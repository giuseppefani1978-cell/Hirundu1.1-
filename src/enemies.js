// src/enemies.js
// ==============================================================
// Ennemis (corbeaux/méduses) + Bonus + Collisions + Rendu sprites
// ==============================================================

import { ping, failSfx } from './audio.js';

// ---------- Sprites (injection via setSprites) ----------
let SPRITES = {
  crowImg:  null, // Image()
  jellyImg: null, // Image()
};

export function setSprites({ crowImg, jellyImg }) {
  SPRITES.crowImg  = crowImg || null;
  SPRITES.jellyImg = jellyImg || null;
}

// ---------- État interne ----------
let enemies = [];
let bonuses = [];
let enemySpawnAt = 0;
let bonusSpawnAt = 0;

let collisionCount = 0;
let bonusCount = 0;

// Ralentissement joueur (après collision) & shake visuel
let playerSlowTimer = 0; // s restant
let hitShake = 0;        // s restant

// ---------- Réglages principaux ----------
export const constants = {
  MAX_ENEMIES: 4,
  ENEMY_LIFETIME: 14,         // s (auto-despawn)
  ENEMY_BASE_SPAWN: 4200,     // ms
  ENEMY_SPAWN_JITTER: 2600,   // ms
  BONUS_LIFETIME: 4,          // s
  COLLIDE_PX: 36,             // rayon collision joueur<->ennemi en px

  // “Shake” visuel
  HIT_SHAKE_MAX: 2.4,         // clamp max (s)
  HIT_SHAKE_DECAY: 1.0,       // s^-1 (on retire 1s de shake par seconde)

  // Ralentissement temporaire après collision
  SLOW_AFTER_COLLISION: 1.25, // s
  SPEED_SLOW_FACTOR: 0.45,    // multiplicateur de speed si ralenti actif

  // Taille “approximative” des sprites ennemis
  ENEMY_DRAW_SIZE: 42,
  BONUS_PICK_PX: 36,          // rayon de pickup bonus en px
};

// Enum type ennemi
const ENEMY = { JELLY: 'jelly', CROW: 'crow' };

// ---------- Reset ----------
export function resetEnemies(now = (typeof performance !== 'undefined' ? performance.now() : Date.now())) {
  enemies.length = 0;
  bonuses.length = 0;

  enemySpawnAt = now + 800;
  bonusSpawnAt = now + 1400;

  collisionCount = 0;
  bonusCount = 0;

  playerSlowTimer = 0;
  hitShake = 0;
}

// ---------- Spawns ----------
function spawnEnemy(now) {
  if (enemies.length >= constants.MAX_ENEMIES) return;

  const type = (Math.random() < 0.5) ? ENEMY.JELLY : ENEMY.CROW;
  const x = Math.random() * 0.9 + 0.05;
  const y = Math.random() * 0.9 + 0.05;
  const speed = (type === ENEMY.JELLY ? 0.06 : 0.10); // fraction largeur/s
  const dir = Math.random() * Math.PI * 2;

  enemies.push({
    type, x, y,
    vx: Math.cos(dir) * speed,
    vy: Math.sin(dir) * speed,
    r: 0.035,               // rayon logique en coord. normalisées (pour IA/simple)
    t: 0,                   // phase pour wobble méduse
    bornAt: now,
    state: 'normal',        // "normal" | "flee"
    fleeUntil: 0,           // ms
  });
}

function spawnBonus(now) {
  bonuses.push({
    x: Math.random() * 0.9 + 0.05,
    y: Math.random() * 0.9 + 0.05,
    life: constants.BONUS_LIFETIME,
    age: 0,
    r: 0.028,   // rayon logique en norm.
    pulse: 0,
  });
}

// ---------- Modificateurs joueur ----------
export function getPlayerSpeedFactor(baseSpeed = 1) {
  // Si ralenti actif, applique un facteur; sinon 1
  return (playerSlowTimer > 0) ? constants.SPEED_SLOW_FACTOR : 1.0;
}

export function getShakeTimeLeft() {
  return hitShake;
}

export function tickModifiers(dt) {
  if (playerSlowTimer > 0) playerSlowTimer = Math.max(0, playerSlowTimer - dt);
  if (hitShake > 0)        hitShake = Math.max(0, hitShake - dt * constants.HIT_SHAKE_DECAY);
}

// ---------- Update principal ----------
/**
 * Met à jour spawns, ennemis, bonus, collisions, et timers shake/slow.
 * @param {number} dt - delta time en secondes
 * @param {{ox:number, oy:number, dw:number, dh:number}} bounds - zone carte en px
 * @param {{bx:number, by:number}} playerPx - position joueur (px canvas)
 * @returns {{ slowSecondsAdded:number, shakeAdd:number, collided:boolean, bonusPicked:boolean }}
 */
