import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createServer } from "vite";

const GLOBAL_KEYS = ["window", "document", "localStorage", "sessionStorage", "CustomEvent", "Event", "__HIRUNDU_TEST_EPHEMERAL_IDENTITY__"];

function snapshotGlobals() {
  const prior = {};
  for (const key of GLOBAL_KEYS) prior[key] = Object.getOwnPropertyDescriptor(globalThis, key);
  return prior;
}

function useDom(dom) {
  for (const key of GLOBAL_KEYS) {
    Object.defineProperty(globalThis, key, {
      value: key === "__HIRUNDU_TEST_EPHEMERAL_IDENTITY__" ? true : key === "window" ? dom.window : key === "document" ? dom.window.document : dom.window[key],
      configurable: true,
      writable: true,
    });
  }
}

function restoreGlobals(prior) {
  for (const [key, value] of Object.entries(prior)) {
    if (value) Object.defineProperty(globalThis, key, value);
    else delete globalThis[key];
  }
}

test("demo field QR codes stay outside the public QR route and never validate the real passport", async () => {
  const dom = new JSDOM("", { url: "https://test.invalid/" });
  const prior = snapshotGlobals();
  useDom(dom);
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  try {
    const trade = await server.ssrLoadModule("/src/features/bonus/cardTrade.ts");
    const passport = await server.ssrLoadModule("/src/features/qr/passport/passportStorage.ts");
    const partner = trade.FIELD_CARD_SCENARIOS.find((entry) => entry.kind === "partner");
    const physical = trade.FIELD_CARD_SCENARIOS.find((entry) => entry.kind === "physical");

    assert.equal(trade.isHirunduCardQr(partner.token), false);
    assert.equal(trade.isHirunduCardQr(physical.token), false);

    const partnerResult = trade.redeemFieldCardQr(partner.token);
    assert.equal(partnerResult.state.cards.otranto, 1);
    assert.equal(partnerResult.state.origins.otranto.partner, 1);
    assert.equal(partnerResult.passportValidated, false);
    assert.equal(passport.readPassportStorage().qrValidated.otranto, undefined);

    const repeated = trade.redeemFieldCardQr(partner.token);
    assert.equal(repeated.alreadyRedeemed, true);
    assert.equal(repeated.passportValidated, false);
    assert.equal(repeated.state.cards.otranto, 1);

    const physicalResult = trade.redeemFieldCardQr(physical.token);
    assert.equal(physicalResult.state.cards.lecce, 1);
    assert.equal(physicalResult.state.origins.lecce.physical, 1);
    assert.equal(passport.readPassportStorage().qrValidated.lecce, undefined);
  } finally {
    await server.close();
    dom.window.close();
    restoreGlobals(prior);
  }
});

test("a complete replay grants a transferable duplicate while preserving one game souvenir", async () => {
  const dom = new JSDOM("", { url: "https://replay.invalid/" });
  const prior = snapshotGlobals();
  useDom(dom);
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  try {
    const trade = await server.ssrLoadModule("/src/features/bonus/cardTrade.ts");
    let inventory = trade.recordGameVictoryCard("otranto", false);
    assert.equal(inventory.cards.otranto, 1);
    assert.equal(inventory.origins.otranto.game, 1);
    await assert.rejects(() => trade.createCardOffer("otranto", "lecce"), /no-duplicate/);

    inventory = trade.recordGameVictoryCard("otranto", true);
    assert.equal(inventory.cards.otranto, 2);
    assert.equal(inventory.origins.otranto.game, 2);

    const offer = await trade.createCardOffer("otranto", "lecce");
    assert.ok(offer.token.startsWith("HIRUNDU-CARD-2."));
    assert.ok(offer.offer.expiresAt - offer.offer.issuedAt <= 15 * 60 * 1000);
  } finally {
    await server.close();
    dom.window.close();
    restoreGlobals(prior);
  }
});

