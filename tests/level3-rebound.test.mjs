import test from 'node:test';
import {execFileSync} from 'node:child_process';
test('rebound hunt, powers, battle and orientation',()=>{execFileSync(process.execPath,['tests/level3-rebound.cjs'],{stdio:'pipe'});});
