// src/game.js
// ========================================================
// CONFIG + GAMEPLAY réunis (i18n/ui/audio restent séparés)
// ========================================================

import { t, poiName, poiInfo } from './i18n.js';
import * as ui from './ui.js';
import { startMusic, stopMusic, ping, starEmphasis, failSfx } from './audio.js';

// ---------- Version & cache-buster ----------
const APP_VERSION = 'v2025-08-20-g';
const APP_Q = `?v=${APP_VERSION}`;
const asset = (p) => `${p}${APP_Q}`;

// ---------- Assets (correspondent à /assets/ que tu as) ----------
const ASSETS = {
  MAP_URL:       asset('assets/salento-map.PNG'),
  BIRD_URL:      asset('assets/aracne .PNG'),      // (avec espace dans le nom, comme tu l’as)
  TARANTULA_URL: asset('assets/tarantula .PNG'),
  CROW_URL:      asset('assets/crow.PNG'),
  JELLY_URL:     asset('assets/jellyfish.PNG'),
};

// ---------- UI layout / zoom ----------
const UI_CONST = {
  TOP: 120,
  BOTTOM: 160,
  MAP_ZOOM: 1.30,
};

// ---------- Aides viewport carte ----------
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

// ---------- POI / progression ----------
const SHIFT_COAST = { x: 0.045, y: 0.026 };
const SHIFT_EAST = 0.04;

const POIS = [
  { key: 'otranto',       x: 0.86 + SHIFT_EAST + SHIFT_COAST.x,       y: 0.48 + SHIFT_COAST.y },
  { key: 'portobadisco',  x: 0.80 + SHIFT_EAST + SHIFT_COAST.x,       y: 0.56 + SHIFT_COAST.y },
  { key: 'santacesarea',  x: 0.74 + SHIFT_EAST + SHIFT_COAST.x + 0.010, y: 0.60 + SHIFT_COAST.y + 0.008 },
  { key: 'castro',        x: 0.72 + SHIFT_EAST + SHIFT_COAST.x + 0.012, y: 0.65 + SHIFT_COAST.y + 0.008 },
  { key: 'ciolo',         x: 0.66 + SHIFT_EAST + SHIFT_COAST.x + 0.070, y: 0.78 + SHIFT_COAST.y + 0.006 },
  { key: 'leuca',         x: 0.64 + SHIFT_COAST.x + 0.10,              y: 0.90 + SHIFT_COAST.y },
  { key: 'gallipoli',     x: 0.27,                                     y: 0.62 },
  { key: 'portocesareo',  x: 0.22,                                     y: 0.46 },
  { key: 'nardo',         x: 0.38,                                     y: 0.50 },
  { key: 'lecce',         x: 0.53,                                     y: 0.28 },
];

const STARS_TARGET = 10;

// ---------- Joueur / énergie ----------
const playerBase = { x: 0.55, y: 0.25, speed: 0.0048, size: 0.11 };
const ENERGY = { MAX: 100, HIT_DAMAGE: 18, BONUS_HEAL: 14 };
let energy = ENERGY.MAX;

function setEnergy(p) {
  energy = Math.max(0, Math.min(ENERGY.MAX, p | 0));
  ui.updateEnergy((energy / ENERGY.MAX) * 100);
}

// ---------- Ennemis / bonus (intégrés ici) ----------
const ENEMY = { JELLY: 'jelly', CROW: 'crow' };
const ENEMY_CFG = {
  MAX_ON_SCREEN: 4,
  LIFETIME_S: 14,
  BASE_SPAWN_MS: 4200,
  SPAWN_JITTER_MS: 2600,
  COLLIDE_RADIUS_PX: 36,
  SPEED: { jelly: 0.06, crow: 0.10 },
  FLEE: { SPEED: 0.38, DURATION_MS_MIN: 1600, DURATION_MS_RAND: 700 },
  SPRITE_PX: 42,
};
const BONUS_CFG = { LIFETIME_S: 4, PICK_RADIUS_PX: 36, BASE_SPAWN_MS: 4200, SPAWN_JITTER_MS: 3000 };

