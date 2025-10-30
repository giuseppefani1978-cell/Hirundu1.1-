// src/bonus_maps.js
// Pont de compatibilité pour les modules historiques qui consomment la logique des cartes bonus.

import { BONUS_MAPS } from "./features/bonus/bonusData";
import {
  BONUS_PROGRESS_EVENT,
  broadcastBonusUpdate,
  getNextLevel,
  getItineraryState,
  getProgressList,
  getResumeTarget,
  getUnlockedKeys,
  isBonusUnlocked as isBonusUnlockedModern,
  markLevelWin,
  readBonusSnapshot,
  unlockBonus as unlockBonusModern,
} from "./features/bonus/bonusStorage";
import { openBonusHub, openBonusMap as openBonusMapModern } from "./features/bonus/bonusNavigation";

const LEGACY_ALIASES = {
  otranto: "otranto",
  gallipoli: "gallipoli",
  lecce: "lecce",
  qr_bonus_otranto: "otranto",
  qr_bonus_gallipoli: "gallipoli",
  qr_bonus_lecce: "lecce",
  bonus_otranto: "otranto",
  bonus_gallipoli: "gallipoli",
  bonus_lecce: "lecce",
  otranto_bonus: "otranto",
  gallipoli_bonus: "gallipoli",
  lecce_bonus: "lecce",
};

const LEGACY_UNLOCK_FLAGS = {
  otranto: ["otranto_bonus_unlocked", "bonus_otranto_unlocked"],
  gallipoli: ["gallipoli_bonus_unlocked"],
  lecce: ["lecce_bonus_unlocked", "bonus_lecce_unlocked"],
};

const LEGACY_EVENTS = {
  otranto: "otranto:unlocked",
  gallipoli: "gallipoli:unlocked",
  lecce: "lecce:unlocked",
};

function normalizeBonusKey(args) {
  for (let idx = args.length - 1; idx >= 0; idx -= 1) {
    const candidate = args[idx];
    if (typeof candidate !== "string") continue;
    const trimmed = candidate.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();
    if (LEGACY_ALIASES[lower]) return LEGACY_ALIASES[lower];

    const sanitized = lower.replace(/[^a-z0-9_]/g, "");
    if (LEGACY_ALIASES[sanitized]) return LEGACY_ALIASES[sanitized];

    if (Object.prototype.hasOwnProperty.call(BONUS_MAPS, lower)) return lower;
    if (Object.prototype.hasOwnProperty.call(BONUS_MAPS, sanitized)) return sanitized;
  }

  return undefined;
}

function updateLegacyUnlockState(key) {
  if (typeof window === "undefined") return;
  const legacyKeys = LEGACY_UNLOCK_FLAGS[key];
  if (!legacyKeys?.length) return;

  try {
    const storage = window.localStorage;
    if (!storage) return;

    legacyKeys.forEach((legacyKey) => {
      try {
        storage.setItem(legacyKey, "true");
        window.dispatchEvent?.(
          new StorageEvent("storage", { key: legacyKey, newValue: "true" })
        );
      } catch {
        // Ignorer les erreurs d’écriture/dispatch isolées
      }
    });

    try {
      const record = storage.getItem("bonus_unlocked_v1");
      window.dispatchEvent?.(
        new StorageEvent("storage", {
          key: "bonus_unlocked_v1",
          newValue: record ?? "",
        })
      );
    } catch {
      // best effort
    }

    const legacyEvent = LEGACY_EVENTS[key];
    if (legacyEvent) {
      try {
        document.dispatchEvent?.(new Event(legacyEvent));
      } catch {
        // ignore
      }
    }
  } catch {
    // localStorage indisponible : on ignore silencieusement
  }
}

export { BONUS_MAPS };
export {
  BONUS_PROGRESS_EVENT,
  broadcastBonusUpdate,
  getNextLevel,
  getItineraryState,
  getProgressList,
  getResumeTarget,
  getUnlockedKeys,
  markLevelWin,
  readBonusSnapshot,
  openBonusHub,
};

export function unlockBonus(...args) {
  const key = normalizeBonusKey(args);
  if (!key) {
    console.warn("[bonus_maps] unlockBonus : clé inconnue", args);
    return;
  }
  unlockBonusModern(key);
  updateLegacyUnlockState(key);
}

export function openBonusMap(...args) {
  const key = normalizeBonusKey(args);
  if (!key) {
    console.warn("[bonus_maps] openBonusMap : clé inconnue", args);
    return;
  }
  unlockBonusModern(key);
  updateLegacyUnlockState(key);
  openBonusMapModern(key);
}

export function isBonusUnlocked(...args) {
  const key = normalizeBonusKey(args);
  if (!key) return false;
  return isBonusUnlockedModern(key);
}
