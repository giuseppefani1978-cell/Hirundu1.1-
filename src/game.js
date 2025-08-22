// src/game.js
// ---------------------------------------------------------
// Boucle principale, rendu carte/POI, progression, énergie
// ---------------------------------------------------------
// ... imports en haut
import { ASSETS } from "./config.js";
import { setupUI, setHeroImages } from "./ui.js"; // si tu as ce helper
// ...

// Assure que le bouton déclenche bien le jeu
function wireStartButton() {
  const btn = document.getElementById("startBtn");
  if (btn) btn.addEventListener("click", startGame);
  // Compat pour anciens onClick inline si jamais tu le gardes :
  window.startGame = startGame;
}

// Au boot du module
document.addEventListener("DOMContentLoaded", () => {
  try {
    wireStartButton();
    // si tu initialises les images de l’écran de démarrage ici :
    setHeroImages?.(ASSETS.BIRD_URL, ASSETS.TARANTULA_URL);
    // le reste de ton init (resize, splash, etc.)
  } catch (e) {
    console.error(e);
  }
});



import {
  MAP_URL, BIRD_URL, TARANTULA_URL,
  CROW_URL, JELLY_URL,
  MAP_ZOOM, UI_TOP, UI_BOTTOM,
  POIS, playerBase
} from './config.js';

import { t, poiName, poiInfo } from './i18n.js';
import { startMusic, stopMusic, ping, starEmphasis } from './audio.js';
import {
  setSprites, resetEnemies, updateEnemies, drawEnemies,
  getEnemyStats, getPlayerSpeedFactor, getShakeTimeLeft
} from './enemies.js';
import * as ui from './ui.js';

// —————————————————————————————
// Canvas & contexte
// —————————————————————————————
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: true });

// —————————————————————————————
// State global jeu
// —————————————————————————————
let running = false;
let lastTS = 0;
let frameDT = 0;

// Joueur
const player = { x: playerBase.x, y: playerBase.y, speed: playerBase.speed, size: playerBase.size };

// Progression
let collected = new Set();
let QUEST = [];
let currentIdx = 0;

// Énergie (0..100)
const ENERGY_MAX = 100;
let energy = ENERGY_MAX;

// Finale / feux (placeholder simple : on réutilise le feu d’artifice via enemies si besoin plus tard)
let finale = false;

// —————————————————————————————
// Images (carte + personnages + sprites ennemis)
// —————————————————————————————
const mapImg    = new Image();
const birdImg   = new Image();
const spiderImg = new Image();
const crowImg   = new Image();
const jellyImg  = new Image();

mapImg.src    = MAP_URL; || 'assets/salento-map.PNG';
birdImg.src   = BIRD_URL; || 'assets/aracne .PNG';
spiderImg.src = TARANTULA_URL; || 'assets/tarantula .PNG';
crowImg.src   = CROW_URL || 'assets/crow.png';
jellyImg.src  = JELLY_URL || 'assets/jellyfish.png';

// Propagation sprites ennemis au module enemies
setSprites({ crowImg, jellyImg });

