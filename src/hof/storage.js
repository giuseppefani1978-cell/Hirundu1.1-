import { withBase } from '../paths';

const HOF_KEYS = ['salento_hof_v1', 'salento_hof_v2', 'salento_hof_v3'];
const DEFAULT_KEY = HOF_KEYS[0];
const HOF_SIZE = 10;
const BONUS_PAGE_URL = withBase('app.html#/bonus?hof');
const SUMMARY_STORAGE_KEY = 'salento_hof_summary_v1';
const SUMMARY_VERSION = 1;

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

function coercePositiveNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function coerceNonNegativeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

function addBonusBreakdown(target, breakdown) {
  if (!target || typeof target !== 'object') {
    return;
  }

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

function cloneBonusTotals(seed) {
  if (!seed || typeof seed !== 'object') {
    return { pasticciotto: 0, rustico: 0, caffe: 0 };
  }
  return {
    pasticciotto: coerceNonNegativeNumber(seed.pasticciotto),
    rustico: coerceNonNegativeNumber(seed.rustico),
    caffe: coerceNonNegativeNumber(seed.caffe),
  };
}

function createEmptySummary(perKeySeeds = HOF_KEYS) {
  const perKey = {};
  perKeySeeds.forEach((key) => {
    perKey[key] = {
      runs: 0,
      points: 0,
      bonuses: cloneBonusTotals(),
    };
  });

  return {
    version: SUMMARY_VERSION,
    total: 0,
    points: 0,
    bonuses: cloneBonusTotals(),
    perKey,
    playerIndex: {},
    playerFallback: 0,
  };
}

function ensurePerKeySummary(summary, key) {
  if (!summary.perKey[key]) {
    summary.perKey[key] = {
      runs: 0,
      points: 0,
      bonuses: cloneBonusTotals(),
    };
  } else {
    const record = summary.perKey[key];
    record.runs = coerceNonNegativeNumber(record.runs);
    record.points = coerceNonNegativeNumber(record.points);
    record.bonuses = cloneBonusTotals(record.bonuses);
  }
  return summary.perKey[key];
}

function readSummaryRecord() {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SUMMARY_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (parsed.version !== SUMMARY_VERSION) {
      return null;
    }

    const summary = createEmptySummary();
    summary.total = coerceNonNegativeNumber(parsed.total ?? parsed.runs ?? 0);
    summary.points = coerceNonNegativeNumber(parsed.points ?? parsed.totalPoints ?? 0);
    summary.bonuses = cloneBonusTotals(parsed.bonuses ?? parsed.bonusTotals);

    const perKeyRaw = parsed.perKey;
    if (perKeyRaw && typeof perKeyRaw === 'object') {
      Object.entries(perKeyRaw).forEach(([key, value]) => {
        if (!key || !value || typeof value !== 'object') {
          return;
        }
        const record = ensurePerKeySummary(summary, key);
        record.runs = coerceNonNegativeNumber(value.runs ?? value.total ?? 0);
        record.points = coerceNonNegativeNumber(value.points ?? value.score ?? 0);
        record.bonuses = cloneBonusTotals(value.bonuses ?? value.bonusTotals);
      });
    }

    const playerIndex = parsed.playerIndex || parsed.playersIndex || parsed.playersMap;
    if (playerIndex && typeof playerIndex === 'object') {
      Object.entries(playerIndex).forEach(([id, count]) => {
        if (!id) return;
        summary.playerIndex[id] = coerceNonNegativeNumber(count);
      });
    }

    if (typeof parsed.players === 'number' && parsed.players > 0) {
      summary.playerFallback = coerceNonNegativeNumber(parsed.players);
    }

    return summary;
  } catch (error) {
    console.warn('[hof] unable to read hall of fame summary', error);
    return null;
  }
}

function writeSummaryRecord(summary) {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return;
  }

  try {
    window.localStorage.setItem(
      SUMMARY_STORAGE_KEY,
      JSON.stringify({
        ...summary,
        version: SUMMARY_VERSION,
      })
    );
  } catch (error) {
    console.warn('[hof] unable to persist hall of fame summary', error);
  }
}

function rebuildSummaryRecord() {
  const keys = collectHallOfFameKeys();
  const summary = createEmptySummary(keys);

  keys.forEach((key) => {
    const entries = readRawList(key);
    const record = ensurePerKeySummary(summary, key);
    record.runs = entries.length;
    record.points = 0;
    record.bonuses = cloneBonusTotals();

    entries.forEach((entry, index) => {
      const normalized = normalizeEntry(entry) ?? entry;
      summary.total += 1;

      const score = coercePositiveNumber(
        normalized?.score ?? normalized?.points ?? normalized?.total
      );
      if (score > 0) {
        summary.points += score;
        record.points += score;
      }

      addBonusBreakdown(summary.bonuses, normalized?.bonusBreakdown ?? normalized?.breakdown);
      addBonusBreakdown(record.bonuses, normalized?.bonusBreakdown ?? normalized?.breakdown);

      const playerId = identifyEntry(normalized, key, index);
      if (playerId) {
        summary.playerIndex[playerId] = (summary.playerIndex[playerId] || 0) + 1;
      }
    });
  });

  writeSummaryRecord(summary);
  return summary;
}

