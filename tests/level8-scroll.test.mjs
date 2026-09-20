import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('level 8 flight background never uses mirrored tiling', async () => {
  const src = await readFile(new URL('../public/level8-flight/game.js', import.meta.url), 'utf8');
  assert.match(src, /function drawLevel8Coast/);
  assert.doesNotMatch(src, /scale\(1,-1\)/);
  assert.doesNotMatch(src, /Math\.abs\(i\)%2/);
  assert.match(src, /scenicOffset/);
  assert.match(src, /crossfade|fadeZone/i);
});

test('flight backgrounds remain non-distorted across levels 4, 6 and 8', async () => {
  const level4 = await readFile(new URL('../public/level4-flight/game.js', import.meta.url), 'utf8');
  const level6 = await readFile(new URL('../public/level6-flight/game.js', import.meta.url), 'utf8');
  const level8 = await readFile(new URL('../public/level8-flight/game.js', import.meta.url), 'utf8');

  assert.match(level4, /function drawScrollingCoast/);
  assert.match(level6, /function drawScrollingCoast/);
  assert.doesNotMatch(level4, /ctx\.scale\(1,-1\)/);
  assert.doesNotMatch(level6, /ctx\.scale\(1,-1\)/);

  assert.match(level8, /function drawLevel8Coast/);
  assert.match(level8, /crossfade|fadeZone/i);
  assert.doesNotMatch(level8, /ctx\.scale\(1,-1\)/);
});