let enemies = [];
let bonuses = [];
let enemySpawnAt = 0;
let bonusSpawnAt = 0;

let playerSlowTimer = 0; // s de ralentissement après collision
let hitShake = 0;        // s de “shake” visuel
const HIT_SHAKE_MAX = 2.4;
const HIT_SHAKE_DECAY = 1.0;

function resetEnemies(now = performance.now()) {
  enemies.length = 0;
  bonuses.length = 0;
  enemySpawnAt = now + 800;
  bonusSpawnAt = now + 1400;
  playerSlowTimer = 0;
  hitShake = 0;
}

function spawnEnemy(now) {
  if (enemies.length >= ENEMY_CFG.MAX_ON_SCREEN) return;
  const type = (Math.random() < 0.5) ? ENEMY.JELLY : ENEMY.CROW;
  const x = Math.random() * 0.9 + 0.05;
  const y = Math.random() * 0.9 + 0.05;
  const dir = Math.random() * Math.PI * 2;
  const speed = ENEMY_CFG.SPEED[type];
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
    age: 0,
    life: BONUS_CFG.LIFETIME_S,
    pulse: 0,
  });
}

function getPlayerSpeedFactor() {
  return (playerSlowTimer > 0) ? 0.45 : 1.0;
}

function updateEnemies(dt, bounds, playerPx) {
  const now = performance.now();
  const { ox, oy, dw, dh } = bounds;
  const { bx, by } = playerPx;

  // spawns
  if (now > enemySpawnAt) {
    if (enemies.length < ENEMY_CFG.MAX_ON_SCREEN) spawnEnemy(now);
    enemySpawnAt = now + ENEMY_CFG.BASE_SPAWN_MS + Math.random() * ENEMY_CFG.SPAWN_JITTER_MS;
  }
  if (now > bonusSpawnAt) {
    spawnBonus(now);
    bonusSpawnAt = now + BONUS_CFG.BASE_SPAWN_MS + Math.random() * BONUS_CFG.SPAWN_JITTER_MS;
  }

  // vieillissement / auto-despawn
  enemies = enemies.filter(e => (now - (e.bornAt || now)) < ENEMY_CFG.LIFETIME_S * 1000);

  // timers
  if (playerSlowTimer > 0) playerSlowTimer = Math.max(0, playerSlowTimer - dt);
  if (hitShake > 0)        hitShake = Math.max(0, hitShake - dt * HIT_SHAKE_DECAY);

  // mouvement
  const PAD = 0.02;
  for (const e of enemies) {
    e.t += dt;

    if (e.state === 'flee') {
      if (now >= e.fleeUntil) {
        e._remove = true;
      } else {
        e.vx *= 0.995; e.vy *= 0.995;
      }
    } else if (e.type === ENEMY.JELLY) {
      e.vx += Math.sin(e.t * 1.7) * 0.0008;
      e.vy += Math.cos(e.t * 1.3) * 0.0008;
    }

    e.x += e.vx * dt; e.y += e.vy * dt;

    if (e.x < PAD || e.x > 1 - PAD) { e.vx *= -1; e.x = Math.max(PAD, Math.min(1 - PAD, e.x)); }
    if (e.y < PAD || e.y > 1 - PAD) { e.vy *= -1; e.y = Math.max(PAD, Math.min(1 - PAD, e.y)); }
  }
  enemies = enemies.filter(e => !e._remove);

  // collisions
  let collided = false;
  let bonusPicked = false;

  for (const e of enemies) {
    if (e.state === 'flee') continue;
    const ex = ox + e.x * dw;
    const ey = oy + e.y * dh;
    const d = Math.hypot(bx - ex, by - ey);
    if (d < ENEMY_CFG.COLLIDE_RADIUS_PX) {
      collided = true;
      failSfx();
      playerSlowTimer = Math.max(playerSlowTimer, 1.25);
      hitShake = Math.min(HIT_SHAKE_MAX, hitShake + 0.6);

      // fuite opposée
      const away = Math.atan2((ey - by), (ex - bx));
      e.vx = Math.cos(away) * ENEMY_CFG.FLEE.SPEED;
      e.vy = Math.sin(away) * ENEMY_CFG.FLEE.SPEED;
      e.state = 'flee';
      e.fleeUntil = now + ENEMY_CFG.FLEE.DURATION_MS_MIN + Math.random() * ENEMY_CFG.FLEE.DURATION_MS_RAND;
    }
  }

  // bonus pickup
  for (let i = bonuses.length - 1; i >= 0; i--) {
    const b = bonuses[i];
    b.age += dt; b.pulse += dt;
    if (b.age > b.life) { bonuses.splice(i, 1); continue; }
    const bpx = ox + b.x * dw, bpy = oy + b.y * dh;
    if (Math.hypot(bx - bpx, by - bpy) < BONUS_CFG.PICK_RADIUS_PX) {
      bonusPicked = true;
      ping(880, 0.35);
      playerSlowTimer = 0; // annule le slow
      hitShake = Math.min(HIT_SHAKE_MAX, hitShake + 0.2);
      bonuses.splice(i, 1);
    }
  }

  return { collided, bonusPicked };
}