function ensureSummaryRecord() {
  return readSummaryRecord() ?? rebuildSummaryRecord();
}

function applyEntryToSummary(entry, key) {
  const summary = ensureSummaryRecord();
  if (!summary) {
    return null;
  }

  const normalized = normalizeEntry(entry) ?? entry;

  summary.total += 1;

  const score = coercePositiveNumber(
    normalized?.score ?? normalized?.points ?? normalized?.total
  );
  if (score > 0) {
    summary.points += score;
  }

  addBonusBreakdown(summary.bonuses, normalized?.bonusBreakdown ?? normalized?.breakdown);

  const record = ensurePerKeySummary(summary, key);
  record.runs += 1;
  if (score > 0) {
    record.points += score;
  }
  addBonusBreakdown(record.bonuses, normalized?.bonusBreakdown ?? normalized?.breakdown);

  const playerId = identifyEntry(normalized, key, summary.total);
  if (playerId) {
    summary.playerIndex[playerId] = (summary.playerIndex[playerId] || 0) + 1;
  }

  summary.playerFallback = 0;

  writeSummaryRecord(summary);
  return summary;
}

function deriveSummarySnapshot(summary) {
  const keys = new Set([
    ...HOF_KEYS,
    ...Object.keys(summary?.perKey || {}),
    ...collectHallOfFameKeys(),
  ]);

  const perKey = {};
  keys.forEach((key) => {
    const record = summary?.perKey?.[key];
    perKey[key] = {
      runs: coerceNonNegativeNumber(record?.runs ?? 0),
      points: coerceNonNegativeNumber(record?.points ?? 0),
      bonuses: cloneBonusTotals(record?.bonuses),
    };
  });

  const playerIndex = summary?.playerIndex && typeof summary.playerIndex === 'object'
    ? summary.playerIndex
    : {};
  const playersFromIndex = Object.keys(playerIndex).filter(Boolean).length;
  const fallbackPlayers = coerceNonNegativeNumber(summary?.playerFallback ?? summary?.players ?? 0);
  const players = playersFromIndex > 0 ? playersFromIndex : fallbackPlayers;

  return {
    total: coerceNonNegativeNumber(summary?.total ?? 0),
    players,
    perKey,
    points: coerceNonNegativeNumber(summary?.points ?? 0),
    bonuses: cloneBonusTotals(summary?.bonuses),
  };
}

function buildEntrySnapshot(keys = collectHallOfFameKeys()) {
  const aggregate = {
    total: 0,
    points: 0,
    bonuses: cloneBonusTotals(),
    perKey: {},
    players: 0,
  };

  const playerIds = new Set();

  keys.forEach((key) => {
    const record = {
      runs: 0,
      points: 0,
      bonuses: cloneBonusTotals(),
    };

    const entries = readRawList(key);
    record.runs = entries.length;
    aggregate.total += record.runs;

    entries.forEach((entry, index) => {
      const normalized = normalizeEntry(entry) ?? entry;

      const score = coercePositiveNumber(
        normalized?.score ?? normalized?.points ?? normalized?.total
      );
      if (score > 0) {
        record.points += score;
        aggregate.points += score;
      }

      const breakdown = normalized?.bonusBreakdown ?? normalized?.breakdown;
      addBonusBreakdown(record.bonuses, breakdown);
      addBonusBreakdown(aggregate.bonuses, breakdown);

      const playerId = identifyEntry(normalized, key, index);
      if (playerId) {
        playerIds.add(playerId);
      }
    });

    aggregate.perKey[key] = record;
  });

  aggregate.players = playerIds.size;
  return aggregate;
}

function mergeBonusTotalsMax(base = {}, fallback = {}) {
  return {
    pasticciotto: Math.max(
      coerceNonNegativeNumber(base?.pasticciotto ?? 0),
      coerceNonNegativeNumber(fallback?.pasticciotto ?? 0)
    ),
    rustico: Math.max(
      coerceNonNegativeNumber(base?.rustico ?? 0),
      coerceNonNegativeNumber(fallback?.rustico ?? 0)
    ),
    caffe: Math.max(
      coerceNonNegativeNumber(base?.caffe ?? 0),
      coerceNonNegativeNumber(fallback?.caffe ?? 0)
    ),
  };
}

