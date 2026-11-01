import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('level 8 obstacles retain visible collision footprints without sprite or emoji support', async () => {
  const source = await readFile(new URL('../public/level8-flight/game.js', import.meta.url), 'utf8');
  assert.match(source, /for\(const o of S\.obstacles\)\{\s*\/\/ Render a high-contrast collision footprint/);
  assert.match(source, /ctx\.ellipse\(o\.x,o\.y,Math\.max\(12,o\.w\/2\)/);
  assert.match(source, /ctx\.strokeStyle=o\.hit\?/);
  assert.match(source, /if\(trashKinds\.includes\(o\.kind\)\)/);
});
