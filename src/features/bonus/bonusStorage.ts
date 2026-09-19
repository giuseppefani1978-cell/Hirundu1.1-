import { BONUS_MAPS, type BonusKey } from "./bonusData";
import { PASSPORT_EVENT, PASSPORT_STORAGE_KEY } from "../qr/passport/passportStorage";
import { replaceDurableProgressSnapshot, syncDurableProgress } from "../../progressStorage.js";

const STORAGE_KEY = "bonus_unlocked_v1";
export const BONUS_PROGRESS_EVENT = "bonus:updated";

type BonusUnlockedRecord = Partial<Record<BonusKey, boolean>>;

export type BonusProgressEntry = {
  id: number;
  name: string;
  key: BonusKey;
  done: boolean;
  unlocked: boolean;
  href: string;
};

export type ItineraryStep = {
  id: number;
  name: string;
  key: BonusKey;
  completed: boolean;
  available: boolean;
};

export type BonusProgressSnapshot = {
  unlockedKeys: BonusKey[];
  resumeTarget: BonusProgressEntry | undefined;
  progress: BonusProgressEntry[];
  itinerary: ItineraryStep[];
};

const isBrowser = typeof window !== "undefined";

function getStorage(): Storage | undefined {
  if (!isBrowser) return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function readRaw(key: string): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function readJSON<T = unknown>(key: string): T | null {
  const raw = readRaw(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function truthy(value: unknown): boolean {
  if (value === true) return true;
  if (value === "true" || value === "1" || value === 1) return true;
  if (typeof value === "string" && value.toLowerCase?.() === "true") return true;
  return false;
}

function readLegacyTruth(keys: string[]): boolean {
  return keys.some((key) => truthy(readJSON(key)) || truthy(readRaw(key)));
}

function loadUnlocked(): BonusUnlockedRecord {
  const record: BonusUnlockedRecord = {};
  const stored = readJSON<Record<string, unknown>>(STORAGE_KEY);
  if (stored && typeof stored === "object") {
    Object.keys(stored).forEach((key) => {
      if (isBonusKey(key) && truthy((stored as Record<string, unknown>)[key])) {
        record[key] = true;
      }
    });
  }

  let mutated = false;
  const ensure = (key: BonusKey, value: unknown) => {
    if (truthy(value) && !record[key]) {
      record[key] = true;
      mutated = true;
    }
  };

  ensure("gallipoli", readJSON("gallipoli_bonus_unlocked"));
  ensure("gallipoli", readRaw("gallipoli_bonus_unlocked"));
  ensure("otranto", readJSON("otranto_bonus_unlocked"));
  ensure("otranto", readRaw("otranto_bonus_unlocked"));
  ensure("otranto", readJSON("bonus_otranto_unlocked"));
  ensure("otranto", readRaw("bonus_otranto_unlocked"));

  if (mutated) saveUnlocked(record);
  return record;
}

function saveUnlocked(record: BonusUnlockedRecord): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(record));
    syncDurableProgress();
    broadcastBonusUpdate();
  } catch {
    // ignore write failure
  }
}

function isBonusKey(value: string): value is BonusKey {
  return Object.prototype.hasOwnProperty.call(BONUS_MAPS, value);
}

export function isBonusUnlocked(key: BonusKey): boolean {
  const unlocked = loadUnlocked();
  return !!unlocked[key];
}

export function unlockBonus(key: BonusKey): void {
  const unlocked = loadUnlocked();
  if (!unlocked[key]) {
    unlocked[key] = true;
    saveUnlocked(unlocked);
  }
}

export function getUnlockedKeys(): BonusKey[] {
  const unlocked = loadUnlocked();
  return (Object.keys(unlocked).filter(isBonusKey) as BonusKey[]).filter((key) => unlocked[key]);
}

export function markLevelWin(levelId: number): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(`level${levelId}_won`, "true");
    storage.setItem(`level${levelId}_won_at`, String(Date.now()));
    if (levelId === 1) storage.setItem("bonus_gallipoli_unlocked", "true");
    if (levelId === 2) storage.setItem("bonus_lecce_unlocked", "true");
    syncDurableProgress();
    broadcastBonusUpdate();
  } catch (error) {
    console.warn("markLevelWin failed", error);
  }
}

function readBooleanFlag(key: string): boolean {
  return ["true", "1"].includes(readRaw(key) ?? "");
}

export function getProgressList(): BonusProgressEntry[] {
  return [
    {
      id: 1,
      name: "Otranto",
      key: "otranto",
      done: readBooleanFlag("level1_won"),
      unlocked: true,
      href: "/index.html#otranto",
    },
    {
      id: 2,
      name: "Gallipoli",
      key: "gallipoli",
      done: readBooleanFlag("level2_won"),
      unlocked: readBooleanFlag("level1_won") || readBooleanFlag("level2_unlocked") || readBooleanFlag("bonus_gallipoli_unlocked"),
      href: "/index.html#gallipoli",
    },
    {
      id: 3,
      name: "Lecce",
      key: "lecce",
      done: readBooleanFlag("level3_won"),
      unlocked: readBooleanFlag("level2_won") || readBooleanFlag("level3_unlocked") || readBooleanFlag("bonus_lecce_unlocked"),
      href: "/index.html#lecce",
    },
    ...(["adriatico","capo","arneo","nardo","messapia","itria"] as const).map((key,i)=>({id:i+4,name:BONUS_MAPS[key].title,key,done:readBooleanFlag(`level${i+4}_won`),unlocked:readBooleanFlag(`level${i+3}_won`),href:`/level/${i+4}`})),
  ];
}

