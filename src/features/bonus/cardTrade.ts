import { BONUS_MAPS, type BonusKey } from "./bonusData";
import { getUnlockedKeys } from "./bonusStorage";

const STORAGE_KEY = "hirundu_card_inventory_v1";
const IDENTITY_KEY = "hirundu_card_identity_v2";
const IDENTITY_DB = "hirundu_card_crypto_v2";
const IDENTITY_STORE = "identity";
const TRADE_PREFIX = "HIRUNDU-CARD-2.";
const LEGACY_TRADE_PREFIX = "HIRUNDU-CARD-1.";
const MAX_AGE = 15 * 60 * 1000;
const CLOCK_SKEW = 60 * 1000;
const TRADE_LOCK_PREFIX = "hirundu_card_trade_lock_v1:";
const TRADE_LOCK_TTL = 30 * 1000;
export const QUEUED_CARD_QR_KEY = "hirundu_queued_card_qr_v1";

export type CardOrigin = "game" | "partner" | "physical" | "exchange" | "test" | "legacy";
type OriginCounts = Partial<Record<CardOrigin, number>>;

type Pending = {
  id: string;
  card: BonusKey;
  requestedCard: BonusKey;
  createdAt: number;
  expiresAt: number;
  sender: string;
  offerHash: string;
  token?: string;
};

type Receiving = {
  card: BonusKey;
  requestedCard: BonusKey;
  sender: string;
  receiver: string;
  createdAt: number;
  expiresAt: number;
  offerHash: string;
  receiptHash: string;
  receiptToken?: string;
};

type OutgoingConfirmation = {
  card: BonusKey;
  requestedCard: BonusKey;
  receiver: string;
  createdAt: number;
  expiresAt: number;
  receiptHash: string;
  confirmationHash?: string;
  token: string;
};

type CompletionAckRecord = {
  card: BonusKey;
  sender: string;
  receiver: string;
  createdAt: number;
  expiresAt: number;
  confirmationHash: string;
  token: string;
};

export type CardInventoryState = {
  version: 1;
  cards: Partial<Record<BonusKey, number>>;
  origins: Partial<Record<BonusKey, OriginCounts>>;
  received: Record<string, number>;
  redeemed: Record<string, number>;
  confirmed: Record<string, number>;
  spent: Record<string, number>;
  receiving: Record<string, Receiving>;
  outgoing: Record<string, OutgoingConfirmation>;
  completionAcks: Record<string, CompletionAckRecord>;
  pending: Pending | null;
};

type OfferPayload = {
  type: "offer";
  version: 2;
  id: string;
  card: BonusKey;
  requestedCard: BonusKey;
  sender: string;
  senderKey: string;
  issuedAt: number;
  expiresAt: number;
};
type Offer = OfferPayload & { sig: string };

type ReceiptPayload = {
  type: "receipt";
  version: 2;
  offerId: string;
  offerHash: string;
  card: BonusKey;
  requestedCard: BonusKey;
  sender: string;
  receiver: string;
  receiverKey: string;
  issuedAt: number;
  expiresAt: number;
};
type Receipt = ReceiptPayload & { sig: string };

type ConfirmationPayload = {
  type: "confirmation";
  version: 2;
  offerId: string;
  receiptHash: string;
  card: BonusKey;
  requestedCard: BonusKey;
  sender: string;
  senderKey: string;
  receiver: string;
  issuedAt: number;
  expiresAt: number;
};
type Confirmation = ConfirmationPayload & { sig: string };

type CompletionAckPayload = {
  type: "ack";
  version: 2;
  offerId: string;
  confirmationHash: string;
  card: BonusKey;
  sender: string;
  receiver: string;
  receiverKey: string;
  issuedAt: number;
  expiresAt: number;
};
type CompletionAck = CompletionAckPayload & { sig: string };

type TradeToken = Offer | Receipt | Confirmation | CompletionAck;

type StoredIdentity = {
  version: 2;
  privateKey: CryptoKey;
  publicRaw: string;
};

type DeviceIdentity = {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicRaw: string;
  fingerprint: string;
};

export type FieldCardScenario = {
  id: string;
  token: string;
  kind: "partner" | "physical";
  card: BonusKey;
  title: string;
  detail: string;
  validatesVisit: boolean;
  mapKey?: BonusKey;
  poiId?: string;
};

