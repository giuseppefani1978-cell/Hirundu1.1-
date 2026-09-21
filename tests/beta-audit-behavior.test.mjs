import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

async function withApp(run) {
  const dom = new JSDOM('', { url: 'https://example.test/Hirundu1.1-/' });
  for (const key of ['window', 'document', 'localStorage', 'location', 'navigator', 'CustomEvent', 'StorageEvent']) {
    Object.defineProperty(globalThis, key, { value: key === 'window' ? dom.window : dom.window[key], configurable: true });
  }
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try { await run(server); } finally { await server.close(); dom.window.close(); }
}

test('C01/C02 reset removes every level and bonus flag without resurrecting them; records and settings survive', async () => {
  await withApp(async (server) => {
    const store = await server.ssrLoadModule('/src/features/bonus/bonusStorage.ts');
    const durable = await server.ssrLoadModule('/src/progressStorage.js');
    const keys = ['otranto','gallipoli','lecce','adriatico','capo','arneo','nardo','messapia','itria'];
    for (let id = 1; id <= 9; id++) {
      for (const suffix of ['won','won_at','unlocked','unlocked_at']) localStorage.setItem(`level${id}_${suffix}`, 'true');
      localStorage.setItem(`region${id}_hunt`, '10');
    }
    for (const key of keys) {
      for (const suffix of ['unlocked','seen']) {
        localStorage.setItem(`bonus_${key}_${suffix}`, 'true');
        localStorage.setItem(`${key}_bonus_${suffix}`, 'true');
      }
      store.unlockBonus(key);
    }
    localStorage.setItem('__lang__', 'it');
    localStorage.setItem('salento_hof_v3', '[{"score":123}]');
    localStorage.setItem('hirundu_flight_handoff_v1', '{"level":8}');
    durable.syncDurableProgress();
    store.resetBonusProgress();
    durable.initializeDurableProgress();
    assert.equal(store.getResumeTarget().id, 1);
    assert.deepEqual(store.getUnlockedKeys(), []);
    assert.deepEqual(durable.readDurableProgress().completedLevels, []);
    assert.equal(durable.readDurableProgress().highestUnlockedLevel, 1);
    assert.deepEqual(durable.readDurableProgress().discoveries, []);
    assert.deepEqual(durable.readDurableProgress().huntProgress, {});
    assert.equal(localStorage.getItem('hirundu_flight_handoff_v1'), null);
    assert.equal(localStorage.getItem('__lang__'), 'it');
    assert.equal(localStorage.getItem('salento_hof_v3'), '[{"score":123}]');
  });
});

test('C02 existing explicit regional unlock flags are honored', async () => {
  await withApp(async (server) => {
    const store = await server.ssrLoadModule('/src/features/bonus/bonusStorage.ts');
    localStorage.setItem('level8_unlocked','true');
    assert.equal(store.getProgressList().find((level) => level.id === 8).unlocked, true);
  });
});

test('C10 malformed encoded badges become unknown QR payloads instead of throwing', async () => {
  await withApp(async (server) => {
    const { parseQrPayload } = await server.ssrLoadModule('/src/features/qr/services/qr.ts');
    for (const raw of ['hirundu://badge/%', 'hirundu://badge/%E0%A4%A', 'unrecognized', 'hirundu://open//poi/unknown/realmap', 'hirundu://open//https://example.test']) {
      assert.equal(parseQrPayload(raw).type, 'unknown');
    }
    assert.deepEqual(parseQrPayload('hirundu://badge/Caf%C3%A9'), { type: 'badge', name: 'Café' });
    assert.equal(parseQrPayload('hirundu://otranto/map').type, 'open-otranto-map');
    assert.deepEqual(parseQrPayload('hirundu://open//poi/otranto/realmap'), { type: 'open-any', path: '/poi/otranto/realmap' });
  });
});

test('C12 legacy worker leaves other applications caches and tabs intact', async () => {
  const events = {};
  const deleted = [], navigated = [];
  const clients = ['https://example.test/Hirundu1.1-/', 'https://example.test/OtherApp/', 'https://other.test/Hirundu1.1-/'];
  const code = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
  vm.runInNewContext(code, {
    URL,
    caches: { keys: async () => ['hirundu-v1', 'aracne-v2', 'other-app-v1'], delete: async (key) => deleted.push(key) },
    self: {
      addEventListener: (name, handler) => { events[name] = handler; },
      registration: { scope: 'https://example.test/Hirundu1.1-/', unregister: async () => true },
      clients: { matchAll: async () => clients.map((url) => ({ url, navigate: async () => { navigated.push(url); } })) },
    },
  });
  let activation;
  events.activate({ waitUntil: (promise) => { activation = promise; } });
  await activation;
  assert.deepEqual(deleted, ['hirundu-v1', 'aracne-v2']);
  assert.deepEqual(navigated, [clients[0]]);
});