export function getItineraryState(): ItineraryStep[] {
  return getProgressList().map(p=>({id:p.id,name:p.name,key:p.key,completed:p.done,available:p.unlocked}));
}

function legacyItineraryState(): ItineraryStep[] {
  const level2Available = readLegacyTruth(["level2_unlocked", "bonus_gallipoli_unlocked"]);
  const level2Completed = readLegacyTruth(["level2_unlocked", "level2_won", "bonus_gallipoli_unlocked"]);
  const level3Available = readLegacyTruth(["level3_unlocked", "bonus_lecce_unlocked"]);
  const level3Completed = readLegacyTruth(["level3_unlocked", "level3_won", "bonus_lecce_unlocked"]);

  return [
    {
      id: 1,
      name: "Otranto",
      key: "otranto",
      completed: readLegacyTruth(["bonus_otranto_unlocked", "otranto_bonus_unlocked", "level1_won"]),
      available: true,
    },
    {
      id: 2,
      name: "Gallipoli",
      key: "gallipoli",
      completed: level2Completed,
      available: level2Available || level2Completed,
    },
    {
      id: 3,
      name: "Lecce",
      key: "lecce",
      completed: level3Completed,
      available: level3Available || level3Completed,
    },
  ];
}

export function getNextLevel(): BonusProgressEntry | undefined {
  const progress = getProgressList();
  return progress.find((entry) => !entry.done && entry.unlocked) ?? progress.find((entry) => !entry.done);
}

export function getResumeTarget(): BonusProgressEntry | undefined {
  const progress = getProgressList();
  const next = progress.find((entry) => !entry.done && entry.unlocked);
  if (next) return next;
  return progress[0];
}

export function readBonusSnapshot(): BonusProgressSnapshot {
  const unlockedKeys = getUnlockedKeys();
  const progress = getProgressList();
  const resumeTarget = getResumeTarget();
  const itinerary = getItineraryState();
  return { unlockedKeys, progress, resumeTarget, itinerary };
}

export function broadcastBonusUpdate(): void {
  if (!isBrowser) return;
  try {
    window.dispatchEvent(new CustomEvent(BONUS_PROGRESS_EVENT));
  } catch {
    // ignore if CustomEvent is not available
  }
}

const PROGRESS_STORAGE_KEYS = [
  STORAGE_KEY,
  "player_name",
  "bonus_unlocked",
  "bonus_unlocked_v1",
  "bonus_otranto_unlocked",
  "otranto_bonus_unlocked",
  "otranto_bonus_seen",
  "bonus_gallipoli_unlocked",
  "gallipoli_bonus_unlocked",
  "gallipoli_bonus_seen",
  "bonus_lecce_unlocked",
  "lecce_bonus_unlocked",
  "level1_won",
  "level1_won_at",
  "level2_won",
  "level2_won_at",
  "level3_won",
  "level3_won_at",
  "level2_unlocked",
  "level2_unlocked_at",
  "level3_unlocked",
  "level3_unlocked_at",
  "__toast_next__",
  "__level_transition_v1__",
];

function dispatchStorageRemoval(key: string, storageArea: Storage): void {
  if (typeof window === "undefined" || typeof StorageEvent === "undefined") {
    return;
  }
  try {
    const event = new StorageEvent("storage", {
      key,
      newValue: null,
      oldValue: null,
      storageArea,
    });
    window.dispatchEvent(event);
  } catch {
    // ignore
  }
}

export function resetBonusProgress(): void {
  const storage = getStorage();
  if (!storage) return;

  const keys = new Set(PROGRESS_STORAGE_KEYS);
  for(const id of [4,5,6,7,8,9]){keys.add(`level${id}_won`);keys.add(`level${id}_won_at`);keys.add(`region${id}_hunt`);}
  keys.add(PASSPORT_STORAGE_KEY);

  keys.forEach((key) => {
    if (!key) return;
    try {
      storage.removeItem(key);
      dispatchStorageRemoval(key, storage);
    } catch {
      // ignore
    }
  });

  try {
    void import("../../level_transition.js").then((mod) => {
      try {
        if (typeof mod.clearLevelTransitions === "function") {
          mod.clearLevelTransitions();
        }
      } catch {
        // ignore nested failure
      }
    });
  } catch {
    // ignore dynamic import failure
  }

  try {
    void import("../../bonus_transition.js").then((mod) => {
      try {
        if (typeof mod.removeVictoryCTA === "function") {
          mod.removeVictoryCTA();
        }
      } catch {
        // ignore nested failure
      }
    });
  } catch {
    // ignore dynamic import failure
  }

  if (typeof document !== "undefined") {
    const staleIds = [
      "__bonus_cta",
      "__otranto_bonus_link",
      "__gallipoli_bonus_link",
      "__lecce_bonus_link",
    ];
    staleIds.forEach((id) => {
      const node = document.getElementById(id);
      if (node?.parentElement) {
        try {
          node.parentElement.removeChild(node);
        } catch {
          // ignore DOM removal issues
        }
      }
    });
  }

  try {
    window.dispatchEvent(new CustomEvent(PASSPORT_EVENT));
  } catch {
    // ignore
  }

  replaceDurableProgressSnapshot();
  broadcastBonusUpdate();
}