test("two-scan barter completes with a local finish button on the receiver", async () => {
  const domA = new JSDOM("", { url: "https://sender.invalid/" });
  const domB = new JSDOM("", { url: "https://receiver-b.invalid/" });
  const domC = new JSDOM("", { url: "https://receiver-c.invalid/" });
  const prior = snapshotGlobals();
  useDom(domA);
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });

  try {
    const trade = await server.ssrLoadModule("/src/features/bonus/cardTrade.ts");

    trade.recordGameVictoryCard("otranto", false);
    trade.recordGameVictoryCard("otranto", true);
    const offer = await trade.createCardOffer("otranto", "lecce");
    assert.equal(trade.readCardInventory().cards.otranto, 2);

    useDom(domB);
    trade.recordGameVictoryCard("lecce", false);
    trade.recordGameVictoryCard("lecce", true);
    const acceptedB = await trade.acceptCardOffer(offer.token);
    let receiverB = trade.readCardInventory();
    assert.equal(receiverB.cards.otranto ?? 0, 0);
    assert.equal(receiverB.cards.lecce, 1);
    assert.ok(receiverB.received[offer.offer.id]);

    useDom(domC);
    trade.recordGameVictoryCard("lecce", false);
    trade.recordGameVictoryCard("lecce", true);
    const acceptedC = await trade.acceptCardOffer(offer.token);
    let receiverC = trade.readCardInventory();
    assert.equal(receiverC.cards.otranto ?? 0, 0);
    assert.equal(receiverC.cards.lecce, 1);
    assert.ok(receiverC.received[offer.offer.id]);

    useDom(domA);
    const completed = await trade.completeCardReceipt(acceptedB.token);
    let sender = trade.readCardInventory();
    assert.equal(sender.cards.otranto, 1);
    assert.equal(sender.origins.otranto.game, 1);
    assert.equal(sender.cards.lecce, 1);
    assert.equal(sender.origins.lecce.exchange, 1);
    await assert.rejects(() => trade.completeCardReceipt(acceptedC.token));

    sender = trade.finishSenderTrade(completed.confirmation.offerId);
    assert.equal(sender.cards.otranto, 1);
    assert.equal(sender.cards.lecce, 1);
    assert.equal(trade.getResumableOutgoingCardTrade(), null);

    useDom(domB);
    receiverB = trade.finishReceiverAfterReceipt(offer.offer.id);
    assert.equal(receiverB.cards.otranto, 1);
    assert.equal(receiverB.origins.otranto.exchange, 1);
    assert.equal(receiverB.cards.lecce, 1);
    assert.equal(trade.getResumableReceiptTrade(), null);

    useDom(domC);
    receiverC = trade.readCardInventory();
    assert.equal(receiverC.cards.otranto ?? 0, 0);
    assert.equal(receiverC.cards.lecce, 1);
  } finally {
    await server.close();
    domA.window.close();
    domB.window.close();
    domC.window.close();
    restoreGlobals(prior);
  }
});


test("receiver local finish after receipt is idempotent and credits only once", async () => {
  const domA = new JSDOM("", { url: "https://two-scan-a.invalid/" });
  const domB = new JSDOM("", { url: "https://two-scan-b.invalid/" });
  const prior = snapshotGlobals();
  useDom(domA);
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  try {
    const trade = await server.ssrLoadModule("/src/features/bonus/cardTrade.ts");
    trade.recordGameVictoryCard("lecce", false);
    trade.recordGameVictoryCard("lecce", true);
    const offer = await trade.createCardOffer("lecce", "nardo");

    useDom(domB);
    trade.recordGameVictoryCard("nardo", false);
    trade.recordGameVictoryCard("nardo", true);
    const accepted = await trade.acceptCardOffer(offer.token);
    assert.equal(trade.readCardInventory().cards.nardo, 1);

    useDom(domA);
    const completed = await trade.completeCardReceipt(accepted.token);
    trade.finishSenderTrade(completed.confirmation.offerId);
    assert.equal(trade.readCardInventory().cards.lecce, 1);
    assert.equal(trade.readCardInventory().cards.nardo, 1);

    useDom(domB);
    const first = trade.finishReceiverAfterReceipt(offer.offer.id);
    assert.equal(first.cards.nardo, 1);
    assert.equal(first.cards.lecce, 1);
    const second = trade.finishReceiverAfterReceipt(offer.offer.id);
    assert.equal(second.cards.nardo, 1);
    assert.equal(second.cards.lecce, 1);
  } finally {
    await server.close();
    domA.window.close();
    domB.window.close();
    restoreGlobals(prior);
  }
});