// Prototype allow-list. Real partner codes will be issued by a controlled back office
// (and signed server-side) before a public launch. Arbitrary QR payloads are rejected.
export const FIELD_CARD_SCENARIOS: readonly FieldCardScenario[] = [
  {
    id: "partner-otranto-cathedral-demo-2026",
    token: "HIRUNDU-FIELD-1.PARTNER-OTRANTO-CATHEDRAL-DEMO-2026",
    kind: "partner",
    card: "otranto",
    title: "QR partenaire · Cattedrale di Otranto",
    detail: "Prototype d’un scan sur place : carte ajoutée et visite QR inscrite dans le passeport de test.",
    validatesVisit: true,
    mapKey: "otranto",
    poiId: "poi_cathedral",
  },
  {
    id: "physical-lecce-event-demo-2026",
    token: "HIRUNDU-FIELD-1.PHYSICAL-LECCE-EVENT-DEMO-2026",
    kind: "physical",
    card: "lecce",
    title: "Carte physique · événement de démonstration",
    detail: "Carte promotionnelle à collectionner ou échanger. Elle ne prouve pas une visite à Lecce.",
    validatesVisit: false,
  },
] as const;

function validKey(value: unknown): value is BonusKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(BONUS_MAPS, value);
}

function cryptoApi(): Crypto {
  const api = globalThis.crypto;
  if (!api?.subtle) throw Error("crypto-unavailable");
  return api;
}

function makeId(): string {
  const api = globalThis.crypto;
  if (api?.randomUUID) return api.randomUUID();
  if (api?.getRandomValues) {
    const bytes = new Uint8Array(16);
    api.getRandomValues(bytes);
    return bytesToBase64Url(bytes);
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const body = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = body + "=".repeat((4 - body.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonical(object[key])}`).join(",")}}`;
}

async function digestText(value: string): Promise<string> {
  const digest = await cryptoApi().subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

async function fingerprintPublicKey(publicRaw: string): Promise<string> {
  const digest = await cryptoApi().subtle.digest("SHA-256", bytesBuffer(base64UrlToBytes(publicRaw)));
  return bytesToBase64Url(new Uint8Array(digest));
}

async function importPublicKey(publicRaw: string): Promise<CryptoKey> {
  return cryptoApi().subtle.importKey(
    "raw",
    bytesBuffer(base64UrlToBytes(publicRaw)),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
}

function openIdentityDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(Error("indexeddb-unavailable"));
      return;
    }
    const request = indexedDB.open(IDENTITY_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDENTITY_STORE)) db.createObjectStore(IDENTITY_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? Error("indexeddb-open"));
  });
}

async function readSecureIdentity(): Promise<StoredIdentity | null> {
  const db = await openIdentityDb();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(IDENTITY_STORE, "readonly").objectStore(IDENTITY_STORE).get("device");
      request.onsuccess = () => resolve((request.result as StoredIdentity | undefined) ?? null);
      request.onerror = () => reject(request.error ?? Error("indexeddb-read"));
    });
  } finally {
    db.close();
  }
}

async function writeSecureIdentity(value: StoredIdentity): Promise<void> {
  const db = await openIdentityDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDENTITY_STORE, "readwrite");
      tx.objectStore(IDENTITY_STORE).put(value, "device");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? Error("indexeddb-write"));
      tx.onabort = () => reject(tx.error ?? Error("indexeddb-abort"));
    });
  } finally {
    db.close();
  }
}

async function createIdentity(): Promise<DeviceIdentity> {
  const api = cryptoApi();
  // Generate once as extractable so the public key can be encoded in the QR.
  // The private key is immediately re-imported as NON-EXTRACTABLE before storage.
  const generated = await api.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  ) as CryptoKeyPair;
  const privateJwk = await api.subtle.exportKey("jwk", generated.privateKey);
  const privateKey = await api.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const publicRaw = bytesToBase64Url(new Uint8Array(await api.subtle.exportKey("raw", generated.publicKey)));
  const publicKey = await importPublicKey(publicRaw);
  return {
    privateKey,
    publicKey,
    publicRaw,
    fingerprint: await fingerprintPublicKey(publicRaw),
  };
}

async function loadFallbackIdentity(): Promise<DeviceIdentity> {
  const api = cryptoApi();
  try {
    const saved = JSON.parse(localStorage.getItem(IDENTITY_KEY) || "null") as
      | { version: 2; privateJwk: JsonWebKey; publicRaw: string }
      | null;
    if (saved?.version === 2 && saved.privateJwk && typeof saved.publicRaw === "string") {
      const privateKey = await api.subtle.importKey(
        "jwk",
        saved.privateJwk,
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["sign"],
      );
      return {
        privateKey,
        publicKey: await importPublicKey(saved.publicRaw),
        publicRaw: saved.publicRaw,
        fingerprint: await fingerprintPublicKey(saved.publicRaw),
      };
    }
  } catch {}

  const generated = await api.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  ) as CryptoKeyPair;
  const privateJwk = await api.subtle.exportKey("jwk", generated.privateKey);
  const privateKey = await api.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const publicRaw = bytesToBase64Url(new Uint8Array(await api.subtle.exportKey("raw", generated.publicKey)));
  localStorage.setItem(IDENTITY_KEY, JSON.stringify({ version: 2, privateJwk, publicRaw }));
  return {
    privateKey,
    publicKey: await importPublicKey(publicRaw),
    publicRaw,
    fingerprint: await fingerprintPublicKey(publicRaw),
  };
}