// —————————————————————————————
// Resize / DPR
// —————————————————————————————
let W = 0, H = 0, dpr = 1;
function resize() {
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  W = canvas.clientWidth  = canvas.parentElement.clientWidth;
  H = canvas.clientHeight = canvas.parentElement.clientHeight;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
addEventListener('resize', resize);

// —————————————————————————————
// Aides rendu / placement carte
// —————————————————————————————
function computeMapBounds() {
  const mw = mapImg.naturalWidth || 1920;
  const mh = mapImg.naturalHeight || 1080;
  const availW = W;
  const availH = Math.max(200, H - UI_BOTTOM - UI_TOP);
  const baseScale = Math.min(availW / mw, availH / mh);
  const scale = baseScale * (MAP_ZOOM || 1);
  const dw = mw * scale;
  const dh = mh * scale;
  const ox = (W - dw) / 2;
  const oy = UI_TOP + (availH - dh) / 2;
  return { mw, mh, dw, dh, ox, oy, scale };
}

function drawMapOrPlaceholder(bounds) {
  const { ox, oy, dw, dh } = bounds;
  if (mapImg.complete && mapImg.naturalWidth) {
    ctx.drawImage(mapImg, ox, oy, dw, dh);
  } else {
    ctx.fillStyle = '#bfe2f8'; ctx.fillRect(ox, oy, dw, dh);
    ctx.fillStyle = '#0e2b4a'; ctx.font = '16px system-ui';
    ctx.fillText(t.mapNotLoaded?.(MAP_URL) || `Map not loaded: ${MAP_URL}`, ox + 14, oy + 24);
  }
}

// —————————————————————————————
// POI & étoiles
// —————————————————————————————
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

// —————————————————————————————
// Energie helpers
// —————————————————————————————
function setEnergy(p) {
  energy = Math.max(0, Math.min(ENERGY_MAX, p|0));
  ui.updateEnergy((energy / ENERGY_MAX) * 100);
}

// —————————————————————————————
// Texte Tarantula (questions/succès)
// —————————————————————————————
function askQuestionFor(p) {
  if (!p) return;
  ui.showAsk(t.ask?.(poiInfo(p.key)) || `Where is ${poiInfo(p.key)}?`);
}
function showTarantulaSuccess(name) {
  ui.showSuccess(t.success?.(name) || `Great, that’s it: ${name}!`);
}

// —————————————————————————————
// Boucle principale
// —————————————————————————————
function draw(ts) {
  if (ts) {
    if (!lastTS) lastTS = ts;
    frameDT = Math.min(0.05, (ts - lastTS) / 1000);
    lastTS = ts;
  }

  const bounds = computeMapBounds();
  const { ox, oy, dw, dh } = bounds;

  // fond
  ctx.clearRect(0, 0, W, H);
  drawMapOrPlaceholder(bounds);

  // POI
  drawPOIs(bounds);

  // Position joueur px
  const bw = Math.min(160, Math.max(90, dw * player.size));
  const bx = ox + player.x * dw;
  const by = oy + player.y * dh;

  // Ennemis + bonus (et collisions)
  const { collided, bonusPicked } = updateEnemies(frameDT, { ox, oy, dw, dh }, { bx, by });

  // Énergie (perte/gain)
  if (collided) {
    setEnergy(energy - 18); // perte
  }
  if (bonusPicked) {
    setEnergy(energy + 14); // regain
  }

  // Si énergie 0 => on “gèle” le joueur (simplement, on arrête de bouger)
  const dead = (energy <= 0);

  // Ajuste la vitesse effective par le slow temporaire (enemies)
  const speedFactor = getPlayerSpeedFactor(1);
  const effSpeed = playerBase.speed * speedFactor;

  // Contrôles (D-pad) — mouvement continu si touche enfoncée (mobile)
  // (Les listeners sont installés dans setupControls; ici on borne juste)
  if (!finale && !dead) {
    // borne déjà assurée par handlers
  }

  // Shake visuel du joueur (issu de enemies)
  let shakeX = 0, shakeY = 0;
  const shakeT = getShakeTimeLeft();
  if (shakeT > 0) {
    const a = Math.min(1, shakeT / 2.4);
    const mag = 6 * a;
    shakeX = (Math.random()*2 - 1) * mag;
    shakeY = (Math.random()*2 - 1) * mag;
  }

  // Dessine bonus/ennemis sous le joueur
  drawEnemies(ctx, { ox, oy, dw, dh });

  // Dessine le joueur
  if (!finale) {
    if (birdImg.complete && birdImg.naturalWidth) {
      ctx.drawImage(birdImg, bx - bw/2 + shakeX, by - bw/2 + shakeY, bw, bw);
    } else {
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(bx + shakeX, by + shakeY, bw * 0.35, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Progression (proche du bon POI ?)
  if (!finale && currentIdx < QUEST.length) {
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
        // Finale (simplifiée ici)
        ui.showReplay(true);
        finale = true;
      } else {
        setTimeout(() => askQuestionFor(QUEST[currentIdx]), 900);
      }
    }
  }

  requestAnimationFrame(draw);
}

// —————————————————————————————
// Contrôles tactiles (D-pad)
// —————————————————————————————
function setupControls() {
  document.querySelectorAll('.btn').forEach((el) => {
    const dx = parseFloat(el.dataset.dx);
    const dy = parseFloat(el.dataset.dy);
    let press = false;
    let rafId = null;

    const step = () => {
      if (!press || finale || energy <= 0) return;
      const bounds = computeMapBounds();
      const speed = playerBase.speed * getPlayerSpeedFactor(1);
      player.x = Math.max(0, Math.min(1, player.x + dx * speed));
      player.y = Math.max(0, Math.min(1, player.y + dy * speed));
      rafId = requestAnimationFrame(step);
    };

    el.addEventListener('touchstart', (e) => {
      press = true; step();
      e.preventDefault();
    }, { passive: false });

    el.addEventListener('touchend', () => {
      press = false; cancelAnimationFrame(rafId);
    });
  });
}

// —————————————————————————————
function refreshHUD() {
  ui.updateScore(collected.size, POIS.length);
  ui.renderStars(collected.size, POIS.length);
  ui.updateEnergy(100);
}

// —————————————————————————————
// Boot/reset publics
// —————————————————————————————
export function resetGame() {
  collected = new Set();
  QUEST = shuffle(POIS);
  currentIdx = 0;
  finale = false;
  setEnergy(ENERGY_MAX);

  player.x = playerBase.x;
  player.y = playerBase.y;

  resetEnemies();

  refreshHUD();
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

// —————————————————————————————
// Helpers
// —————————————————————————————
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// —————————————————————————————
// Wiring initial
// —————————————————————————————
(function boot() {
  ui.initUI();
  refreshHUD();

  // Musique
  ui.onClickMusic(() => {
    // Simple toggle basé sur l’état AudioContext — on s’appuie sur les labels
    // (si vous avez un isOn accessible dans audio.js, remplacez par un vrai toggle)
    startMusic();
    ui.setMusicLabel(true);
  });

  // Replay
  ui.onClickReplay(() => {
    resetGame();
  });

  // “Force refresh” (debug facultatif)
  const rb = document.getElementById('__force__');
  rb?.addEventListener('click', () => {
    const url = new URL(location.href);
    url.searchParams.set('t', Date.now());
    location.replace(url.toString());
  });

  // Avatars écran de démarrage
  const heroAr = document.getElementById('heroAr');
  const heroTa = document.getElementById('heroTa');
  if (heroAr) heroAr.src = BIRD_URL;
  if (heroTa) heroTa.src = TARANTULA_URL;

  // Bouton “Démarrer”
  const startBtn = document.getElementById('startBtn');
  startBtn?.addEventListener('click', () => startGame());

  // D-pad
  setupControls();

  // Bulle placeholder tant que l’overlay est visible
  if (POIS?.length) {
    ui.showAsk(t.ask?.(poiInfo(POIS[0].key)) || `Where is ${poiInfo(POIS[0].key)}?`);
  }
})();
