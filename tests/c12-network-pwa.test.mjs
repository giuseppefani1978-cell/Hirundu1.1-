import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('C12 legacy service-worker cleanup is scoped to HIRUNDU', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /HIRUNDU_SCOPE = "\/Hirundu1\.1-\/"/);
  assert.match(html, /filter\(r =>/);
  assert.match(html, /hirundu\|aracne/i);
});

test('C12 stale chunk or network boot failure has a visible recovery UI', async () => {
  const app = await readFile(new URL('../src/app.tsx', import.meta.url), 'utf8');
  assert.match(app, /class AppErrorBoundary/);
  assert.match(app, /getDerivedStateFromError/);
  assert.match(app, /syncDurableProgress\(\)/);
  assert.match(app, /fresh/);
});

test('C12 online map failure is explained with a safe return', async () => {
  const map = await readFile(new URL('../src/features/qr/routes/RealMap.tsx', import.meta.url), 'utf8');
  assert.match(map, /tileerror: \(\) => setMapUnavailable\(true\)/);
  assert.match(map, /Carte indisponible/);
  assert.match(map, /progression locale est conservée/);
  assert.match(map, /Retour aux découvertes/);
});

test('C12 beta does not claim guaranteed offline mode', async () => {
  const copy = await readFile(new URL('../src/ui/copy.js', import.meta.url), 'utf8');
  assert.match(copy, /hors ligne complet n’est pas garanti/);
  assert.match(copy, /Full offline mode is not guaranteed/);
});