async function loadDeviceIdentity(): Promise<DeviceIdentity> {
  try {
    const saved = await readSecureIdentity();
    if (
      saved?.version === 2 &&
      saved.privateKey?.type === "private" &&
      saved.privateKey.extractable === false &&
      typeof saved.publicRaw === "string"
    ) {
      return {
        privateKey: saved.privateKey,
        publicKey: await importPublicKey(saved.publicRaw),
        publicRaw: saved.publicRaw,
        fingerprint: await fingerprintPublicKey(saved.publicRaw),
      };
    }

    const created = await createIdentity();
    await writeSecureIdentity({
      version: 2,
      privateKey: created.privateKey,
      publicRaw: created.publicRaw,
    });
    return created;
  } catch {
    // Test environments / legacy WebViews without IndexedDB use a compatible
    // fallback. Modern iOS/Android browsers use the non-exportable key above.
    return loadFallbackIdentity();
  }
}

async function signPayload<T extends object>(payload: T, privateKey: CryptoKey): Promise<T & { sig: string }> {
  const signature = await cryptoApi().subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(canonical(payload)),
  );
  return { ...payload, sig: bytesToBase64Url(new Uint8Array(signature)) };
}

async function verifySigned(value: TradeToken, publicRaw: string): Promise<boolean> {
  const payload = { ...value } as Record<string, unknown>;
  const signature = String(payload.sig ?? "");
  delete payload.sig;
  if (!signature) return false;
  try {
    const publicKey = await importPublicKey(publicRaw);
    return cryptoApi().subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      bytesBuffer(base64UrlToBytes(signature)),
      new TextEncoder().encode(canonical(payload)),
    );
  } catch {
    return false;
  }
}

async function tokenHash(value: TradeToken): Promise<string> {
  return digestText(canonical(value));
}

function blank(): CardInventoryState {
  return {
    version: 1,
    cards: {},
    origins: {},
    received: {},
    redeemed: {},
    confirmed: {},
    spent: {},
    receiving: {},
    outgoing: {},
    completionAcks: {},
    pending: null,
  };
}

function positive(value: unknown): number {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function sumOrigins(origins: OriginCounts | undefined): number {
  return Object.values(origins ?? {}).reduce<number>((sum, value) => sum + positive(value), 0);
}

function write(state: CardInventoryState): CardInventoryState {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("hirundu:cards"));
  return state;
}

function tradeLockKey(offerId: string): string {
  return `${TRADE_LOCK_PREFIX}${offerId}`;
}

function acquireTradeLock(offerId: string): string {
  const key = tradeLockKey(offerId);
  const now = Date.now();
  const existingRaw = localStorage.getItem(key);
  if (existingRaw) {
    try {
      const existing = JSON.parse(existingRaw) as { owner?: string; expiresAt?: number };
      if (existing.owner && Number(existing.expiresAt) > now) throw Error("trade-busy");
    } catch (error) {
      if (error instanceof Error && error.message === "trade-busy") throw error;
    }
  }

  const owner = makeId();
  localStorage.setItem(key, JSON.stringify({ owner, expiresAt: now + TRADE_LOCK_TTL }));
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "null") as { owner?: string } | null;
    if (stored?.owner !== owner) throw Error("trade-busy");
  } catch (error) {
    if (error instanceof Error && error.message === "trade-busy") throw error;
    throw Error("trade-lock");
  }
  return owner;
}

function releaseTradeLock(offerId: string, owner: string): void {
  const key = tradeLockKey(offerId);
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "null") as { owner?: string } | null;
    if (stored?.owner === owner) localStorage.removeItem(key);
  } catch {}
}

async function withTradeLock<T>(offerId: string, action: () => Promise<T>): Promise<T> {
  const owner = acquireTradeLock(offerId);
  try {
    return await action();
  } finally {
    releaseTradeLock(offerId, owner);
  }
}

function encode(value: TradeToken): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return TRADE_PREFIX + bytesToBase64Url(bytes);
}

function validateTimes(parsed: Record<string, unknown>): void {
  const issuedAt = Number(parsed.issuedAt);
  const expiresAt = Number(parsed.expiresAt);
  const now = Date.now();
  if (
    !Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) ||
    issuedAt > now + CLOCK_SKEW ||
    expiresAt <= now ||
    expiresAt - issuedAt > MAX_AGE + 5_000 ||
    now - issuedAt > MAX_AGE + CLOCK_SKEW
  ) throw Error("expired");
}

