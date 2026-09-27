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

    const offer = trade.createCardOffer("otranto");
    assert.ok(offer.token.startsWith("HIRUNDU-CARD-1."));
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
    const offer = trade.createCardOffer("otranto");
    assert.equal(trade.readCardInventory().cards.otranto, 2);

    useDom(domB);
    const acceptedB = trade.acceptCardOffer(offer.token);
    let receiverB = trade.readCardInventory();
    assert.equal(receiverB.cards.otranto ?? 0, 0);
    assert.ok(receiverB.received[offer.offer.id]);

    useDom(domC);
    const acceptedC = trade.acceptCardOffer(offer.token);
    let receiverC = trade.readCardInventory();
    assert.equal(receiverC.cards.otranto ?? 0, 0);
    assert.ok(receiverC.received[offer.offer.id]);

    useDom(domA);
    const completed = trade.completeCardReceipt(acceptedB.token);
    const sender = trade.readCardInventory();
    assert.equal(sender.cards.otranto, 1);
    assert.equal(sender.origins.otranto.game, 1);
    assert.throws(() => trade.completeCardReceipt(acceptedC.token));

    useDom(domC);
    assert.throws(() => trade.finalizeCardConfirmation(completed.token));
    receiverC = trade.readCardInventory();
    assert.equal(receiverC.cards.otranto ?? 0, 0);

    useDom(domB);
    const final = trade.finalizeCardConfirmation(completed.token);
    receiverB = final.state;
    assert.equal(receiverB.cards.otranto, 1);
    assert.equal(receiverB.origins.otranto.exchange, 1);
    assert.throws(() => trade.finalizeCardConfirmation(completed.token));
  } finally {
    await server.close();
    domA.window.close();
    domB.window.close();
    domC.window.close();
    restoreGlobals(prior);
  }
});
