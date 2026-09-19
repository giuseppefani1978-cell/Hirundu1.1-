import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('level 9 opts into standardized classic framing only', async () => {
  const l9 = await readFile(new URL('../src/levels/level9/level9_game.js', import.meta.url), 'utf8');
  assert.match(l9, /framing:\s*'standard-classic'/);

  for (const level of [4, 6, 8]) {
    const src = await readFile(new URL(`../src/levels/level${level}/level${level}_game.js`, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /framing:\s*'standard-classic'/);
  }
});

test('shared classic engine keeps legacy framing unless explicitly overridden', async () => {
  const src = await readFile(new URL('../src/levels/level3/level3_game.js', import.meta.url), 'utf8');
  assert.match(src, /regional\?\.framing === 'standard-classic'/);
  assert.match(src, /const scale = Math\.min\(baseScale \* 1\.04, availW \/ mapW\)/);
  assert.match(src, /computeMapViewport\(W, H, mw, mh, Boolean\(regional\)\)/);
});
