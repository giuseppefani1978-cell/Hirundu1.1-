// src/levels/level2/game_battle_gallipoli.js
// =====================================================
// Couche "battle" autonome — NIVEAU 2 : Gallipoli
// Boss : double corbeaux
// =====================================================

const BTL_BG_SRC = 'assets/battle_bg_gallipoli.png';  // 🖼 ton fond spécifique

import {
  setupBattleInputs,
  setBattleCallbacks as setCallbacksRaw,
  setBattleAmmo as setAmmoRaw,
  startBattle as startBattleRaw,
  tickBattle,
  renderBattle,
  isBattleActive as isActiveRaw
} from '../../battle.js';

// ---------------------------
// Config assets (sprites)
// ---------------------------
// NB : structure identique à Otranto, seul le boss et le fond changent
const SPRITES_SRC = {
  bird:   'assets/aracne .PNG',      // même sprites du héros
  spider: 'assets/tarantula .PNG',
  crow:   'assets/crow.PNG',         // corbeaux 🪶
  jelly:  'assets/jellyfish_boss.PNG'
};

// --- Taille logique (aspect)
const BTL_VIRTUAL = { W: 800, H: 450 };

// ---------------------------
// État interne (privé)
// ---------------------------
let _canvas = null;
let _ctx = null;
let _raf = 0;
let _lastTS = 0;
let _bottomExtra = 16;
let _sprites = null;
let _onWin = null;
let _onLose = null;

function _pickDPR(){ return Math.max(1, Math.min(2, window.devicePixelRatio || 1)); }

// --- Helpers safe-area
function getSafeInset(pxName) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(pxName).trim();
    const n = parseFloat(v || '0');
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
}

// ---------------------------
// Viewport (identique à L1)
// ---------------------------
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

function _sizeCanvas() {
  if (!_canvas) return;
  const rect = _canvas.getBoundingClientRect();
  const cssW = Math.max(1, Math.round(rect.width));
  const cssH = Math.max(1, Math.round(rect.height));
  const dpr  = _pickDPR();

  const pxW = Math.max(1, Math.floor(cssW * dpr));
  const pxH = Math.max(1, Math.floor(cssH * dpr));

  if (_canvas.width  !== pxW) _canvas.width  = pxW;
  if (_canvas.height !== pxH) _canvas.height = pxH;

  _ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function _onResize() {
  _sizeCanvas();
  try {
    window.scrollTo(0,0);
    requestAnimationFrame(()=>window.scrollTo(0,0));
  } catch {}
}

// ---------------------------
// Chargement des sprites
// ---------------------------
function _loadSprites() {
  return new Promise((resolve) => {
    const birdImg   = new Image();
    const spiderImg = new Image();
    const crowImg   = new Image();
    const jellyImg  = new Image();
    const bgImg     = new Image();

    let left = 5;
    const done = () => { if(--left===0) resolve({ birdImg, spiderImg, crowImg, jellyImg, bgImg }); };

    birdImg.onload = done;   birdImg.onerror = done;   birdImg.src = SPRITES_SRC.bird;
    spiderImg.onload = done; spiderImg.onerror = done; spiderImg.src = SPRITES_SRC.spider;
    crowImg.onload = done;   crowImg.onerror = done;   crowImg.src = SPRITES_SRC.crow;
    jellyImg.onload = done;  jellyImg.onerror = done;  jellyImg.src = SPRITES_SRC.jelly;
    bgImg.onload = done;     bgImg.onerror = done;     bgImg.src   = BTL_BG_SRC; // fond Gallipoli
  });
}

// ---------------------------
// Boucle & rendu
// ---------------------------
function _loop(ts) {
  _raf = requestAnimationFrame(_loop);

  const now = performance.now();
  if (!_lastTS) _lastTS = now;
  const dt = Math.min(0.05, (now - _lastTS) / 1000);
  _lastTS = now;

  tickBattle(dt, _ctx);

  const rect = _canvas.getBoundingClientRect();
  const W = Math.max(1, Math.round(rect.width));
  const H = Math.max(1, Math.round(rect.height));

  const vp = { ox:0, oy:0, dw:W, dh:H };
  renderBattle(_ctx, vp, _sprites);
}

// ------------------------------------------------------------------
// Plein-écran
// ------------------------------------------------------------------
function _enterCanvasFullscreen() {
  if (!_canvas) return;
  _canvas.__prevStyle = _canvas.getAttribute('style') || '';
  _canvas.style.position = 'fixed';
  _canvas.style.left = '0';
  _canvas.style.top = '0';
  _canvas.style.right = '0';
  _canvas.style.bottom = '0';
  _canvas.style.margin = '0';
  _canvas.style.zIndex = '10002';
}

function _exitCanvasFullscreen() {
  if (!_canvas) return;
  if (_canvas.__prevStyle != null) {
    _canvas.setAttribute('style', _canvas.__prevStyle);
    delete _canvas.__prevStyle;
  } else {
    _canvas.removeAttribute('style');
  }
}

// ---------------------------
// API publique
// ---------------------------
export async function startBattleFlow(
  ammo,
  { onWin = ()=>{}, onLose = ()=>{}, bottomExtra = 0 } = {}
){
  _canvas = document.getElementById('c');
  if (!_canvas) { alert("Canvas #c introuvable pour la battle."); return; }
  _ctx = _canvas.getContext('2d', { alpha:true });

  try { document.body.classList.add('mode-battle'); } catch {}
  _enterCanvasFullscreen();

  _bottomExtra = bottomExtra;
  _lastTS = 0;

  setupBattleInputs();

  _onWin  = onWin;
  _onLose = onLose;
  setCallbacksRaw({
    onWin: () => {
      stopBattleFlow();
      try { document.body.classList.remove('mode-battle'); } catch {}
      _onWin && _onWin();
    },
    onLose: () => {
      stopBattleFlow();
      try { document.body.classList.remove('mode-battle'); } catch {}
      _onLose && _onLose();
    }
  });

  setAmmoRaw(ammo || {});
  _sprites = await _loadSprites();

  _onResize();
  window.addEventListener('resize', _onResize, { passive:true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', _onResize, { passive:true });
  }
  window.addEventListener('orientationchange', () => {
    setTimeout(_onResize, 60);
    setTimeout(_onResize, 220);
  }, { passive:true });

  // ✅ Boss Gallipoli = corbeaux
  startBattleRaw('crow');

  cancelAnimationFrame(_raf);
  _raf = requestAnimationFrame(_loop);
}

export function stopBattleFlow() {
  cancelAnimationFrame(_raf); _raf = 0;
  _lastTS = 0;
  if (window.visualViewport) {
    try { window.visualViewport.removeEventListener('resize', _onResize); } catch {}
  }
  try { window.removeEventListener('resize', _onResize); } catch {}
  _exitCanvasFullscreen();
}

export function isBattleActive() { return isActiveRaw(); }
