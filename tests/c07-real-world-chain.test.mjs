import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const orderedKeys = ['otranto','gallipoli','lecce','adriatico','capo','arneo','nardo','messapia','itria'];

test('C07 nine virtual levels map one-to-one to nine real territories', async () => {
  const storage = await readFile(new URL('../src/features/bonus/bonusStorage.ts', import.meta.url), 'utf8');
  const data = await readFile(new URL('../src/features/bonus/bonusData.ts', import.meta.url), 'utf8');
  for (const key of orderedKeys) {
    assert.match(storage, new RegExp('key:\\s*["\\\']' + key + '["\\\']'));
    assert.match(data, new RegExp('(?:^|\\n)\\s*' + key + '\\s*:'));
  }
});

test('C07 opening a real map cannot unlock it', async () => {
  const navigation = await readFile(new URL('../src/features/bonus/bonusNavigation.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(navigation, /unlockBonus\(/);
  assert.match(navigation, /getUnlockedKeys\(\)/);
  assert.match(navigation, /Cette découverte n’est pas encore débloquée/);
});

test('C07 territories with no verified POIs stay empty instead of borrowing another territory', async () => {
  const map = await readFile(new URL('../src/features/qr/routes/RealMap.tsx', import.meta.url), 'utf8');
  const start = map.indexOf('function filterPoisForMap');
  const end = map.indexOf('function enrichPartners', start);
  const filter = map.slice(start, end);
  assert.match(filter, /if \(!ids\?\.length\) return \[\]/);
});
