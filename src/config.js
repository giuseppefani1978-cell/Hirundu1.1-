// src/config.js
// ========================================================
// Configuration globale, assets, constantes gameplay & UI
// ========================================================

// --- Version & cache-buster (gardée compatible avec ton HTML) ---
export const APP_VERSION = "v2025-08-20-e";
export const APP_Q = `?v=${APP_VERSION}`;

// Petit helper pour composer un chemin asset + cache-buster
export const asset = (path) => `${path}${APP_Q}`;

// --- Assets (⚠️ Assure-toi que les noms de fichiers côté /assets/ correspondent) ---
// Si tes fichiers sont en .PNG majuscule, garde .PNG. Évite les espaces dans les noms.
export const APP_VERSION = "v2025-08-20-f";
export const APP_Q = `?v=${APP_VERSION}`;
export const asset = (p) => `${p}${APP_Q}`;

// Chemins canoniques SANS espaces
export const ASSETS = {
  MAP_URL:       asset("assets/salento-map.PNG"),   // ou .PNG si tes fichiers sont en .PNG
  BIRD_URL:      asset("assets/aracne .PNG"),        // <-- renomme le fichier si besoin
  TARANTULA_URL: asset("assets/tarantula .PNG"),
  CROW_URL:      asset("assets/crow.PNG"),
  JELLY_URL:     asset("assets/jellyfish.PNG")
};


  // (Optionnel) SFX ou musiques pré-générées si un jour tu ajoutes des fichiers
  // MUSIC_URL:   asset("assets/music.ogg"),
  // SFX_HIT_URL: asset("assets/hit.wav"),
};
for (const [k, url] of Object.entries(ASSETS)) {
  const img = new Image();
  img.onerror = () => console.warn("[ASSET 404?]", k, url);
  img.src = url;
}

// --- UI layout (marges réservées en haut/bas pour HUD) ---
export const UI = {
  TOP: 120,
  BOTTOM: 160,
  MAP_ZOOM: 1.30, // zoom global de la carte
};

// --- Joueur : constructeur d’état initial (position normalisée 0..1) ---
export function makeInitialPlayer() {
  return {
    x: 0.55,
    y: 0.25,
    speed: 0.0048,   // fraction de largeur carte / frame (avant dt)
    size: 0.11,      // taille relative (pour le sprite)
    // Énergie (NRJ)
    energy: 100,
    energyMax: 100,
    invulnTimer: 0,  // secondes d’invulnérabilité temporaire après un hit
  };
}

// --- POIs (positions normalisées ~ basées sur tes derniers offsets) ---
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

// --- Étoiles / score ---
export const STARS_TARGET = 10;

// --- Ennemis & bonus : constantes communes ---
export const ENEMY = { JELLY: "jelly", CROW: "crow" };

export const ENEMY_CONFIG = {
  MAX_ON_SCREEN: 4,
  LIFETIME_S: 14,                // auto-despawn
  BASE_SPAWN_MS: 4200,
  SPAWN_JITTER_MS: 2600,
  COLLIDE_RADIUS_PX: 36,

  // vitesses (fraction largeur / seconde)
  SPEED: {
    [ENEMY.JELLY]: 0.06,
    [ENEMY.CROW]:  0.10,
  },

  // comportement
  FLEE: {
    SPEED: 0.38,                 // vitesse pendant la fuite
    DURATION_MS_MIN: 1600,
    DURATION_MS_RAND: 700,       // + aléatoire [0..RAND]
  },

  // rendu (taille sprite px)
  SPRITE_PX: {
    [ENEMY.JELLY]: 42,
    [ENEMY.CROW]:  42,
  },
};

export const BONUS_CONFIG = {
  LIFETIME_S: 4,
  BASE_SPAWN_MS: 4200,
  SPAWN_JITTER_MS: 3000,
  PICK_RADIUS_PX: 36,
  HEAL_AMOUNT: 25,          // +NRJ à la prise
};

// --- Énergie / dégâts ---
export const ENERGY = {
  MAX: 100,
  START: 100,
  HIT_DAMAGE: 20,           // -NRJ à chaque collision
  INVULN_AFTER_HIT_S: 1.0,  // invulnérabilité courte
};

// --- Effets visuels “shake” (joueur) ---
export const SHAKE = {
  MAX_S: 2.4,               // clamp maximum
  DECAY_PER_S: 1.0,         // (s^-1)
  HIT_ADD: 0.6,             // +shake à chaque hit
  BONUS_ADD: 0.2,           // petit shake positif à un bonus
};

// --- Audio/musique ---
export const AUDIO = {
  MASTER_GAIN: 0.58,
  LOOP_PHRASE_MS: 2800,
  ENABLED_BY_DEFAULT: false, // la musique démarre après geste utilisateur
};

// --- Final / feu d’artifice ---
export const FINALE = {
  FW_REPEAT_MS: 4500,
  ZOOM_MAX: 1.35,
  ZOOM_SPEED: 0.12,
};

// --- Fail feedback cooldown (anti-spam sfx quand on frôle le mauvais POI) ---
export const FEEDBACK = {
  FAIL_COOLDOWN_MS: 900,
};

// --- Outils utiles pour le canvas (dpr) ---
export function pickDevicePixelRatio() {
  return Math.max(1, Math.min(2, window.devicePixelRatio || 1));
}

// --- Helpers pour dimensions canvas calculées côté game/ui ---
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
