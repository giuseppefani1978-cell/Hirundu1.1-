export function setupDpad(player, getSpeed, canMove) {
  const buttons = document.querySelectorAll('.btn');
  const held = new Map();
  let vx = 0;
  let vy = 0;
  let nextChirpAt = 0;

  buttons.forEach((btn) => {
    const dx = Number.parseFloat(btn.dataset.dx);
    const dy = Number.parseFloat(btn.dataset.dy);
    if (Number.isNaN(dx) || Number.isNaN(dy)) return;

    btn.style.touchAction = 'none';
    const start = (ev) => {
      if (canMove && !canMove()) return;
      ev?.preventDefault?.();
      const id = ev?.pointerId ?? btn;
      try { if (ev?.pointerId != null) btn.setPointerCapture?.(ev.pointerId); } catch {}
      held.set(id, [dx, dy]);
    };
    const stop = (ev) => {
      const id = ev?.pointerId ?? btn;
      held.delete(id);
    };

    btn.addEventListener('pointerdown', start, { passive: false });
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointercancel', stop);
    btn.addEventListener('lostpointercapture', stop);
  });

  const step = (rawDt = 1 / 60) => {
    const dt = Math.min(0.05, Math.max(0.001, rawDt));
    if (canMove && !canMove()) held.clear();

    let dx = 0;
    let dy = 0;
    held.forEach(([x, y]) => { dx += x; dy += y; });
    const length = Math.hypot(dx, dy);
    const targetX = length ? dx / length : 0;
    const targetY = length ? dy / length : 0;
    const blend = 1 - Math.exp(-(length ? 12 : 8) * dt);
    vx += (targetX - vx) * blend;
    vy += (targetY - vy) * blend;
    if (!length && Math.abs(vx) < 0.015) vx = 0;
    if (!length && Math.abs(vy) < 0.015) vy = 0;

    const distance = (getSpeed ? getSpeed() : 0) * 60 * dt;
    player.x = Math.max(0, Math.min(1, player.x + vx * distance));
    player.y = Math.max(0, Math.min(1, player.y + vy * distance));
    player._motionX = vx;
    player._motionY = vy;
    player._motionSpeed = Math.min(1, Math.hypot(vx, vy));

    const now = performance.now();
    if (length && player._motionSpeed > 0.45 && now >= nextChirpAt) {
      try { window.__HIRUNDU_CHIRP?.('soft'); } catch {}
      nextChirpAt = now + 1700 + Math.random() * 2200;
    }
  };

  step.dispose = () => {
    held.clear();
    buttons.forEach((btn) => {
      // listeners are short-lived with the page; clearing movement state is sufficient here
      btn.releasePointerCapture?.(0);
    });
  };
  return step;
}
