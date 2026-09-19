import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('C11 real maps remain consultable without requesting user geolocation', async () => {
  const map = await readFile(new URL('../src/features/qr/routes/RealMap.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(map, /navigator\.geolocation/);
  assert.doesNotMatch(map, /getCurrentPosition/);
  assert.match(map, /MapContainer/);
});

test('C11 external directions use the selected destination and open separately', async () => {
  const map = await readFile(new URL('../src/features/qr/routes/RealMap.tsx', import.meta.url), 'utf8');
  assert.match(map, /www\.google\.com\/maps\/dir\//);
  assert.match(map, /url\.searchParams\.set\("destination", destination\)/);
  assert.match(map, /window\.open\(url\.toString\(\), "_blank", "noopener,noreferrer"\)/);
  assert.match(map, /Itinéraire/);
});

test('C11 returning to HIRUNDU does not clear durable progress', async () => {
  const map = await readFile(new URL('../src/features/qr/routes/RealMap.tsx', import.meta.url), 'utf8');
  assert.match(map, /navigate\("\/bonus"\)/);
  assert.doesNotMatch(map, /localStorage\.clear\(\)/);
  assert.doesNotMatch(map, /resetBonusProgress\(/);
});
