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
// V9.5: acceleration/deceleration replaces the old on/off movement.
export function setupHuntControls(player, getSpeed, canMove, session) {
  const held = new Map();
  const keys = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] };
  let vx = 0;
  let vy = 0;
  let nextChirpAt = 0;

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
    e.preventDefault();
    held.set(e.key, keys[e.key]);
  });
  session.listen(window, 'keyup', (e) => held.delete(e.key));
  const stopMotion = () => {
    held.clear();
    vx = 0;
    vy = 0;
    player._motionX = 0;
    player._motionY = 0;
    player._motionSpeed = 0;
  };
  session.listen(window, 'blur', stopMotion);
  session.listen(document, 'visibilitychange', () => { if (document.hidden) stopMotion(); });

  return (rawDt) => {
    const dt = Math.min(0.05, Math.max(0.001, rawDt || 0.016));
    if (!canMove() || document.hidden) held.clear();

    let dx = 0;
    let dy = 0;
    held.forEach(([x,y]) => { dx += x; dy += y; });
    const length = Math.hypot(dx,dy);
    const targetX = length ? dx / length : 0;
    const targetY = length ? dy / length : 0;

    // Responsive on press, softer on release: still arcade-like but no hard step.
    const response = length ? 12 : 8;
    const decay = Math.exp(-response * dt);
    const oldVx = vx;
    const oldVy = vy;
    // Exact integral of first-order acceleration: same travelled distance at 60 or 120 Hz.
    const moveX = targetX * dt + (oldVx - targetX) * (1 - decay) / response;
    const moveY = targetY * dt + (oldVy - targetY) * (1 - decay) / response;
    vx = targetX + (oldVx - targetX) * decay;
    vy = targetY + (oldVy - targetY) * decay;
    if (!length && Math.abs(vx) < 0.015) vx = 0;
    if (!length && Math.abs(vy) < 0.015) vy = 0;

    const speedPerSecond = (getSpeed ? getSpeed() : 0) * 60;
    player.x = Math.max(0, Math.min(1, player.x + moveX * speedPerSecond));
    player.y = Math.max(0, Math.min(1, player.y + moveY * speedPerSecond));
    player._motionX = vx;
    player._motionY = vy;
    player._motionSpeed = Math.min(1, Math.hypot(vx, vy));

    const now = performance.now();
    if (length && player._motionSpeed > 0.45 && now >= nextChirpAt) {
      try { window.__HIRUNDU_CHIRP?.('soft'); } catch {}
      nextChirpAt = now + 1700 + Math.random() * 2200;
    }
  };
}

// Gives one static PNG a subtle sense of wingbeats without requiring a sprite sheet.
export function drawAnimatedBird(ctx, image, x, y, size, player, now = performance.now(), shakeX = 0, shakeY = 0) {
  const mx = Number(player?._motionX) || 0;
  const my = Number(player?._motionY) || 0;
  const motion = Math.min(1, Number(player?._motionSpeed) || Math.hypot(mx, my));
  const period = motion > 0.15 ? 74 : 118;
  const flap = Math.sin(now / period);
  const bob = Math.sin(now / (motion > 0.15 ? 105 : 155)) * (1.2 + motion * 1.5);
  const scaleY = 0.95 + flap * (0.045 + motion * 0.025);
  const scaleX = 1.015 - flap * 0.018;
  const tilt = Math.max(-0.15, Math.min(0.15, my * 0.10 + mx * 0.035));

  ctx.save();
  ctx.translate(x + shakeX, y + shakeY + bob);
  ctx.rotate(tilt);
  ctx.scale(scaleX, scaleY);
  if (image?.complete && image.naturalWidth) {
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
  } else {
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
