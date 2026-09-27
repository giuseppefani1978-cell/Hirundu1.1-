import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('startup cinematic is shown on every fresh app launch and retries autoplay without a tap', async () => {
  const [app, intro] = await Promise.all([
    readFile(new URL('../src/app.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/routes/StartupIntro.tsx', import.meta.url), 'utf8'),
  ]);
  assert.doesNotMatch(app, /hirundu_startup_intro_seen/);
  assert.match(app, /useState\(false\)/);
  assert.match(intro, /document\.createElement\("video"\)/);
  assert.match(intro, /video\.autoplay = true/);
  assert.match(intro, /video\.defaultMuted = true/);
  assert.match(intro, /video\.muted = true/);
  assert.match(intro, /video\.playsInline = true/);
  assert.match(intro, /Attach the source only after/);
  assert.match(intro, /loadeddata/);
  assert.match(intro, /canplay/);
  assert.match(intro, /pageshow/);
  assert.doesNotMatch(intro, /pointerdown.*retry/);
});

test('home Settings label is localized in all four supported languages', async () => {
  const [i18n, home] = await Promise.all([
    readFile(new URL('../src/i18n.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/routes/StartPage.tsx', import.meta.url), 'utf8'),
  ]);
  for (const label of [
    'settings: "Réglages"',
    'settings: "Impostazioni"',
    'settings: "Settings"',
    'settings: "Ajustes"',
  ]) assert.ok(i18n.includes(label), 'missing translation: ' + label);
  assert.match(home, /t\('settings', 'Réglages'\)/);
});

test('rebound guide demo supports touch dragging and keeps standalone assets in sync', async () => {
  const [model, ui, publicModel, publicUi] = await Promise.all([
    readFile(new URL('../src/legacy/practice-model.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/legacy/practice.js', import.meta.url), 'utf8'),
    readFile(new URL('../public/shared/practice-model.js', import.meta.url), 'utf8'),
    readFile(new URL('../public/shared/practice.js', import.meta.url), 'utf8'),
  ]);
  assert.equal(model, publicModel);
  assert.equal(ui, publicUi);
  assert.match(model, /setPaddle/);
  assert.match(model, /Math\.abs\(s\.ballX-s\.paddle\)<=\.18/);
  assert.match(ui, /movePaddleFromPointer/);
  assert.match(ui, /canvas\.addEventListener\('pointerdown'/);
  assert.match(ui, /Glisse la barre ou utilise/);
  assert.match(ui, /Trascina la barra oppure usa/);
  assert.doesNotMatch(ui, /const skip=add/);
  assert.match(model, /if\(ark&&!s\.launched&&!s\.done\)/);
});
