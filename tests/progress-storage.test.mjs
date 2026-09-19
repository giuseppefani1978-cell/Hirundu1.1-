import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

function expose(dom) {
  const w = dom.window;
  for (const key of ['window','document','localStorage','location','navigator','CustomEvent','StorageEvent','Event']) {
    Object.defineProperty(globalThis, key, {
      value: key === 'window' ? w : w[key],
      configurable: true,
      writable: true,
    });
  }
}

test('C01 durable progress migrates legacy data and restores a missing legacy key', async () => {
  const dom = new JSDOM('', { url: 'https://example.test/Hirundu1.1-/?lang=it' });
  expose(dom);
  localStorage.setItem('__lang__', 'it');
  localStorage.setItem('hirundu_music_v1', 'off');
  localStorage.setItem('player_name', 'Ada');
  localStorage.setItem('level1_won', 'true');
  localStorage.setItem('bonus_unlocked_v1', JSON.stringify({ otranto: true }));
  localStorage.setItem('region4_hunt', '5');
  localStorage.setItem('salentino_passport_v1', JSON.stringify({ pois: { otranto: ['poi-1'] } }));
  localStorage.setItem('salento_hof_v1', JSON.stringify([{ name: 'Ada', score: 42 }]));

  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const progress = await server.ssrLoadModule('/src/progressStorage.js');
    const snapshot = progress.initializeDurableProgress();
    assert.deepEqual(snapshot.completedLevels, [1]);
    assert.equal(snapshot.highestUnlockedLevel, 2);
    assert.ok(snapshot.discoveries.includes('otranto'));
    assert.equal(snapshot.huntProgress[4], 5);
    assert.equal(snapshot.values.__lang__, 'it');
    assert.equal(snapshot.values.hirundu_music_v1, 'off');
    assert.ok(snapshot.values.salentino_passport_v1);
    assert.ok(snapshot.values.salento_hof_v1);

    localStorage.removeItem('level1_won');
    localStorage.removeItem('salentino_passport_v1');
    progress.initializeDurableProgress();
    assert.equal(localStorage.getItem('level1_won'), 'true');
    assert.ok(localStorage.getItem('salentino_passport_v1'));
  } finally {
    await server.close();
    dom.window.close();
  }
});

test('C01 intentional new-game reset is not undone by durable recovery', async () => {
  const dom = new JSDOM('', { url: 'https://example.test/Hirundu1.1-/' });
  expose(dom);
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const store = await server.ssrLoadModule('/src/features/bonus/bonusStorage.ts');
    const progress = await server.ssrLoadModule('/src/progressStorage.js');

    store.markLevelWin(1);
    localStorage.setItem('salentino_passport_v1', JSON.stringify({ pois: { otranto: ['poi-1'] } }));
    progress.syncDurableProgress();

    store.resetBonusProgress();
    assert.equal(localStorage.getItem('level1_won'), null);
    assert.equal(localStorage.getItem('salentino_passport_v1'), null);

    progress.initializeDurableProgress();
    assert.equal(localStorage.getItem('level1_won'), null);
    assert.equal(localStorage.getItem('salentino_passport_v1'), null);
  } finally {
    await server.close();
    dom.window.close();
  }
});
