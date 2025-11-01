const HOF_KEYS = ['salento_hof_v1', 'salento_hof_v2', 'salento_hof_v3'];
const DEFAULT_KEY = HOF_KEYS[0];
const HOF_SIZE = 10;
const BONUS_PAGE_URL = '/app.html#/bonus?hof';

function isLikelyHallOfFameKey(key) {
  if (!key) return false;
  return (
    HOF_KEYS.includes(key) ||
    /^salento_hof/i.test(key) ||
    key === 'hof'
  );
}

function collectHallOfFameKeys() {
  const discovered = new Set(HOF_KEYS);

  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return [...discovered];
  }

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && isLikelyHallOfFameKey(key)) {
        discovered.add(key);
      }
    }
  } catch (error) {
    console.warn('[hof] unable to enumerate hall of fame keys', error);
  }

  return [...discovered];
}

const LEGACY_LIST_KEYS = ['entries', 'list', 'scores', 'runs', 'records', 'items', 'values'];

function normalizeToken(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function identifyEntry(entry, key, index) {
  if (!entry || typeof entry !== 'object') {
    return `${key}:${index}`;
  }

  const name = normalizeToken(entry.name);
  if (name) return `name:${name}`;

  const alias = normalizeToken(entry.alias);
  if (alias) return `alias:${alias}`;

  const player = normalizeToken(entry.player);
  if (player) return `player:${player}`;

  const countryLabel = typeof entry.country === 'string' ? entry.country : entry.country?.label;
  const country = normalizeToken(countryLabel);
  if (country) return `country:${country}`;

  if (entry.date) {
    return `date:${entry.date}`;
  }

  return `${key}:${index}`;
}

function normalizeBonusBreakdown(raw) {
  if (!raw) return undefined;
  if (typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return undefined;

  const result = { pasticciotto: 0, rustico: 0, caffe: 0 };
  const tokens = raw.split(/[•,|]/);
  tokens.forEach((token) => {
    const cleaned = token.trim();
    if (!cleaned) return;
    const match = cleaned.match(/(p|r|c)[^0-9]*(\d+)/i);
    if (!match) return;
    const [, kind, amount] = match;
    const value = Number.parseInt(amount, 10);
    if (!Number.isFinite(value)) return;
    const key = kind.toLowerCase();
    if (key === 'p') result.pasticciotto = value;
    if (key === 'r') result.rustico = value;
    if (key === 'c') result.caffe = value;
  });
  return result;
}

function normalizeEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const entry = { ...raw };

  if (typeof entry.name !== 'string' || !entry.name.trim()) {
    const fallbackName =
      typeof raw.player === 'string'
        ? raw.player
        : typeof raw.alias === 'string'
        ? raw.alias
        : 'Joueur';
    entry.name = fallbackName;
  }

  const coerceNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };

  if (!Number.isFinite(entry.score)) {
    entry.score = coerceNumber(raw.score ?? raw.points ?? raw.total ?? raw.value, 0);
  }
  if (!Number.isFinite(entry.stars)) {
    entry.stars = coerceNumber(raw.stars ?? raw.progress ?? raw.progression, 0);
  }
  if (!Number.isFinite(entry.bonuses)) {
    entry.bonuses = coerceNumber(raw.bonuses ?? raw.bonus ?? raw.bonusCount, 0);
  }
  if (!Number.isFinite(entry.hits)) {
    entry.hits = coerceNumber(raw.hits ?? raw.moves ?? raw.steps, 0);
  }
  if (!Number.isFinite(entry.time)) {
    entry.time = coerceNumber(raw.time ?? raw.duration ?? raw.ms ?? raw.elapsed, 0);
  }

  if (!entry.date || typeof entry.date !== 'string') {
    entry.date = typeof raw.date === 'number' ? new Date(raw.date).toISOString() : new Date().toISOString();
  }

  if (entry.country && typeof entry.country === 'string') {
    entry.country = { label: entry.country };
  }

  const breakdown = normalizeBonusBreakdown(entry.bonusBreakdown ?? raw.breakdown);
  if (breakdown) {
    entry.bonusBreakdown = breakdown;
  }

  return entry;
}

