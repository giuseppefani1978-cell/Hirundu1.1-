import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("failed legacy level boot offers a localized retry and home without resetting saves", async () => {
  const src = await readFile(new URL("../src/routes/LegacyLevelPage.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/routes/LegacyLevelPage.css", import.meta.url), "utf8");
  assert.match(src, /setBootFailed\(true\)/);
  assert.match(src, /controller\.signal\.aborted/);
  assert.match(src, /role="alert"/);
  assert.match(src, /setBootAttempt\(\(attempt\) => attempt \+ 1\)/);
  assert.match(src, /navigate\("\/"\)/);
  assert.match(src, /fr: \{ title:/);
  assert.match(src, /it: \{ title:/);
  assert.match(src, /en: \{ title:/);
  assert.match(src, /es: \{ title:/);
  assert.doesNotMatch(src, /localStorage\.clear\(/);
  assert.doesNotMatch(src, /removeItem\(["']level/);
  assert.match(css, /legacy-level-page__recovery/);
});
