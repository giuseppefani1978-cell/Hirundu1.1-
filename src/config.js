// src/config.js
// ========================================================
// Configuration globale, assets, constantes gameplay & UI
// ========================================================

// --- Version & cache-buster ---
export const APP_VERSION = "v2025-08-20-g";
export const APP_Q = `?v=${APP_VERSION}`;
export const asset = (p) => `${p}${APP_Q}`;

// --- Assets (⚠️ renomme vraiment les fichiers côté /assets/ pour éviter les espaces) ---
export const ASSETS = {
  MAP_URL:       asset("assets/salento-map.PNG"),
  BIRD_URL:      asset("assets/aracne .PNG"),      // <-- pas d’espace dans le nom du fichier
  TARANTULA_URL: asset("assets/tarantula .PNG"),
  CROW_URL:      asset("assets/crow.PNG"),
  JELLY_URL:     asset("assets/jelly.PNG"),       // ou "jellyfish.PNG" si c’est ton nom réel
};

// --- UI layout ---
export const UI = {
  TOP: 120,
  BOTTOM: 160,
  MAP_ZOOM: 1.30,
};

// --- POIs (positions normalisées) ---
const SHIFT_COAST = { x: 0.045, y: 0.026 };
const SHIFT_EAST  = 0.04;

export const POIS = [
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

// --- Outils écran (DPR) ---
export function pickDevicePixelRatio() {
  return Math.max(1, Math.min(2, window.devicePixelRatio || 1));
}

// --- Calcul du viewport carte (utilisé par game.js) ---
export function computeMapViewport(canvasW, canvasH, mapW, mapH) {
  const availW = canvasW;
  const availH = Math.max(200, canvasH - UI.BOTTOM - UI.TOP);
  const baseScale = Math.min(availW / mapW, availH / mapH);
  const scale = baseScale * UI.MAP_ZOOM;
  const dw = mapW * scale;
  const dh = mapH * scale;
  const ox = (canvasW - dw) / 2;
  const oy = UI.TOP + (availH - dh) / 2;
  return { ox, oy, dw, dh };
}
