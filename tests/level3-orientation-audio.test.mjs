import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('level 3 handles legacy orientation and visibility lifecycle',async()=>{
 const source=await readFile(new URL('../public/level3-arkanoid/game.js',import.meta.url),'utf8');
 assert.match(source,/orientationQuery\.addEventListener/);
 assert.match(source,/orientationQuery\.addListener/);
 assert.match(source,/addEventListener\('orientationchange',syncBattleOrientation\)/);
 assert.match(source,/addEventListener\('pageshow',syncBattleOrientation\)/);
 assert.match(source,/document\.addEventListener\('visibilitychange'/);
 assert.match(source,/if\(document\.hidden\)pauseLevelMusic\(\)/);
});
