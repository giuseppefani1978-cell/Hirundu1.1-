import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('integrated guide covers six steps, four languages and the three real practice families', async () => {
  const [page, app, home] = await Promise.all([
    readFile(
      new URL('../src/routes/GameGuidePage.tsx', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../src/app.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/routes/StartPage.tsx', import.meta.url), 'utf8'),
  ]);

  assert.match(app, /path="\/guide"/);
  assert.match(home, /to="\/guide"/);
  for (const language of ['fr', 'it', 'en', 'es'])
    assert.match(page, new RegExp(`\\b${language}: \\{`));
  for (const family of ['classic', 'arkanoid', 'flight'])
    assert.match(page, new RegExp(`${family}:`));
  for (const label of [
    'Chasse à rebonds',
    'Caccia a rimbalzi',
    'Rebound hunt',
    'Caza de rebotes',
    'Après les dix découvertes',
    'Dopo le dieci scoperte',
    'After the ten discoveries',
    'Después de los diez descubrimientos',
  ])
    assert.match(page, new RegExp(label));
  for (const asset of [
    'assets/salento-map.PNG',
    'assets/aracne .PNG',
    'level4-flight/coast.webp',
    'level4-flight/assets/bird.png',
    'assets/battle_bg_lecce.webp',
    'assets/tarantula .PNG',
  ])
    assert.match(page, new RegExp(asset.replace(/[.]/g, '\\.')));
  assert.doesNotMatch(page, /Arkanoid/);
  assert.match(page, /attachPractice/);
  assert.match(page, /steps\.length/);
  assert.match(page, /hirundu_game_guide_v1/);
  assert.doesNotMatch(
    page,
    /markLevelWin|unlockBonus|setPoiQrValidated|writePassportStorage/,
  );
});
