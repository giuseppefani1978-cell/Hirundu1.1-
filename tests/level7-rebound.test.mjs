import test from 'node:test';
import {execFileSync} from 'node:child_process';
test('level 7 rebound runtime boots and completes',()=>{execFileSync(process.execPath,['tests/level7-rebound.cjs'],{stdio:'pipe'});});
