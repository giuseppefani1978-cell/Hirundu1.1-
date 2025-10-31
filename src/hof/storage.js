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

function readRawList(key = DEFAULT_KEY) {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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
