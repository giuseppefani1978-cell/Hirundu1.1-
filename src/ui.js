// src/ui.js
// ---------------------------------------------------------
// UI/HUD : score, étoiles, barre d'énergie, boutons, bulle
// ---------------------------------------------------------
import { t } from './i18n.js';

const qs = (sel) => document.querySelector(sel);

// Réfs DOM (remplies par initUI)
let el = {
  hud: null,
  score: null,
  stars: null,
  musicBtn: null,
  replayBtn: null,
  tarTop: null,
  tarAvatar: null,
  bdTitle: null,
  bdText: null,
  overlay: null,
  touch: null,
  errBox: null,
  errText: null,
  energyWrap: null,
  energySegs: [],
};

// —————————————————————————————
// Initialisation/sanity
// —————————————————————————————
export function initUI() {
  el.hud       = qs('#hud');
  el.score     = qs('#score');
  el.stars     = qs('#stars');
  el.musicBtn  = qs('#musicBtn');
  el.replayBtn = qs('#replayFloat');
  el.tarTop    = qs('#tarTop');
  el.tarAvatar = qs('#tarAvatar');
  el.bdTitle   = qs('#bdTitle');
  el.bdText    = qs('#bdText');
  el.overlay   = qs('#overlay');
  el.touch     = qs('#touch');
  el.errBox    = qs('#err');
  el.errText   = qs('#errText');

  // — Barre d’énergie : injection auto en bas du HUD —
  buildEnergyBar();
}

// —————————————————————————————
// Barre d’énergie (type batterie)
// —————————————————————————————
const ENERGY_SEGMENTS = 8; // 8 “plots” façon batterie

function buildEnergyBar() {
  if (!el.hud) return;

  const wrap = document.createElement('div');
  wrap.setAttribute('id', 'energyBar');
  wrap.style.cssText = `
    width: 42px; margin-top: 8px; display: flex; flex-direction: column; align-items: center; gap: 6px;
  `;

  const label = document.createElement('div');
  label.textContent = 'NRJ';
  label.style.cssText = 'font: 700 11px system-ui; color:#0e2b4a;';

  const battery = document.createElement('div');
  battery.style.cssText = `
    position: relative;
    width: 28px; height: 54px;
    border: 2px solid #7a6a2b; border-radius: 5px; background: #fff8dc;
    display: grid; grid-template-rows: repeat(${ENERGY_SEGMENTS}, 1fr); gap: 3px; padding: 4px 4px;
  `;

  // Cosse de batterie
  const nub = document.createElement('div');
  nub.style.cssText = `
    position:absolute; top:-6px; left:50%; transform:translateX(-50%);
    width:12px; height:6px; border:2px solid #7a6a2b; border-bottom:none; background:#fff8dc; border-radius:3px 3px 0 0;
  `;
  battery.appendChild(nub);

  // Segments
  el.energySegs = [];
  for (let i = 0; i < ENERGY_SEGMENTS; i++) {
    const seg = document.createElement('div');
    seg.style.cssText = `
      width: 100%; border-radius: 2px; background: #e5d9a6; height: 100%;
      box-shadow: inset 0 -1px 0 rgba(0,0,0,.08);
    `;
    el.energySegs.push(seg);
    battery.appendChild(seg);
  }

  wrap.appendChild(label);
  wrap.appendChild(battery);
  el.hud.appendChild(wrap);
  el.energyWrap = wrap;
}

/**
 * Met à jour la barre d’énergie (0..100)
 */
export function updateEnergy(percent) {
  const p = Math.max(0, Math.min(100, percent|0));
  const full = Math.round((p / 100) * ENERGY_SEGMENTS);

  el.energySegs.forEach((seg, idx) => {
    const on = (ENERGY_SEGMENTS - idx) <= full; // on remplit par le bas
    seg.style.background = on ? '#7ac37a' : '#e5d9a6';
  });

  // Border/couleur d’alerte si faible
  const battery = el.energyWrap?.querySelector('div:nth-child(2)');
  if (!battery) return;
  if (p <= 20) {
    battery.style.borderColor = '#c34a3a';
  } else if (p <= 50) {
    battery.style.borderColor = '#c8b37a';
  } else {
    battery.style.borderColor = '#7a6a2b';
  }
}

// —————————————————————————————
// Score + étoiles
// —————————————————————————————
export function updateScore(n, total) {
  if (el.score) el.score.textContent = `${n}/${total}`;
}

export function renderStars(n, total) {
  if (!el.stars) return;
  el.stars.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const im = new Image();
    im.className = 'star';
    im.src = starSVG(i < n ? '#d26f45' : '#f0c9a7');
    el.stars.appendChild(im);
  }
}

