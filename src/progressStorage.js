export const DURABLE_PROGRESS_KEY = "hirundu_progress_v1";
const DURABLE_PROGRESS_VERSION = 1;
const PASSPORT_STORAGE_KEY = "salentino_passport_v1";
export const PROGRESS_SAVE_EVENT = "hirundu:progress-save";
let lastSaveResult = null;

export function getProgressSaveResult() {
  return lastSaveResult;
}

function publishSaveResult(ok, reason = "") {
  lastSaveResult = { ok, at: Date.now(), reason };
  if (typeof window !== "undefined") {
    try { window.dispatchEvent(new CustomEvent(PROGRESS_SAVE_EVENT, { detail: lastSaveResult })); } catch { /* restricted browser */ }
  }
}

const STATIC_KEYS = new Set([
  "player_name",
  "hirundu_player_id_v1",
  "__lang__",
  "hirundu_music_v1",
  "hirundu_flight_music_v1",
  "bonus_unlocked",
  "bonus_unlocked_v1",
  PASSPORT_STORAGE_KEY,
  "salento_hof_v1",
  "salento_hof_v2",
  "salento_hof_v3",
  "salento_hof_summary_v1",
]);

const BONUS_KEYS = [
  "otranto",
  "gallipoli",
  "lecce",
  "adriatico",
  "capo",
  "arneo",
  "nardo",
  "messapia",
  "itria",
];

function getStorage() {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function isDurableLegacyKey(key) {
  if (!key || key === DURABLE_PROGRESS_KEY) return false;
  if (STATIC_KEYS.has(key)) return true;
  if (/^level[1-9]_(?:won|won_at|unlocked|unlocked_at)$/.test(key)) return true;
  if (/^region[1-9]_hunt$/.test(key)) return true;
  if (/^salento_hof/i.test(key) || key === "hof") return true;
  if (/^(?:bonus_.+_(?:unlocked|seen)|.+_bonus_(?:unlocked|seen))$/.test(key)) return true;
  return false;
}

function safeParse(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function truthyRaw(raw) {
  if (raw == null) return false;
  if (raw === "true" || raw === "1") return true;
  try {
    const parsed = JSON.parse(raw);
    return parsed === true || parsed === 1 || parsed === "true" || parsed === "1";
  } catch {
    return false;
  }
}

function collectLegacyValues(storage) {
  const values = {};
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!isDurableLegacyKey(key)) continue;
      const raw = storage.getItem(key);
      if (raw != null) values[key] = raw;
    }
  } catch {
    // Best effort: localStorage can be unavailable in private/restricted contexts.
  }
  return values;
}

function readStoredSnapshot(storage) {
  try {
    const parsed = safeParse(storage.getItem(DURABLE_PROGRESS_KEY));
    if (!parsed || parsed.version !== DURABLE_PROGRESS_VERSION || !parsed.values || typeof parsed.values !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function restoreMissingValues(storage, values) {
  if (!values || typeof values !== "object") return;
  Object.entries(values).forEach(([key, raw]) => {
    if (!isDurableLegacyKey(key) || typeof raw !== "string") return;
    try {
      if (storage.getItem(key) == null) storage.setItem(key, raw);
    } catch {
      // Never overwrite or delete surviving legacy data if one key cannot be restored.
    }
  });
}

function deriveCompletedLevels(values) {
  const completed = [];
  for (let level = 1; level <= 9; level += 1) {
    if (truthyRaw(values[`level${level}_won`])) completed.push(level);
  }
  return completed;
}

function deriveHighestUnlockedLevel(values, completedLevels) {
  let highest = 1;
  for (let level = 2; level <= 9; level += 1) {
    if (truthyRaw(values[`level${level}_unlocked`])) highest = Math.max(highest, level);
  }
  completedLevels.forEach((level) => {
    highest = Math.max(highest, Math.min(9, level + 1));
  });
  return highest;
}

function deriveDiscoveries(values) {
  const discoveries = [];
  const aggregate = safeParse(values.bonus_unlocked_v1);
  BONUS_KEYS.forEach((key) => {
    const fromAggregate = !!(aggregate && aggregate[key]);
    const fromLegacy =
      truthyRaw(values[`bonus_${key}_unlocked`]) ||
      truthyRaw(values[`${key}_bonus_unlocked`]);
    if (fromAggregate || fromLegacy) discoveries.push(key);
  });
  return discoveries;
}

function deriveHuntProgress(values) {
  const hunts = {};
  for (let level = 1; level <= 9; level += 1) {
    const raw = values[`region${level}_hunt`];
    if (raw == null) continue;
    const amount = Number(raw);
    if (Number.isFinite(amount) && amount >= 0) hunts[level] = Math.min(10, Math.floor(amount));
  }
  return hunts;
}

function buildSnapshot(storage, baseValues = {}) {
  const currentValues = collectLegacyValues(storage);
  const values = { ...baseValues, ...currentValues };
  const completedLevels = deriveCompletedLevels(values);
  return {
    version: DURABLE_PROGRESS_VERSION,
    updatedAt: new Date().toISOString(),
    scope: {
      origin: typeof location !== "undefined" ? location.origin : "",
    },
    values,
    completedLevels,
    highestUnlockedLevel: deriveHighestUnlockedLevel(values, completedLevels),
    discoveries: deriveDiscoveries(values),
    huntProgress: deriveHuntProgress(values),
  };
}

function writeSnapshot(storage, snapshot) {
  try {
    storage.setItem(DURABLE_PROGRESS_KEY, JSON.stringify(snapshot));
    publishSaveResult(true);
    return true;
  } catch (error) {
    console.warn("[progress] unable to persist durable snapshot", error);
    publishSaveResult(false, error instanceof Error ? error.message : "storage");
    return false;
  }
}

export function initializeDurableProgress() {
  const storage = getStorage();
  if (!storage) return null;

  const previous = readStoredSnapshot(storage);
  if (previous?.values) restoreMissingValues(storage, previous.values);

  const snapshot = buildSnapshot(storage, previous?.values || {});
  writeSnapshot(storage, snapshot);
  return snapshot;
}

export function syncDurableProgress() {
  const storage = getStorage();
  if (!storage) return null;
  const previous = readStoredSnapshot(storage);
  const snapshot = buildSnapshot(storage, previous?.values || {});
  writeSnapshot(storage, snapshot);
  return snapshot;
}

export function readDurableProgress() {
  const storage = getStorage();
  if (!storage) return null;
  const previous = readStoredSnapshot(storage);
  if (!previous) return initializeDurableProgress();
  return buildSnapshot(storage, previous.values || {});
}

export function replaceDurableProgressSnapshot() {
  const storage = getStorage();
  if (!storage) return null;
  const snapshot = buildSnapshot(storage);
  writeSnapshot(storage, snapshot);
  return snapshot;
}

export function clearDurableProgressSnapshot() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(DURABLE_PROGRESS_KEY);
  } catch {
    // no-op
  }
}

export function getProgressStorageScope() {
  return {
    origin: typeof location !== "undefined" ? location.origin : "",
    note: "localStorage is shared only by pages on the same origin; another domain/subdomain cannot read this save.",
  };
}
