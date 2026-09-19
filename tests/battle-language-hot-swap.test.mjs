import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('classic hunt language change no longer reloads or resets the level', async () => {
  const shell = await readFile(new URL('../src/legacy/LegacyGameShell.tsx', import.meta.url), 'utf8');
  assert.match(shell, /setLang\(nextLanguage\)/);
  assert.doesNotMatch(shell, /changeLanguage[\s\S]{0,900}location\.reload/);
  assert.doesNotMatch(shell, /changeLanguage[\s\S]{0,900}replayFloat/);
});

test('classic hunt refresh only redraws language-dependent UI', async () => {
  for (const file of ['../src/game.js', '../src/levels/level2/level2_game.js', '../src/levels/level3/level3_game.js']) {
    const src = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(src, /LANGUAGE_EVENT/);
    assert.match(src, /refreshLanguageUI/);
    const start = src.indexOf('const refreshLanguageUI');
    const end = src.indexOf('session.listen(window, LANGUAGE_EVENT', start);
    const hotSwap = src.slice(start, end);
    assert.doesNotMatch(hotSwap, /resetGame\(/);
    assert.doesNotMatch(hotSwap, /player\.x\s*=/);
    assert.doesNotMatch(hotSwap, /pickedCounts\s*=/);
  }
});

test('common battle hot-swaps its labels on language event', async () => {
  const battle = await readFile(new URL('../src/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /BATTLE_WORDS/);
  assert.match(battle, /BATTLE_COPY/);
  assert.match(battle, /function _onBattleLanguage/);
  assert.match(battle, /window\.addEventListener\(LANGUAGE_EVENT, _onBattleLanguage\)/);
  assert.match(battle, /_syncBattleLanguageFromStorage\(\)/);
  assert.doesNotMatch(battle, /_onBattleLanguage[\s\S]{0,600}location\.reload/);
});

test('battle language refresh updates controls without resetting combat data', async () => {
  const battle = await readFile(new URL('../src/battle.js', import.meta.url), 'utf8');
  const start = battle.indexOf('function _setBattleLanguage');
  const end = battle.indexOf('export function disposeBattle', start);
  const hotSwap = battle.slice(start, end);
  assert.doesNotMatch(hotSwap, /state\.player\s*=/);
  assert.doesNotMatch(hotSwap, /state\.foe\s*=/);
  assert.doesNotMatch(hotSwap, /state\.ammo\s*=/);
  assert.match(hotSwap, /_refreshBattleLanguageUI/);
});

test('rebound levels exchange language with their iframe without restarting state', async () => {
  for (const file of [
    '../src/levels/level3/reboundLevel3.js',
    '../src/levels/level5/reboundLevel5.js',
    '../src/levels/level7/reboundLevel7.js',
  ]) {
    const src = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(src, /LANGUAGE_EVENT/);
    assert.match(src, /type:'language'/);
    assert.match(src, /setLang\(data\.lang\)/);
  }
  for (const file of [
    '../public/level3-arkanoid/game.js',
    '../public/level5-arkanoid/game.js',
    '../public/level7-arkanoid/game.js',
  ]) {
    const src = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(src, /e\.data\.type==='language'/);
    assert.match(src, /translated\(\);labelBridge\(\)/);
  }
});