function starSVG(fill) {
  const f = fill || '#d26f45';
  return 'data:image/svg+xml;base64,' + btoa(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M50 5 L61 36 L94 36 L67 55 L77 88 L50 68 L23 88 L33 55 L6 36 L39 36 Z' fill='${f}' stroke='#8c3f28' stroke-width='4' stroke-linejoin='round'/></svg>`
  );
}

// —————————————————————————————
// Bulle / texte Tarantula
// —————————————————————————————
export function showAsk(text) {
  if (!el.tarTop) return;
  el.bdTitle.textContent = 'Tarantula';
  el.bdText.textContent  = text || '';
  el.tarTop.classList.add('show');
}
export function showSuccess(text) {
  if (!el.tarTop) return;
  el.bdTitle.textContent = 'Tarantula';
  el.bdText.textContent  = text || '';
  el.tarTop.classList.add('show');
}

// —————————————————————————————
// Overlay / Touch / Boutons
// —————————————————————————————
export function hideOverlay() { el.overlay && (el.overlay.style.display = 'none'); }
export function showOverlay() { el.overlay && (el.overlay.style.display = ''); }

export function showTouch(show = true) {
  if (!el.touch) return;
  el.touch.classList.toggle('show', !!show);
}

export function showReplay(show = true) {
  if (!el.replayBtn) return;
  el.replayBtn.style.display = show ? 'inline-block' : 'none';
}

export function setMusicLabel(isOn) {
  if (!el.musicBtn) return;
  const txt = isOn ? (t.musicOn || 'Musique ON') : (t.musicOff || 'Musique OFF');
  const icon = isOn ? '🔊' : '🔈';
  el.musicBtn.innerHTML = `<span aria-hidden="true">${icon}</span> ${txt}`;
  el.musicBtn.setAttribute('aria-pressed', String(!!isOn));
  el.musicBtn.classList.toggle('is-on', !!isOn);
}

export function onClickMusic(handler) {
  el.musicBtn?.addEventListener('click', handler);
}

// —————————————————————————————
// Labels éphémères (petits toasts animés au-dessus d’un point)
// —————————————————————————————
let labelLayer;

/**
 * Affiche un label éphémère (en px écran) au-dessus d'un point.
 * @param {number} x écran (px)
 * @param {number} y écran (px)
 * @param {string} text contenu du label
 * @param {object} [opts] { color?:string, durationMs?:number, dy?:number }
 */
export function showEphemeralLabel(x, y, text, opts = {}) {
  // lazy-create d’un calque DOM
  if (!labelLayer) {
    labelLayer = document.createElement('div');
    labelLayer.id = 'labelLayer';
    labelLayer.style.cssText = `
      position:fixed; left:0; top:0; right:0; bottom:0;
      pointer-events:none; z-index: 9998;
    `;
    document.body.appendChild(labelLayer);
  }

  const { color = '#b04123', durationMs = 950, dy = -24 } = opts;

  const node = document.createElement('div');
  node.className = 'epi-label';
  node.textContent = text;

  // position de départ (légèrement en dessous)
  node.style.left = `${Math.round(x)}px`;
  node.style.top  = `${Math.round(y)}px`;

  // style inline (fallback si le CSS n’est pas chargé)
  node.style.position   = 'absolute';
  node.style.transform  = 'translate(-50%, -50%)';
  node.style.font       = '700 14px system-ui';
  node.style.color      = '#fff';
  node.style.padding    = '6px 10px';
  node.style.borderRadius = '10px';
  node.style.border     = '2px solid rgba(0,0,0,.25)';
  node.style.background = color; // couleur principale
  node.style.textShadow = '0 1px 0 rgba(0,0,0,.2)';
  node.style.boxShadow  = '0 6px 12px rgba(0,0,0,.25)';
  node.style.opacity    = '0';
  node.style.transition = 'transform 140ms ease, opacity 140ms ease';

  labelLayer.appendChild(node);

  // apparition
  requestAnimationFrame(() => {
    node.style.opacity = '1';
    node.style.transform = `translate(-50%, -50%) translateY(-6px)`;
  });

  // attente puis légère montée + fade
  setTimeout(() => {
    node.style.transition = 'transform 260ms ease, opacity 260ms ease';
    node.style.transform  = `translate(-50%, -50%) translateY(${dy}px)`;
    node.style.opacity    = '0';
  }, Math.max(1, durationMs - 260));

  // cleanup
  setTimeout(() => {
    node.remove();
  }, durationMs + 40);
}

// —————————————————————————————
// Erreurs assets
// —————————————————————————————
export function assetFail(who, url, placeholderCb) {
  if (!el.errBox || !el.errText) return;
  el.errBox.style.display = 'block';
  el.errText.innerHTML += (el.errText.innerHTML ? '<br>' : '') + (t.assetMissing?.(who, url) || `${who} missing: ${url}`);
  if (typeof placeholderCb === 'function') placeholderCb();
}
