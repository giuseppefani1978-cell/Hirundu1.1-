import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../docs/preview-a02.fragment.html', import.meta.url), 'utf8');
function fixture() {
  const writes = [];
  const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://example.org/', beforeParse(window) {
    window.Storage.prototype.setItem = (...args) => writes.push(args);
    window.Storage.prototype.removeItem = (...args) => writes.push(args);
    window.Storage.prototype.clear = () => writes.push('clear');
  }});
  const d = dom.window.document;
  const change = (id, value) => { const el = d.querySelector(id); el.value = value; el.dispatchEvent(new dom.window.Event('change')); };
  return {dom, d, change, writes};
}

test('A02: nine stages, correct families and three scenarios in all four languages', () => {
  const {dom, d, change, writes} = fixture();
  for (const lang of ['fr', 'it', 'en', 'es']) {
    change('#hp-language', lang);
    assert.equal(d.querySelector('.hp-phone').lang, lang);
    for (const won of [0, 7, 9]) {
      change('#hp-scenario', String(won));
      assert.equal(d.querySelectorAll('.hp-step').length, 9);
      assert.equal(d.querySelectorAll('.hp-done').length, won);
      assert.equal(d.querySelectorAll('[aria-current="step"]').length, won === 9 ? 0 : 1);
      assert.equal(d.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'), String(won));
      assert.equal(d.querySelectorAll('.hp-step button[aria-pressed="true"]').length, 1);
      const symbols = [...d.querySelectorAll('.hp-step button > span:last-child')].map(e => e.textContent[0]);
      assert.deepEqual(symbols, ['⌖','⌖','▦','➤','▦','➤','▦','➤','⌖']);
      for (const button of d.querySelectorAll('.hp-step button')) {
        button.click();
        const id = Number(button.dataset.id);
        assert.equal(d.querySelector('#hp-play').disabled, id > won + 1);
        assert.ok(d.querySelector('#hp-name').textContent);
        assert.ok(d.querySelector('#hp-description').textContent);
        assert.doesNotMatch(d.querySelector('.hp-detail').textContent, /undefined/);
      }
    }
  }
  assert.deepEqual(writes, []);
  dom.window.close();
});

test('A02: future territory stays secret, replay is simulated, selections survive language changes', () => {
  const {dom, d, change, writes} = fixture();
  d.querySelector('[data-id="9"]').click();
  assert.doesNotMatch(d.querySelector('.hp-detail').textContent, /Ostuni/);
  assert.doesNotMatch(d.querySelector('[data-id="9"]').getAttribute('aria-label'), /Ostuni/);
  d.querySelector('#hp-play').click();
  assert.equal(d.querySelector('#hp-response').textContent, '');
  d.querySelector('[data-id="2"]').click();
  assert.equal(d.querySelector('#hp-name').textContent, 'Gallipoli');
  assert.equal(d.querySelector('#hp-play').textContent, 'Rejouer ce niveau');
  d.querySelector('#hp-play').click();
  assert.match(d.querySelector('#hp-response').textContent, /Aperçu.*2/);
  change('#hp-language', 'it');
  assert.equal(d.querySelector('[data-id="2"]').getAttribute('aria-pressed'), 'true');
  assert.equal(d.querySelector('#hp-name').textContent, 'Gallipoli');
  assert.equal(d.querySelector('#hp-play').textContent, 'Rigioca il livello');
  assert.equal(d.querySelectorAll('.hp-done').length, 7);
  assert.deepEqual(writes, []);
  dom.window.close();
});