function drawEnemies(ctx, bounds, sprites) {
  const { ox, oy, dw, dh } = bounds;
  const SIZE = ENEMY_CFG.SPRITE_PX;

  // bonus sous les ennemis
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

  // ennemis
  for (const e of enemies) {
    const x = ox + e.x * dw, y = oy + e.y * dh;
    ctx.save();

    if (e.state === 'flee') {
      const remain = Math.max(0, e.fleeUntil - (performance.now ? performance.now() : Date.now())) / 700;
      ctx.globalAlpha = Math.max(0.12, Math.min(1, remain));
    }

    if (e.type === ENEMY.JELLY) {
      if (sprites.jellyImg?.naturalWidth) {
        ctx.drawImage(sprites.jellyImg, x - SIZE / 2, y - SIZE / 2, SIZE, SIZE);
      } else {
        // Fallback jelly
        ctx.fillStyle = 'rgba(123,200,255,0.85)';
        ctx.beginPath(); ctx.arc(x, y, 18, Math.PI, 0); ctx.fill();
        ctx.fillRect(x - 18, y, 36, 8);
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(x - 14 + i * 7, y + 8);
          ctx.quadraticCurveTo(x - 14 + i * 7, y + 22 + (i % 2 ? 6 : -4), x - 14 + i * 7, y + 32);
          ctx.strokeStyle = 'rgba(80,150,220,0.9)';
          ctx.lineWidth = 2; ctx.stroke();
        }
      }
    } else { // crow
      const ang = Math.atan2(e.vy, e.vx);
      ctx.translate(x, y); ctx.rotate(ang);
      if (sprites.crowImg?.naturalWidth) {
        ctx.drawImage(sprites.crowImg, -SIZE / 2, -SIZE / 2, SIZE, SIZE);
      } else {
        // Fallback corbeau
        ctx.fillStyle = '#242424';
        ctx.beginPath();
        ctx.moveTo(-20, 0); ctx.lineTo(10, -8); ctx.lineTo(10, 8);
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-6, 0, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd400';
        ctx.fillRect(10, -2, 6, 4);
      }
    }
    ctx.restore();
  }
}

// ---------- Canvas & images ----------
let canvas, ctx;
let W = 0, H = 0, dpr = 1;

const mapImg    = new Image();
const birdImg   = new Image();
const spiderImg = new Image();
const crowImg   = new Image();
const jellyImg  = new Image();

const SPRITES = { crowImg, jellyImg };

// ---------- State global ----------
let running = false;
let lastTS = 0;
let frameDT = 0;
let finale = false;

const player = { ...playerBase };
let collected = new Set();
let QUEST = [];
let currentIdx = 0;

