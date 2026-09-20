import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

test('C02 discovery menu: cancel is harmless, replay preserves progress, confirmed reset clears it', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://example.test/?lang=fr', pretendToBeVisual: true });
  for (const key of ['window','document','localStorage','location','navigator','CustomEvent','StorageEvent','Event','HTMLElement']) {
    Object.defineProperty(globalThis,key,{value:key==='window'?dom.window:dom.window[key],configurable:true});
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const server = await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',plugins:[{
    name:'test-router-interop',enforce:'post',transform(code,id){
      if(id.endsWith('/src/routes/BonusHubPage.tsx')) return code.replace(/import \{ useLocation, useNavigate \} from ['"]react-router-dom['"];?/, "import Router from 'react-router-dom'; const {useLocation,useNavigate}=Router;");
    }
  }]});
  let root;
  try {
    const Hub = (await server.ssrLoadModule('/src/routes/BonusHubPage.tsx')).default;
    const storage = await server.ssrLoadModule('/src/features/bonus/bonusStorage.ts');
    storage.markLevelWin(1); storage.markLevelWin(2);
    const mount = async () => {
      root = createRoot(document.getElementById('root'));
      await act(async () => root.render(React.createElement(MemoryRouter,{initialEntries:['/bonus']},
        React.createElement(Routes,null,
          React.createElement(Route,{path:'/bonus',element:React.createElement(Hub)}),
          React.createElement(Route,{path:'/level/:id',element:React.createElement('p',null,'Hunt route')})))));
    };
    const click = async (label) => {
      const button = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === label);
      assert.ok(button, label);
      await act(async () => button.click());
    };
    await mount();
    await click('Nouvelle partie'); await click('Annuler');
    assert.equal(storage.getResumeTarget().id, 3);
    await click('Rejouer · Niveau 1 · Otranto');
    assert.match(document.body.textContent, /Hunt route/);
    assert.equal(storage.getResumeTarget().id, 3);
    await act(async () => root.unmount());
    await mount();
    await click('Nouvelle partie'); await click('Oui, recommencer');
    assert.equal(storage.getResumeTarget().id, 1);
    assert.equal(localStorage.getItem('level1_won'), null);
    assert.equal(localStorage.getItem('level2_won'), null);
  } finally {
    if(root) await act(async () => root.unmount());
    await server.close(); dom.window.close(); delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
