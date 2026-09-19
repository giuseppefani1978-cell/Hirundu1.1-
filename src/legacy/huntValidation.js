// Shared validation for classic hunt POIs.
//
// The visible X is small, so collection must happen near its centre. On compact
// mobile viewports, nearby POIs can otherwise share a large hit zone.
export const TARGET_HIT_DEFAULTS = Object.freeze({
  minRadiusPx: 10,
  maxRadiusPx: 18,
  separationFactor: 0.40,
});

export function computeTargetHitRadiusPx(target, points, dw, dh, options = {}) {
  const minRadiusPx = Number.isFinite(options.minRadiusPx)
    ? options.minRadiusPx
    : TARGET_HIT_DEFAULTS.minRadiusPx;
  const maxRadiusPx = Number.isFinite(options.maxRadiusPx)
    ? options.maxRadiusPx
    : TARGET_HIT_DEFAULTS.maxRadiusPx;
  const separationFactor = Number.isFinite(options.separationFactor)
    ? options.separationFactor
    : TARGET_HIT_DEFAULTS.separationFactor;

  if (!target || !Array.isArray(points) || !Number.isFinite(dw) || !Number.isFinite(dh)) {
    return maxRadiusPx;
  }

  let nearestPx = Infinity;
  for (const point of points) {
    if (!point) continue;
    if (point === target) continue;
    if (target.key != null && point.key === target.key) continue;

    const dx = (Number(point.x) - Number(target.x)) * dw;
    const dy = (Number(point.y) - Number(target.y)) * dh;
    const distance = Math.hypot(dx, dy);
    if (Number.isFinite(distance) && distance < nearestPx) nearestPx = distance;
  }

  if (!Number.isFinite(nearestPx)) return maxRadiusPx;

  return Math.max(
    minRadiusPx,
    Math.min(maxRadiusPx, nearestPx * separationFactor),
  );
}

export function canCollectTarget({
  questionReady,
  targetEntryReady,
  now,
  collectLockUntil,
  playerX,
  playerY,
  targetX,
  targetY,
  radiusPx,
}) {
  if (!questionReady || !targetEntryReady) return false;
  if (!Number.isFinite(now) || now < collectLockUntil) return false;
  if (![playerX, playerY, targetX, targetY, radiusPx].every(Number.isFinite)) return false;
  return Math.hypot(playerX - targetX, playerY - targetY) <= radiusPx;
}