// ---------- Resize ----------
function resize() {
  if (!canvas) return;
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  W = canvas.clientWidth = canvas.parentElement.clientWidth;
  H = canvas.clientHeight = canvas.parentElement.clientHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ---------- Dessins utiles ----------
function drawMapOrPlaceholder(bounds) {
  const { ox, oy, dw, dh } = bounds;
  if (mapImg.complete && mapImg.naturalWidth) {
    ctx.drawImage(mapImg, ox, oy, dw, dh);
  } else {
    ctx.fillStyle = '#bfe2f8'; ctx.fillRect(ox, oy, dw, dh);
    ctx.fillStyle = '#0e2b4a'; ctx.font = '16px system-ui';
    ctx.fillText(t.mapNotLoaded?.(ASSETS.MAP_URL) || `Map not loaded: ${ASSETS.MAP_URL}`, ox + 14, oy + 24);
  }
}

function drawStarfish(cx, cy, R) {
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

function drawPOIs(bounds) {
  const { ox, oy, dw, dh } = bounds;
  for (const p of POIS) {
    const x = ox + p.x * dw;
    const y = oy + p.y * dh;
    if (collected.has(p.key)) {
      drawStarfish(x, y - 20, Math.max(14, Math.min(22, Math.min(W, H) * 0.028)));
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
}

// ---------- Questions / textes ----------
function askQuestionFor(p) { if (p) ui.showAsk(t.ask?.(poiInfo(p.key)) || `Where is ${poiInfo(p.key)}?`); }
function showTarantulaSuccess(name) { ui.showSuccess(t.success?.(name) || `Great, that’s it: ${name}!`); }

// ---------- Boucle ----------
function draw(ts) {
  if (ts) {
    if (!lastTS) lastTS = ts;
    frameDT = Math.min(0.05, (ts - lastTS) / 1000);
    lastTS = ts;
  }

  const mw = mapImg.naturalWidth || 1920;
  const mh = mapImg.naturalHeight || 1080;
  const bounds = computeMapViewport(W, H, mw, mh);
  const { ox, oy, dw, dh } = bounds;

  ctx.clearRect(0, 0, W, H);
  drawMapOrPlaceholder(bounds);
  drawPOIs(bounds);

  // joueur
  const bw = Math.min(160, Math.max(90, dw * player.size));
  const bx = ox + player.x * dw;
  const by = oy + player.y * dh;

  // ennemis/bonus + énergie
  const { collided, bonusPicked } = updateEnemies(frameDT, { ox, oy, dw, dh }, { bx, by });
  if (collided)    setEnergy(energy - ENERGY.HIT_DAMAGE);
  if (bonusPicked) setEnergy(energy + ENERGY.BONUS_HEAL);

  const dead = (energy <= 0);

  // shake
  let shakeX = 0, shakeY = 0;
  if (hitShake > 0) {
    const a = Math.min(1, hitShake / HIT_SHAKE_MAX);
    const mag = 6 * a;
    shakeX = (Math.random()*2 - 1) * mag;
    shakeY = (Math.random()*2 - 1) * mag;
  }

  // dessine ennemis/bonus sous le joueur
  drawEnemies(ctx, { ox, oy, dw, dh }, SPRITES);

  // dessine le joueur
  if (!finale) {
    if (birdImg.complete && birdImg.naturalWidth) {
      ctx.drawImage(birdImg, bx - bw/2 + shakeX, by - bw/2 + shakeY, bw, bw);
    } else {
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(bx + shakeX, by + shakeY, bw * 0.35, 0, Math.PI * 2); ctx.fill();
    }
  }

  // progression
  if (!finale && !dead && currentIdx < QUEST.length) {
    const p = QUEST[currentIdx];
    const px = ox + p.x * dw, py = oy + p.y * dh;
    const onTarget = Math.hypot(bx - px, by - py) < 44;

    if (onTarget) {
      collected.add(p.key);
      ui.updateScore(collected.size, POIS.length);
      ui.renderStars(collected.size, POIS.length);
      starEmphasis();

      const nameShort = poiName(p.key);
      showTarantulaSuccess(nameShort);

      currentIdx++;
      if (currentIdx === QUEST.length) {
        ui.showReplay(true);
        finale = true;
      } else {
        setTimeout(() => askQuestionFor(QUEST[currentIdx]), 900);
      }
    }
  }

  requestAnimationFrame(draw);
}

// ---------- Contrôles tactiles (D-pad) ----------
function setupControls() {
  document.querySelectorAll('.btn').forEach((el) => {
    const dx = parseFloat(el.dataset.dx);
    const dy = parseFloat(el.dataset.dy);
    let press = false;
    let rafId = null;

    const step = () => {
      if (!press || finale || energy <= 0) return;
      const mw = mapImg.naturalWidth || 1920;
      const mh = mapImg.naturalHeight || 1080;
      const b = computeMapViewport(W, H, mw, mh);
      const speed = playerBase.speed * getPlayerSpeedFactor();
      player.x = Math.max(0, Math.min(1, player.x + dx * speed));
      player.y = Math.max(0, Math.min(1, player.y + dy * speed));
      rafId = requestAnimationFrame(step);
    };

    el.addEventListener('touchstart', (e) => { press = true; step(); e.preventDefault(); }, { passive: false });
    el.addEventListener('touchend',   ()  => { press = false; cancelAnimationFrame(rafId); });
  });
}

// ---------- Reset / Start / Stop ----------
function shuffle(a){ const x=a.slice(); for(let i=x.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; } return x; }

export function resetGame() {
  collected = new Set();
  QUEST = shuffle(POIS);
  currentIdx = 0;
  finale = false;
  setEnergy(ENERGY.MAX);

  player.x = playerBase.x;
  player.y = playerBase.y;

  resetEnemies();

  ui.updateScore(collected.size, POIS.length);
  ui.renderStars(collected.size, POIS.length);
  ui.updateEnergy(100);

  askQuestionFor(QUEST[currentIdx]);
}

export function startGame() {
  try {
    ui.hideOverlay();
    ui.showTouch(true);
    ui.setMusicLabel(true);
    startMusic();

    if (!running) {
      running = true;
      requestAnimationFrame(draw);
    }
    resetGame();
  } catch (e) {
    alert('Start error: ' + (e?.message || e));
  }
}

export function stopGame() {
  stopMusic();
  running = false;
}

// ---------- Boot ----------
export function boot() {
  // Canvas / ctx
  canvas = document.getElementById('c');
  ctx = canvas.getContext('2d', { alpha: true });
  resize(); addEventListener('resize', resize);

  // UI init
  ui.initUI();
  ui.updateScore(0, POIS.length);
  ui.renderStars(0, POIS.length);
  ui.updateEnergy(100);

  // Boutons
  ui.onClickMusic(() => { /* toggle handled in audio; ici simple start */ startMusic(); ui.setMusicLabel(true); });
  ui.onClickReplay(() => { resetGame(); });

  // Avatars overlay (si helper existe; sinon direct DOM)
  if (typeof ui.setHeroImages === 'function') {
    ui.setHeroImages(ASSETS.BIRD_URL, ASSETS.TARANTULA_URL);
  } else {
    const heroAr = document.getElementById('heroAr');
    const heroTa = document.getElementById('heroTa');
    if (heroAr) heroAr.src = ASSETS.BIRD_URL;
    if (heroTa) heroTa.src = ASSETS.TARANTULA_URL;
  }

  // images
  mapImg.src = ASSETS.MAP_URL;
  birdImg.src = ASSETS.BIRD_URL;
  spiderImg.src = ASSETS.TARANTULA_URL;
  crowImg.src = ASSETS.CROW_URL;
  jellyImg.src = ASSETS.JELLY_URL;

  // overlay “placeholder” question
  if (POIS?.length) askQuestionFor(POIS[0]);

  // D-pad
  setupControls();

  // start button (fallback + compat old onclick)
  const startBtn = document.getElementById('startBtn');
  startBtn?.addEventListener('click', () => startGame());
  window.startGame = startGame; // compat
}
