// src/game.js
// =====================================================
// CONFIG + GAMEPLAY (imports: i18n, ui, audio uniquement)
// =====================================================
import { t, poiName, poiInfo } from './i18n.js';
import { startMusic, stopMusic, toggleMusic, isMusicOn, ping, starEmphasis, failSfx, resetAudioForNewGame } from './audio.js';
import * as ui from './ui.js';

// ------------------------
// Config (fusionnée ici)
// ------------------------
const APP_VERSION = (window.APP_VERSION || 'v2025-08-20-g');
const APP_Q = `?v=${APP_VERSION}`;
const asset = (p) => `${p}${APP_Q}`;

// ⚠️ les noms ci-dessous doivent correspondre EXACTEMENT aux fichiers présents dans /assets
const ASSETS = {
  MAP_URL:       asset('assets/salento-map.PNG'),
  BIRD_URL:      asset('assets/aracne .PNG'),       // (avec espace avant .PNG si ton fichier a bien cet espace)
  TARANTULA_URL: asset('assets/tarantula .PNG'),
  CROW_URL:      asset('assets/crow.PNG'),
  JELLY_URL:     asset('assets/jellyfish.PNG'),
};

const UI_CONST = {
  TOP: 120,
  BOTTOM: 160,
  MAP_ZOOM: 1.30,
};

function pickDPR() {
  return Math.max(1, Math.min(2, window.devicePixelRatio || 1));
}
function computeMapViewport(canvasW, canvasH, mapW, mapH) {
  const availW = canvasW;
  const availH = Math.max(200, canvasH - UI_CONST.BOTTOM - UI_CONST.TOP);
  const baseScale = Math.min(availW / mapW, availH / mapH);
  const scale = baseScale * UI_CONST.MAP_ZOOM;
  const dw = mapW * scale;
  const dh = mapH * scale;
  const ox = (canvasW - dw) / 2;
  const oy = UI_CONST.TOP + (availH - dh) / 2;
  return { ox, oy, dw, dh, scale };
}

// POIs (positions normalisées)
const SHIFT_COAST = { x: 0.045, y: 0.026 };
const SHIFT_EAST  = 0.04;
const POIS = [
  { key:"otranto",       x:0.86+SHIFT_EAST+SHIFT_COAST.x,       y:0.48+SHIFT_COAST.y },
  { key:"portobadisco",  x:0.80+SHIFT_EAST+SHIFT_COAST.x,       y:0.56+SHIFT_COAST.y },
  { key:"santacesarea",  x:0.74+SHIFT_EAST+SHIFT_COAST.x+0.010, y:0.60+SHIFT_COAST.y+0.008 },
  { key:"castro",        x:0.72+SHIFT_EAST+SHIFT_COAST.x+0.012, y:0.65+SHIFT_COAST.y+0.008 },
  { key:"ciolo",         x:0.66+SHIFT_EAST+SHIFT_COAST.x+0.070, y:0.78+SHIFT_COAST.y+0.006 },
  { key:"leuca",         x:0.64+SHIFT_COAST.x+0.10,             y:0.90+SHIFT_COAST.y },
  { key:"gallipoli",     x:0.27,                                y:0.62 },
  { key:"portocesareo",  x:0.22,                                y:0.46 },
  { key:"nardo",         x:0.38,                                y:0.50 },
  { key:"lecce",         x:0.53,                                y:0.28 },
];
const STARS_TARGET = POIS.length;

// Joueur / énergie
const PLAYER_BASE = { x: 0.55, y: 0.25, speed: 0.0048, size: 0.11 };
const ENERGY = { MAX: 100, START: 100 };
const ENEMY = { JELLY: 'jelly', CROW: 'crow' };

const ENEMY_CONFIG = {
  MAX_ON_SCREEN: 4,
  LIFETIME_S: 14,
  BASE_SPAWN_MS: 4200,
  SPAWN_JITTER_MS: 2600,
  COLLIDE_RADIUS_PX: 36,
  SPEED: { [ENEMY.JELLY]: 0.06, [ENEMY.CROW]: 0.10 },
  FLEE: { SPEED: 0.38, DURATION_MS_MIN: 1600, DURATION_MS_RAND: 700 },
  SPRITE_PX: { [ENEMY.JELLY]: 42, [ENEMY.CROW]: 42 },
};

const BONUS_CONFIG = {
  LIFETIME_S: 4,
  BASE_SPAWN_MS: 4200,
  SPAWN_JITTER_MS: 3000,
  PICK_RADIUS_PX: 36,
  HEAL_AMOUNT: 25,
};