test("signed QR offers reject tampering and expire after 15 minutes", async () => {
  const domA = new JSDOM("", { url: "https://sender-expiry.invalid/" });
  const domB = new JSDOM("", { url: "https://receiver-expiry.invalid/" });
  const prior = snapshotGlobals();
  useDom(domA);
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  const realNow = Date.now;
  try {
    const trade = await server.ssrLoadModule("/src/features/bonus/cardTrade.ts");
    trade.recordGameVictoryCard("otranto", false);
    trade.recordGameVictoryCard("otranto", true);
    const base = realNow();
    Date.now = () => base;
    const offer = await trade.createCardOffer("otranto", "lecce");

    useDom(domB);
    const last = offer.token.at(-1);
    const tampered = offer.token.slice(0, -1) + (last === "A" ? "B" : "A");
    await assert.rejects(() => trade.inspectCardOffer(tampered));

    Date.now = () => base + 16 * 60 * 1000;
    await assert.rejects(() => trade.inspectCardOffer(offer.token));
  } finally {
    Date.now = realNow;
    await server.close();
    domA.window.close();
    domB.window.close();
    restoreGlobals(prior);
  }
});

test("barter offer is visible but cannot be accepted without the requested duplicate", async () => {
  const domA = new JSDOM("", { url: "https://barter-sender.invalid/" });
  const domB = new JSDOM("", { url: "https://barter-receiver.invalid/" });
  const prior = snapshotGlobals();
  useDom(domA);
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });

  try {
    const trade = await server.ssrLoadModule("/src/features/bonus/cardTrade.ts");
    trade.recordGameVictoryCard("otranto", false);
    trade.recordGameVictoryCard("otranto", true);
    const offer = await trade.createCardOffer("otranto", "lecce");

    useDom(domB);
    const inspected = await trade.inspectCardOffer(offer.token);
    assert.equal(inspected.card, "otranto");
    assert.equal(inspected.requestedCard, "lecce");
    await assert.rejects(() => trade.acceptCardOffer(offer.token), /missing-requested-duplicate/);
    assert.equal(trade.readCardInventory().cards.otranto ?? 0, 0);
    assert.equal(trade.readCardInventory().cards.lecce ?? 0, 0);
  } finally {
    await server.close();
    domA.window.close();
    domB.window.close();
    restoreGlobals(prior);
  }
});

test("trade page renders generated offer QR directly under the selected duplicate", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../src/routes/CardTradePage.tsx", import.meta.url), "utf8")
  );
  assert.match(source, /qrCard === key \? renderActiveQr\(\) : null/);
  assert.match(source, /await createCardOffer\(card, requested\)/);
  assert.match(source, /remainingLabel/);
  assert.match(source, /Creating offer|Création de l’offre/);
});


test("card exchange is reachable from home, discoveries and passport without QR branding", async () => {
  const fs = await import("node:fs/promises");
  const start = await fs.readFile(new URL("../src/routes/StartPage.tsx", import.meta.url), "utf8");
  const discoveries = await fs.readFile(new URL("../src/routes/BonusHubPage.tsx", import.meta.url), "utf8");
  const passport = await fs.readFile(new URL("../src/features/qr/routes/RealMap.tsx", import.meta.url), "utf8");
  const card = await fs.readFile(new URL("../src/features/bonus/DiscoveryCard.tsx", import.meta.url), "utf8");
  const tradePage = await fs.readFile(new URL("../src/routes/CardTradePage.tsx", import.meta.url), "utf8");

  assert.match(start, /to="\/card-trade"/);
  assert.match(discoveries, /navigate\('\/card-trade'\)/);
  assert.match(passport, /navigate\('\/card-trade'\)/);
  assert.match(card, /Échange de cartes/);
  assert.doesNotMatch(card, /Échanges QR · 15 min/);
  assert.match(tradePage, /title: "Échange de cartes"/);
  assert.doesNotMatch(tradePage, /<h1>.*QR/);
});

test("strict card-trade security never persists a private JWK fallback", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../src/features/bonus/cardTrade.ts", import.meta.url), "utf8")
  );
  assert.match(source, /writeSecureIdentity/);
  assert.match(source, /clearLegacyIdentityStrict/);
  assert.match(source, /localStorage\.removeItem\(IDENTITY_KEY\)/);
  assert.doesNotMatch(source, /localStorage\.setItem\(IDENTITY_KEY/);
  assert.doesNotMatch(source, /return loadFallbackIdentity\(\)/);
});

