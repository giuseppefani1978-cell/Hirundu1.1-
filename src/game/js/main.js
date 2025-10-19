import { t, poiName, poiInfo } from '../../i18n.js';
import {
  startMusic,
  stopMusic,
  toggleMusic,
  isMusicOn,
  ping,
  starEmphasis,
  failSfx,
  resetAudioForNewGame,
  playFinaleLong,
} from '../../audio.js';
import * as ui from '../../ui.js';
import { startBattleIntro } from '../../battle_intro.js';
import {
  DEBUG,
  APP_VERSION,
  ASSETS,
  POIS,
  STARS_TARGET,
  PLAYER_BASE,
  ENERGY,
  ENEMY,
  ENEMY_CONFIG,
  BONUS_CONFIG,
  BONUS_TYPES,
  SHAKE,
  SCORE,
  UI_CONST,
} from './config.js';
import {
  shuffle,
  fmtTime,
  getCountry,
  debugLog,
  now,
} from './utils.js';
import { createHallOfFameController } from './hof.js';
import { setupDpad } from './input.js';
import {
  computeMapViewport,
  drawStarfish,
  drawEnemies,
  drawBonuses,
  renderWin,
  spawnFirework,
  applyShake,
} from './render.js';

const TWO_PI = Math.PI * 2;

function createScoreData() {
  return {
    value: 0,
    hits: 0,
    bonusesPicked: 0,
    bonusScore: 0,
    starsPicked: 0,
    counts: { pasticciotto: 0, rustico: 0, caffe: 0 },
    startAt: 0,
    finalized: false,
    playerName: 'Joueur',
    country: getCountry(),
  };
}

function createInitialState() {
  return {
    mode: 'splash',
    running: false,
    lastFrame: 0,
    width: 0,
    height: 0,
    dpr: 1,
    quest: shuffle(POIS),
    currentTarget: 0,
    collected: new Set(),
    askTimer: 0,
    player: { x: PLAYER_BASE.x, y: PLAYER_BASE.y, size: PLAYER_BASE.size },
    energy: ENERGY.START,
    enemies: [],
    bonuses: [],
    enemySpawnAt: now() + 800,
    bonusSpawnAt: now() + 1400,
    playerSlowTimer: 0,
    hitShake: 0,
    collectLockUntil: 0,
    score: createScoreData(),
    winFx: { t: 0, fireworks: [], timer: 0 },
  };
}

function bonusLabel(bonus) {
  const label =
    bonus.type === 'caffe' ? 'Caffè Leccese'
      : bonus.type === 'rustico' ? 'Rustico'
      : 'Pasticciotto';
  return `+${bonus.score} ${label}  (+${bonus.heal} NRJ)`;
}

function ensureScoreLiveElement() {
  let el = document.getElementById('__score_live');
  if (el) {
    return el;
  }
  el = document.createElement('div');
  el.id = '__score_live';
  el.style.cssText = `
    position:fixed; top:8px; right:8px; z-index:10002;
    background:linear-gradient(180deg, rgba(255,240,200,.95), rgba(255,226,160,.95));
    color:#8a2a0a; border:1px solid #b08a3c; box-shadow:0 4px 10px rgba(0,0,0,.15);
    padding:6px 10px; border-radius:10px; font:700 18px/1.1 "Courier New", ui-monospace, monospace;
    text-shadow:0 1px 0 #fff, 0 0 8px rgba(255,200,0,.6);
  `;
  el.textContent = '000000';
  document.body.appendChild(el);
  return el;
}

function chooseBonusType() {
  const r = Math.random();
  if (r < BONUS_TYPES.PASTICCIOTTO.prob) {
    return BONUS_TYPES.PASTICCIOTTO;
  }
  if (r < BONUS_TYPES.PASTICCIOTTO.prob + BONUS_TYPES.RUSTICO.prob) {
    return BONUS_TYPES.RUSTICO;
  }
  return BONUS_TYPES.CAFFE;
}