const SHAKE = { MAX_S: 2.4, DECAY_PER_S: 1.0, HIT_ADD: 0.6, BONUS_ADD: 0.2 };

// ----------------------------------
// État runtime (créé dans boot())
// ----------------------------------
export function boot() {
  // DOM refs (récupérées AU MOMENT du boot → évite les erreurs DOM pas prêt)
  const canvas = document.getElementById('c');
  if (!canvas) {
    alert("Chargement du jeu impossible : canvas introuvable (#c).");
    return;
  }
  const ctx = canvas.getContext('2d', { alpha: true });

  // Héros du splash
  const heroAr = document.getElementById('heroAr');
  const heroTa = document.getElementById('heroTa');
  const tarAvatar = document.getElementById('tarAvatar');
  if (heroAr) heroAr.src = ASSETS.BIRD_URL;
  if (heroTa) heroTa.src = ASSETS.TARANTULA_URL;
  if (tarAvatar) tarAvatar.src = ASSETS.TARANTULA_URL;

  // Initialisation UI
  ui.initUI();
  ui.updateScore(0, STARS_TARGET);
  ui.renderStars(0, STARS_TARGET);
  ui.updateEnergy(100);

  // Musique
  ui.onClickMusic(() => {
    toggleMusic();
    ui.setMusicLabel(isMusicOn());
  });
  ui.setMusicLabel(false);
  ui.onClickReplay(() => { resetGame(); });

  // Images (chargées après boot)
  const mapImg   = new Image();
  const birdImg  = new Image();
  const spiderImg= new Image();
  const crowImg  = new Image();
  const jellyImg = new Image();

  mapImg.onerror   = () => ui.assetFail('Map', ASSETS.MAP_URL);
  birdImg.onerror  = () => ui.assetFail('Aracne', ASSETS.BIRD_URL);
  spiderImg.onerror= () => ui.assetFail('Tarantula', ASSETS.TARANTULA_URL);
  crowImg.onerror  = () => ui.assetFail('Crow', ASSETS.CROW_URL);
  jellyImg.onerror = () => ui.assetFail('Jellyfish', ASSETS.JELLY_URL);

  mapImg.src    = ASSETS.MAP_URL;
  birdImg.src   = ASSETS.BIRD_URL;
  spiderImg.src = ASSETS.TARANTULA_URL;
  crowImg.src   = ASSETS.CROW_URL;
  jellyImg.src  = ASSETS.JELLY_URL;

  // Canvas sizing
  function resize() {
  dpr = pickDPR();
  const parent = canvas.parentElement || document.body;

  // on LIT seulement, on n’écrit pas sur clientWidth/clientHeight :
  W = parent.clientWidth;
  H = parent.clientHeight;

  // on règle les dimensions du canvas (attributs) + (optionnel) les styles CSS
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
  // ------- Game state -------
  let running = false;
  let lastTS = 0;
  let collected = new Set();
  let QUEST = shuffle(POIS);
  let currentIdx = 0;

  const player = { x: PLAYER_BASE.x, y: PLAYER_BASE.y, speed: PLAYER_BASE.speed, size: PLAYER_BASE.size };
  let energy = ENERGY.START;

  // Ennemis/bonus état
  let enemies = [];     // {type,x,y,vx,vy,t,bornAt,state,fleeUntil}
  let bonuses = [];     // {x,y,life,age,pulse}
  let enemySpawnAt = performance.now() + 800;
  let bonusSpawnAt = performance.now() + 1400;

  let playerSlowTimer = 0;
  let hitShake = 0;

  // ---- Controls (D-pad) ----
  setupDpad(player, () => getSpeed());

  // ---- Start button ----
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  }

  // Première question (overlay visible)
  if (QUEST.length) ui.showAsk(t.ask?.(poiInfo(QUEST[0].key)) || `Où est ${poiInfo(QUEST[0].key)} ?`);

  // ---------- helpers ----------
  function setEnergy(p) {
    energy = Math.max(0, Math.min(ENERGY.MAX, p|0));
    ui.updateEnergy((energy / ENERGY.MAX) * 100);
  }
  function getSpeed() {
    const slowFactor = (playerSlowTimer > 0) ? 0.45 : 1.0;
    return PLAYER_BASE.speed * slowFactor;
  }
  function spawnEnemy(now) {
    if (enemies.length >= ENEMY_CONFIG.MAX_ON_SCREEN) return;
    const type = (Math.random() < 0.5) ? ENEMY.JELLY : ENEMY.CROW;
    const x = Math.random() * 0.9 + 0.05;
    const y = Math.random() * 0.9 + 0.05;
    const speed = ENEMY_CONFIG.SPEED[type];
    const dir = Math.random() * Math.PI * 2;
    enemies.push({
      type, x, y,
      vx: Math.cos(dir) * speed,
      vy: Math.sin(dir) * speed,
      t: 0,
      bornAt: now,
      state: 'normal',
      fleeUntil: 0,
    });
  }
  function spawnBonus(now) {
    bonuses.push({
      x: Math.random() * 0.9 + 0.05,
      y: Math.random() * 0.9 + 0.05,
      life: BONUS_CONFIG.LIFETIME_S,
      age: 0,
      pulse: 0,
    });
  }

  // ---------- Game loop ----------
  function draw(ts) {
    if (!running) return;

    if (ts) {
      if (!lastTS) lastTS = ts;
      const dt = Math.min(0.05, (ts - lastTS) / 1000);
      lastTS = ts;

      // mise à jour ennemis/bonus
      tickEnemies(dt);
      // shake decay
      if (hitShake > 0) hitShake = Math.max(0, hitShake - dt * SHAKE.DECAY_PER_S);
      if (playerSlowTimer > 0) playerSlowTimer = Math.max(0, playerSlowTimer - dt);
    }

    // viewport carte
    const mw = mapImg.naturalWidth || 1920;
    const mh = mapImg.naturalHeight || 1080;
    const view = computeMapViewport(W, H, mw, mh);
    const { ox, oy, dw, dh } = view;

    // fond
    ctx.clearRect(0, 0, W, H);
    if (mapImg.complete && mapImg.naturalWidth) {
      ctx.drawImage(mapImg, ox, oy, dw, dh);
    } else {
      ctx.fillStyle = '#bfe2f8'; ctx.fillRect(ox, oy, dw, dh);
      ctx.fillStyle = '#0e2b4a'; ctx.font = '16px system-ui';
      ctx.fillText(t.mapNotLoaded?.(ASSETS.MAP_URL) || `Map not loaded: ${ASSETS.MAP_URL}`, ox + 14, oy + 24);
    }

    // POIs
    for (const p of POIS) {
      const x = ox + p.x * dw, y = oy + p.y * dh;
      if (collected.has(p.key)) {
        drawStarfish(ctx, x, y - 20, Math.max(14, Math.min(22, Math.min(W, H) * 0.028)));
      } else {
        ctx.save();
        ctx.strokeStyle = '#b04123'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y + 6);
        ctx.moveTo(x - 6, y + 6); ctx.lineTo(x + 6, y - 6);
        ctx.stroke();
        ctx.restore();
      }
    }

    // joueur position (px)
    const bw = Math.min(160, Math.max(90, dw * player.size));
    const bx = ox + player.x * dw;
    const by = oy + player.y * dh;

    // collisions + bonus
    const { collided, picked } = handleCollisions({ bx, by, ox, oy, dw, dh });

    if (collided) {
      setEnergy(energy - 18);
    }
    if (picked) {
      setEnergy(energy + 14);
    }
    const dead = energy <= 0;

    // dessine bonus/ennemis sous joueur
    drawBonuses(ctx, bonuses, { ox, oy, dw, dh });
    drawEnemies(ctx, enemies, { ox, oy, dw, dh }, { crowImg, jellyImg });

    // shake
    let sx = 0, sy = 0;
    if (hitShake > 0) {
      const a = Math.min(1, hitShake / SHAKE.MAX_S);
      const mag = 6 * a;
      sx = (Math.random()*2-1) * mag;
      sy = (Math.random()*2-1) * mag;
    }

    // dessine joueur
    if (!dead) {
      if (birdImg.complete && birdImg.naturalWidth) {
        ctx.drawImage(birdImg, bx - bw/2 + sx, by - bw/2 + sy, bw, bw);
      } else {
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(bx + sx, by + sy, bw*0.35, 0, Math.PI*2); ctx.fill();
      }
    }

    // progression
    if (!dead && currentIdx < QUEST.length) {
      const p = QUEST[currentIdx];
      const px = ox + p.x * dw, py = oy + p.y * dh;
      const onTarget = Math.hypot(bx - px, by - py) < 44;
      if (onTarget) {
        collected.add(p.key);
        ui.updateScore(collected.size, STARS_TARGET);
        ui.renderStars(collected.size, STARS_TARGET);
        starEmphasis();

        const nameShort = poiName(p.key);
        ui.showSuccess(t.success?.(nameShort) || `Bravo : ${nameShort} !`);

        currentIdx++;
        if (currentIdx === QUEST.length) {
          // fin de partie simple : proposer rejouer
          ui.showReplay(true);
        } else {
          setTimeout(() => ui.showAsk(t.ask?.(poiInfo(QUEST[currentIdx].key)) || ''), 900);
        }
      }
    }

    requestAnimationFrame(draw);
  }

  function tickEnemies(dt) {
    const now = performance.now();

    if (now > enemySpawnAt) {
      if (enemies.length < ENEMY_CONFIG.MAX_ON_SCREEN) spawnEnemy(now);
      enemySpawnAt = now + ENEMY_CONFIG.BASE_SPAWN_MS + Math.random() * ENEMY_CONFIG.SPAWN_JITTER_MS;
    }
    if (now > bonusSpawnAt) {
      spawnBonus(now);
      bonusSpawnAt = now + BONUS_CONFIG.BASE_SPAWN_MS + Math.random() * BONUS_CONFIG.SPAWN_JITTER_MS;
    }

    // auto-despawn
    enemies = enemies.filter(e => (now - (e.bornAt || now)) < ENEMY_CONFIG.LIFETIME_S * 1000);

    // déplacement
    const PAD = 0.02;
    for (const e of enemies) {
      e.t += dt;
      if (e.state === 'flee') {
        if (now >= e.fleeUntil) { e._remove = true; }
        else { e.vx *= 0.995; e.vy *= 0.995; }
      } else if (e.type === ENEMY.JELLY) {
        e.vx += Math.sin(e.t * 1.7) * 0.0008;
        e.vy += Math.cos(e.t * 1.3) * 0.0008;
      }
      e.x += e.vx * dt; e.y += e.vy * dt;
      if (e.x < PAD || e.x > 1 - PAD) { e.vx *= -1; e.x = Math.max(PAD, Math.min(1 - PAD, e.x)); }
      if (e.y < PAD || e.y > 1 - PAD) { e.vy *= -1; e.y = Math.max(PAD, Math.min(1 - PAD, e.y)); }
    }
    enemies = enemies.filter(e => !e._remove);

    // vieillir bonus
    for (let i = bonuses.length - 1; i >= 0; i--) {
      const b = bonuses[i];
      b.age += dt; b.pulse += dt;
      if (b.age > b.life) bonuses.splice(i, 1);
    }
  }

  function handleCollisions({ bx, by, ox, oy, dw, dh }) {
    let collided = false;
    let picked = false;
    const now = performance.now();

    // ennemis
    for (const e of enemies) {
      if (e.state === 'flee') continue;
      const ex = ox + e.x * dw, ey = oy + e.y * dh;
      const d = Math.hypot(bx - ex, by - ey);
      if (d < ENEMY_CONFIG.COLLIDE_RADIUS_PX) {
        collided = true;
        failSfx();
        playerSlowTimer = Math.max(playerSlowTimer, 1.25);
        hitShake = Math.min(SHAKE.MAX_S, hitShake + SHAKE.HIT_ADD);

        const away = Math.atan2((ey - by), (ex - bx));
        e.vx = Math.cos(away) * ENEMY_CONFIG.FLEE.SPEED;
        e.vy = Math.sin(away) * ENEMY_CONFIG.FLEE.SPEED;
        e.state = 'flee';
        e.fleeUntil = now + ENEMY_CONFIG.FLEE.DURATION_MS_MIN + Math.random() * ENEMY_CONFIG.FLEE.DURATION_MS_RAND;
      }
    }

    // bonus
    for (let i = bonuses.length - 1; i >= 0; i--) {
      const b = bonuses[i];
      const bpx = ox + b.x * dw, bpy = oy + b.y * dh;
      if (Math.hypot(bx - bpx, by - bpy) < BONUS_CONFIG.PICK_RADIUS_PX) {
        picked = true;
        ping(880, 0.35);
        playerSlowTimer = 0;
        hitShake = Math.min(SHAKE.MAX_S, hitShake + SHAKE.BONUS_ADD);
        bonuses.splice(i, 1);
      }
    }
    return { collided, picked };
  }

  function startGame() {
    try {
      ui.hideOverlay();
      ui.showTouch(true);
      if (!isMusicOn()) startMusic();
      ui.setMusicLabel(isMusicOn());
      resetGame();
      if (!running) { running = true; requestAnimationFrame(draw); }
    } catch (e) {
      alert('Chargement du jeu impossible : ' + (e?.message || e));
    }
  }

  function resetGame() {
    collected = new Set();
    QUEST = shuffle(POIS);
    currentIdx = 0;

    player.x = PLAYER_BASE.x;
    player.y = PLAYER_BASE.y;
    setEnergy(ENERGY.START);

    enemies.length = 0;
    bonuses.length = 0;
    enemySpawnAt = performance.now() + 800;
    bonusSpawnAt = performance.now() + 1400;
    playerSlowTimer = 0;
    hitShake = 0;

    ui.updateScore(0, STARS_TARGET);
    ui.renderStars(0, STARS_TARGET);
    resetAudioForNewGame();

    if (QUEST.length) ui.showAsk(t.ask?.(poiInfo(QUEST[0].key)) || '');
  }
}

