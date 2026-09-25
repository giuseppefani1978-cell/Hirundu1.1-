import { BONUS_MAPS, type BonusKey } from "./bonusData";
import { getUnlockedKeys } from "./bonusStorage";
import { setPoiQrValidated } from "../qr/passport/passportStorage";

const STORAGE_KEY = "hirundu_card_inventory_v1";
const DEVICE_KEY = "hirundu_card_device_v1";
const TRADE_PREFIX = "HIRUNDU-CARD-1.";
const MAX_AGE = 15 * 60 * 1000;
export const QUEUED_CARD_QR_KEY = "hirundu_queued_card_qr_v1";

export type CardOrigin = "game" | "partner" | "physical" | "exchange" | "test" | "legacy";
type OriginCounts = Partial<Record<CardOrigin, number>>;
type Pending = { id: string; card: BonusKey; createdAt: number };
export type CardInventoryState = {
  version: 1;
  cards: Partial<Record<BonusKey, number>>;
  origins: Partial<Record<BonusKey, OriginCounts>>;
  received: Record<string, number>;
  redeemed: Record<string, number>;
  pending: Pending | null;
};
type Offer = { type: "offer"; version: 1; id: string; card: BonusKey; sender: string; issuedAt: number };
type Receipt = { type: "receipt"; version: 1; offerId: string; card: BonusKey; receiver: string; issuedAt: number };

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

function makeId(): string {
  return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function device(): string {
  let value = localStorage.getItem(DEVICE_KEY);
  if (!value) {
    value = makeId();
    localStorage.setItem(DEVICE_KEY, value);
  }
  return value;
}

function blank(): CardInventoryState {
  return { version: 1, cards: {}, origins: {}, received: {}, redeemed: {}, pending: null };
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

function encode(value: Offer | Receipt): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return TRADE_PREFIX + btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decode(raw: string): Offer | Receipt {
  if (!raw.startsWith(TRADE_PREFIX)) throw Error("not-hirundu");
  const body = raw.slice(TRADE_PREFIX.length).replaceAll("-", "+").replaceAll("_", "/");
  const padded = body + "=".repeat((4 - body.length % 4) % 4);
  const binary = atob(padded);
  const parsed = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0))));
  if (
    parsed?.version !== 1 || !validKey(parsed.card) || typeof parsed.issuedAt !== "number" ||
    Date.now() - parsed.issuedAt > MAX_AGE || parsed.issuedAt > Date.now() + 60_000
  ) throw Error("invalid");
  return parsed as Offer | Receipt;
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

export function readCardInventory(): CardInventoryState {
  const state = blank();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved?.version === 1 && saved.cards && saved.received) {
      state.cards = saved.cards;
      state.origins = sanitizeOrigins(saved.origins);
      state.received = saved.received;
      state.redeemed = saved.redeemed && typeof saved.redeemed === "object" ? saved.redeemed : {};
      state.pending = saved.pending ?? null;
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
  return raw.trim().startsWith(TRADE_PREFIX) || !!findFieldCardScenario(raw);
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
    return { scenario, state, alreadyRedeemed: true, passportValidated: scenario.validatesVisit };
  }

  grantCard(state, scenario.card, scenario.kind);
  state.redeemed[scenario.id] = Date.now();
  write(state);

  if (scenario.validatesVisit && scenario.mapKey && scenario.poiId) {
    const config = BONUS_MAPS[scenario.mapKey];
    setPoiQrValidated(scenario.mapKey, scenario.poiId, true, config.poiIds);
  }
  return { scenario, state, alreadyRedeemed: false, passportValidated: scenario.validatesVisit };
}

export function queueCardQr(raw: string): void {
  sessionStorage.setItem(QUEUED_CARD_QR_KEY, raw.trim());
}

export function takeQueuedCardQr(): string {
  const raw = sessionStorage.getItem(QUEUED_CARD_QR_KEY) ?? "";
  sessionStorage.removeItem(QUEUED_CARD_QR_KEY);
  return raw;
}

export function createCardOffer(card: BonusKey): { offer: Offer; token: string } {
  const state = readCardInventory();
  if ((state.cards[card] || 0) < 2) throw Error("no-duplicate");
  const offer: Offer = { type: "offer", version: 1, id: makeId(), card, sender: device(), issuedAt: Date.now() };
  state.pending = { id: offer.id, card, createdAt: offer.issuedAt };
  write(state);
  return { offer, token: encode(offer) };
}

export function inspectCardOffer(raw: string): Offer {
  const offer = decode(raw);
  if (offer.type !== "offer" || offer.sender === device()) throw Error("invalid-offer");
  const state = readCardInventory();
  if (state.received[offer.id]) throw Error("already-received");
  return offer;
}

export function acceptCardOffer(raw: string): { offer: Offer; receipt: Receipt; token: string } {
  const offer = inspectCardOffer(raw);
  const state = readCardInventory();
  grantCard(state, offer.card, "exchange");
  state.received[offer.id] = Date.now();
  write(state);
  const receipt: Receipt = { type: "receipt", version: 1, offerId: offer.id, card: offer.card, receiver: device(), issuedAt: Date.now() };
  return { offer, receipt, token: encode(receipt) };
}

function removeTransferableCopy(state: CardInventoryState, card: BonusKey): void {
  const origins = { ...(state.origins[card] ?? {}) };
  const preferred: CardOrigin[] = ["test", "legacy", "physical", "partner", "exchange"];
  const origin = preferred.find((candidate) => positive(origins[candidate]) > 0);
  if (!origin) throw Error("no-transferable-copy");
  const next = positive(origins[origin]) - 1;
  if (next) origins[origin] = next;
  else delete origins[origin];
  state.origins[card] = origins;
  state.cards[card] = sumOrigins(origins);
}

export function completeCardReceipt(raw: string): { card: BonusKey; state: CardInventoryState } {
  const receipt = decode(raw);
  if (receipt.type !== "receipt") throw Error("invalid-receipt");
  const state = readCardInventory();
  if (!state.pending || state.pending.id !== receipt.offerId || state.pending.card !== receipt.card || (state.cards[receipt.card] || 0) < 2) {
    throw Error("no-pending");
  }
  removeTransferableCopy(state, receipt.card);
  state.pending = null;
  write(state);
  return { card: receipt.card, state };
}

export function cancelPendingOffer(): CardInventoryState {
  const state = readCardInventory();
  state.pending = null;
  return write(state);
}
