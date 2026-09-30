import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createServer } from 'vite';

test('iOS installation help is localized, in Settings, and absent for installed apps and Android', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://example.test/' });
  const previous = {};
  for (const key of ['window', 'document', 'navigator', 'localStorage', 'CustomEvent', 'IS_REACT_ACT_ENVIRONMENT']) {
    previous[key] = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true,
      value: key === 'IS_REACT_ACT_ENVIRONMENT' ? true : dom.window[key] });
  }
  let standalone = false;
  window.matchMedia = () => ({ matches: standalone });
  const device = (ua, platform = '', touch = 0) => {
    for (const [key, value] of Object.entries({ userAgent: ua, platform, maxTouchPoints: touch }))
      Object.defineProperty(navigator, key, { configurable: true, value });
  };
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  const root = createRoot(document.getElementById('root'));
  try {
    const { default: Settings } = await server.ssrLoadModule('/src/routes/SettingsPage.tsx');
    const { setLang } = await server.ssrLoadModule('/src/i18n.js');
    device('iPhone Safari');
    for (const [lang, expected] of Object.entries({ fr: 'Partager', it: 'Condividi', en: 'Share', es: 'Compartir' })) {
      await act(async () => { setLang(lang); root.render(React.createElement(Settings)); });
      const help = document.querySelector('.settings-page .ios-install-help');
      assert.ok(help);
      assert.ok(help.textContent.includes(expected));
      assert.equal(help.parentElement.closest('.settings-page') !== null, true);
    }
    standalone = true;
    await act(async () => root.render(React.createElement(Settings)));
    assert.equal(document.querySelector('.ios-install-help'), null);
    standalone = false;
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true });
    await act(async () => root.render(React.createElement(Settings)));
    assert.equal(document.querySelector('.ios-install-help'), null);
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: false });
    device('Android Chrome');
    await act(async () => root.render(React.createElement(Settings)));
    assert.equal(document.querySelector('.ios-install-help'), null);
    device('Macintosh Safari', 'MacIntel', 5);
    await act(async () => root.render(React.createElement(Settings)));
    assert.ok(document.querySelector('.ios-install-help'));
  } finally {
    await act(async () => root.unmount());
    await server.close();
    dom.window.close();
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
