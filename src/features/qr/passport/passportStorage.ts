import type { BonusKey } from "../../bonus/bonusData";

export const PASSPORT_STORAGE_KEY = "salentino_passport_v1";
export const PASSPORT_EVENT = "passport:updated";

const isBrowser = typeof window !== "undefined";

export type PassportStorage = {
  pois: Record<string, string[]>;
};

function sanitizeEntries(entries: string[], allowed: Set<string>): string[] {
  if (allowed.size === 0) {
    return entries.filter((value): value is string => typeof value === "string" && value.length > 0);
  }
  return entries.filter((value): value is string => typeof value === "string" && allowed.has(value));
}

export function readPassportStorage(): PassportStorage {
  if (!isBrowser) {
    return { pois: {} };
  }

  try {
    const raw = window.localStorage.getItem(PASSPORT_STORAGE_KEY);
    if (!raw) {
      return { pois: {} };
    }

    const parsed = JSON.parse(raw) as Partial<PassportStorage>;
    if (!parsed || typeof parsed !== "object") {
      return { pois: {} };
    }

    const pois = parsed.pois && typeof parsed.pois === "object" ? parsed.pois : {};
    const clean: Record<string, string[]> = {};

    Object.entries(pois as Record<string, unknown>).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        clean[key] = sanitizeEntries(value, new Set());
      }
    });

    return { pois: clean };
  } catch (error) {
    console.warn("Impossible de lire le passeport Salentino", error);
    return { pois: {} };
  }
}

export function writePassportStorage(record: PassportStorage): void {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(PASSPORT_STORAGE_KEY, JSON.stringify(record));
    window.dispatchEvent(new CustomEvent(PASSPORT_EVENT));
  } catch (error) {
    console.warn("Impossible d’enregistrer le passeport Salentino", error);
  }
}

export function getVisitedFor(mapKey: BonusKey, poiIds: readonly string[]): Set<string> {
  const storage = readPassportStorage();
  const allowed = new Set(poiIds);
  const stored = storage.pois[mapKey] ?? [];
  return new Set(sanitizeEntries(stored, allowed));
}

export function persistVisited(
  mapKey: BonusKey,
  poiIds: readonly string[],
  visited: Set<string>
): void {
  if (!isBrowser) {
    return;
  }

  const storage = readPassportStorage();
  const allowed = new Set(poiIds);
  const sanitized = [...visited].filter((poiId) => allowed.size === 0 || allowed.has(poiId));

  const nextRecord: PassportStorage = {
    pois: { ...storage.pois },
  };

  if (sanitized.length > 0) {
    nextRecord.pois[mapKey] = sanitized;
  } else {
    delete nextRecord.pois[mapKey];
  }

  writePassportStorage(nextRecord);
}

export function setPoiVisited(
  mapKey: BonusKey,
  poiId: string,
  visited: boolean,
  poiIds: readonly string[]
): Set<string> {
  const current = getVisitedFor(mapKey, poiIds);
  const next = new Set(current);

  if (visited) {
    next.add(poiId);
  } else {
    next.delete(poiId);
  }

  persistVisited(mapKey, poiIds, next);
  return next;
}

export function isBrowserEnvironment(): boolean {
  return isBrowser;
}