function mergeSnapshotWithFallback(primary, fallback) {
  if (!fallback) {
    return primary;
  }

  const mergedBonuses = mergeBonusTotalsMax(primary?.bonuses, fallback?.bonuses);
  const merged = {
    total: Math.max(coerceNonNegativeNumber(primary?.total ?? 0), coerceNonNegativeNumber(fallback?.total ?? 0)),
    players: Math.max(coerceNonNegativeNumber(primary?.players ?? 0), coerceNonNegativeNumber(fallback?.players ?? 0)),
    points: Math.max(coerceNonNegativeNumber(primary?.points ?? 0), coerceNonNegativeNumber(fallback?.points ?? 0)),
    bonuses: mergedBonuses,
    perKey: {},
  };

  const keys = new Set([
    ...Object.keys(primary?.perKey || {}),
    ...Object.keys(fallback?.perKey || {}),
    ...collectHallOfFameKeys(),
  ]);

  keys.forEach((key) => {
    const baseRecord = primary?.perKey?.[key];
    const fallbackRecord = fallback?.perKey?.[key];
    merged.perKey[key] = {
      runs: Math.max(
        coerceNonNegativeNumber(baseRecord?.runs ?? 0),
        coerceNonNegativeNumber(fallbackRecord?.runs ?? 0)
      ),
      points: Math.max(
        coerceNonNegativeNumber(baseRecord?.points ?? 0),
        coerceNonNegativeNumber(fallbackRecord?.points ?? 0)
      ),
      bonuses: mergeBonusTotalsMax(baseRecord?.bonuses, fallbackRecord?.bonuses),
    };
  });

  return merged;
}

function ensureSummaryIncludesFallback(summary, fallback) {
  if (!summary || !fallback) {
    return false;
  }

  let mutated = false;

  const fallbackTotal = coerceNonNegativeNumber(fallback.total ?? 0);
  if (fallbackTotal > coerceNonNegativeNumber(summary.total ?? 0)) {
    summary.total = fallbackTotal;
    mutated = true;
  }

  const fallbackPoints = coerceNonNegativeNumber(fallback.points ?? 0);
  if (fallbackPoints > coerceNonNegativeNumber(summary.points ?? 0)) {
    summary.points = fallbackPoints;
    mutated = true;
  }

  const fallbackBonuses = mergeBonusTotalsMax(summary.bonuses, fallback.bonuses);
  if (
    fallbackBonuses.pasticciotto !== summary.bonuses.pasticciotto ||
    fallbackBonuses.rustico !== summary.bonuses.rustico ||
    fallbackBonuses.caffe !== summary.bonuses.caffe
  ) {
    summary.bonuses = cloneBonusTotals(fallbackBonuses);
    mutated = true;
  }

  Object.entries(fallback.perKey || {}).forEach(([key, record]) => {
    const holder = ensurePerKeySummary(summary, key);
    const runs = coerceNonNegativeNumber(record?.runs ?? 0);
    if (runs > coerceNonNegativeNumber(holder.runs ?? 0)) {
      holder.runs = runs;
      mutated = true;
    }

    const points = coerceNonNegativeNumber(record?.points ?? 0);
    if (points > coerceNonNegativeNumber(holder.points ?? 0)) {
      holder.points = points;
      mutated = true;
    }

    const mergedPerKeyBonuses = mergeBonusTotalsMax(holder.bonuses, record?.bonuses);
    if (
      mergedPerKeyBonuses.pasticciotto !== holder.bonuses.pasticciotto ||
      mergedPerKeyBonuses.rustico !== holder.bonuses.rustico ||
      mergedPerKeyBonuses.caffe !== holder.bonuses.caffe
    ) {
      holder.bonuses = cloneBonusTotals(mergedPerKeyBonuses);
      mutated = true;
    }
  });

  const fallbackPlayers = coerceNonNegativeNumber(fallback.players ?? 0);
  if (fallbackPlayers > coerceNonNegativeNumber(summary.playerFallback ?? 0)) {
    summary.playerFallback = fallbackPlayers;
    mutated = true;
  }

  if (mutated) {
    writeSummaryRecord(summary);
  }

  return mutated;
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
  try {
    applyEntryToSummary(entry, key);
  } catch (error) {
    console.warn('[hof] unable to update hall of fame summary', error);
  }
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
export function loadHallOfFameSummary() {
  const summary = ensureSummaryRecord();
  const primary = summary
    ? deriveSummarySnapshot(summary)
    : deriveSummarySnapshot(createEmptySummary());
  const fallback = buildEntrySnapshot();

  if (summary) {
    const mutated = ensureSummaryIncludesFallback(summary, fallback);
    if (mutated) {
      return mergeSnapshotWithFallback(deriveSummarySnapshot(summary), fallback);
    }
  }

  return mergeSnapshotWithFallback(primary, fallback);
}
export function normalizeHallOfFameName(value) {
  return normalizeToken(value);
}
