import test from 'node:test';
import assert from 'node:assert/strict';
import { createLevelSession, setupHuntControls } from '../src/legacy/levelSession.js';

test('leaving a hunt cancels timers, frames and listeners; duplicate draw is ignored', () => {
  const frames = new Map(), timers = new Map(); let id = 0;
  globalThis.window = Object.assign(new EventTarget(), {
    requestAnimationFrame: fn => { frames.set(++id, fn); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: fn => { timers.set(++id, fn); return id; },
    clearTimeout: id => timers.delete(id),
  });
  const session = createLevelSession(); let calls = 0;
  const draw = () => calls++;
  session.frame(draw); session.frame(draw);
  assert.equal(frames.size, 1);
  session.timeout(draw, 100);
  session.listen(window, 'resize', draw);
  window.dispatchEvent(new Event('resize'));
  assert.equal(calls, 1);
  const late = [...timers.values()][0];
  session.dispose(); late(); session.frame(draw);
  window.dispatchEvent(new Event('resize'));
  assert.equal(calls, 1); assert.equal(frames.size, 0); assert.equal(timers.size, 0);
});

test('movement speed is stable at 60/120 Hz and stops when the app loses focus', () => {
  const run = hz => {
    globalThis.window = new EventTarget();
    globalThis.document = Object.assign(new EventTarget(), { hidden:false, querySelectorAll:()=>[] });
    const player = {x:0.2,y:0.2}, session = createLevelSession();
    const move = setupHuntControls(player,()=>0.005,()=>true,session);
    const press = Object.assign(new Event('keydown'), {key:'ArrowRight'});
    window.dispatchEvent(press);
    for(let i=0;i<hz;i++) move(1/hz);
    const result=player.x;
    window.dispatchEvent(new Event('blur')); move(1/hz);
    assert.equal(player.x,result);
    session.dispose(); return result;
  };
  assert.ok(Math.abs(run(60)-run(120))<1e-10);
  assert.ok(Math.abs(run(60)-0.5)<1e-10);
});
