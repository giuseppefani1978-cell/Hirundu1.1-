import test from 'node:test';
import assert from 'node:assert/strict';
import {replayGoal} from '../src/features/bonus/replayGoal.js';
test('A12 uses retained scores without inventing a record or modifying them',()=>{
 assert.equal(replayGoal([]),null);assert.equal(replayGoal(null),null);
 assert.equal(replayGoal([{score:'100'},{score:-1},{score:Infinity},{}]),null);
 assert.equal(replayGoal([{score:0}]),0);
 const entries=Object.freeze([Object.freeze({score:150}),Object.freeze({score:900}),Object.freeze({score:80})]);
 assert.equal(replayGoal(entries),900);assert.equal(entries[0].score,150);
});
