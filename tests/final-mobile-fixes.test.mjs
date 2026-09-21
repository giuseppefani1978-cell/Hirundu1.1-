import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('L3 Tarantula dialogue always reserves two lines in hunt mode', async () => {
  const css = await readFile(new URL('../public/level3-arkanoid/style.css', import.meta.url), 'utf8');
  assert.match(css, /body:not\(\.battle-active\) \.question\{[\s\S]*flex:0 0 74px/);
  assert.match(css, /body:not\(\.battle-active\) \.question p\{[\s\S]*height:2\.64em/);
  assert.match(css, /-webkit-line-clamp:2/);
});

test('L8 uses the validated L6 obstacle cadence and movement model', async () => {
  const l6 = await readFile(new URL('../public/level6-flight/game.js', import.meta.url), 'utf8');
  const l8 = await readFile(new URL('../public/level8-flight/game.js', import.meta.url), 'utf8');
  const spawn6 = l6.slice(l6.indexOf('function spawnObstacleWave(){'), l6.indexOf('function tick(dt)'));
  const spawn8 = l8.slice(l8.indexOf('function spawnObstacleWave(){'), l8.indexOf('function tick(dt)'));
  assert.equal(spawn8, spawn6);
  assert.match(l8, /if\(S\.spawn>1\.65\)/);
  assert.match(l8, /Math\.random\(\)<\.36/);
  assert.doesNotMatch(l8, /drawObstacleBackdrop/);
  assert.doesNotMatch(l8, /drawTrashObstacle/);
  assert.match(l8, /ctx\.globalAlpha=1/);
  assert.match(l8, /ctx\.globalCompositeOperation='source-over'/);
  assert.match(l8, /ctx\.filter='none'/);
  assert.match(l8, /ctx\.fillStyle='#369fab'/);
  assert.match(l8, /ctx\.fillText\(glyph,o\.x,o\.y\)/);
});

test('home stays minimal and resumes the current unlocked level', async () => {
  const home = await readFile(new URL('../src/routes/StartPage.tsx', import.meta.url), 'utf8');
  assert.match(home, /const resumeTarget = getResumeTarget\(\)/);
  assert.match(home, /navigate\(`\/level\/\$\{resumeLevel\}`\)/);
  assert.doesNotMatch(home, /replayLevel/);
  assert.doesNotMatch(home, /confirmNewGame/);
  assert.doesNotMatch(home, /resetBonusProgress/);
});

