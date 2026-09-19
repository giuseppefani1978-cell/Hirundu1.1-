import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('C09 passport storage separates consultation declaration and QR validation', async () => {
  const src = await readFile(new URL('../src/features/qr/passport/passportStorage.ts', import.meta.url), 'utf8');
  assert.match(src, /qrValidated:/);
  assert.match(src, /declaredVisited:/);
  assert.match(src, /consultedMaps:/);
  assert.match(src, /setPoiQrValidated/);
  assert.match(src, /setPoiDeclaredVisited/);
  assert.match(src, /markMapConsulted/);
});

test('C09 legacy POI stamps migrate only to QR validation', async () => {
  const src = await readFile(new URL('../src/features/qr/passport/passportStorage.ts', import.meta.url), 'utf8');
  assert.match(src, /const legacyQr = sanitizeRecord\(parsed\.pois\)/);
  assert.match(src, /pois: \{ \.\.\.qrValidated \}/);
  assert.doesNotMatch(src, /declaredVisited\s*=\s*legacyQr/);
});

test('C09 virtual victories do not count as real-world passport validation', async () => {
  const map = await readFile(new URL('../src/features/qr/routes/RealMap.tsx', import.meta.url), 'utf8');
  const start = map.indexOf('function computePassportProgress');
  const end = map.indexOf('function resolvePassportLevel', start);
  const progress = map.slice(start, end);
  assert.match(progress, /const totalPoints = totalPoiCount/);
  assert.match(progress, /const earnedPoints = qrValidatedPoiCount/);
  assert.doesNotMatch(progress, /earnedPoints = .*completedItinerarySteps/);
});
