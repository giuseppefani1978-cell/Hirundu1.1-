export const DEBUG = false;

export const APP_VERSION = window.APP_VERSION || 'v2025-08-20-g';
export const APP_QUERY = `?v=${APP_VERSION}`;
export const withVersion = (path) => `${path}${APP_QUERY}`;

export const ASSETS = {
  MAP_URL: withVersion('assets/salento-map.PNG'),
  BIRD_URL: withVersion('assets/aracne .PNG'),
  TARANTULA_URL: withVersion('assets/tarantula .PNG'),
  CROW_URL: withVersion('assets/crow.PNG'),
  JELLY_URL: withVersion('assets/jellyfish.PNG'),
  BONUS_PASTICCIOTTO: withVersion('assets/bonus-pasticciotto.PNG'),
  BONUS_RUSTICO: withVersion('assets/rustico.PNG'),
  BONUS_CAFFE: withVersion('assets/caffeleccese .PNG'),
};

export const UI_CONST = Object.freeze({
  TOP: 120,
  BOTTOM: 160,
  MAP_ZOOM: 1.30,
});

const SHIFT_COAST = { x: 0.045, y: 0.026 };
const SHIFT_EAST = 0.04;

export const POIS = [
  { key: 'otranto',      x: 0.86 + SHIFT_EAST + SHIFT_COAST.x,       y: 0.48 + SHIFT_COAST.y },
  { key: 'portobadisco', x: 0.80 + SHIFT_EAST + SHIFT_COAST.x,       y: 0.56 + SHIFT_COAST.y },
  { key: 'santacesarea', x: 0.74 + SHIFT_EAST + SHIFT_COAST.x + 0.010, y: 0.60 + SHIFT_COAST.y + 0.008 },
  { key: 'castro',       x: 0.72 + SHIFT_EAST + SHIFT_COAST.x + 0.012, y: 0.65 + SHIFT_COAST.y + 0.008 },
  { key: 'ciolo',        x: 0.66 + SHIFT_EAST + SHIFT_COAST.x + 0.070, y: 0.78 + SHIFT_COAST.y + 0.006 },
  { key: 'leuca',        x: 0.64 + SHIFT_COAST.x + 0.10,             y: 0.90 + SHIFT_COAST.y },
  { key: 'gallipoli',    x: 0.27,                                    y: 0.62 },
  { key: 'portocesareo', x: 0.22,                                    y: 0.46 },
  { key: 'nardo',        x: 0.38,                                    y: 0.50 },
  { key: 'lecce',        x: 0.53,                                    y: 0.28 },
];

export const STARS_TARGET = POIS.length;

export const PLAYER_BASE = Object.freeze({
  x: 0.55,
  y: 0.25,
  speed: 0.0048,
  size: 0.08,
});

export const ENERGY = Object.freeze({
  MAX: 100,
  START: 100,
});

export const ENEMY = Object.freeze({
  JELLY: 'jelly',
  CROW: 'crow',
});

export const ENEMY_CONFIG = Object.freeze({
  MAX_ON_SCREEN: 4,
  LIFETIME_S: 14,
  BASE_SPAWN_MS: 4200,
  SPAWN_JITTER_MS: 2600,
  COLLIDE_RADIUS_PX: 36,
  SPEED: Object.freeze({
    [ENEMY.JELLY]: 0.06,
    [ENEMY.CROW]: 0.10,
  }),
  FLEE: Object.freeze({
    SPEED: 0.38,
    DURATION_MS_MIN: 1600,
    DURATION_MS_RAND: 700,
  }),
  SPRITE_PX: Object.freeze({
    [ENEMY.JELLY]: 42,
    [ENEMY.CROW]: 42,
  }),
});

export const BONUS = Object.freeze({
  PASTICCIOTTO: 'pasticciotto',
  RUSTICO: 'rustico',
  CAFFE: 'caffe',
});

export const BONUS_CONFIG = Object.freeze({
  LIFETIME_S: 4,
  BASE_SPAWN_MS: 4200,
  SPAWN_JITTER_MS: 3000,
  PICK_RADIUS_PX: 36,
  HEAL_AMOUNT: 25,
});

export const BONUS_TYPES = Object.freeze({
  PASTICCIOTTO: { key: BONUS.PASTICCIOTTO, score: 20, heal: 15, prob: 0.5 },
  RUSTICO:      { key: BONUS.RUSTICO,      score: 40, heal: 25, prob: 0.35 },
  CAFFE:        { key: BONUS.CAFFE,        score: 70, heal: 40, prob: 0.15 },
});

export const SHAKE = Object.freeze({
  MAX_S: 2.4,
  DECAY_PER_S: 1.0,
  HIT_ADD: 0.6,
  BONUS_ADD: 0.2,
});

export const SCORE = Object.freeze({
  STAR: 100,
  BONUS: 20,
  HIT: -30,
  WIN: 200,
  GAMEOVER: 0,
});