// ------------------------
// Rendu utilitaires
// ------------------------
function drawStarfish(ctx, cx, cy, R) {
  ctx.save(); ctx.shadowColor='rgba(0,0,0,.2)'; ctx.shadowBlur=6; ctx.shadowOffsetY=3;
  ctx.beginPath(); const pts=5,inner=R*0.45;
  for(let i=0;i<pts*2;i++){
    const ang=(Math.PI/pts)*i - Math.PI/2;
    const r=(i%2===0)?R:inner;
    const x=cx+Math.cos(ang)*r, y=cy+Math.sin(ang)*r;
    if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath(); ctx.fillStyle='#d26f45'; ctx.strokeStyle='#8c3f28'; ctx.lineWidth=3; ctx.fill(); ctx.stroke(); ctx.restore();
}
function drawEnemies(ctx, enemies, bounds, sprites) {
  const { ox, oy, dw, dh } = bounds;
  const { crowImg, jellyImg } = sprites;
  const SIZE = 42;
  const now = performance.now();
  for (const e of enemies) {
    const x = ox + e.x * dw, y = oy + e.y * dh;
    ctx.save();
    if (e.state === 'flee') {
      const remain = Math.max(0, (e.fleeUntil - now) / 700);
      ctx.globalAlpha = Math.max(0.12, Math.min(1, remain));
    }
    if (e.type === ENEMY.JELLY) {
      if (jellyImg.complete && jellyImg.naturalWidth) {
        ctx.drawImage(jellyImg, x - SIZE/2, y - SIZE/2, SIZE, SIZE);
      } else {
        // fallback jelly
        ctx.fillStyle = 'rgba(123,200,255,0.85)';
        ctx.beginPath(); ctx.arc(x, y, 18, Math.PI, 0); ctx.fill();
        ctx.fillRect(x - 18, y, 36, 8);
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(x - 14 + i * 7, y + 8);
          ctx.quadraticCurveTo(x - 14 + i * 7, y + 22 + (i % 2 ? 6 : -4), x - 14 + i * 7, y + 32);
          ctx.strokeStyle = 'rgba(80,150,220,0.9)'; ctx.lineWidth = 2; ctx.stroke();
        }
      }
    } else {
      const ang = Math.atan2(e.vy, e.vx);
      ctx.translate(x, y); ctx.rotate(ang);
      if (crowImg.complete && crowImg.naturalWidth) {
        ctx.drawImage(crowImg, -SIZE/2, -SIZE/2, SIZE, SIZE);
      } else {
        // fallback crow
        ctx.fillStyle = '#242424';
        ctx.beginPath();
        ctx.moveTo(-20, 0); ctx.lineTo(10, -8); ctx.lineTo(10, 8);
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-6, 0, 10, 6, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffd400'; ctx.fillRect(10, -2, 6, 4);
      }
    }
    ctx.restore();
  }
}
function drawBonuses(ctx, bonuses, bounds) {
  const { ox, oy, dw, dh } = bounds;
  for (const b of bonuses) {
    const x = ox + b.x * dw, y = oy + b.y * dh;
    const r = 10 + Math.sin(b.pulse * 6) * 2;
    ctx.save();
    ctx.globalAlpha = 0.9 * (1 - b.age / b.life);
    ctx.fillStyle = '#ffe06b';
    ctx.strokeStyle = '#8c6a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = i * 2 * Math.PI / 5 - Math.PI / 2;
      const xi = x + Math.cos(a) * r, yi = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(xi, yi); else ctx.lineTo(xi, yi);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

// ------------------------
// Utils
// ------------------------
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function setupDpad(player, getSpeed) {
  document.querySelectorAll('.btn').forEach((el) => {
    const dx = parseFloat(el.dataset.dx);
    const dy = parseFloat(el.dataset.dy);
    let press = false;
    let rafId = null;
    const step = () => {
      if (!press) return;
      const s = getSpeed();
      player.x = Math.max(0, Math.min(1, player.x + dx * s));
      player.y = Math.max(0, Math.min(1, player.y + dy * s));
      rafId = requestAnimationFrame(step);
    };
    el.addEventListener('touchstart', (e) => { press = true; step(); e.preventDefault(); }, { passive: false });
    el.addEventListener('touchend',   () => { press = false; cancelAnimationFrame(rafId); });
  });
}