function decode(raw: string): TradeToken {
  if (!raw.startsWith(TRADE_PREFIX)) throw Error(raw.startsWith(LEGACY_TRADE_PREFIX) ? "legacy-trade" : "not-hirundu");
  const body = raw.slice(TRADE_PREFIX.length);
  const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(body))) as Record<string, unknown>;
  if (
    parsed?.version !== 2 ||
    !["offer", "receipt", "confirmation", "ack"].includes(String(parsed.type)) ||
    !validKey(parsed.card) ||
    (parsed.type !== "ack" && !validKey(parsed.requestedCard)) ||
    typeof parsed.sig !== "string"
  ) throw Error("invalid");
  validateTimes(parsed);
  return parsed as TradeToken;
}

function sanitizeOrigins(value: unknown): Partial<Record<BonusKey, OriginCounts>> {
  const result: Partial<Record<BonusKey, OriginCounts>> = {};
  if (!value || typeof value !== "object") return result;
  const allowed: CardOrigin[] = ["game", "partner", "physical", "exchange", "test", "legacy"];
  Object.entries(value as Record<string, unknown>).forEach(([key, counts]) => {
    if (!validKey(key) || !counts || typeof counts !== "object") return;
    const clean: OriginCounts = {};
    allowed.forEach((origin) => {
      const count = positive((counts as Record<string, unknown>)[origin]);
      if (count) clean[origin] = count;
    });
    if (sumOrigins(clean)) result[key] = clean;
  });
  return result;
}

function cleanTimestamps(value: unknown): Record<string, number> {
  const result: Record<string, number> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  Object.entries(value as Record<string, unknown>).forEach(([key, stamp]) => {
    const number = Number(stamp);
    if (key && Number.isFinite(number) && number > 0) result[key] = number;
  });
  return result;
}

function sanitizePending(value: unknown): Pending | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const pending = value as Partial<Pending>;
  if (
    typeof pending.id !== "string" || !validKey(pending.card) || !validKey(pending.requestedCard) ||
    typeof pending.createdAt !== "number" || typeof pending.expiresAt !== "number" ||
    typeof pending.sender !== "string" || typeof pending.offerHash !== "string" ||
    (pending.token !== undefined && typeof pending.token !== "string")
  ) return null;
  return pending as Pending;
}

function sanitizeReceiving(value: unknown): Record<string, Receiving> {
  const result: Record<string, Receiving> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  Object.entries(value as Record<string, unknown>).forEach(([id, raw]) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;
    const item = raw as Partial<Receiving>;
    if (
      validKey(item.card) && validKey(item.requestedCard) && typeof item.sender === "string" && typeof item.receiver === "string" &&
      typeof item.createdAt === "number" && typeof item.expiresAt === "number" &&
      typeof item.offerHash === "string" && typeof item.receiptHash === "string" &&
      (item.receiptToken === undefined || typeof item.receiptToken === "string")
    ) result[id] = item as Receiving;
  });
  return result;
}

function sanitizeOutgoing(value: unknown): Record<string, OutgoingConfirmation> {
  const result: Record<string, OutgoingConfirmation> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  Object.entries(value as Record<string, unknown>).forEach(([id, raw]) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;
    const item = raw as Partial<OutgoingConfirmation>;
    if (
      validKey(item.card) && validKey(item.requestedCard) && typeof item.receiver === "string" &&
      typeof item.createdAt === "number" && typeof item.expiresAt === "number" &&
      typeof item.receiptHash === "string" &&
      (item.confirmationHash === undefined || typeof item.confirmationHash === "string") &&
      typeof item.token === "string"
    ) result[id] = item as OutgoingConfirmation;
  });
  return result;
}

function sanitizeCompletionAcks(value: unknown): Record<string, CompletionAckRecord> {
  const result: Record<string, CompletionAckRecord> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  Object.entries(value as Record<string, unknown>).forEach(([id, raw]) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;
    const item = raw as Partial<CompletionAckRecord>;
    if (
      validKey(item.card) && typeof item.sender === "string" && typeof item.receiver === "string" &&
      typeof item.createdAt === "number" && typeof item.expiresAt === "number" &&
      typeof item.confirmationHash === "string" && typeof item.token === "string"
    ) result[id] = item as CompletionAckRecord;
  });
  return result;
}

