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

test('level 8 scrolling fix stays isolated from levels 4 and 6', async () => {
  for (const level of [4, 6]) {
    const src = await readFile(new URL(`../public/level${level}-flight/game.js`, import.meta.url), 'utf8');
    assert.match(src, /scale\(1,-1\)/);
  }
});
