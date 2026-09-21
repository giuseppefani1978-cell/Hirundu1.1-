import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {createPractice} from '../src/legacy/practice-model.js';
test('practice assets remain identical for bundled and standalone levels',()=>{
 for(const file of ['practice-model.js','practice.js','practice.css'])assert.equal(readFileSync('src/legacy/'+file,'utf8'),readFileSync('public/shared/'+file,'utf8'));
});
for(const family of ['classic','flight'])test(`${family}: only real movement and target contact complete practice`,()=>{
 const model=createPractice(family);for(let i=0;i<50;i++)model.tick(.04);assert.equal(model.state.step,0);assert.equal(model.state.done,false);
 for(let i=0;i<17;i++)model.tick(.04,1,0);assert.equal(model.state.step,1);assert.equal(model.state.done,false);
 for(let i=0;i<15;i++)model.tick(.04,0,-1);assert.equal(model.state.done,true);
});
test('Arkanoid requires paddle movement, launch, actual collision and target contact; misses allow retry',()=>{
 const model=createPractice('arkanoid');model.launch();assert.equal(model.state.launched,false);
 for(let i=0;i<4;i++)model.tick(.04,1);assert.equal(model.state.step,1);model.launch();
 for(let i=0;i<50;i++)model.tick(.04,-1);assert.equal(model.state.misses,1);assert.equal(model.state.done,false);
 for(let i=0;i<18;i++)model.tick(.04,1);model.launch();
 for(let i=0;i<26;i++)model.tick(.04);assert.equal(model.state.step,2);assert.equal(model.state.done,false);assert.ok(model.state.vy<0);
 for(let i=0;i<25;i++)model.tick(.04);assert.equal(model.state.done,true);
});
test('L3 creates and caches real music players; hunt/battle reuse and mute work',()=>{
 const src=readFileSync('public/level3-arkanoid/game.js','utf8');
 const block=src.slice(src.indexOf('function ensureLevelTrack'),src.indexOf('function setLevelMusicEnabled'));
 let created=[];class Audio{constructor(src){this.src=src;this.plays=0;this.pauses=0;created.push(this);}play(){this.plays++;return Promise.resolve();}pause(){this.pauses++;}}
 const api=new Function('Audio',`let huntMusic=null,battleMusic=null,musicEnabled=true;const state={mode:'ready'};${block};return {ensureLevelTrack,playLevelMusic,mute(){musicEnabled=false;},pauseLevelMusic};`)(Audio);
 const hunt=api.ensureLevelTrack('hunt');assert.equal(typeof hunt.play,'function');assert.equal(api.ensureLevelTrack('hunt'),hunt);assert.equal(created.length,1);
 api.playLevelMusic('hunt');assert.equal(hunt.plays,1);api.playLevelMusic('battle');assert.equal(created.length,2);assert.equal(created[1].plays,1);assert.ok(hunt.pauses);api.mute();api.playLevelMusic('hunt');assert.equal(hunt.plays,1);api.pauseLevelMusic();assert.ok(created[1].pauses);
});
test('L3 and host-managed L5/L7 resolve their own audio preference without ReferenceError',()=>{
 const code=readFileSync('public/shared/standalone-experience.js','utf8');const expression=code.match(/muted:\(\)=>(.*),\n/)[1];
 for(const key of ['musicEnabled','hostMusicEnabled'])for(const value of [true,false])assert.equal(new Function(`const ${key}=${value};return ${expression};`)(),!value);
});
test('practice modal records completion only after played movement, leaves game saves intact and cleans up',()=>{
 const dom=new JSDOM('<html lang="fr"><div id="host"></div></html>',{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
 let frame,now=0;w.requestAnimationFrame=fn=>{frame=fn;return 1;};w.cancelAnimationFrame=()=>{};
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(obj,key)=>obj[key]||(()=>{}),set:(obj,key,value)=>{obj[key]=value;return true;}});
 w.eval(readFileSync('src/legacy/practice-model.js','utf8').replaceAll('export function','function')+'\n'+readFileSync('src/legacy/practice.js','utf8').replace(/^import .*;$/m,'').replaceAll('export function','function'));
 w.localStorage.setItem('game-save','unchanged');const practice=w.attachPractice({host:d.getElementById('host'),family:'classic'});practice.button.click();assert.ok(d.querySelector('dialog'));assert.equal(w.localStorage.getItem('hirundu_practice_classic_v2'),null);
 frame(now+=40);const dialog=d.querySelector('dialog');const key=(type,k)=>dialog.dispatchEvent(new w.KeyboardEvent(type,{key:k,bubbles:true}));
 key('keydown','ArrowRight');for(let i=0;i<17;i++)frame(now+=40);key('keyup','ArrowRight');key('keydown','ArrowUp');for(let i=0;i<15;i++)frame(now+=40);key('keyup','ArrowUp');
 assert.equal(w.localStorage.getItem('hirundu_practice_classic_v2'),'completed');assert.equal(w.localStorage.getItem('game-save'),'unchanged');assert.match(d.querySelector('.practice-instruction').textContent,/réussi/);
 practice.dispose();assert.equal(d.querySelector('dialog'),null);dom.window.close();
});