export function readCardInventory(): CardInventoryState {
  const state = blank();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved?.version === 1 && saved.cards && saved.received) {
      state.cards = saved.cards;
      state.origins = sanitizeOrigins(saved.origins);
      state.received = cleanTimestamps(saved.received);
      state.redeemed = cleanTimestamps(saved.redeemed);
      state.confirmed = cleanTimestamps(saved.confirmed);
      state.spent = cleanTimestamps(saved.spent);
      state.receiving = sanitizeReceiving(saved.receiving);
      state.outgoing = sanitizeOutgoing(saved.outgoing);
      state.completionAcks = sanitizeCompletionAcks(saved.completionAcks);
      state.pending = sanitizePending(saved.pending);
    }
  } catch {
    // Corrupt local inventory is replaced by a safe empty state.
  }

  const unlocked = new Set(getUnlockedKeys());
  (Object.keys(BONUS_MAPS) as BonusKey[]).forEach((key) => {
    const savedCount = positive(state.cards[key]);
    let origins = state.origins[key];
    if (!origins && savedCount) {
      const gameCopies = unlocked.has(key) ? 1 : 0;
      origins = {};
      if (gameCopies) origins.game = gameCopies;
      if (savedCount > gameCopies) origins.legacy = savedCount - gameCopies;
    }
    if (!origins) origins = {};
    if (unlocked.has(key) && !positive(origins.game)) origins.game = 1;
    const total = sumOrigins(origins);
    if (total) {
      state.origins[key] = origins;
      state.cards[key] = total;
    } else {
      delete state.origins[key];
      delete state.cards[key];
    }
  });
  return state;
}

export function getCardOrigins(state: CardInventoryState, key: BonusKey): OriginCounts {
  return { ...(state.origins[key] ?? {}) };
}

function grantCard(state: CardInventoryState, key: BonusKey, origin: CardOrigin): void {
  const origins = { ...(state.origins[key] ?? {}) };
  origins[origin] = positive(origins[origin]) + 1;
  state.origins[key] = origins;
  state.cards[key] = sumOrigins(origins);
}

export function recordGameVictoryCard(key: BonusKey, replay: boolean): CardInventoryState {
  const state = readCardInventory();
  if (replay) {
    grantCard(state, key, "game");
  } else {
    const origins = { ...(state.origins[key] ?? {}) };
    origins.game = Math.max(1, positive(origins.game));
    state.origins[key] = origins;
    state.cards[key] = sumOrigins(origins);
  }
  return write(state);
}

export function addTestDuplicate(key: BonusKey = "otranto"): CardInventoryState {
  const state = readCardInventory();
  const missingCopies = Math.max(1, 2 - positive(state.cards[key]));
  for (let index = 0; index < missingCopies; index += 1) grantCard(state, key, "test");
  return write(state);
}

export function findFieldCardScenario(raw: string): FieldCardScenario | undefined {
  const token = raw.trim();
  return FIELD_CARD_SCENARIOS.find((scenario) => scenario.token === token);
}

export function isHirunduCardQr(raw: string): boolean {
  const token = raw.trim();
  return token.startsWith(TRADE_PREFIX) || token.startsWith(LEGACY_TRADE_PREFIX);
}

export function redeemFieldCardQr(raw: string): {
  scenario: FieldCardScenario;
  state: CardInventoryState;
  alreadyRedeemed: boolean;
  passportValidated: boolean;
} {
  const scenario = findFieldCardScenario(raw);
  if (!scenario) throw Error("unknown-field-card");
  const state = readCardInventory();
  if (state.redeemed[scenario.id]) {
    return { scenario, state, alreadyRedeemed: true, passportValidated: false };
  }

  grantCard(state, scenario.card, scenario.kind);
  state.redeemed[scenario.id] = Date.now();
  write(state);

  // Demonstration field QR codes are deliberately isolated from the real passport.
  return { scenario, state, alreadyRedeemed: false, passportValidated: false };
}

export function queueCardQr(raw: string): void {
  sessionStorage.setItem(QUEUED_CARD_QR_KEY, raw.trim());
}

export function takeQueuedCardQr(): string {
  const raw = sessionStorage.getItem(QUEUED_CARD_QR_KEY) ?? "";
  sessionStorage.removeItem(QUEUED_CARD_QR_KEY);
  return raw;
}

export type ResumableCardTradeQr = {
  kind: "offer" | "receipt" | "confirmation" | "ack";
  token: string;
  card: BonusKey;
  expiresAt: number;
  offerId?: string;
};

export function getResumableOutgoingCardTrade(): ResumableCardTradeQr | null {
  const state = readCardInventory();
  const now = Date.now();
  const confirmationEntry = Object.entries(state.outgoing)
    .filter(([, item]) => item.expiresAt > now)
    .sort(([, a], [, b]) => b.createdAt - a.createdAt)[0];
  if (confirmationEntry) {
    const [offerId, confirmation] = confirmationEntry;
    return {
      kind: "confirmation",
      token: confirmation.token,
      card: confirmation.card,
      expiresAt: confirmation.expiresAt,
      offerId,
    };
  }
  if (state.pending?.token && state.pending.expiresAt > now) {
    return {
      kind: "offer",
      token: state.pending.token,
      card: state.pending.card,
      expiresAt: state.pending.expiresAt,
      offerId: state.pending.id,
    };
  }
  return null;
}

