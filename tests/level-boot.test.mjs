import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('all three real hunt modules boot and start without runtime exceptions', async () => {
 const dom = new JSDOM('<div id="root"></div>',{url:'https://example.test/Hirundu1.1-/?lang=it',pretendToBeVisual:true});
 const w=dom.window;
 for(const key of ['window','document','localStorage','location','navigator','Event','CustomEvent','HTMLElement','Image']) Object.defineProperty(globalThis,key,{value:key==='window'?w:w[key],configurable:true,writable:true});
 const errors=[];
 globalThis.alert=msg=>errors.push(String(msg));globalThis.prompt=()=> 'Tester';
 w.scrollTo=()=>{};w.matchMedia=()=>({matches:false});
 const drawing=new Proxy({measureText:()=>({width:100}),getImageData:()=>({data:new Uint8ClampedArray(4)})},{get:(obj,key)=>obj[key]??(()=>{})});
 w.HTMLCanvasElement.prototype.getContext=()=>drawing;
 class AudioContext {
  state='running'; currentTime=0;destination={};
  resume(){return Promise.resolve();}
  createGain(){return {gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return this},disconnect(){}};}
  createBuffer(){return {};}
  createBufferSource(){return {connect(){},start(){}};}
  createOscillator(){return {frequency:{value:0},connect(){return this},start(){},stop(){},disconnect(){}};}
 }
 w.AudioContext=AudioContext;
 const frames=new Map();let counter=0;
 w.requestAnimationFrame=fn=>{frames.set(++counter,fn);return counter;};w.cancelAnimationFrame=id=>frames.delete(id);
 globalThis.requestAnimationFrame=w.requestAnimationFrame;globalThis.cancelAnimationFrame=w.cancelAnimationFrame;
 const server=await createServer({server:{middlewareMode:true},appType:'custom'});
 try {
  const Shell=(await server.ssrLoadModule('/src/legacy/LegacyGameShell.tsx')).default;
  const {bootLegacyLevel}=await server.ssrLoadModule('/src/legacy/bootLevel.ts');
  const storage = await server.ssrLoadModule('/src/features/bonus/bonusStorage.ts');
  storage.markLevelWin(1);
  assert.equal(storage.getResumeTarget().id, 2, 'victory 1 offers hunt 2');
  storage.markLevelWin(2);
  assert.equal(storage.getResumeTarget().id, 3, 'victory 2 offers hunt 3');
  w.localStorage.setItem('bonus_gallipoli_unlocked','1');
  assert.equal(storage.getProgressList()[1].unlocked,true,'legacy numeric flags remain usable');
  const transitions = await server.ssrLoadModule('/src/level_transition.js');
  for(const n of [1,2,3]) {
   w.document.body.innerHTML=renderToStaticMarkup(React.createElement(Shell));
   transitions.queueLevelTransition({targetLevel:n, subtitle:'ANCIEN TEXTE FRANÇAIS', startLabel:'ANCIEN BOUTON FRANÇAIS'});
   const dispose=await bootLegacyLevel(n);
   assert.ok(!w.document.getElementById('subtitleP').textContent.includes('ANCIEN'), 'saved text cannot override current language');
   assert.ok(!w.document.getElementById('startBtn').textContent.includes('ANCIEN'));
   w.document.getElementById('startBtn').click();
   assert.deepEqual(errors,[],`level ${n} start errors`);
   assert.equal(w.document.getElementById('overlay').style.display,'none',`level ${n} starts`);
   // Execute a real game frame; no screenshots or browser claims are inferred.
   const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(1000));
   assert.deepEqual(errors,[],`level ${n} frame errors`);
   dispose?.();frames.clear();
  }
 } finally {await server.close();dom.window.close();}
});
