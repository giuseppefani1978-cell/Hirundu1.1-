import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('play beta admin preview stays a disconnected mock with no sensitive API access', () => {
  const html=readFileSync(new URL('../public/beta-admin-preview.html', import.meta.url),'utf8');
  assert.match(html,/PROTOTYPE|MAQUETTE/);
  assert.match(html,/Simuler/);
  assert.match(html,/data-pane="partners"/);
  assert.match(html,/data-pane="feedback"/);
  assert.match(html,/data-pane="testers"/);
  assert.doesNotMatch(html,/supabase\.co|service_role|localStorage\.|fetch\(|apiKey|apikey/);
});
