import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

test('V9.2 mobile game flow enforces portrait hunt and landscape battle intro', async () => {
  const dom = new JSDOM('<!doctype html><body></body>', {
    url: 'https://example.test/Hirundu1.1-/?lang=fr',
    pretendToBeVisual: true,
  });
  const w = dom.window;

  for (const key of ['window','document','localStorage','location','navigator','Event','CustomEvent','HTMLElement']) {
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

    const start = w.document.getElementById('__battle_start_btn');
    assert.equal(start.disabled, true, 'portrait mobile blocks battle start');
    assert.equal(flow.getGameFlowState().phase, 'battle-intro');
    start.click();
    assert.equal(proceeded, 0, 'battle cannot start while still portrait');

    w.innerWidth = 844;
    w.innerHeight = 390;
    w.dispatchEvent(new w.Event('resize'));
    assert.equal(start.disabled, false, 'landscape unlocks battle start');

    start.click();
    assert.equal(proceeded, 1);
    assert.equal(flow.getGameFlowState().phase, 'battle');

    cleanup?.();
    flow.clearGameFlow();
  } finally {
    await server.close();
    dom.window.close();
  }
});


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
