import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';

test('A01/A02 real React screens: progress, navigation, languages, locks and rollback', async () => {
  const dom = new JSDOM('<div id="test"></div>', {url:'https://example.org/'});
  const previous = {};
  for (const key of ['window','document','localStorage','CustomEvent','IS_REACT_ACT_ENVIRONMENT']) {
    previous[key] = Object.getOwnPropertyDescriptor(globalThis,key);
    Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:key==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[key]});
  }
  const server = await createServer({server:{middlewareMode:true},appType:'custom',resolve:{alias:{'react-router-dom':new URL('../node_modules/react-router-dom/dist/index.mjs',import.meta.url).pathname}},ssr:{noExternal:['react-router-dom','react-router']}});
  let root;
  try {
    const { MemoryRouter, Routes, Route, useLocation } = await server.ssrLoadModule('react-router-dom');
    const {default:Home} = await server.ssrLoadModule('/src/routes/StartPage.tsx');
    const {default:Journey} = await server.ssrLoadModule('/src/routes/JourneyPage.tsx');
    const {setLang} = await server.ssrLoadModule('/src/i18n.js');
    const d = dom.window.document, storage = dom.window.localStorage;
    const snapshot = () => JSON.stringify(Object.fromEntries(Object.keys(storage).map(k=>[k,storage.getItem(k)])));
    function Destination(){return React.createElement('output',null,useLocation().pathname);}
    async function mount(path='/') {
      if(root) await act(async()=>root.unmount());
      root=createRoot(d.getElementById('test'));
      await act(async()=>root.render(React.createElement(MemoryRouter,{initialEntries:[path]},React.createElement(Routes,null,
        React.createElement(Route,{path:'/',element:React.createElement(Home)}),
        React.createElement(Route,{path:'/journey',element:React.createElement(Journey)}),
        React.createElement(Route,{path:'*',element:React.createElement(Destination)})))));
    }
    const click=async el=>act(async()=>el.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true})));
    await mount();
    assert.match(d.querySelector('.start-page__resume').textContent,/1 \/ 9/);
    const before=snapshot();
    await click(d.querySelector('.start-page__play'));
    assert.equal(d.querySelector('output').textContent,'/level/1');
    assert.equal(snapshot(),before);
    // Non-contiguous legacy save: completed level 4, current level 2, available 5.
    storage.setItem('level1_won','true');storage.setItem('level4_won','true');
    storage.setItem('bonus_unlocked_v1',JSON.stringify({otranto:true}));
    const saved=snapshot();
    await mount('/journey');
    assert.equal(d.querySelectorAll('.hp-done').length,2);
    assert.equal(d.querySelectorAll('.hp-available').length,1);
    assert.match(d.querySelector('[aria-current="step"]').textContent,/2/);
    assert.match(d.querySelector('.hp-summary').textContent,/1 .*map|1 .*carte/);
    await click(d.querySelectorAll('.hp-step button')[8]);
    assert.equal(d.querySelector('#hp-play').disabled,true);
    assert.doesNotMatch(d.querySelector('.hp-detail').textContent,/Ostuni/);
    await click(d.querySelectorAll('.hp-step button')[3]);
    assert.equal(d.querySelector('#hp-play').disabled,false);
    assert.equal(d.querySelector('.hp-card-link'),null); // A win is not proof of map unlock.
    await click(d.querySelector('#hp-play'));
    assert.equal(d.querySelector('output').textContent,'/level/4');
    assert.equal(snapshot(),saved);
    for(const lang of ['fr','it','en','es']) {
      setLang(lang);
      await mount('/journey');
      assert.equal(d.querySelectorAll('.hp-step').length,9);
      assert.doesNotMatch(d.querySelector('main').textContent,/undefined|Démonstration/);
    }
    for(let i=1;i<=9;i++)storage.setItem(`level${i}_won`,'true');
    await mount();
    await click(d.querySelector('.start-page__play'));
    assert.equal(d.querySelectorAll('.hp-done').length,9);
    assert.equal(d.querySelector('[aria-current="step"]'),null);
    await mount('/?home=original');
    assert.match(d.querySelector('main, .start-page').textContent,/v9 · TEST/);
    assert.equal(d.querySelector('.start-page--player'),null);
  } finally {
    if(root)await act(async()=>root.unmount());
    await server.close();dom.window.close();
    for(const [key,desc]of Object.entries(previous)){if(desc)Object.defineProperty(globalThis,key,desc);else delete globalThis[key];}
  }
});
