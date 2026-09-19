import type { BonusKey } from "../../bonus/bonusData";
import { syncDurableProgress } from "../../../progressStorage.js";

export const PASSPORT_STORAGE_KEY = "salentino_passport_v1";
export const PASSPORT_EVENT = "passport:updated";

const isBrowser = typeof window !== "undefined";

export type PassportStorage = {
  // Legacy field kept for backward compatibility. It stores QR-validated POIs.
  pois: Record<string, string[]>;
  qrValidated: Record<string, string[]>;
  declaredVisited: Record<string, string[]>;
  consultedMaps: string[];
};

function sanitizeEntries(entries: unknown, allowed = new Set<string>()): string[] {
  if (!Array.isArray(entries)) return [];
  const clean = entries.filter((value): value is string => typeof value === "string" && value.length > 0);
  if (allowed.size === 0) return [...new Set(clean)];
  return [...new Set(clean.filter((value) => allowed.has(value)))];
}

function sanitizeRecord(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object") return {};
  const clean: Record<string, string[]> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, entries]) => {
    const sanitized = sanitizeEntries(entries);
    if (sanitized.length) clean[key] = sanitized;
  });
  return clean;
}

function emptyPassport(): PassportStorage {
  return { pois: {}, qrValidated: {}, declaredVisited: {}, consultedMaps: [] };
}

export function readPassportStorage(): PassportStorage {
  if (!isBrowser) return emptyPassport();

  try {
    const raw = window.localStorage.getItem(PASSPORT_STORAGE_KEY);
    if (!raw) return emptyPassport();

    const parsed = JSON.parse(raw) as Partial<PassportStorage>;
    if (!parsed || typeof parsed !== "object") return emptyPassport();

    const legacyQr = sanitizeRecord(parsed.pois);
    const explicitQr = sanitizeRecord(parsed.qrValidated);
    const qrValidated: Record<string, string[]> = { ...legacyQr };

    Object.entries(explicitQr).forEach(([key, entries]) => {
      qrValidated[key] = [...new Set([...(qrValidated[key] ?? []), ...entries])];
    });

    const declaredVisited = sanitizeRecord(parsed.declaredVisited);
    const consultedMaps = sanitizeEntries(parsed.consultedMaps);

    return {
      // Keep the legacy mirror so older code/data remains readable.
      pois: { ...qrValidated },
      qrValidated,
      declaredVisited,
      consultedMaps,
    };
  } catch (error) {
    console.warn("Impossible de lire le passeport Salentino", error);
    return emptyPassport();
  }
}

export function writePassportStorage(record: PassportStorage): void {
  if (!isBrowser) return;

  try {
    const qrValidated = sanitizeRecord(record.qrValidated ?? record.pois);
    const declaredVisited = sanitizeRecord(record.declaredVisited);
    const consultedMaps = sanitizeEntries(record.consultedMaps);

    const normalized: PassportStorage = {
      pois: { ...qrValidated },
      qrValidated,
      declaredVisited,
      consultedMaps,
    };

    window.localStorage.setItem(PASSPORT_STORAGE_KEY, JSON.stringify(normalized));
    syncDurableProgress();
    window.dispatchEvent(new CustomEvent(PASSPORT_EVENT));
  } catch (error) {
    console.warn("Impossible d’enregistrer le passeport Salentino", error);
  }
}

function getFor(
  field: "qrValidated" | "declaredVisited",
  mapKey: BonusKey,
  poiIds: readonly string[],
): Set<string> {
  const storage = readPassportStorage();
  const allowed = new Set(poiIds);
  const stored = storage[field][mapKey] ?? [];
  return new Set(sanitizeEntries(stored, allowed));
}

export function getQrValidatedFor(mapKey: BonusKey, poiIds: readonly string[]): Set<string> {
  return getFor("qrValidated", mapKey, poiIds);
}

// Backward-compatible name. Historically "visited" meant QR-validated.
export function getVisitedFor(mapKey: BonusKey, poiIds: readonly string[]): Set<string> {
  return getQrValidatedFor(mapKey, poiIds);
}

export function getDeclaredVisitedFor(mapKey: BonusKey, poiIds: readonly string[]): Set<string> {
  return getFor("declaredVisited", mapKey, poiIds);
}

function persistSet(
  field: "qrValidated" | "declaredVisited",
  mapKey: BonusKey,
  poiIds: readonly string[],
  values: Set<string>,
): void {
  if (!isBrowser) return;

  const storage = readPassportStorage();
  const allowed = new Set(poiIds);
  const sanitized = [...values].filter((poiId) => allowed.size === 0 || allowed.has(poiId));
  const nextRecord: PassportStorage = {
    ...storage,
    pois: { ...storage.pois },
    qrValidated: { ...storage.qrValidated },
    declaredVisited: { ...storage.declaredVisited },
    consultedMaps: [...storage.consultedMaps],
  };

  if (sanitized.length > 0) nextRecord[field][mapKey] = sanitized;
  else delete nextRecord[field][mapKey];

  // Keep the legacy field strictly as a mirror of QR validation, never declarations.
  nextRecord.pois = { ...nextRecord.qrValidated };
  writePassportStorage(nextRecord);
}

export function persistVisited(
  mapKey: BonusKey,
  poiIds: readonly string[],
  visited: Set<string>
): void {
  persistSet("qrValidated", mapKey, poiIds, visited);
}

export function setPoiQrValidated(
  mapKey: BonusKey,
  poiId: string,
  validated: boolean,
  poiIds: readonly string[]
): Set<string> {
  const current = getQrValidatedFor(mapKey, poiIds);
  const next = new Set(current);
  if (validated) next.add(poiId);
  else next.delete(poiId);
  persistSet("qrValidated", mapKey, poiIds, next);
  return next;
}

// Backward-compatible alias for callers not yet migrated.
export function setPoiVisited(
  mapKey: BonusKey,
  poiId: string,
  visited: boolean,
  poiIds: readonly string[]
): Set<string> {
  return setPoiQrValidated(mapKey, poiId, visited, poiIds);
}

export function setPoiDeclaredVisited(
  mapKey: BonusKey,
  poiId: string,
  declared: boolean,
  poiIds: readonly string[]
): Set<string> {
  const current = getDeclaredVisitedFor(mapKey, poiIds);
  const next = new Set(current);
  if (declared) next.add(poiId);
  else next.delete(poiId);
  persistSet("declaredVisited", mapKey, poiIds, next);
  return next;
}

export function markMapConsulted(mapKey: BonusKey): void {
  if (!isBrowser) return;
  const storage = readPassportStorage();
  if (storage.consultedMaps.includes(mapKey)) return;
  writePassportStorage({
    ...storage,
    consultedMaps: [...storage.consultedMaps, mapKey],
  });
}

export function isMapConsulted(mapKey: BonusKey): boolean {
  return readPassportStorage().consultedMaps.includes(mapKey);
}

export function isBrowserEnvironment(): boolean {
  return isBrowser;
}
