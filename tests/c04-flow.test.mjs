import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('C04 every level victory is routed through discoveries before the next hunt', async () => {
  const page = await readFile(new URL('../src/routes/LegacyLevelPage.tsx', import.meta.url), 'utf8');
  const start = page.indexOf('const handleWin');
  const end = page.indexOf('document.addEventListener(event, handleWin)', start);
  const handler = page.slice(start, end);
  assert.match(handler, /markLevelWin\(level\)/);
  assert.match(handler, /unlockBonus\(bonusKey/);
  assert.match(handler, /navigate\(`\/bonus\/\$\{bonusKey\}`/);
  assert.match(handler, /nextLevel: next \?\? null/);
  assert.doesNotMatch(handler, /navigate\(`\/level\/\$\{next\}`/);
});

test('C04 flight handoff keeps provisions and defeat return', async () => {
  for (const level of [4, 6, 8]) {
    const flight = await readFile(new URL('../public/level' + level + '-flight/game.js', import.meta.url), 'utf8');
    assert.match(flight, /hirundu_flight_handoff_v1/);
    assert.match(flight, /rustico:S\.rustico\|0/);
    assert.match(flight, /caffe:S\.coffee\|0/);
    assert.match(flight, /stars:S\.round\|0/);
  }
  const regional = await readFile(new URL('../src/levels/level3/level3_game.js', import.meta.url), 'utf8');
  assert.match(regional, /applyFlightHandoff/);
  assert.match(regional, /window\.location\.assign\(flightReturnUrl\)/);
});
