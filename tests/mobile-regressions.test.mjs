import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('mobile regression: L3 owns hunt and battle music and pause toggle works locally', async () => {
  const game = await readFile(new URL('../public/level3-arkanoid/game.js', import.meta.url), 'utf8');
  const battle = await readFile(new URL('../public/level3-arkanoid/battle.js', import.meta.url), 'utf8');
  assert.match(game, /hunt_loop\.wav/);
  assert.match(game, /battle_loop\.mp3/);
  assert.match(game, /\$\('pauseMusic'\)\.onclick=\(\)=>toggleLevelMusic\(\)/);
  assert.match(game, /playLevelMusic\('hunt'\)/);
  assert.match(game, /__L3_START_BATTLE_MUSIC__/);
  assert.match(battle, /__L3_START_BATTLE_MUSIC__/);
  assert.match(battle, /__L3_STOP_BATTLE_MUSIC__/);
});

test('mobile regression: L3 question area keeps a stable height', async () => {
  const css = await readFile(new URL('../public/level3-arkanoid/style.css', import.meta.url), 'utf8');
  const host = await readFile(new URL('../src/levels/level3/reboundLevel3.js', import.meta.url), 'utf8');
  assert.match(css, /\.question,.battle-active \.question\{height:74px;min-height:74px;max-height:74px/);
  assert.match(css, /\.targets-list\{height:28px;min-height:28px;max-height:28px/);
  assert.match(host, /height:100%;border:0/);
});

test('mobile regression: flight sprites keep their native aspect ratio', async () => {
  for (const level of [4, 6, 8]) {
    const src = await readFile(new URL('../public/level' + level + '-flight/game.js', import.meta.url), 'utf8');
    assert.match(src, /const k=size\/Math\.max\(img\.naturalWidth,img\.naturalHeight\),dw=img\.naturalWidth\*k,dh=img\.naturalHeight\*k/);
    assert.doesNotMatch(src, /ctx\.drawImage\(img,-size\/2,-size\/2,size,size\)/);
  }
});

test('mobile regression: L4 and L6 coast scroll without mirrored tiles', async () => {
  for (const level of [4, 6]) {
    const src = await readFile(new URL('../public/level' + level + '-flight/game.js', import.meta.url), 'utf8');
    assert.match(src, /function drawScrollingCoast/);
    assert.doesNotMatch(src, /ctx\.scale\(1,-1\)/);
    assert.match(src, /ctx\.drawImage\(bg,x,y,dw,dh\+1\)/);
  }
});

test('mobile regression: standalone flight pages avoid dynamic viewport height', async () => {
  for (const level of [4, 6, 8]) {
    const css = await readFile(new URL('../public/level' + level + '-flight/style.css', import.meta.url), 'utf8');
    assert.match(css, /main\{height:100%;/);
    assert.doesNotMatch(css, /main\{height:100dvh/);
  }
});
