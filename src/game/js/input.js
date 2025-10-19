export function setupDpad(player, getSpeed, canMove) {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach((btn) => {
    const dx = Number.parseFloat(btn.dataset.dx);
    const dy = Number.parseFloat(btn.dataset.dy);
    if (Number.isNaN(dx) || Number.isNaN(dy)) {
      return;
    }

    let pressed = false;
    let rafId = 0;

    const step = () => {
      if (!pressed) {
        return;
      }
      if (canMove && !canMove()) {
        pressed = false;
        cancelAnimationFrame(rafId);
        return;
      }
      const speed = getSpeed ? getSpeed() : 0;
      player.x = Math.max(0, Math.min(1, player.x + dx * speed));
      player.y = Math.max(0, Math.min(1, player.y + dy * speed));
      rafId = requestAnimationFrame(step);
    };

    const start = (ev) => {
      pressed = true;
      step();
      if (ev) {
        ev.preventDefault();
      }
    };

    const stop = () => {
      if (!pressed) {
        return;
      }
      pressed = false;
      cancelAnimationFrame(rafId);
    };

    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', stop, { passive: true });
    btn.addEventListener('mousedown', start);
    window.addEventListener('mouseup', stop);
  });
}
