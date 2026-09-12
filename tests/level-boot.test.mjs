import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

for (const language of ['fr','it','en','es']) test(`three hunts and victory routing work in ${language}`, async () => {
 const dom = new JSDOM('<div id="root"></div>',{url:`https://example.test/Hirundu1.1-/?lang=${language}`,pretendToBeVisual:true});
 const w=dom.window;
 for(const key of ['window','document','localStorage','location','navigator','Event','CustomEvent','HTMLElement','Image','screen']) Object.defineProperty(globalThis,key,{value:key==='window'?w:w[key],configurable:true,writable:true});
 const errors=[];
 globalThis.alert=msg=>errors.push(String(msg));globalThis.prompt=()=> { throw new Error('Native prompt must not interrupt the game'); };
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
 const server=await createServer({server:{middlewareMode:true},appType:'custom', plugins:[{
  name:'test-only-battle-outcome', enforce:'post',
  transform(code,id) {
   if(id.endsWith('/src/battle.js')) return code + '\nexport { _endBattle as finishBattleForTest };';
  }
 }]});
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
  const {t, LANG} = await server.ssrLoadModule('/src/i18n.js');
  assert.equal(LANG, language);
  for(const n of [1,2,3]) {
   w.document.body.innerHTML=renderToStaticMarkup(React.createElement(Shell));
   transitions.queueLevelTransition({targetLevel:n, subtitle:'ANCIEN TEXTE FRANÇAIS', startLabel:'ANCIEN BOUTON FRANÇAIS'});
   const dispose=await bootLegacyLevel(n);
   assert.ok(!w.document.getElementById('subtitleP').textContent.includes('ANCIEN'), 'saved text cannot override current language');
   assert.ok(!w.document.getElementById('startBtn').textContent.includes('ANCIEN'));
   assert.equal(w.document.getElementById('hudLabel').textContent, n===1 ? t.hudStars : t['level'+n].hudLabel);
   assert.equal(w.document.getElementById('replayFloat').textContent, t.replay);
   w.document.getElementById('playerName').value='Tester';
   w.document.getElementById('startBtn').click();
   assert.deepEqual(errors,[],`level ${n} start errors`);
   assert.equal(w.document.getElementById('overlay').style.display,'none',`level ${n} starts`);
   // Execute a real game frame; no screenshots or browser claims are inferred.
   const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(1000));
   assert.deepEqual(errors,[],`level ${n} frame errors`);
   dispose?.();frames.clear();
  }
  // Inject only the outcome in the test loader; execute the actual end screen,
  // click handler, progress writes and hash routing. No production cheat exists.
  const battle = await server.ssrLoadModule('/src/battle.js');
  battle.setupBattleInputs();
  let victories = 0;
  battle.setBattleCallbacks({onWin:()=> { victories++; }});
  for (const [foe,key,level] of [['jelly','otranto',1],['crow','gallipoli',2],['sputacchina','lecce',3]]) {
   w.location.hash='/level/'+level;
   battle.startBattle(foe);
   battle.finishBattleForTest(true);
   assert.equal(w.location.hash,'#/level/'+level,'victory waits for the player to continue');
   const continueButton=w.document.getElementById('__battle_replay_btn');
   continueButton.click(); continueButton.click();
   assert.equal(victories,level,'one victory callback per battle');
   assert.equal(w.location.hash,'#/bonus/'+key,'victory opens discoveries instead of the real map');
   assert.equal(storage.getProgressList()[level-1].done,true);
   assert.equal(battle.isBattleActive(),false);
  }
  battle.disposeBattle();
 } finally {await server.close();dom.window.close();}
});