function extractEntryArray(parsed) {
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (!parsed || typeof parsed !== 'object') {
    return [];
  }

  for (const key of LEGACY_LIST_KEYS) {
    const value = parsed[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  const values = Object.values(parsed);
  if (values.every((item) => item && typeof item === 'object')) {
    return values;
  }

  return [];
}

function readRawList(key = DEFAULT_KEY) {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const entries = extractEntryArray(parsed);
    if (!entries.length) {
      return [];
    }
    const normalized = entries
      .map((item) => normalizeEntry(item))
      .filter((item) => item !== null);
    if (!normalized.length) {
      return [];
    }
    if (!Array.isArray(parsed) || parsed.length !== normalized.length) {
      writeRawList(normalized, key);
    }
    return normalized;
  } catch (error) {
    console.warn('[hof] unable to read hall of fame entries', error);
    return [];
  }
}

function writeRawList(list, key = DEFAULT_KEY) {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch (error) {
    console.warn('[hof] unable to persist hall of fame entries', error);
  } finally {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hof:update', { detail: { key } }));
      }
    } catch (eventError) {
      console.warn('[hof] unable to broadcast hall of fame update', eventError);
    }
  }
}

export function loadHallOfFame(key = DEFAULT_KEY) {
  return readRawList(key);
}

export function loadAllHallOfFame() {
  return getHallOfFameKeys().map((key) => ({ key, entries: readRawList(key) }));
}

export function saveHallOfFame(entries, key = DEFAULT_KEY) {
  writeRawList(entries, key);
}

export function addHallOfFameEntry(entry, key = DEFAULT_KEY) {
  const list = readRawList(key);
  list.push(entry);
  list.sort((a, b) => (b?.score || 0) - (a?.score || 0));
  const trimmed = list.slice(0, HOF_SIZE);
  writeRawList(trimmed, key);
  return trimmed;
}

export function formatHallOfFameTime(ms) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m${String(remainder).padStart(2, '0')}s`;
}

export function formatHallOfFameBreakdown(breakdown) {
  if (!breakdown || typeof breakdown !== 'object') {
    return 'P:0 • R:0 • C:0';
  }
  const p = breakdown.pasticciotto || 0;
  const r = breakdown.rustico || 0;
  const c = breakdown.caffe || 0;
  return `P:${p} • R:${r} • C:${c}`;
}

export function getHallOfFameKeys() {
  return collectHallOfFameKeys();
}

export function isHallOfFameStorageKey(key) {
  return isLikelyHallOfFameKey(key);
}

export function getHallOfFameBonusUrl() {
  return BONUS_PAGE_URL;
}

export function openHallOfFameBonusPage() {
  if (typeof window === 'undefined') return;
  window.location.assign(BONUS_PAGE_URL);
}

export const HOF_KEY = DEFAULT_KEY;
export { HOF_SIZE };

function coercePositiveNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function coerceNonNegativeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

function addBonusBreakdown(target, breakdown) {
  if (!breakdown || typeof breakdown !== 'object') {
    return;
  }

  target.pasticciotto += coerceNonNegativeNumber(
    breakdown.pasticciotto ?? breakdown.p ?? breakdown.pasticciotti
  );
  target.rustico += coerceNonNegativeNumber(
    breakdown.rustico ?? breakdown.r ?? breakdown.rustici
  );
  target.caffe += coerceNonNegativeNumber(
    breakdown.caffe ?? breakdown.c ?? breakdown.caffes
  );
}

export function loadHallOfFameSummary() {
  const summary = {
    total: 0,
    players: 0,
    perKey: {},
    points: 0,
    bonuses: { pasticciotto: 0, rustico: 0, caffe: 0 },
  };

  const seenPlayers = new Set();
  const keys = getHallOfFameKeys();

  keys.forEach((key) => {
    const entries = readRawList(key);
    const perKey = {
      runs: entries.length,
      points: 0,
      bonuses: { pasticciotto: 0, rustico: 0, caffe: 0 },
    };

    summary.total += entries.length;

    entries.forEach((entry, index) => {
      seenPlayers.add(identifyEntry(entry, key, index));

      const score = coercePositiveNumber(entry?.score ?? entry?.points ?? entry?.total);
      if (score > 0) {
        summary.points += score;
        perKey.points += score;
      }

      addBonusBreakdown(summary.bonuses, entry?.bonusBreakdown ?? entry?.breakdown);
      addBonusBreakdown(perKey.bonuses, entry?.bonusBreakdown ?? entry?.breakdown);
    });

    summary.perKey[key] = perKey;
  });

  summary.players = seenPlayers.size;
  return summary;
}

export function normalizeHallOfFameName(value) {
  return normalizeToken(value);
}
