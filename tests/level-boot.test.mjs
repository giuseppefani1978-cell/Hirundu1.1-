import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

for (const language of ['fr','it','en','es']) test(`nine hunts and victory routing work in ${language}`, async () => {
 const dom = new JSDOM('<div id="root"></div>',{url:`https://example.test/Hirundu1.1-/?lang=${language}`,pretendToBeVisual:true});
 const w=dom.window;
 for(const key of ['window','document','localStorage','location','navigator','Event','CustomEvent','HTMLElement','Image','screen']) Object.defineProperty(globalThis,key,{value:key==='window'?w:w[key],configurable:true,writable:true});
 const errors=[];
 globalThis.alert=msg=>errors.push(String(msg));globalThis.prompt=()=> { throw new Error('Native prompt must not interrupt the game'); };
 globalThis.Image = function() { const img=w.document.createElement('img'); Object.defineProperty(img,'src',{get(){return img.getAttribute('src');},set(value){img.setAttribute('src',value);queueMicrotask(()=>img.onload?.());}}); return img; };
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
 w.Audio=class extends w.EventTarget {paused=true;error=null; play(){this.paused=false;return Promise.resolve();} pause(){this.paused=true;} };

 const frames=new Map();let counter=0;
 w.requestAnimationFrame=fn=>{frames.set(++counter,fn);return counter;};w.cancelAnimationFrame=id=>frames.delete(id);
 globalThis.requestAnimationFrame=w.requestAnimationFrame;globalThis.cancelAnimationFrame=w.cancelAnimationFrame;
 const server=await createServer({server:{middlewareMode:true},appType:'custom', plugins:[{
  name:'test-only-battle-outcome', enforce:'post',
  transform(code,id) {
   if(id.endsWith('/src/features/qr/routes/RealMap.tsx')) return code.replace('import { useNavigate, useParams } from "react-router-dom";', 'import Router from "react-router-dom"; const {useNavigate,useParams}=Router;');
   if(id.endsWith('/src/battle.js')) return code + '\nexport { _endBattle as finishBattleForTest };';
  }
 }]});
 try {
  const Shell=(await server.ssrLoadModule('/src/legacy/LegacyGameShell.tsx')).default;
  const {bootLegacyLevel,getNextLevelId}=await server.ssrLoadModule('/src/legacy/bootLevel.ts');
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
  for(const n of [1,2,3,4,5,6,7,8,9]) {
   w.document.body.innerHTML=renderToStaticMarkup(React.createElement(Shell,{level:n}));
   transitions.queueLevelTransition({targetLevel:n, subtitle:'ANCIEN TEXTE FRANÇAIS', startLabel:'ANCIEN BOUTON FRANÇAIS'});
   const dispose=await bootLegacyLevel(n);
   if(n===3){
    const iframe=w.document.getElementById('hirundu-level3-rebound');
    assert.ok(iframe,'level 3 boots the replacement runtime');
    assert.equal(new URL(iframe.src).searchParams.get('lang'),language);
    const send=(data,source=iframe.contentWindow,origin=w.location.origin)=>w.dispatchEvent(new w.MessageEvent('message',{source,origin,data:{source:'hirundu-level3',...data}}));
    send({type:'victory',score:1200,leaves:10,elapsed:30},w);
    assert.equal(w.localStorage.getItem('level3_won'),null,'foreign frame cannot award victory');
    send({type:'victory',score:1200,leaves:10,elapsed:30},iframe.contentWindow,'https://untrusted.test');
    assert.equal(w.localStorage.getItem('level3_won'),null,'foreign origin cannot award victory');
    send({type:'victory',score:1200,leaves:9,elapsed:30});
    assert.equal(w.localStorage.getItem('level3_won'),null,'incomplete hunt cannot award victory');
    send({type:'victory',score:1200,leaves:10,elapsed:30});
    assert.equal(w.localStorage.getItem('level3_won'),'true');
    assert.equal(storage.isBonusUnlocked('lecce'),true);
    let next=0;const onNext=()=>next++;w.document.addEventListener('lecce:unlocked',onNext);
    send({type:'continue'});assert.equal(next,1,'continue uses the existing level route');
    w.document.removeEventListener('lecce:unlocked',onNext);
    dispose?.();assert.equal(w.document.getElementById('hirundu-level3-rebound'),null,'unmount removes isolated runtime');
    frames.clear();continue;
   }
   assert.ok(!w.document.getElementById('subtitleP').textContent.includes('ANCIEN'), 'saved text cannot override current language');
   assert.ok(!w.document.getElementById('startBtn').textContent.includes('ANCIEN'));
   assert.equal(w.document.getElementById('hudLabel').textContent, n===9 ? {fr:'Cristaux',it:'Cristalli',en:'Crystals',es:'Cristales'}[language] : n===8 ? {fr:'Amphores',it:'Anfore',en:'Amphorae',es:'Ánforas'}[language] : n===7 ? {fr:'Olives',it:'Olive',en:'Olives',es:'Aceitunas'}[language] : n===6 ? {fr:'Pins',it:'Pini',en:'Pines',es:'Pinos'}[language] : n===5 ? {fr:'Gouttes',it:'Gocce',en:'Drops',es:'Gotas'}[language] : n===4 ? {fr:'Coquillages',it:'Conchiglie',en:'Shells',es:'Conchas'}[language] : n===1 ? t.hudStars : t['level'+n].hudLabel);
   assert.equal(w.document.getElementById('replayFloat').textContent, t.replay);
   const nameInput=w.document.getElementById('playerName');
   assert.equal(!!nameInput,n===1,'only the first level asks for a name');
   if(nameInput) nameInput.value='Tester';
   w.document.getElementById('startBtn').click();
   assert.deepEqual(errors,[],`level ${n} start errors`);
   assert.equal(w.document.getElementById('overlay').style.display,'none',`level ${n} starts`);
   // Execute a real game frame; no screenshots or browser claims are inferred.
   const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(1000));
   assert.deepEqual(errors,[],`level ${n} frame errors`);
   assert.equal(w.localStorage.getItem('player_name'),'Tester');
   assert.equal(w.document.querySelectorAll('#__bonus_cta, #__otranto_bonus_link, #__gallipoli_bonus_link, #__lecce_bonus_link').length,0);
   dispose?.();frames.clear();
  }
  for (const n of [1,2,3,4,5,6,7,8,9]) {
   w.document.body.innerHTML=renderToStaticMarkup(React.createElement(Shell,{level:n}));
   const dispose = await bootLegacyLevel(n, undefined, {testBattle:true});
   if(n===3){
    const iframe=w.document.getElementById('hirundu-level3-rebound');
    assert.equal(new URL(iframe.src).searchParams.get('test'),'battle');
    w.localStorage.removeItem('level3_won');
    w.dispatchEvent(new w.MessageEvent('message',{source:iframe.contentWindow,origin:w.location.origin,data:{source:'hirundu-level3',type:'victory',score:1000,leaves:10,elapsed:10}}));
    assert.equal(w.localStorage.getItem('level3_won'),null,'direct battle practice does not unlock progression');
    dispose?.();frames.clear();continue;
   }
   assert.ok(w.document.getElementById('__battle_intro__'), 'shortcut opens battle intro for level '+n);
   assert.equal(w.document.getElementById('playerName'),null,'saved name not requested again');
   const {copy}=await server.ssrLoadModule('/src/ui/copy.js');
   assert.ok(w.document.getElementById('__battle_intro__').textContent.includes(copy.rotateLandscape || copy.battleOrientation));
   const start = w.document.getElementById('__battle_start_btn');
   assert.equal(start.disabled,false,'portrait and timers do not block starting');
   start.click(); start.click();
   const engine = await server.ssrLoadModule('/src/battle.js');
   for(let attempt=0;attempt<100 && !engine.isBattleActive();attempt++) await new Promise(resolve=>setTimeout(resolve,10));
   assert.equal(engine.isBattleActive(),true,'shortcut starts the actual battle wrapper for level '+n);
   if(n>=4){
    const width=w.innerWidth,height=w.innerHeight;
    w.innerWidth=390;w.innerHeight=844;w.dispatchEvent(new w.Event('resize'));
    assert.equal(w.document.getElementById('__battle_rotate__').style.display,'flex','portrait displays rotation guidance');
    w.innerWidth=844;w.innerHeight=390;w.dispatchEvent(new w.Event('resize'));
    assert.equal(w.document.getElementById('__battle_rotate__').style.display,'none','landscape releases the battle');
    w.innerWidth=width;w.innerHeight=height;
   }
   for (let retry=0;retry<2;retry++) {
    engine.finishBattleForTest(false);
    await new Promise(resolve=>setTimeout(resolve,1));
    assert.ok(w.document.body.classList.contains('mode-battle'),'defeat retains battle canvas');
    w.document.getElementById('__battle_replay_btn').click();
    assert.equal(engine.isBattleActive(),true,'retry restarts the battle');
    const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(performance.now()));
    assert.ok(frames.size>0,'wrapper render loop survives retry');
   }
   engine.disposeBattle();
   dispose?.();frames.clear();
   assert.equal(w.document.getElementById('__battle_intro__'),null,'battle intro cleaned on exit');
  }
  // Inject only the outcome in the test loader; execute the actual end screen,
  // click handler and progress writes. Routing is owned by the React level flow.
  const battle = await server.ssrLoadModule('/src/battle.js');
  battle.setupBattleInputs();
  let victories = 0;
  battle.setBattleCallbacks({onWin:()=> { victories++; }});
  for (const [foe,level] of [['jelly',1],['crow',2],['sputacchina',3],['nacra',4],['scirocco',5],['resino',6],['macina',7],['argillo',8],['calcara',9]]) {
   w.location.hash='/level/'+level;
   battle.startBattle(foe);
   battle.finishBattleForTest(true);
   assert.equal(w.location.hash,'#/level/'+level,'victory waits for the player to continue');
   const continueButton=w.document.getElementById('__battle_replay_btn');
   continueButton.click(); continueButton.click();
   assert.equal(victories,level,'one victory callback per battle');
   assert.equal(w.location.hash,'#/level/'+level,'battle engine must not own navigation');
   assert.equal(getNextLevelId(level), level < 9 ? level + 1 : null, 'app flow knows the next level');
   assert.equal(storage.getProgressList()[level-1].done,true);
   assert.equal(battle.isBattleActive(),false);
  }
  battle.disposeBattle();
  const passportStore=await server.ssrLoadModule('/src/features/qr/passport/passportStorage.ts');
  passportStore.writePassportStorage({pois:{otranto:['poi_castle']}});
  const PassportPage=(await server.ssrLoadModule('/src/features/qr/routes/RealMap.tsx')).default;
  const {passportCopy}=await server.ssrLoadModule('/src/features/qr/passport/passportCopy.ts');
  const markup=renderToStaticMarkup(React.createElement(MemoryRouter,{initialEntries:['/passport/otranto']},React.createElement(Routes,null,React.createElement(Route,{path:'/passport/:id',element:React.createElement(PassportPage,{passportOnly:true})}))));
  assert.ok(markup.includes('Passport Salentino'));
  assert.ok(markup.includes(passportCopy.validated),'existing QR stamp appears on passport');
  assert.ok(!markup.includes('leaflet-container'),'passport does not require loading the map');
  assert.deepEqual(passportStore.readPassportStorage().pois.otranto,['poi_castle']);
 } finally {await server.close();dom.window.close();}
});
