import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

for (const level of [4, 6, 8]) {
  test(`flight level ${level} is integrated with main game state`, async () => {
    const js = await readFile(new URL(`../public/level${level}-flight/game.js`, import.meta.url), 'utf8');
    const html = await readFile(new URL(`../public/level${level}-flight/index.html`, import.meta.url), 'utf8');

    assert.match(js, /localStorage\.getItem\('__lang__'\)/);
    assert.match(js, /localStorage\.setItem\('__lang__',lang\)/);
    assert.match(js, /hirundu_flight_handoff_v1/);
    assert.match(js, /hunt_loop\.wav/);
    assert.match(js, new RegExp(`#\\/level/${level}\\?test=battle&from=flight`));
    assert.match(js, /rustico:S\.rustico\|0/);
    assert.match(js, /caffe:S\.coffee\|0/);
    assert.match(html, /id="pauseLangRow"/);
    assert.match(html, /id="musicToggle"/);
  });
}

test('regional battle consumes flight handoff and returns to flight hunt after defeat', async () => {
  const src = await readFile(new URL('../src/levels/level3/level3_game.js', import.meta.url), 'utf8');
  assert.match(src, /hirundu_flight_handoff_v1/);
  assert.match(src, /applyFlightHandoff/);
  assert.match(src, /pickedCounts = \{/);
  assert.match(src, /leavesPicked = Math\.max/);
  assert.match(src, /window\.location\.assign\(flightReturnUrl\)/);
});

test('level 8 flight no longer hardcodes the production host for battle handoff', async () => {
  const src = await readFile(new URL('../public/level8-flight/game.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /https:\/\/giuseppefani1978-cell\.github\.io\/Hirundu1\.1-/);
  assert.doesNotMatch(src, /sameApp/);
});
