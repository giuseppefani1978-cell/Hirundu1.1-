import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('C05 PWA does not lock the app to portrait', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.orientation, 'any');
});

test('C05 active classic gameplay pauses on blur or hidden document', async () => {
  const flow = await readFile(new URL('../src/game_flow.js', import.meta.url), 'utf8');
  assert.match(flow, /installInterruptionWatch/);
  assert.match(flow, /window\.addEventListener\('blur', pauseForInterruption\)/);
  assert.match(flow, /document\.addEventListener\('visibilitychange'/);
  assert.match(flow, /setGamePaused\(true\)/);
});

test('C05 flight controls clear keyboard and touch input before pausing', async () => {
  for (const level of [4, 6, 8]) {
    const src = await readFile(new URL('../public/level' + level + '-flight/game.js', import.meta.url), 'utf8');
    assert.match(src, /const suspendFlight=\(\)=>\{keys=\{\};resetPad\(\);if\(S\.mode==='playing'\)pause\(\);\}/);
    assert.match(src, /visibilitychange/);
  }
});
