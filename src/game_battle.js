// src/game_battle.js
// Couche "battle" séparée : inputs, callbacks, tick+render et viewport bas-centré

import {
  setupBattleInputs,
  setBattleCallbacks as setCallbacksRaw,
  setBattleAmmo as setAmmoRaw,
  startBattle as startBattleRaw,
  tickBattle,
  renderBattle,
  isBattleActive as isActiveRaw
} from './battle.js';

// --- Taille logique (aspect) utilisée par battle.js (16:9 conseillé)
const BTL_VIRTUAL = { W: 800, H: 450 };

// --- Helpers safe-area lus depuis :root (si présents)
// Mets dans ton CSS :root { --safe-bottom: env(safe-area-inset-bottom); ... } si tu veux
function getSafeInset(pxName) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(pxName).trim();
    const n = parseFloat(v || '0');
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
}

// Viewport bas-centré : remplit au max sans déformer, collé au bas de l’écran
export function computeBattleViewportBottom(W, H, { sideExtra = 0, bottomExtra = 0 } = {}) {
  const safeBottom = getSafeInset('--safe-bottom');
  const safeLeft   = getSafeInset('--safe-left');
  const safeRight  = getSafeInset('--safe-right');

  const targetAR = BTL_VIRTUAL.W / BTL_VIRTUAL.H;
  const availW = Math.max(1, W - safeLeft - safeRight - sideExtra * 2);
  const availH = Math.max(1, H - safeBottom - bottomExtra);

  let dw = availW;
  let dh = Math.round(dw / targetAR);
  if (dh > availH) { dh = availH; dw = Math.round(availH * targetAR); }

  const ox = Math.floor((W - dw) / 2);
  const oy = Math.floor(H - safeBottom - bottomExtra - dh);
  return { ox, oy, dw, dh };
}

// --- API exposée à game.js (chasse) ---
// (mince adaptateur autour de battle.js)
export function initBattleLayer() {
  setupBattleInputs();
}

// on laisse la possibilité à game.js de brancher ses onWin/onLose
export function setBattleCallbacks(cbs) {
  setCallbacksRaw(cbs);
}

export function setBattleAmmo(ammo) {
  setAmmoRaw(ammo);
}

export function startBattle(levelKey) {
  startBattleRaw(levelKey);
}

export function isBattleActive() {
  return isActiveRaw();
}

// Boucle locale de la battle : on gère notre propre dt ici
let _lastTS = 0;
export function renderBattleFrame(ctx, W, H, sprites, opts = {}) {
  // calcule le viewport bas-centré (ajuste bottomExtra si tu veux coller pile au bouton)
  const vp = computeBattleViewportBottom(W, H, { sideExtra: 0, bottomExtra: opts.bottomExtra ?? 16 });

  const now = performance.now();
  if (!_lastTS) _lastTS = now;
  const dt = Math.min(0.05, (now - _lastTS) / 1000);
  _lastTS = now;

  // tick logique + rendu battle
  tickBattle(dt, ctx);
  renderBattle(ctx, vp, sprites);
}

// reset interne si besoin (ex: quand on quitte la battle)
export function resetBattleClock() { _lastTS = 0; }