export function boot() {
  const canvas = document.getElementById('c');
  if (!canvas) {
    alert('Chargement du jeu impossible : canvas introuvable (#c).');
    return;
  }
  const ctx = canvas.getContext('2d', { alpha: true });

  ui.initUI();
  ui.updateScore(0, STARS_TARGET);
  ui.renderStars(0, STARS_TARGET);
  ui.updateEnergy(100);
  ui.onClickMusic(() => {
    toggleMusic();
    ui.setMusicLabel(isMusicOn());
  });
  ui.setMusicLabel(false);
  ui.onClickReplay(() => startGame());

  const replayBtn = document.getElementById('replayFloat');
  if (replayBtn) {
    replayBtn.style.position = 'fixed';
    replayBtn.style.top = 'auto';
    replayBtn.style.right = '8px';
    replayBtn.style.left = 'auto';
    replayBtn.style.bottom = '16px';
    replayBtn.style.zIndex = '10001';
  }

  const hof = createHallOfFameController();
  hof.attachHudLink();
  hof.ensureHashRouting();
  const scoreLive = ensureScoreLiveElement();

  const state = createInitialState();

  const heroAr = document.getElementById('heroAr');
  const heroTa = document.getElementById('heroTa');
  const tarAvatar = document.getElementById('tarAvatar');
  if (heroAr) heroAr.src = ASSETS.BIRD_URL;
  if (heroTa) heroTa.src = ASSETS.TARANTULA_URL;
  if (tarAvatar) tarAvatar.src = ASSETS.TARANTULA_URL;

  const images = prepareImages();

  function prepareImages() {
    const mapImg = new Image();
    const birdImg = new Image();
    const spiderImg = new Image();
    const crowImg = new Image();
    const jellyImg = new Image();
    const imgPasticciotto = new Image();
    const imgRustico = new Image();
    const imgCaffe = new Image();

    mapImg.addEventListener('load', () => {
      debugLog('map loaded');
      resizeCanvas();
    });
    mapImg.addEventListener('error', () => ui.assetFail('Map', ASSETS.MAP_URL));
    birdImg.addEventListener('error', () => ui.assetFail('Aracne', ASSETS.BIRD_URL));
    spiderImg.addEventListener('error', () => ui.assetFail('Tarantula', ASSETS.TARANTULA_URL));
    crowImg.addEventListener('error', () => ui.assetFail('Crow', ASSETS.CROW_URL));
    jellyImg.addEventListener('error', () => ui.assetFail('Jellyfish', ASSETS.JELLY_URL));

    imgPasticciotto.src = ASSETS.BONUS_PASTICCIOTTO;
    imgRustico.src = ASSETS.BONUS_RUSTICO;
    imgCaffe.src = ASSETS.BONUS_CAFFE;

    mapImg.src = ASSETS.MAP_URL;
    birdImg.src = ASSETS.BIRD_URL;
    spiderImg.src = ASSETS.TARANTULA_URL;
    crowImg.src = ASSETS.CROW_URL;
    jellyImg.src = ASSETS.JELLY_URL;

    return {
      mapImg,
      birdImg,
      spiderImg,
      crowImg,
      jellyImg,
      imgPasticciotto,
      imgRustico,
      imgCaffe,
    };
  }

  function resizeCanvasHard() {
    try {
      window.scrollTo(0, 0);
      requestAnimationFrame(() => window.scrollTo(0, 0));
    } catch {}
  }

  function resizeCanvas() {
    const vp = window.visualViewport;
    state.width = Math.round(vp?.width || window.innerWidth || document.documentElement.clientWidth || 360);
    state.height = Math.round(vp?.height || window.innerHeight || document.documentElement.clientHeight || 640);
    state.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.max(1, Math.floor(state.width * state.dpr));
    canvas.height = Math.max(1, Math.floor(state.height * state.dpr));
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      resizeCanvas();
      resizeCanvasHard();
    }, { passive: true });
  }
  window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 60);
    setTimeout(() => {
      resizeCanvas();
      resizeCanvasHard();
    }, 220);
  }, { passive: true });

  setupDpad(state.player, () => getSpeed(), () => state.mode === 'play');

  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  }

  askQuestionAt(0);
  updateScoreLive();

  function updateScoreLive() {
    if (scoreLive) {
      scoreLive.textContent = String(Math.max(0, state.score.value)).padStart(6, '0');
    }
  }

  function setEnergy(value) {
    state.energy = Math.max(0, Math.min(ENERGY.MAX, Math.floor(value)));
    ui.updateEnergy((state.energy / ENERGY.MAX) * 100);
    return state.energy;
  }

  function getSpeed() {
    const slowFactor = state.playerSlowTimer > 0 ? 0.45 : 1;
    return PLAYER_BASE.speed * slowFactor;
  }

  function clearAskTimer() {
    if (state.askTimer) {
      clearTimeout(state.askTimer);
      state.askTimer = 0;
    }
  }

  function askQuestionAt(index) {
    if (index < 0 || index >= state.quest.length) {
      return;
    }
    const key = state.quest[index].key;
    ui.showAsk(t.ask?.(poiInfo(key)) || `Où est ${poiInfo(key)} ?`);
  }

  function queueNextAsk(delay = 1200) {
    clearAskTimer();
    state.askTimer = setTimeout(() => {
      if (state.mode === 'play' && state.currentTarget < state.quest.length) {
        askQuestionAt(state.currentTarget);
      }
    }, delay);
  }

  function resetScore() {
    state.score.value = 0;
    state.score.hits = 0;
    state.score.bonusesPicked = 0;
    state.score.bonusScore = 0;
    state.score.starsPicked = 0;
    state.score.counts = { pasticciotto: 0, rustico: 0, caffe: 0 };
    state.score.startAt = now();
    state.score.finalized = false;
    state.collectLockUntil = 0;
    updateScoreLive();
  }

  function spawnEnemy(current) {
    if (state.enemies.length >= ENEMY_CONFIG.MAX_ON_SCREEN) {
      return;
    }
    const type = Math.random() < 0.5 ? ENEMY.JELLY : ENEMY.CROW;
    const angle = Math.random() * TWO_PI;
    const speed = ENEMY_CONFIG.SPEED[type];
    state.enemies.push({
      type,
      x: Math.random() * 0.9 + 0.05,
      y: Math.random() * 0.9 + 0.05,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      t: 0,
      bornAt: current,
      state: 'normal',
      fleeUntil: 0,
    });
  }

  function spawnBonus() {
    const type = chooseBonusType();
    state.bonuses.push({
      type: type.key,
      score: type.score,
      heal: type.heal,
      x: Math.random() * 0.9 + 0.05,
      y: Math.random() * 0.9 + 0.05,
      life: BONUS_CONFIG.LIFETIME_S,
      age: 0,
      pulse: 0,
    });
  }

  function tickEnemies(dt) {
    const current = now();
    if (current >= state.enemySpawnAt && state.enemies.length < ENEMY_CONFIG.MAX_ON_SCREEN) {
      spawnEnemy(current);
      state.enemySpawnAt = current + ENEMY_CONFIG.BASE_SPAWN_MS + Math.random() * ENEMY_CONFIG.SPAWN_JITTER_MS;
    }
    if (current >= state.bonusSpawnAt) {
      spawnBonus();
      state.bonusSpawnAt = current + BONUS_CONFIG.BASE_SPAWN_MS + Math.random() * BONUS_CONFIG.SPAWN_JITTER_MS;
    }

    const lifetime = ENEMY_CONFIG.LIFETIME_S * 1000;
    state.enemies = state.enemies.filter((enemy) => (current - (enemy.bornAt || current)) < lifetime);

    const PAD = 0.02;
    state.enemies.forEach((enemy) => {
      enemy.t += dt;
      if (enemy.state === 'flee') {
        if (current >= enemy.fleeUntil) {
          enemy._remove = true;
        } else {
          enemy.vx *= 0.995;
          enemy.vy *= 0.995;
        }
      } else if (enemy.type === ENEMY.JELLY) {
        enemy.vx += Math.sin(enemy.t * 1.7) * 0.0008;
        enemy.vy += Math.cos(enemy.t * 1.3) * 0.0008;
      }

      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;

      if (enemy.x < PAD || enemy.x > 1 - PAD) {
        enemy.vx *= -1;
        enemy.x = Math.max(PAD, Math.min(1 - PAD, enemy.x));
      }
      if (enemy.y < PAD || enemy.y > 1 - PAD) {
        enemy.vy *= -1;
        enemy.y = Math.max(PAD, Math.min(1 - PAD, enemy.y));
      }
    });

    state.enemies = state.enemies.filter((enemy) => !enemy._remove);

    for (let i = state.bonuses.length - 1; i >= 0; i -= 1) {
      const bonus = state.bonuses[i];
      bonus.age += dt;
      bonus.pulse += dt;
      if (bonus.age > bonus.life) {
        state.bonuses.splice(i, 1);
      }
    }
  }

  function tickWin(dt) {
    const fx = state.winFx;
    fx.t += dt;
    fx.timer -= dt;
    if (fx.timer <= 0) {
      spawnFirework(fx.fireworks);
      fx.timer = 0.7 + Math.random() * 0.7;
    }
    for (let i = fx.fireworks.length - 1; i >= 0; i -= 1) {
      const particle = fx.fireworks[i];
      particle.vx *= 0.98;
      particle.vy = particle.vy * 0.98 + 18 * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
      if (particle.life <= 0) {
        fx.fireworks.splice(i, 1);
      }
    }
  }

  function handleCollisions(bounds) {
    const { ox, oy, dw, dh, px, py } = bounds;
    const playerHitRadius = ENEMY_CONFIG.COLLIDE_RADIUS_PX;
    let collided = false;
    const current = now();

    state.enemies.forEach((enemy) => {
      if (enemy.state === 'flee') {
        return;
      }
      const ex = ox + enemy.x * dw;
      const ey = oy + enemy.y * dh;
      if (Math.hypot(px - ex, py - ey) < playerHitRadius) {
        collided = true;
        failSfx();
        state.playerSlowTimer = Math.max(state.playerSlowTimer, 1.25);
        state.hitShake = Math.min(SHAKE.MAX_S, state.hitShake + SHAKE.HIT_ADD);
        const away = Math.atan2(ey - py, ex - px);
        enemy.vx = Math.cos(away) * ENEMY_CONFIG.FLEE.SPEED;
        enemy.vy = Math.sin(away) * ENEMY_CONFIG.FLEE.SPEED;
        enemy.state = 'flee';
        enemy.fleeUntil = current + ENEMY_CONFIG.FLEE.DURATION_MS_MIN + Math.random() * ENEMY_CONFIG.FLEE.DURATION_MS_RAND;
        state.score.value += SCORE.HIT;
        state.score.hits += 1;
      }
    });

    for (let i = state.bonuses.length - 1; i >= 0; i -= 1) {
      const bonus = state.bonuses[i];
      const bx = ox + bonus.x * dw;
      const by = oy + bonus.y * dh;
      if (Math.hypot(px - bx, py - by) < BONUS_CONFIG.PICK_RADIUS_PX) {
        state.playerSlowTimer = 0;
        state.hitShake = Math.min(SHAKE.MAX_S, state.hitShake + SHAKE.BONUS_ADD);
        state.score.value += bonus.score;
        state.score.bonusScore += bonus.score;
        state.score.bonusesPicked += 1;
        setEnergy(state.energy + bonus.heal);
        ui.showEphemeralLabel(bx, by - 24, bonusLabel(bonus), {
          color: 'transparent',
          durationMs: 1000,
          dy: -28,
        });
        state.score.counts[bonus.type] = (state.score.counts[bonus.type] || 0) + 1;
        const hz = bonus.type === 'caffe' ? 980 : bonus.type === 'rustico' ? 880 : 780;
        ping(hz, 0.35);
        state.bonuses.splice(i, 1);
        updateScoreLive();
      }
    }

    if (collided) {
      updateScoreLive();
    }
    return collided;
  }

  function finalizeRun({ won }) {
    if (state.score.finalized) {
      return;
    }
    state.score.finalized = true;

    const total = state.score.value + (won ? SCORE.WIN : SCORE.GAMEOVER);
    const elapsed = Math.max(0, now() - state.score.startAt);
    const entry = {
      name: (state.score.playerName || 'Joueur').trim() || 'Joueur',
      country: state.score.country,
      score: total,
      stars: state.score.starsPicked,
      bonuses: state.score.bonusesPicked,
      hits: state.score.hits,
      time: elapsed,
      date: new Date().toISOString(),
      won: !!won,
      bonusScore: state.score.bonusScore,
      bonusBreakdown: { ...state.score.counts },
    };

    hof.addEntry(entry);
    updateScoreLive();

    const title = won ? (t.win?.() || 'Bravo ! Victoire 🌟') : (t.gameover?.() || 'Game Over');
    const lines = [
      `${title}`,
      `Score: ${total} (Étoiles: +${state.score.starsPicked * SCORE.STAR}, Bonus: +${state.score.bonusScore}, Coups: ${state.score.hits * SCORE.HIT}${won ? `, Win: +${SCORE.WIN}` : ''})`,
      `Bonus: ${state.score.counts.pasticciotto || 0} Pasticciotto · ${state.score.counts.rustico || 0} Rustico · ${state.score.counts.caffe || 0} Caffè`,
      `Temps: ${fmtTime(elapsed)}`,
      ``,
      `👉 check le Hall of Fame en bas du HUD.`,
    ];
    ui.showSuccess(lines.join('
'));
    ui.showReplay(true);
  }

  function triggerWin() {
    state.mode = 'win';
    finalizeRun({ won: true });
    stopMusic();
    playFinaleLong();
    state.winFx.t = 0;
    state.winFx.fireworks.length = 0;
    state.winFx.timer = 0;
  }

  function triggerGameOver() {
    state.mode = 'dead';
    state.running = false;
    finalizeRun({ won: false });
  }

  function resetGame() {
    state.collected = new Set();
    state.quest = shuffle(POIS);
    state.currentTarget = 0;
    resetScore();
    state.player.x = PLAYER_BASE.x;
    state.player.y = PLAYER_BASE.y;
    setEnergy(ENERGY.START);
    state.enemies.length = 0;
    state.bonuses.length = 0;
    state.enemySpawnAt = now() + 800;
    state.bonusSpawnAt = now() + 1400;
    state.playerSlowTimer = 0;
    state.hitShake = 0;
    state.winFx.t = 0;
    state.winFx.fireworks.length = 0;
    state.winFx.timer = 0;
    ui.updateScore(0, STARS_TARGET);
    ui.renderStars(0, STARS_TARGET);
    ui.showReplay(false);
    resetAudioForNewGame();
    clearAskTimer();
    askQuestionAt(0);
    updateScoreLive();
  }

  function startGame() {
    try {
      document.body.classList.remove('mode-battle');
      const name = prompt('Ton nom/pseudo ?') || 'Joueur';
      state.score.playerName = (name || 'Joueur').trim() || 'Joueur';
      state.score.country = getCountry();
      ui.hideOverlay();
      ui.showTouch(true);
      if (!isMusicOn()) {
        startMusic();
      }
      ui.setMusicLabel(isMusicOn());
      resetGame();
      state.score.startAt = now();
      state.mode = 'play';
      state.running = true;
      state.lastFrame = 0;
      requestAnimationFrame(draw);
    } catch (err) {
      alert('Chargement du jeu impossible : ' + (err?.message || err));
    }
  }

  function enterBattleFlow() {
    state.mode = 'battle_intro';
    ui.showTouch(false);
    clearAskTimer();
    try {
      const bdText = document.getElementById('bdText');
      const bdTitle = document.getElementById('bdTitle');
      const tar = document.getElementById('tarTop');
      if (bdText && bdTitle && tar) {
        bdTitle.textContent = 'Tarantula';
        bdText.textContent = 'Conseil: en bataille, ←/→ pour bouger, ↑ pour sauter, A attaquer, B spécial. Tourne en paysage.';
        tar.classList.add('show');
        setTimeout(() => tar.classList.remove('show'), 2200);
      }
    } catch {}

    const ammo = {
      pasticciotto: state.score.counts.pasticciotto | 0,
      rustico: state.score.counts.rustico | 0,
      caffe: state.score.counts.caffe | 0,
      stars: state.score.starsPicked | 0,
    };

    startBattleIntro({
      ammo,
      onProceed: async () => {
        const battleAmmo = {
          pasticciotto: state.score.counts.pasticciotto | 0,
          rustico: state.score.counts.rustico | 0,
          caffe: state.score.counts.caffe | 0,
          stars: state.score.starsPicked | 0,
        };
        try {
          state.running = false;
          state.mode = 'battle';
          const module = await import(`../../game_battle.js?v=${APP_VERSION}`);
          await module.startBattleFlow(battleAmmo, {
            bottomExtra: 0,
            onWin: () => {
              document.body.classList.remove('mode-battle');
              state.mode = 'win';
              state.running = true;
              requestAnimationFrame(draw);
              try {
                triggerWin();
              } catch (err) {
                if (DEBUG) console.error(err);
              }
            },
            onLose: () => {
              document.body.classList.remove('mode-battle');
              state.mode = 'dead';
              state.running = false;
              try {
                triggerGameOver();
              } catch (err) {
                if (DEBUG) console.error(err);
              }
            },
          });
        } catch (err) {
          console.error('Battle module load error:', err);
          alert('Impossible de charger la battle. Retour à la carte.');
          document.body.classList.remove('mode-battle');
          state.mode = 'play';
          state.running = true;
          requestAnimationFrame(draw);
        }
      },
    });
  }

  function draw(timestamp) {
    if (!state.running) {
      return;
    }

    if (timestamp) {
      if (!state.lastFrame) {
        state.lastFrame = timestamp;
      }
      const dt = Math.min(0.05, (timestamp - state.lastFrame) / 1000);
      state.lastFrame = timestamp;
      if (state.mode === 'play') {
        tickEnemies(dt);
        if (state.hitShake > 0) {
          state.hitShake = Math.max(0, state.hitShake - dt * SHAKE.DECAY_PER_S);
        }
        if (state.playerSlowTimer > 0) {
          state.playerSlowTimer = Math.max(0, state.playerSlowTimer - dt);
        }
      } else if (state.mode === 'win') {
        tickWin(dt);
      }
    }

    const mapWidth = images.mapImg.naturalWidth || 1920;
    const mapHeight = images.mapImg.naturalHeight || 1080;
    const view = computeMapViewport(state.width, state.height, mapWidth, mapHeight);

    ctx.clearRect(0, 0, state.width, state.height);

    if (images.mapImg.complete && images.mapImg.naturalWidth) {
      ctx.drawImage(images.mapImg, view.ox, view.oy, view.dw, view.dh);
    } else {
      ctx.fillStyle = '#bfe2f8';
      ctx.fillRect(view.ox, view.oy, view.dw || state.width, view.dh || (state.height - UI_CONST.TOP - UI_CONST.BOTTOM));
      ctx.fillStyle = '#0e2b4a';
      ctx.font = '14px system-ui';
      ctx.fillText(t.mapNotLoaded?.(ASSETS.MAP_URL) || `Map not loaded: ${ASSETS.MAP_URL}`, (view.ox || 14), (view.oy || 24));
    }

    POIS.forEach((poi) => {
      const x = view.ox + poi.x * view.dw;
      const y = view.oy + poi.y * view.dh;
      if (state.collected.has(poi.key)) {
        drawStarfish(ctx, x, y - 20, Math.max(14, Math.min(22, Math.min(state.width, state.height) * 0.028)));
      } else {
        ctx.save();
        ctx.strokeStyle = '#b04123';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 6);
        ctx.lineTo(x + 6, y + 6);
        ctx.moveTo(x - 6, y + 6);
        ctx.lineTo(x + 6, y - 6);
        ctx.stroke();
        ctx.restore();
      }
    });

    const playerSize = Math.min(160, Math.max(90, view.dw * state.player.size || 90));
    const px = view.ox + state.player.x * view.dw;
    const py = view.oy + state.player.y * view.dh;

    if (state.mode === 'play') {
      const collided = handleCollisions({ ox: view.ox, oy: view.oy, dw: view.dw, dh: view.dh, px, py });
      if (collided && setEnergy(state.energy - 18) <= 0) {
        triggerGameOver();
        return;
      }
      drawBonuses(ctx, state.bonuses, view, images);
      drawEnemies(ctx, state.enemies, view, images);
    }

    const shake = applyShake({ mode: state.mode, hitShake: state.hitShake });

    if (state.mode === 'play') {
      if (images.birdImg.complete && images.birdImg.naturalWidth) {
        ctx.drawImage(images.birdImg, px - playerSize / 2 + shake.x, py - playerSize / 2 + shake.y, playerSize, playerSize);
      } else {
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(px + shake.x, py + shake.y, playerSize * 0.35, 0, TWO_PI);
        ctx.fill();
      }
    }

    if (state.mode === 'play' && state.currentTarget < state.quest.length) {
      const currentPoi = state.quest[state.currentTarget];
      const tx = view.ox + currentPoi.x * view.dw;
      const ty = view.oy + currentPoi.y * view.dh;
      if (now() >= state.collectLockUntil) {
        const onTarget = Math.hypot(px - tx, py - ty) < 44;
        if (onTarget) {
          state.collectLockUntil = now() + 900;
          state.collected.add(currentPoi.key);
          ui.updateScore(state.collected.size, STARS_TARGET);
          ui.renderStars(state.collected.size, STARS_TARGET);
          starEmphasis();
          ui.showEphemeralLabel(tx, ty - 28, poiName(currentPoi.key), {
            color: 'rgba(255,255,255,0.7)',
            durationMs: 950,
            dy: -30,
          });
          state.score.value += SCORE.STAR;
          state.score.starsPicked += 1;
          updateScoreLive();
          const nameShort = poiName(currentPoi.key);
          ui.showSuccess(t.success?.(nameShort) || `Bravo : ${nameShort} !`);
          state.currentTarget += 1;
          if (state.currentTarget === state.quest.length) {
            enterBattleFlow();
          } else {
            queueNextAsk(1200);
          }
        }
      }
    }

    if (state.mode === 'win') {
      renderWin(ctx, view, { birdImg: images.birdImg, spiderImg: images.spiderImg }, state.winFx);
    }

    requestAnimationFrame(draw);
  }
}