test("strict mode blocks card trades when IndexedDB is unavailable", async () => {
  const dom = new JSDOM("", { url: "https://strict-storage.invalid/" });
  const prior = snapshotGlobals();
  useDom(dom);
  Object.defineProperty(globalThis, "__HIRUNDU_TEST_EPHEMERAL_IDENTITY__", {
    configurable: true,
    writable: true,
    value: false,
  });
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  try {
    const trade = await server.ssrLoadModule("/src/features/bonus/cardTrade.ts");
    const status = await trade.prepareCardTradeSecurity();
    assert.equal(status.available, false);
    assert.equal(status.reason, "secure-storage-unavailable");
    trade.recordGameVictoryCard("otranto", false);
    trade.recordGameVictoryCard("otranto", true);
    await assert.rejects(
      () => trade.createCardOffer("otranto", "lecce"),
      /secure-storage-unavailable/
    );
    assert.equal(trade.readCardInventory().cards.otranto, 2);
  } finally {
    await server.close();
    dom.window.close();
    restoreGlobals(prior);
  }
});

test("card exchange explains browser-bound storage and strict incompatibility", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../src/routes/CardTradePage.tsx", import.meta.url), "utf8")
  );
  assert.match(source, /Effacer les données du site ou changer de téléphone peut les rendre irrécupérables/);
  assert.match(source, /prepareCardTradeSecurity\(\)/);
  assert.match(source, /securityBlocked/);
  assert.match(source, /secureStorageUnavailable/);
});

test("modern browser path stores a non-exportable private trade key in IndexedDB", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../src/features/bonus/cardTrade.ts", import.meta.url), "utf8")
  );
  assert.match(source, /indexedDB\.open\(IDENTITY_DB/);
  assert.match(source, /false,\s*\["sign"\]/);
  assert.match(source, /privateKey\.extractable === false/);
});



test("legacy signed confirmation remains resumable without a second debit", async () => {
  const domA = new JSDOM("", { url: "https://sender-resume.invalid/" });
  const domB = new JSDOM("", { url: "https://receiver-resume.invalid/" });
  const prior = snapshotGlobals();
  useDom(domA);
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });

  try {
    const trade = await server.ssrLoadModule("/src/features/bonus/cardTrade.ts");
    trade.recordGameVictoryCard("otranto", false);
    trade.recordGameVictoryCard("otranto", true);
    const offer = await trade.createCardOffer("otranto", "lecce");

    useDom(domB);
    trade.recordGameVictoryCard("lecce", false);
    trade.recordGameVictoryCard("lecce", true);
    const accepted = await trade.acceptCardOffer(offer.token);
    const receiptResume = trade.getResumableReceiptTrade();
    assert.equal(receiptResume?.kind, "receipt");
    assert.equal(receiptResume?.token, accepted.token);

    useDom(domA);
    const completed = await trade.completeCardReceipt(accepted.token);
    assert.equal(trade.readCardInventory().cards.otranto, 1);

    const confirmationResume = trade.getResumableOutgoingCardTrade();
    assert.equal(confirmationResume?.kind, "confirmation");
    assert.equal(confirmationResume?.token, completed.token);

    const repeated = await trade.completeCardReceipt(accepted.token);
    assert.equal(repeated.token, completed.token);
    assert.equal(trade.readCardInventory().cards.otranto, 1);

    useDom(domB);
    const final = await trade.finalizeCardConfirmation(completed.token);
    assert.equal(final.state.cards.otranto, 1);
    assert.equal(trade.getResumableReceiptTrade(), null);
    assert.equal(trade.getResumableCompletionAckTrade()?.token, final.token);

    useDom(domA);
    trade.finishSenderTrade(final.ack.offerId);
    assert.equal(trade.getResumableOutgoingCardTrade(), null);
  } finally {
    await server.close();
    domA.window.close();
    domB.window.close();
    restoreGlobals(prior);
  }
});


test("concurrent sender confirmation never debits the same duplicate twice", async () => {
  const domA = new JSDOM("", { url: "https://sender-concurrent.invalid/" });
  const domB = new JSDOM("", { url: "https://receiver-concurrent.invalid/" });
  const prior = snapshotGlobals();
  useDom(domA);
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });

  try {
    const trade = await server.ssrLoadModule("/src/features/bonus/cardTrade.ts");
    trade.recordGameVictoryCard("otranto", false);
    trade.recordGameVictoryCard("otranto", true);
    const offer = await trade.createCardOffer("otranto", "lecce");

    useDom(domB);
    trade.recordGameVictoryCard("lecce", false);
    trade.recordGameVictoryCard("lecce", true);
    const accepted = await trade.acceptCardOffer(offer.token);

    useDom(domA);
    const results = await Promise.allSettled([
      trade.completeCardReceipt(accepted.token),
      trade.completeCardReceipt(accepted.token),
    ]);

    assert.ok(results.some((result) => result.status === "fulfilled"));
    assert.equal(trade.readCardInventory().cards.otranto, 1);
    assert.ok(trade.getResumableOutgoingCardTrade()?.token);
  } finally {
    await server.close();
    domA.window.close();
    domB.window.close();
    restoreGlobals(prior);
  }
});


