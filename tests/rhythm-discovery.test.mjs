import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {createServer} from 'vite';
test('A09 warnings are bounded, muted in pause/battle, optional and advance only on a click',()=>{
 const source=readFileSync('src/legacy/rhythm.js','utf8');assert.equal(source,readFileSync('public/shared/rhythm.js','utf8'));
 const dom=new JSDOM('<html lang="fr"><div id="host"></div><canvas></canvas></html>',{runScripts:'outside-only',url:'https://example.test/',pretendToBeVisual:true}),w=dom.window,d=w.document;
 w.eval(source.replace('export function','function'));let advances=0;
 const r=w.mountRhythm({host:d.getElementById('host'),canvas:d.querySelector('canvas'),advance:()=>advances++});
 const warning=d.querySelector('.hirundu-danger'),button=d.querySelector('.hirundu-advance');
 r.update({playing:true,dangerIn:1.2,canAdvance:false});assert.equal(warning.hidden,true);assert.equal(button.hidden,true);
 r.update({playing:true,dangerIn:.5,canAdvance:true,advanceKind:'targets'});assert.equal(warning.hidden,false);assert.match(button.textContent,/cibles/);assert.equal(advances,0);button.click();button.click();assert.equal(advances,1);
 r.update({playing:false,dangerIn:.5,canAdvance:true});assert.equal(warning.hidden,true);assert.equal(button.hidden,true);button.click();assert.equal(advances,1);
 const check=d.querySelector('input');check.checked=false;check.dispatchEvent(new w.Event('change'));r.update({playing:true,dangerIn:.4});assert.equal(warning.hidden,true);
 for(const language of ['fr','it','en','es']){d.documentElement.lang=language;r.update({playing:true,canAdvance:true,advanceKind:'question'});assert.ok(button.textContent.length>5);}
 r.dispose();assert.equal(d.querySelector('.hirundu-danger'),null);dom.window.close();
});
test('A10 cards preserve real-world passport data, gate locked content, localize, and navigate to their territory',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test/'}),prior={};
 for(const k of ['window','document','localStorage','CustomEvent','IS_REACT_ACT_ENVIRONMENT']){prior[k]=Object.getOwnPropertyDescriptor(globalThis,k);Object.defineProperty(globalThis,k,{value:k==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[k],configurable:true,writable:true});}
 const server=await createServer({server:{middlewareMode:true},appType:'custom',resolve:{alias:{'react-router-dom':new URL('../node_modules/react-router-dom/dist/index.mjs',import.meta.url).pathname}},ssr:{noExternal:['react-router-dom','react-router']}});
 let root;
 try{
  const {MemoryRouter,Routes,Route,useLocation}=await server.ssrLoadModule('react-router-dom');
  const {default:Card}=await server.ssrLoadModule('/src/features/bonus/DiscoveryCard.tsx');const {DISCOVERY_CARDS}=await server.ssrLoadModule('/src/features/bonus/discoveryCards.ts');const {setLang}=await server.ssrLoadModule('/src/i18n.js');
  const d=dom.window.document,storage=dom.window.localStorage;storage.setItem('salentino_passport_v1',JSON.stringify({qrValidated:{otranto:['real']},declaredVisited:{lecce:['declared']}}));const before=storage.getItem('salentino_passport_v1');
  function Destination(){return React.createElement('output',null,useLocation().pathname);}
  async function mount(props){if(root)await act(async()=>root.unmount());root=createRoot(d.getElementById('root'));await act(async()=>root.render(React.createElement(MemoryRouter,null,React.createElement(Routes,null,React.createElement(Route,{path:'/',element:React.createElement(Card,props)}),React.createElement(Route,{path:'*',element:React.createElement(Destination)})))));}
  assert.equal(Object.keys(DISCOVERY_CARDS).length,9);
  for(const [key,data] of Object.entries(DISCOVERY_CARDS)){
   assert.ok(existsSync('public/assets/'+data.image));assert.equal(data.fact.length,4);assert.ok(data.source.startsWith('https://'));
   await mount({mapKey:key,earned:false});assert.equal(d.querySelector('article'),null);
   for(const lang of ['fr','it','en','es']){setLang(lang);await mount({mapKey:key,earned:true});assert.ok(d.querySelector('article').textContent.includes(data.fact[['fr','it','en','es'].indexOf(lang)]));}
  }
  await mount({mapKey:'arneo',earned:true});await act(async()=>d.querySelector('button').click());assert.equal(d.querySelector('output').textContent,'/passport/arneo');
  await mount({mapKey:'itria',earned:false,preview:true});assert.match(d.querySelector('article').textContent,/DEMO/);assert.equal(d.querySelector('button'),null);
  assert.equal(storage.getItem('salentino_passport_v1'),before);
 }finally{if(root)await act(async()=>root.unmount());await server.close();dom.window.close();for(const [k,v] of Object.entries(prior)){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}}
});
