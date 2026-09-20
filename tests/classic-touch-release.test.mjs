import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('classic hunt D-pad cannot stay latched after an iOS touch release', async () => {
  const src = await readFile(new URL('../src/legacy/levelSession.js', import.meta.url), 'utf8');
  assert.match(src, /session\.listen\(window, 'pointerup'/);
  assert.match(src, /session\.listen\(window, 'pointercancel'/);
  assert.match(src, /session\.listen\(window, 'touchend'/);
  assert.match(src, /session\.listen\(window, 'touchcancel'/);
  assert.match(src, /if \(held\.size === 0\) zeroMotion\(\)/);
  assert.doesNotMatch(src, /setPointerCapture\?/);
});
