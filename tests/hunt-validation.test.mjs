import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canCollectTarget,
  computeTargetHitRadiusPx,
} from '../src/legacy/huntValidation.js';

test('classic hunt hit radius stays close to the visible X', () => {
  const target = { key: 'a', x: 0.2, y: 0.2 };
  const points = [target, { key: 'b', x: 0.8, y: 0.8 }];
  assert.equal(computeTargetHitRadiusPx(target, points, 390, 700), 18);
});

test('classic hunt hit radius shrinks when two POIs are close on mobile', () => {
  const target = { key: 'castro', x: 0.50, y: 0.50 };
  const neighbour = { key: 'santa-cesarea', x: 0.56, y: 0.50 };
  const radius = computeTargetHitRadiusPx(target, [target, neighbour], 400, 700);
  assert.equal(radius, 10);
  assert.equal(Math.hypot((neighbour.x - target.x) * 400, 0) > radius, true);
});

test('target cannot validate before its question is visible', () => {
  assert.equal(canCollectTarget({
    questionReady: false,
    targetEntryReady: true,
    now: 2000,
    collectLockUntil: 0,
    playerX: 100,
    playerY: 100,
    targetX: 100,
    targetY: 100,
    radiusPx: 18,
  }), false);
});

test('target requires a fresh entry after the question appears', () => {
  assert.equal(canCollectTarget({
    questionReady: true,
    targetEntryReady: false,
    now: 2000,
    collectLockUntil: 0,
    playerX: 100,
    playerY: 100,
    targetX: 100,
    targetY: 100,
    radiusPx: 18,
  }), false);
});

test('target validates only after question, exit/re-entry and lock expiry', () => {
  assert.equal(canCollectTarget({
    questionReady: true,
    targetEntryReady: true,
    now: 2000,
    collectLockUntil: 1500,
    playerX: 108,
    playerY: 104,
    targetX: 100,
    targetY: 100,
    radiusPx: 18,
  }), true);

  assert.equal(canCollectTarget({
    questionReady: true,
    targetEntryReady: true,
    now: 1200,
    collectLockUntil: 1500,
    playerX: 100,
    playerY: 100,
    targetX: 100,
    targetY: 100,
    radiusPx: 18,
  }), false);
});
