// src/config.js
// Configuration + assets + constantes

export const APP_VERSION = "v2025-08-20-g";
export const APP_Q = `?v=${APP_VERSION}`;
export const asset = (p) => `${p}${APP_Q}`;

// Noms de fichiers SANS espaces (doivent exister dans /assets/)
export const ASSETS = {
  MAP_URL:       asset("assets/salento-map.PNG"),
  BIRD_URL:      asset("assets/aracne .PNG"),
  TARANTULA_URL: asset("assets/tarantula .PNG"),
  CROW_URL:      asset("assets/crow.PNG"),
  JELLY_URL:     asset("assets/jellyfish.PNG"),
};

// UI
export const UI = { TOP: 120, BOTTOM: 160, MAP_ZOOM: 1.30 };

// Joueur (état initial)
export function makeInitialPlayer() {
  return { x: 0.55, y: 0.25, speed: 0.0048, size: 0.11 };
}

// POI (inchangés)
const SHIFT_COAST = { x:0.045, y:0.026 };
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

export const STARS_TARGET = 10;
