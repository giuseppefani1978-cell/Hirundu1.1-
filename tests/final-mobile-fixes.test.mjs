import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('L3 Tarantula dialogue always reserves two lines in hunt mode', async () => {
  const css = await readFile(new URL('../public/level3-arkanoid/style.css', import.meta.url), 'utf8');
  assert.match(css, /body:not\(\.battle-active\) \.question\{[\s\S]*flex:0 0 74px/);
  assert.match(css, /body:not\(\.battle-active\) \.question p\{[\s\S]*height:2\.64em/);
  assert.match(css, /-webkit-line-clamp:2/);
  assert.match(css, /body:not\(\.battle-active\) \.targets-list\{[\s\S]*flex:0 0 28px/);
});

test('L8 flight draws a visible backdrop for every obstacle without changing spawning', async () => {
  const src = await readFile(new URL('../public/level8-flight/game.js', import.meta.url), 'utf8');
  assert.match(src, /function drawObstacleBackdrop\(o\)/);
  assert.match(src, /for\(const o of S\.obstacles\)\{\s*drawObstacleBackdrop\(o\)/);
  assert.match(src, /spawnObstacleWave\(\)/);
  assert.match(src, /S\.obstacles\.push/);
});
