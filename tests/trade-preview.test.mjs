import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {createServer} from 'vite';
test('trade demo: duplicate-only, reject, gift, exchange, reset, four languages and zero save mutations',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test/'}),prior={};
 for(const k of ['window','document','localStorage','CustomEvent','IS_REACT_ACT_ENVIRONMENT']){prior[k]=Object.getOwnPropertyDescriptor(globalThis,k);Object.defineProperty(globalThis,k,{value:k==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[k],configurable:true,writable:true});}
 const server=await createServer({server:{middlewareMode:true},appType:'custom'});let root;
 try{
  const {default:Preview}=await server.ssrLoadModule('/src/routes/TradePreview.tsx');
  const {demoCards,simulateTrade}=await server.ssrLoadModule('/src/features/bonus/tradeDemo.ts');
  const {setLang}=await server.ssrLoadModule('/src/i18n.js');
  const initial=demoCards();assert.equal(simulateTrade(initial,'gallipoli','itria'),initial);assert.equal(simulateTrade(initial,'otranto','otranto'),initial);
  const moved=simulateTrade(initial,'otranto','itria');assert.equal(moved.find(c=>c.key==='otranto').copies,1);assert.equal(initial[0].copies,2);assert.equal(moved.at(-1).origin,'exchange');assert.equal(simulateTrade(moved,'otranto','capo'),moved);
  const d=dom.window.document;const storage=dom.window.localStorage;storage.setItem('salentino_passport_v1','unchanged');storage.setItem('level1_won','true');
  let writes=0;const original=dom.window.Storage.prototype.setItem;dom.window.Storage.prototype.setItem=function(...args){writes++;return original.apply(this,args);};
  const click=async(sel,index=0)=>act(async()=>d.querySelectorAll(sel)[index].click());
  for(const lang of ['fr','it','en','es']){
   setLang(lang);writes=0;
   root=createRoot(d.getElementById('root'));await act(async()=>root.render(React.createElement(Preview)));
   assert.equal(d.querySelectorAll('.trade-preview__grid article').length,4);
   assert.equal(d.querySelectorAll('.trade-preview__grid .trade-primary').length,2);
   await click('.trade-preview__tabs button',1);assert.equal(d.querySelectorAll('.trade-preview__grid article').length,2);
   await click('.trade-primary');assert.ok(d.querySelector('select option[value="messapia"]'));
   await click('.trade-preview__offer>.trade-primary');assert.equal(d.querySelectorAll('.trade-preview__offer .trade-card').length,2);
   await click('.trade-preview__offer>button',1);assert.ok(d.querySelector('[role="status"]'));assert.equal(d.querySelectorAll('.trade-preview__grid .trade-primary').length,2);
   await click('.trade-primary');await click('.trade-preview__offer>.trade-primary');await click('.trade-preview__offer>.trade-primary');
   assert.ok(d.querySelector('.trade-preview__seal'));await click('.trade-primary');assert.equal(d.querySelectorAll('.trade-preview__grid .trade-primary').length,1);
   await click('.trade-primary');await click('.trade-preview__offer .trade-preview__tabs button',1);assert.equal(d.querySelector('.trade-preview__offer select'),null);
   await click('.trade-preview__offer>.trade-primary');assert.equal(d.querySelectorAll('.trade-preview__offer .trade-card').length,1);await click('.trade-preview__offer>.trade-primary');await click('.trade-primary');
   assert.equal(d.querySelectorAll('.trade-preview__grid article').length,0);
   await click('footer button');assert.equal(d.querySelectorAll('.trade-preview__grid article').length,4);
   assert.equal(writes,0,'demo never writes storage');assert.equal(storage.getItem('salentino_passport_v1'),'unchanged');assert.equal(storage.getItem('level1_won'),'true');
   await act(async()=>root.unmount());root=null;
  }
 }finally{if(root)await act(async()=>root.unmount());await server.close();dom.window.close();for(const [k,v]of Object.entries(prior)){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}}
});