export function getResumableReceiptTrade(): ResumableCardTradeQr | null {
  const now = Date.now();
  const receipt = Object.values(readCardInventory().receiving)
    .filter((item) => Boolean(item.receiptToken) && item.expiresAt > now)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  if (!receipt?.receiptToken) return null;
  return {
    kind: "receipt",
    token: receipt.receiptToken,
    card: receipt.card,
    expiresAt: receipt.expiresAt,
  };
}

export function getResumableCompletionAckTrade(): ResumableCardTradeQr | null {
  const now = Date.now();
  const ack = Object.values(readCardInventory().completionAcks)
    .filter((item) => item.expiresAt > now)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  if (!ack) return null;
  const [offerId] = Object.entries(readCardInventory().completionAcks)
    .filter(([, item]) => item === ack)[0] ?? [];
  return {
    kind: "ack",
    token: ack.token,
    card: ack.card,
    expiresAt: ack.expiresAt,
    offerId,
  };
}

export function finishReceiverTrade(offerId: string): CardInventoryState {
  const state = readCardInventory();
  if (!offerId || !state.completionAcks[offerId]) return state;
  delete state.completionAcks[offerId];
  return write(state);
}

export function finishSenderTrade(offerId: string): CardInventoryState {
  const state = readCardInventory();
  if (!offerId || !state.outgoing[offerId]) return state;
  delete state.outgoing[offerId];
  return write(state);
}

export function hasUnresolvedExpiredOutgoingCardTrade(): boolean {
  const now = Date.now();
  return Object.values(readCardInventory().outgoing).some((item) => item.expiresAt <= now);
}

export async function createCardOffer(card: BonusKey, requestedCard: BonusKey): Promise<{ offer: Offer; token: string }> {
  const state = readCardInventory();
  if ((state.cards[card] || 0) < 2) throw Error("no-duplicate");
  if (!validKey(requestedCard) || requestedCard === card) throw Error("invalid-requested-card");

  const identity = await loadDeviceIdentity();
  const issuedAt = Date.now();
  const payload: OfferPayload = {
    type: "offer",
    version: 2,
    id: makeId(),
    card,
    requestedCard,
    sender: identity.fingerprint,
    senderKey: identity.publicRaw,
    issuedAt,
    expiresAt: issuedAt + MAX_AGE,
  };
  const offer = await signPayload(payload, identity.privateKey);
  const token = encode(offer);
  state.pending = {
    id: offer.id,
    card,
    requestedCard,
    createdAt: issuedAt,
    expiresAt: offer.expiresAt,
    sender: identity.fingerprint,
    offerHash: await tokenHash(offer),
    token,
  };
  write(state);
  return { offer, token };
}

export async function inspectCardOffer(raw: string): Promise<Offer> {
  const offer = decode(raw);
  if (offer.type !== "offer") throw Error("invalid-offer");
  if (await fingerprintPublicKey(offer.senderKey) !== offer.sender) throw Error("invalid-sender");
  if (!await verifySigned(offer, offer.senderKey)) throw Error("bad-signature");

  const identity = await loadDeviceIdentity();
  if (offer.sender === identity.fingerprint) throw Error("self-offer");

  const state = readCardInventory();
  if ((state.cards[offer.requestedCard] || 0) < 2) throw Error("missing-requested-duplicate");
  if (state.confirmed[offer.id]) throw Error("already-received");
  if (state.received[offer.id] && !state.receiving[offer.id]?.receiptToken) throw Error("already-received");
  return offer;
}

export async function acceptCardOffer(raw: string): Promise<{ offer: Offer; receipt: Receipt; token: string }> {
  const offer = await inspectCardOffer(raw);
  const identity = await loadDeviceIdentity();
  const offerHash = await tokenHash(offer);

  return withTradeLock(offer.id, async () => {
    const state = readCardInventory();
    const existing = state.receiving[offer.id];
    if (
      existing?.receiptToken &&
      existing.card === offer.card &&
      existing.requestedCard === offer.requestedCard &&
      existing.sender === offer.sender &&
      existing.receiver === identity.fingerprint &&
      existing.offerHash === offerHash &&
      existing.expiresAt === offer.expiresAt &&
      existing.expiresAt > Date.now()
    ) {
      const resumed = decode(existing.receiptToken);
      if (resumed.type !== "receipt") throw Error("invalid-receipt");
      return { offer, receipt: resumed, token: existing.receiptToken };
    }
    if (state.received[offer.id] || state.confirmed[offer.id]) throw Error("already-received");

    const issuedAt = Date.now();
    const payload: ReceiptPayload = {
      type: "receipt",
      version: 2,
      offerId: offer.id,
      offerHash,
      card: offer.card,
      requestedCard: offer.requestedCard,
      sender: offer.sender,
      receiver: identity.fingerprint,
      receiverKey: identity.publicRaw,
      issuedAt,
      expiresAt: offer.expiresAt,
    };
    const receipt = await signPayload(payload, identity.privateKey);
    const receiptHash = await tokenHash(receipt);
    const token = encode(receipt);

    // B commits the requested duplicate when creating the signed receipt.
    // The receipt itself is the cryptographic proof that A will scan in step 2.
    removeTransferableCopy(state, offer.requestedCard);
    state.received[offer.id] = issuedAt;
    state.receiving[offer.id] = {
      card: offer.card,
      requestedCard: offer.requestedCard,
      sender: offer.sender,
      receiver: identity.fingerprint,
      createdAt: issuedAt,
      expiresAt: offer.expiresAt,
      offerHash,
      receiptHash,
      receiptToken: token,
    };
    write(state);
    return { offer, receipt, token };
  });
}

