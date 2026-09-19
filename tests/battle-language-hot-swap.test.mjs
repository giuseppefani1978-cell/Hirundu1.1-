import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('classic battle language change preserves battle state instead of reloading', async () => {
  const shell = await readFile(new URL('../src/legacy/LegacyGameShell.tsx', import.meta.url), 'utf8');
  assert.match(shell, /LANGUAGE_EVENT/);
  assert.match(shell, /FLOW_PHASES\.BATTLE/);
  assert.match(shell, /keepBattleState/);
  assert.match(shell, /if \(!keepBattleState\) window\.location\.reload\(\)/);
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
