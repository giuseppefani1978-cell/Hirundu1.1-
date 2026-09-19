import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('C06 keeps approved classic framing families distinct', async () => {
  const level1 = await readFile(new URL('../src/game.js', import.meta.url), 'utf8');
  const level2 = await readFile(new URL('../src/levels/level2/level2_game.js', import.meta.url), 'utf8');
  const level3Engine = await readFile(new URL('../src/levels/level3/level3_game.js', import.meta.url), 'utf8');
  const level9 = await readFile(new URL('../src/levels/level9/level9_game.js', import.meta.url), 'utf8');

  assert.match(level1, /MAP_ZOOM:\s*1\b/);
  assert.doesNotMatch(level1, /framing:\s*['"]standard-classic['"]/);
  assert.match(level2, /MAP_ZOOM:\s*1\.04/);
  assert.match(level2, /Math\.min\(baseScale \* UI_CONST\.MAP_ZOOM, availW \/ mapW\)/);
  assert.match(level9, /framing:\s*['"]standard-classic['"]/);
  assert.match(level3Engine, /function computeStandardClassicViewport/);
});

test('C06 classic target validation remains question-gated and requires fresh entry', async () => {
  const validation = await readFile(new URL('../src/legacy/huntValidation.js', import.meta.url), 'utf8');
  const level2 = await readFile(new URL('../src/levels/level2/level2_game.js', import.meta.url), 'utf8');
  const regional = await readFile(new URL('../src/levels/level3/level3_game.js', import.meta.url), 'utf8');
  assert.match(validation, /if \(!questionReady \|\| !targetEntryReady\) return false/);
  assert.match(level2, /distanceToTarget > targetRadiusPx \* 1\.35/);
  assert.match(regional, /distanceToTarget > targetRadiusPx \* 1\.35/);
});

test('C06 level 8 long-scroll seam correction stays isolated', async () => {
  const level8 = await readFile(new URL('../public/level8-flight/game.js', import.meta.url), 'utf8');
  assert.match(level8, /function drawLevel8Coast/);
  assert.match(level8, /scenicOffset/);
  assert.match(level8, /crossfade|fadeZone/i);
  assert.doesNotMatch(level8, /scale\(1,-1\)/);
});