function removeTransferableCopy(state: CardInventoryState, card: BonusKey): void {
  const origins = { ...(state.origins[card] ?? {}) };
  const preferred: CardOrigin[] = ["test", "legacy", "physical", "partner", "exchange"];
  let origin = preferred.find((candidate) => positive(origins[candidate]) > 0);
  if (!origin && positive(origins.game) > 1) origin = "game";
  if (!origin) throw Error("no-transferable-copy");
  const next = positive(origins[origin]) - 1;
  if (next) origins[origin] = next;
  else delete origins[origin];
  state.origins[card] = origins;
  state.cards[card] = sumOrigins(origins);
}

export async function completeCardReceipt(raw: string): Promise<{
  card: BonusKey;
  state: CardInventoryState;
  confirmation: Confirmation;
  token: string;
}> {
  const receipt = decode(raw);
  if (receipt.type !== "receipt") throw Error("invalid-receipt");
  if (await fingerprintPublicKey(receipt.receiverKey) !== receipt.receiver) throw Error("invalid-receiver");
  if (!await verifySigned(receipt, receipt.receiverKey)) throw Error("bad-signature");

  const identity = await loadDeviceIdentity();
  if (receipt.sender !== identity.fingerprint) throw Error("wrong-sender");
  const receiptHash = await tokenHash(receipt);

  return withTradeLock(receipt.offerId, async () => {
    const state = readCardInventory();
    const existing = state.outgoing[receipt.offerId];
    if (
      existing &&
      existing.card === receipt.card &&
      existing.requestedCard === receipt.requestedCard &&
      existing.receiver === receipt.receiver &&
      existing.receiptHash === receiptHash &&
      existing.expiresAt === receipt.expiresAt &&
      existing.expiresAt > Date.now()
    ) {
      const resumed = decode(existing.token);
      if (resumed.type !== "confirmation") throw Error("invalid-confirmation");
      return { card: receipt.card, state, confirmation: resumed, token: existing.token };
    }

    const pending = state.pending;
    if (
      !pending ||
      pending.id !== receipt.offerId ||
      pending.card !== receipt.card ||
      pending.requestedCard !== receipt.requestedCard ||
      pending.sender !== identity.fingerprint ||
      pending.offerHash !== receipt.offerHash ||
      pending.expiresAt !== receipt.expiresAt ||
      pending.expiresAt <= Date.now() ||
      state.spent[receipt.offerId] ||
      (state.cards[receipt.card] || 0) < 2
    ) throw Error("no-pending");

    const issuedAt = Date.now();
    const payload: ConfirmationPayload = {
      type: "confirmation",
      version: 2,
      offerId: receipt.offerId,
      receiptHash,
      card: receipt.card,
      requestedCard: receipt.requestedCard,
      sender: identity.fingerprint,
      senderKey: identity.publicRaw,
      receiver: receipt.receiver,
      issuedAt,
      expiresAt: receipt.expiresAt,
    };

    // Build and sign the final confirmation before any inventory debit. The
    // debit and the resumable token are then persisted by one localStorage write.
    const confirmation = await signPayload(payload, identity.privateKey);
    const token = encode(confirmation);
    const confirmationHash = await tokenHash(confirmation);
    if (receipt.expiresAt <= Date.now()) throw Error("expired");

    removeTransferableCopy(state, receipt.card);
    grantCard(state, receipt.requestedCard, "exchange");
    state.pending = null;
    state.spent[receipt.offerId] = Date.now();
    state.outgoing[receipt.offerId] = {
      card: receipt.card,
      requestedCard: receipt.requestedCard,
      receiver: receipt.receiver,
      createdAt: issuedAt,
      expiresAt: receipt.expiresAt,
      receiptHash,
      confirmationHash,
      token,
    };
    write(state);
    return { card: receipt.card, state, confirmation, token };
  });
}