export function updateEnemies(dt, bounds, playerPx) {
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const { ox, oy, dw, dh } = bounds;
  const { bx, by } = playerPx;

  // Spawns (si non finale — c’est géré côté game, ici on spawn tant que appelé)
  if (now > enemySpawnAt) {
    if (enemies.length < constants.MAX_ENEMIES) spawnEnemy(now);
    enemySpawnAt = now + constants.ENEMY_BASE_SPAWN + Math.random() * constants.ENEMY_SPAWN_JITTER;
  }
  if (now > bonusSpawnAt) {
    spawnBonus(now);
    bonusSpawnAt = now + 4200 + Math.random() * 3000;
  }

  // Vieillissement / auto-despawn ennemis
  enemies = enemies.filter(e => (now - (e.bornAt || now)) < constants.ENEMY_LIFETIME * 1000);

  // Timers slow & shake
  tickModifiers(dt);

  // Mouvement ennemis
  const PAD = 0.02;
  for (const e of enemies) {
    e.t += dt;

    if (e.state === 'flee') {
      if (now >= e.fleeUntil) {
        e._remove = true;
      } else {
        // friction légère en fuite
        e.vx *= 0.995;
        e.vy *= 0.995;
      }
    } else if (e.type === ENEMY.JELLY) {
      // wobble méduse
      e.vx += Math.sin(e.t * 1.7) * 0.0008;
      e.vy += Math.cos(e.t * 1.3) * 0.0008;
    }

    e.x += e.vx * dt;
    e.y += e.vy * dt;

    // rebond bords en norm.
    if (e.x < PAD || e.x > 1 - PAD) { e.vx *= -1; e.x = Math.max(PAD, Math.min(1 - PAD, e.x)); }
    if (e.y < PAD || e.y > 1 - PAD) { e.vy *= -1; e.y = Math.max(PAD, Math.min(1 - PAD, e.y)); }
  }
  enemies = enemies.filter(e => !e._remove);

  let collided = false;
  let bonusPicked = false;
  let slowSecondsAdded = 0;
  let shakeAdd = 0;

  // Collisions joueur <-> ennemis (en pixels)
  for (const e of enemies) {
    if (e.state === 'flee') continue;
    const ex = ox + e.x * dw;
    const ey = oy + e.y * dh;
    const d = Math.hypot(bx - ex, by - ey);
    if (d < constants.COLLIDE_PX) {
      collided = true;
      collisionCount++;
      failSfx();

      playerSlowTimer = Math.max(playerSlowTimer, constants.SLOW_AFTER_COLLISION);
      slowSecondsAdded = constants.SLOW_AFTER_COLLISION;

      hitShake = Math.min(constants.HIT_SHAKE_MAX, hitShake + 0.6);
      shakeAdd += 0.6;

      // passe en fuite, direction opposée au joueur
      const fleeSpeed = 0.38; // fraction largeur/s
      const away = Math.atan2((ey - by), (ex - bx));
      e.vx = Math.cos(away) * fleeSpeed;
      e.vy = Math.sin(away) * fleeSpeed;
      e.state = 'flee';
      e.fleeUntil = now + 1600 + Math.random() * 700;
    }
  }

  // Bonus pickup
  for (let i = bonuses.length - 1; i >= 0; i--) {
    const b = bonuses[i];
    b.age += dt; b.pulse += dt;
    if (b.age > b.life) { bonuses.splice(i, 1); continue; }
    const bpx = ox + b.x * dw, bpy = oy + b.y * dh;
    if (Math.hypot(bx - bpx, by - bpy) < constants.BONUS_PICK_PX) {
      bonusPicked = true;
      bonusCount++;
      ping(880, 0.35);
      // Un bonus annule le ralentissement en cours (récompense “NRJ”)
      playerSlowTimer = 0;
      hitShake = Math.min(constants.HIT_SHAKE_MAX, hitShake + 0.2);
      bonuses.splice(i, 1);
    }
  }

  return { slowSecondsAdded, shakeAdd, collided, bonusPicked };
}

// ---------- Rendu ----------
function drawCrow(ctx) {
  ctx.fillStyle = '#242424';
  ctx.beginPath();
  ctx.moveTo(-20, 0); ctx.lineTo(10, -8); ctx.lineTo(10, 8);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-6, 0, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd400';
  ctx.fillRect(10, -2, 6, 4);
}

function drawJellyFallback(ctx, x, y) {
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

/**
 * Dessine tous les ennemis + bonus
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ox:number, oy:number, dw:number, dh:number}} bounds
 */
export function drawEnemies(ctx, bounds) {
  const { ox, oy, dw, dh } = bounds;
  const SIZE = constants.ENEMY_DRAW_SIZE;

  // Dessine bonus (sous les ennemis)
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

  // Dessine ennemis (au-dessus)
  for (const e of enemies) {
    const x = ox + e.x * dw, y = oy + e.y * dh;
    ctx.save();

    // Transparence si “flee”
    if (e.state === 'flee') {
      const remain = Math.max(0, (e.fleeUntil - (performance.now ? performance.now() : Date.now())) / 700);
      ctx.globalAlpha = Math.max(0.12, Math.min(1, remain));
    }

    if (e.type === ENEMY.JELLY) {
      if (SPRITES.jellyImg && SPRITES.jellyImg.complete && SPRITES.jellyImg.naturalWidth) {
        ctx.drawImage(SPRITES.jellyImg, x - SIZE / 2, y - SIZE / 2, SIZE, SIZE);
      } else {
        drawJellyFallback(ctx, x, y);
      }
    } else {
      // Corbeau : on oriente dans la direction du vol
      const ang = Math.atan2(e.vy, e.vx);
      ctx.translate(x, y); ctx.rotate(ang);
      if (SPRITES.crowImg && SPRITES.crowImg.complete && SPRITES.crowImg.naturalWidth) {
        ctx.drawImage(SPRITES.crowImg, -SIZE / 2, -SIZE / 2, SIZE, SIZE);
      } else {
        drawCrow(ctx);
      }
    }
    ctx.restore();
  }
}

// ---------- Stats ----------
export function getEnemyStats() {
  return {
    collisions: collisionCount,
    bonuses: bonusCount,
    enemiesCount: enemies.length,
    slowTimeLeft: playerSlowTimer,
    shakeTimeLeft: hitShake,
  };
}
