import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('common battle renders hunt supplies as real projectiles', async () => {
  const src = await readFile(new URL('../src/battle.js', import.meta.url), 'utf8');
  assert.match(src, /kind,\s*dmg: spec\.dmg/);
  assert.match(src, /s\.kind === 'caffe' \? sprites\?\.caffeImg/);
  assert.match(src, /s\.kind === 'rustico' \? sprites\?\.rusticoImg/);
  assert.match(src, /s\.kind === 'pasticciotto' \? sprites\?\.pasticciottoImg/);
  assert.match(src, /Shared HIRUNDU battle inventory/);
  assert.match(src, /state\.ammo\.caffe/);
  assert.match(src, /state\.ammo\.rustico/);
  assert.match(src, /state\.ammo\.pasticciotto/);
});

for (const path of [
  '../src/game_battle.js',
  '../src/levels/level2/game_battle_gallipoli.js',
  '../src/levels/level3/game_battle_lecce.js',
]) {
  test(`${path} preloads the three food projectile sprites`, async () => {
    const src = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.match(src, /caffeleccese \.PNG/);
    assert.match(src, /rustico\.PNG/);
    assert.match(src, /bonus-pasticciotto\.PNG/);
    assert.match(src, /caffeImg/);
    assert.match(src, /rusticoImg/);
    assert.match(src, /pasticciottoImg/);
  });
}

for (const level of [3, 5, 7]) {
  test(`Arkanoid battle ${level} keeps the approved food-projectile UX`, async () => {
    const src = await readFile(new URL(`../public/level${level}-arkanoid/battle.js`, import.meta.url), 'utf8');
    assert.match(src, /\['coffee','rustico','pasticciotto','stars'\]/);
    assert.match(src, /sprite\(s\.food,s\.x,s\.y,32\)/);
  });
}