export async function finalizeCardConfirmation(raw: string): Promise<{
  card: BonusKey;
  state: CardInventoryState;
  ack: CompletionAck;
  token: string;
}> {
  const confirmation = decode(raw);
  if (confirmation.type !== "confirmation") throw Error("invalid-confirmation");
  if (await fingerprintPublicKey(confirmation.senderKey) !== confirmation.sender) throw Error("invalid-sender");
  if (!await verifySigned(confirmation, confirmation.senderKey)) throw Error("bad-signature");

  const identity = await loadDeviceIdentity();
  if (confirmation.receiver !== identity.fingerprint) throw Error("wrong-receiver");
  const confirmationHash = await tokenHash(confirmation);

  return withTradeLock(confirmation.offerId, async () => {
    const state = readCardInventory();
    const existingAck = state.completionAcks[confirmation.offerId];
    if (
      existingAck &&
      existingAck.card === confirmation.card &&
      existingAck.sender === confirmation.sender &&
      existingAck.receiver === identity.fingerprint &&
      existingAck.confirmationHash === confirmationHash &&
      existingAck.expiresAt === confirmation.expiresAt &&
      existingAck.expiresAt > Date.now()
    ) {
      const resumed = decode(existingAck.token);
      if (resumed.type !== "ack") throw Error("invalid-ack");
      return { card: confirmation.card, state, ack: resumed, token: existingAck.token };
    }

    const receiving = state.receiving[confirmation.offerId];
    if (
      !receiving ||
      receiving.card !== confirmation.card ||
      receiving.requestedCard !== confirmation.requestedCard ||
      receiving.sender !== confirmation.sender ||
      receiving.receiver !== identity.fingerprint ||
      receiving.receiptHash !== confirmation.receiptHash ||
      receiving.expiresAt !== confirmation.expiresAt ||
      receiving.expiresAt <= Date.now() ||
      state.confirmed[confirmation.offerId]
    ) throw Error("confirmation-not-expected");

    const issuedAt = Date.now();
    const ackPayload: CompletionAckPayload = {
      type: "ack",
      version: 2,
      offerId: confirmation.offerId,
      confirmationHash,
      card: confirmation.card,
      sender: confirmation.sender,
      receiver: identity.fingerprint,
      receiverKey: identity.publicRaw,
      issuedAt,
      expiresAt: confirmation.expiresAt,
    };
    const ack = await signPayload(ackPayload, identity.privateKey);
    const token = encode(ack);

    // The received card and its signed closure receipt are persisted together.
    grantCard(state, confirmation.card, "exchange");
    state.confirmed[confirmation.offerId] = Date.now();
    delete state.receiving[confirmation.offerId];
    state.completionAcks[confirmation.offerId] = {
      card: confirmation.card,
      sender: confirmation.sender,
      receiver: identity.fingerprint,
      createdAt: issuedAt,
      expiresAt: confirmation.expiresAt,
      confirmationHash,
      token,
    };
    return { card: confirmation.card, state: write(state), ack, token };
  });
}

export async function finalizeSenderAcknowledgement(raw: string): Promise<{ card: BonusKey; state: CardInventoryState }> {
  const ack = decode(raw);
  if (ack.type !== "ack") throw Error("invalid-ack");
  if (await fingerprintPublicKey(ack.receiverKey) !== ack.receiver) throw Error("invalid-receiver");
  if (!await verifySigned(ack, ack.receiverKey)) throw Error("bad-signature");

  const identity = await loadDeviceIdentity();
  if (ack.sender !== identity.fingerprint) throw Error("wrong-sender");

  return withTradeLock(ack.offerId, async () => {
    const state = readCardInventory();
    const outgoing = state.outgoing[ack.offerId];
    if (!outgoing) throw Error("ack-not-expected");

    let expectedConfirmationHash = outgoing.confirmationHash;
    if (!expectedConfirmationHash) {
      const legacyConfirmation = decode(outgoing.token);
      if (legacyConfirmation.type !== "confirmation") throw Error("ack-not-expected");
      expectedConfirmationHash = await tokenHash(legacyConfirmation);
    }

    if (
      outgoing.card !== ack.card ||
      outgoing.receiver !== ack.receiver ||
      expectedConfirmationHash !== ack.confirmationHash ||
      outgoing.expiresAt !== ack.expiresAt ||
      outgoing.expiresAt <= Date.now()
    ) throw Error("ack-not-expected");

    delete state.outgoing[ack.offerId];
    return { card: ack.card, state: write(state) };
  });
}

export function cancelPendingOffer(): CardInventoryState {
  const state = readCardInventory();
  state.pending = null;
  return write(state);
}
