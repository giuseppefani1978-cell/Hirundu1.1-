import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

for (const rotation of ['automatic', 'manual', 'unsupported']) {
test(`mobile battle rotation: ${rotation} preserves the landscape gate`, async () => {
  const dom = new JSDOM('<!doctype html><body></body>', {
    url: 'https://example.test/Hirundu1.1-/?lang=fr',
    pretendToBeVisual: true,
  });
  const w = dom.window;

  for (const key of ['window','document','localStorage','location','navigator','screen','Event','CustomEvent','HTMLElement']) {
    Object.defineProperty(globalThis, key, {
      value: key === 'window' ? w : w[key],
      configurable: true,
      writable: true,
    });
  }

  Object.defineProperty(w.navigator, 'maxTouchPoints', { value: 5, configurable: true });
  w.matchMedia = (query) => ({
    matches: query.includes('pointer: coarse'),
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return true; },
  });

  Object.defineProperty(w, 'innerWidth', { value: 844, writable: true, configurable: true });
  Object.defineProperty(w, 'innerHeight', { value: 390, writable: true, configurable: true });

  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const flow = await server.ssrLoadModule('/src/game_flow.js');
    const { startBattleIntro } = await server.ssrLoadModule('/src/battle_intro.js');

    flow.setGameFlowPhase(flow.FLOW_PHASES.HUNT, { level: 7 });
    assert.equal(flow.getGameFlowState().phase, 'hunt');
    assert.equal(flow.getGameFlowState().requiredOrientation, 'portrait');
    assert.equal(w.document.getElementById('__hunt_orientation__').style.display, 'flex');

    w.innerWidth = 390;
    w.innerHeight = 844;
    w.dispatchEvent(new w.Event('resize'));
    assert.equal(w.document.getElementById('__hunt_orientation__').style.display, 'none');

    let proceeded = 0;
    const cleanup = startBattleIntro({
      level: 7,
      boss: 'Macina',
      onProceed: () => { proceeded += 1; },
    });

    const calls = [];
    const rotate = () => {
      w.innerWidth = 844;
      w.innerHeight = 390;
      w.dispatchEvent(new w.Event('resize'));
    };
    if (rotation !== 'unsupported') {
      w.document.documentElement.requestFullscreen = async () => { calls.push('fullscreen'); };
      Object.defineProperty(w.screen, 'orientation', { configurable: true, value: {
        lock: async (orientation) => {
          calls.push(orientation);
          if (rotation === 'manual') throw new Error('Lock refused');
          rotate();
        },
      } });
    }
    const waitUntil = async (condition) => {
      const deadline = Date.now() + 2500;
      while (!condition()) {
        assert.ok(Date.now() < deadline, 'rotation request completes');
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    };
    const start = w.document.getElementById('__battle_start_btn');
    assert.equal(start.disabled, false, 'portrait allows a user gesture to request rotation');
    assert.equal(flow.getGameFlowState().phase, 'battle-intro');
    start.click();
    assert.equal(proceeded, 0, 'battle cannot start while still portrait');
    assert.equal(start.disabled, true, 'pending rotation prevents duplicate requests');
    start.click();

    if (rotation === 'automatic') {
      await waitUntil(() => proceeded === 1);
      assert.deepEqual(calls, ['fullscreen', 'landscape']);
      assert.equal(w.__HIRUNDU_BATTLE_ORIENTATION_LOCKED__, true);
    } else {
      await waitUntil(() => !start.disabled);
      assert.equal(proceeded, 0, 'refused or unavailable rotation does not bypass the gate');
      assert.equal(flow.getGameFlowState().phase, 'battle-intro');
      assert.deepEqual(calls, rotation === 'manual' ? ['fullscreen', 'landscape'] : []);
      rotate();
      await waitUntil(() => proceeded === 1);
    }
    start.click();
    assert.equal(proceeded, 1, 'battle starts exactly once after landscape is ready');
    assert.equal(flow.getGameFlowState().phase, 'battle');

    cleanup?.();
    flow.clearGameFlow();
  } finally {
    await server.close();
    dom.window.close();
  }
});

}

test('V9.3 pause state is explicit and reversible', async () => {
  const dom = new JSDOM('<!doctype html><body></body>', {
    url: 'https://example.test/Hirundu1.1-/?lang=fr',
    pretendToBeVisual: true,
  });
  const w = dom.window;
  for (const key of ['window','document','localStorage','sessionStorage','location','navigator','Event','CustomEvent','HTMLElement']) {
    Object.defineProperty(globalThis, key, {
      value: key === 'window' ? w : w[key],
      configurable: true,
      writable: true,
    });
  }
  w.matchMedia = () => ({ matches:false, addEventListener(){}, removeEventListener(){} });
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const flow = await server.ssrLoadModule('/src/game_flow.js');
    flow.setGameFlowPhase(flow.FLOW_PHASES.HUNT, { level: 4 });
    assert.equal(flow.isGamePaused(), false);
    flow.setGamePaused(true);
    assert.equal(flow.isGamePaused(), true);
    assert.equal(w.document.body.classList.contains('game-paused'), true);
    flow.setGamePaused(false);
    assert.equal(flow.isGamePaused(), false);
    assert.equal(w.document.body.classList.contains('game-paused'), false);
    flow.clearGameFlow();
  } finally {
    await server.close();
    dom.window.close();
  }
});