test("storage failure while finalizing leaves the transferable duplicate intact", async () => {
  const domA = new JSDOM("", { url: "https://sender-storage.invalid/" });
  const domB = new JSDOM("", { url: "https://receiver-storage.invalid/" });
  const prior = snapshotGlobals();
  useDom(domA);
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  const originalSetItem = domA.window.Storage.prototype.setItem;

  try {
    const trade = await server.ssrLoadModule("/src/features/bonus/cardTrade.ts");
    trade.recordGameVictoryCard("otranto", false);
    trade.recordGameVictoryCard("otranto", true);
    const offer = await trade.createCardOffer("otranto", "lecce");

    useDom(domB);
    trade.recordGameVictoryCard("lecce", false);
    trade.recordGameVictoryCard("lecce", true);
    const accepted = await trade.acceptCardOffer(offer.token);

    useDom(domA);
    domA.window.Storage.prototype.setItem = function setItem(key, value) {
      if (key === "hirundu_card_inventory_v1") throw Error("quota");
      return originalSetItem.call(this, key, value);
    };

    await assert.rejects(() => trade.completeCardReceipt(accepted.token), /quota/);
    assert.equal(trade.readCardInventory().cards.otranto, 2);
    const resumable = trade.getResumableOutgoingCardTrade();
    assert.equal(resumable?.kind, "offer");
    assert.equal(resumable?.token, offer.token);
  } finally {
    domA.window.Storage.prototype.setItem = originalSetItem;
    await server.close();
    domA.window.close();
    domB.window.close();
    restoreGlobals(prior);
  }
});


test("trade page restores pending QR state and finishes the normal barter after two scans", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../src/routes/CardTradePage.tsx", import.meta.url), "utf8")
  );
  assert.match(source, /getResumableOutgoingCardTrade\(\)/);
  assert.match(source, /getResumableReceiptTrade\(\)/);
  assert.match(source, /getResumableCompletionAckTrade\(\)/);
  assert.match(source, /finishSenderTrade\(result\.confirmation\.offerId\)/);
  assert.match(source, /finishReceiverAfterReceipt\(receiptOfferId\)/);
  assert.match(source, /finishReceiverTrade\(completionOfferId\)/);
  assert.match(source, /duplicateRule/);
  assert.match(source, /noDuplicate/);
  assert.doesNotMatch(source, />3\. /);
  assert.match(source, /finishAfterSenderScan/);
  assert.match(source, /2 scans|2 scansions|2 escaneos/);
  assert.match(source, /The signed receipt is already persisted and will be restored on reload/);
  assert.match(source, /myCards/);
});


test("expired debited confirmation stays explicit and is never auto-refunded", async () => {
  const domA = new JSDOM("", { url: "https://sender-expired-final.invalid/" });
  const domB = new JSDOM("", { url: "https://receiver-expired-final.invalid/" });
  const prior = snapshotGlobals();
  const realNow = Date.now;
  const base = realNow();
  useDom(domA);
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });

  try {
    const trade = await server.ssrLoadModule("/src/features/bonus/cardTrade.ts");
    Date.now = () => base;

    trade.recordGameVictoryCard("otranto", false);
    trade.recordGameVictoryCard("otranto", true);
    const offer = await trade.createCardOffer("otranto", "lecce");

    useDom(domB);
    trade.recordGameVictoryCard("lecce", false);
    trade.recordGameVictoryCard("lecce", true);
    const accepted = await trade.acceptCardOffer(offer.token);

    useDom(domA);
    const completed = await trade.completeCardReceipt(accepted.token);
    assert.equal(trade.readCardInventory().cards.otranto, 1);

    Date.now = () => base + 16 * 60 * 1000;
    assert.equal(trade.getResumableOutgoingCardTrade(), null);
    assert.equal(trade.hasUnresolvedExpiredOutgoingCardTrade(), true);
    assert.equal(trade.readCardInventory().cards.otranto, 1);

    useDom(domB);
    await assert.rejects(() => trade.finalizeCardConfirmation(completed.token));
    assert.equal(trade.readCardInventory().cards.otranto ?? 0, 0);
  } finally {
    Date.now = realNow;
    await server.close();
    domA.window.close();
    domB.window.close();
    restoreGlobals(prior);
  }
});
