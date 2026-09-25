import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createServer } from "vite";

test("QR collection keeps card origins separate from real-world passport validation", async () => {
  const dom = new JSDOM("", { url: "https://test.invalid/" });
  const prior = {};
  for (const key of ["window", "document", "localStorage", "sessionStorage", "CustomEvent", "Event"]) {
    prior[key] = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, {
      value: key === "window" ? dom.window : key === "document" ? dom.window.document : dom.window[key],
      configurable: true,
      writable: true,
    });
  }
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  try {
    const trade = await server.ssrLoadModule("/src/features/bonus/cardTrade.ts");
    const passport = await server.ssrLoadModule("/src/features/qr/passport/passportStorage.ts");
    const partner = trade.FIELD_CARD_SCENARIOS.find((entry) => entry.kind === "partner");
    const physical = trade.FIELD_CARD_SCENARIOS.find((entry) => entry.kind === "physical");

    const partnerResult = trade.redeemFieldCardQr(partner.token);
    assert.equal(partnerResult.state.cards.otranto, 1);
    assert.equal(partnerResult.state.origins.otranto.partner, 1);
    assert.deepEqual(passport.readPassportStorage().qrValidated.otranto, ["poi_cathedral"]);

    const repeated = trade.redeemFieldCardQr(partner.token);
    assert.equal(repeated.alreadyRedeemed, true);
    assert.equal(repeated.state.cards.otranto, 1);

    const physicalResult = trade.redeemFieldCardQr(physical.token);
    assert.equal(physicalResult.state.cards.lecce, 1);
    assert.equal(physicalResult.state.origins.lecce.physical, 1);
    assert.equal(passport.readPassportStorage().qrValidated.lecce, undefined);
  } finally {
    await server.close();
    dom.window.close();
    for (const [key, value] of Object.entries(prior)) {
      if (value) Object.defineProperty(globalThis, key, value);
      else delete globalThis[key];
    }
  }
});

test("direct QR trade requires confirmation and records exchange provenance without a visit", async () => {
  const domA = new JSDOM("", { url: "https://sender.invalid/" });
  const domB = new JSDOM("", { url: "https://receiver.invalid/" });
  const prior = {};
  for (const key of ["window", "document", "localStorage", "sessionStorage", "CustomEvent", "Event"]) prior[key] = Object.getOwnPropertyDescriptor(globalThis, key);
  const use = (dom) => {
    for (const key of ["window", "document", "localStorage", "sessionStorage", "CustomEvent", "Event"]) {
      Object.defineProperty(globalThis, key, {
        value: key === "window" ? dom.window : key === "document" ? dom.window.document : dom.window[key],
        configurable: true,
        writable: true,
      });
    }
  };
  use(domA);
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  try {
    const trade = await server.ssrLoadModule("/src/features/bonus/cardTrade.ts");
    assert.throws(() => trade.createCardOffer("otranto"));
    trade.addTestDuplicate("otranto");
    const offer = trade.createCardOffer("otranto");
    assert.equal(trade.readCardInventory().cards.otranto, 2);

    use(domB);
    const accepted = trade.acceptCardOffer(offer.token);
    const received = trade.readCardInventory();
    assert.equal(received.cards.otranto, 1);
    assert.equal(received.origins.otranto.exchange, 1);
    assert.equal(localStorage.getItem("salentino_passport_v1"), null);
    assert.throws(() => trade.acceptCardOffer(offer.token));

    use(domA);
    const completed = trade.completeCardReceipt(accepted.token);
    assert.equal(completed.state.cards.otranto, 1);
    assert.throws(() => trade.completeCardReceipt(accepted.token));
  } finally {
    await server.close();
    domA.window.close();
    domB.window.close();
    for (const [key, value] of Object.entries(prior)) {
      if (value) Object.defineProperty(globalThis, key, value);
      else delete globalThis[key];
    }
  }
});
