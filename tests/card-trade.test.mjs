import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createServer } from "vite";

const GLOBAL_KEYS = ["window", "document", "localStorage", "sessionStorage", "CustomEvent", "Event"];

function snapshotGlobals() {
  const prior = {};
  for (const key of GLOBAL_KEYS) prior[key] = Object.getOwnPropertyDescriptor(globalThis, key);
  return prior;
}

function useDom(dom) {
  for (const key of GLOBAL_KEYS) {
    Object.defineProperty(globalThis, key, {
      value: key === "window" ? dom.window : key === "document" ? dom.window.document : dom.window[key],
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

    inventory = trade.recordGameVictoryCard("otranto", true);
    assert.equal(inventory.cards.otranto, 2);
    assert.equal(inventory.origins.otranto.game, 2);

    const offer = await trade.createCardOffer("otranto");
    assert.ok(offer.token.startsWith("HIRUNDU-CARD-2."));
    assert.ok(offer.offer.expiresAt - offer.offer.issuedAt <= 15 * 60 * 1000);
  } finally {
    await server.close();
    dom.window.close();
    restoreGlobals(prior);
  }
});

test("three-step QR trade credits only the receiver confirmed by the sender", async () => {
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
    const offer = await trade.createCardOffer("otranto");
    assert.equal(trade.readCardInventory().cards.otranto, 2);

    useDom(domB);
    const acceptedB = await trade.acceptCardOffer(offer.token);
    let receiverB = trade.readCardInventory();
    assert.equal(receiverB.cards.otranto ?? 0, 0);
    assert.ok(receiverB.received[offer.offer.id]);

    useDom(domC);
    const acceptedC = await trade.acceptCardOffer(offer.token);
    let receiverC = trade.readCardInventory();
    assert.equal(receiverC.cards.otranto ?? 0, 0);
    assert.ok(receiverC.received[offer.offer.id]);

    useDom(domA);
    const completed = await trade.completeCardReceipt(acceptedB.token);
    const sender = trade.readCardInventory();
    assert.equal(sender.cards.otranto, 1);
    assert.equal(sender.origins.otranto.game, 1);
    await assert.rejects(() => trade.completeCardReceipt(acceptedC.token));

    useDom(domC);
    await assert.rejects(() => trade.finalizeCardConfirmation(completed.token));
    receiverC = trade.readCardInventory();
    assert.equal(receiverC.cards.otranto ?? 0, 0);

    useDom(domB);
    const final = await trade.finalizeCardConfirmation(completed.token);
    receiverB = final.state;
    assert.equal(receiverB.cards.otranto, 1);
    assert.equal(receiverB.origins.otranto.exchange, 1);
    await assert.rejects(() => trade.finalizeCardConfirmation(completed.token));
  } finally {
    await server.close();
    domA.window.close();
    domB.window.close();
    domC.window.close();
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
    const offer = await trade.createCardOffer("otranto");

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

test("trade page renders generated offer QR directly under the selected duplicate", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../src/routes/CardTradePage.tsx", import.meta.url), "utf8")
  );
  assert.match(source, /qrCard === key \? renderActiveQr\(\) : null/);
  assert.match(source, /await createCardOffer\(card\)/);
  assert.match(source, /remainingLabel/);
  assert.match(source, /Generating QR|Génération du QR/);
});


test("modern browser path stores a non-exportable private trade key in IndexedDB", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../src/features/bonus/cardTrade.ts", import.meta.url), "utf8")
  );
  assert.match(source, /indexedDB\.open\(IDENTITY_DB/);
  assert.match(source, /false,\s*\["sign"\]/);
  assert.match(source, /privateKey\.extractable === false/);
});



test("interrupted sender confirmation is resumable without a second debit", async () => {
  const domA = new JSDOM("", { url: "https://sender-resume.invalid/" });
  const domB = new JSDOM("", { url: "https://receiver-resume.invalid/" });
  const prior = snapshotGlobals();
  useDom(domA);
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });

  try {
    const trade = await server.ssrLoadModule("/src/features/bonus/cardTrade.ts");
    trade.recordGameVictoryCard("otranto", false);
    trade.recordGameVictoryCard("otranto", true);
    const offer = await trade.createCardOffer("otranto");

    useDom(domB);
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
    const offer = await trade.createCardOffer("otranto");

    useDom(domB);
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
    const offer = await trade.createCardOffer("otranto");

    useDom(domB);
    const accepted = await trade.acceptCardOffer(offer.token);

    useDom(domA);
    domA.window.Storage.prototype.setItem = function setItem(key, value) {
      if (key === "hirundu_card_inventory_v1") throw Error("quota");
      return originalSetItem.call(this, key, value);
    };

    await assert.rejects(() => trade.completeCardReceipt(accepted.token), /quota/);
    assert.equal(trade.readCardInventory().cards.otranto, 2);
    assert.equal(trade.getResumableOutgoingCardTrade(), null);
  } finally {
    domA.window.Storage.prototype.setItem = originalSetItem;
    await server.close();
    domA.window.close();
    domB.window.close();
    restoreGlobals(prior);
  }
});


test("trade page restores persisted receipt and final confirmation QR after reload", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../src/routes/CardTradePage.tsx", import.meta.url), "utf8")
  );
  assert.match(source, /getResumableOutgoingCardTrade\(\)/);
  assert.match(source, /getResumableReceiptTrade\(\)/);
  assert.match(source, /The signed confirmation is already persisted and will be restored on reload/);
  assert.match(source, /The signed receipt is already persisted and will be restored on reload/);
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
    const offer = await trade.createCardOffer("otranto");

    useDom(domB);
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
