import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {createServer} from 'vite';
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
  const {default:Collection}=await server.ssrLoadModule('/src/features/bonus/PassportCollection.tsx');
  const {collectionCopy}=await server.ssrLoadModule('/src/features/bonus/collectionCopy.ts');
  const keys=Object.keys(DISCOVERY_CARDS);let selected=null;
  const passport={pois:{},qrValidated:{otranto:['poi_cathedral','foreign','poi_cathedral']},declaredVisited:{otranto:['poi_castle']},consultedMaps:[]};
  async function showCollection(count){
   if(root)await act(async()=>root.unmount());root=createRoot(d.getElementById('root'));
   const itinerary=keys.map((key,i)=>({key,id:i+1,name:key,completed:i<count,available:i<=count}));
   await act(async()=>root.render(React.createElement(Collection,{itinerary,passport,onSelect:key=>selected=key})));
  }
  for(const lang of ['fr','it','en','es']){
   setLang(lang);await showCollection(0);assert.equal(d.querySelectorAll('.passport-collection__tile').length,9);assert.equal(d.querySelectorAll('img').length,0);assert.equal(d.querySelectorAll('.passport-collection__tile button').length,0);
   assert.ok(!d.body.textContent.includes(DISCOVERY_CARDS.itria.name));assert.ok(d.body.textContent.includes(collectionCopy()[9]));
   await showCollection(3);assert.equal(d.querySelector('progress').value,3);assert.equal(d.querySelectorAll('img').length,3);
   assert.deepEqual([...d.querySelectorAll('.passport-collection__tile:first-child dd')].map(el=>el.textContent),['1','1']);
   await act(async()=>d.querySelector('.passport-collection__tile button').click());assert.equal(selected,'otranto');
   await act(async()=>d.querySelectorAll('.passport-collection__filters button')[2].click());assert.equal(d.querySelectorAll('.passport-collection__tile').length,6);assert.equal(d.querySelectorAll('img').length,0);
   await showCollection(9);assert.equal(d.querySelector('progress').value,9);assert.ok(d.body.textContent.includes(collectionCopy()[4]));
  }
  assert.equal(storage.getItem('salentino_passport_v1'),before);
 }finally{if(root)await act(async()=>root.unmount());await server.close();dom.window.close();for(const [k,v] of Object.entries(prior)){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}}
});
