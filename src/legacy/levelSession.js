// Own every timer, animation and event listener of one mounted hunt.
export function createLevelSession() {
  let active = true;
  const frames = new Map();
  const timers = new Set();
  const removers = [];
  return {
    get active() { return active; },
    frame(callback) {
      if (!active || frames.has(callback)) return frames.get(callback);
      const id = window.requestAnimationFrame((ts) => {
        frames.delete(callback);
        if (active) callback(ts);
      });
      frames.set(callback, id);
      return id;
    },
    timeout(callback, delay) {
      if (!active) return 0;
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (active) callback();
      }, delay);
      timers.add(id);
      return id;
    },
    listen(target, event, handler, options) {
      if (!target || !active) return;
      target.addEventListener(event, handler, options);
      removers.push(() => target.removeEventListener(event, handler, options));
    },
    dispose() {
      active = false;
      frames.forEach((id) => window.cancelAnimationFrame(id));
      timers.forEach((id) => window.clearTimeout(id));
      removers.forEach((remove) => remove());
      frames.clear(); timers.clear(); removers.length = 0;
    },
  };
}

// Input is sampled by the game's single frame loop, with speed per second.
export function setupHuntControls(player, getSpeed, canMove, session) {
  const held = new Map();
  const keys = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] };
  document.querySelectorAll('.btn[data-dx]').forEach((el) => {
    el.style.touchAction = 'none';
    session.listen(el, 'pointerdown', (event) => {
      if (!canMove()) return;
      event.preventDefault();
      el.setPointerCapture?.(event.pointerId);
      held.set(event.pointerId, [Number(el.dataset.dx), Number(el.dataset.dy)]);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      session.listen(el, event, (e) => held.delete(e.pointerId));
    }
  });
  session.listen(window, 'keydown', (e) => {
    if (!keys[e.key] || !canMove() || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName)) return;
    e.preventDefault(); held.set(e.key, keys[e.key]);
  });
  session.listen(window, 'keyup', (e) => held.delete(e.key));
  session.listen(window, 'blur', () => held.clear());
  session.listen(document, 'visibilitychange', () => held.clear());
  return (dt) => {
    if (!canMove() || document.hidden) { held.clear(); return; }
    let dx = 0, dy = 0;
    held.forEach(([x,y]) => { dx += x; dy += y; });
    const length = Math.hypot(dx,dy);
    if (!length) return;
    const distance = getSpeed() * 60 * Math.min(dt, 0.05);
    player.x = Math.max(0, Math.min(1, player.x + dx/length * distance));
    player.y = Math.max(0, Math.min(1, player.y + dy/length * distance));
  };
}
