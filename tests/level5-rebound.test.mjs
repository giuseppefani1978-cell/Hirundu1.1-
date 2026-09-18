import test from 'node:test';
import {execFileSync} from 'node:child_process';
test('level 5 rebound runtime boots and completes',()=>{execFileSync(process.execPath,['tests/level5-rebound.cjs'],{stdio:'pipe'});});
