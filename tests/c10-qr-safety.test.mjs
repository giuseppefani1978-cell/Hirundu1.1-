import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('C10 bundled QR scenarios are explicitly demo-only', async () => {
  const scenarios = JSON.parse(await readFile(new URL('../src/data/qr_scenarios.json', import.meta.url), 'utf8'));
  assert.ok(scenarios.length > 0);
  assert.ok(scenarios.every((item) => item.label.startsWith('[DÉMO]')));
  assert.ok(scenarios.every((item) => /Démonstration/i.test(item.notes || '')));
});

test('C10 demo partner and badge scans cannot validate the real passport', async () => {
  const hub = await readFile(new URL('../src/features/qr/routes/QrHub.tsx', import.meta.url), 'utf8');
  assert.match(hub, /getPartnerVerificationStatus\(partner\) === "confirmed"/);
  assert.match(hub, /markPartnerVisit/);
  assert.match(hub, /markBadgeVisit/);
});

test('C10 QR passport writes are idempotent sets', async () => {
  const storage = await readFile(new URL('../src/features/qr/passport/passportStorage.ts', import.meta.url), 'utf8');
  assert.match(storage, /const next = new Set\(current\)/);
  assert.match(storage, /if \(validated\) next\.add\(poiId\)/);
});

test('C10 camera refusal is recoverable and closing scanner remains possible', async () => {
  const scanner = await readFile(new URL('../src/features/qr/components/QrScanner.tsx', import.meta.url), 'utf8');
  assert.match(scanner, /pref === "once" \|\| pref === "never"/);
  assert.match(scanner, /persistPref\("once"\)/);
  assert.match(scanner, /onClose\?\.\(\)/);
  assert.match(scanner, /stopStreams\(\)/);
});
