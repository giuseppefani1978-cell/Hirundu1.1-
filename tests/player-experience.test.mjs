import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const source=readFileSync('src/legacy/playerExperience.js','utf8');
test('static and bundled experience modules are identical',()=>{
 assert.equal(readFileSync('public/shared/player-experience.js','utf8'),source);
 assert.equal(readFileSync('public/shared/player-experience.css','utf8'),readFileSync('src/legacy/playerExperience.css','utf8'));
});
for(const family of ['classic','arkanoid','flight'])test(`${family}: actual counters, pause/battle isolation, replayable guide, no gameplay writes, cleanup`,()=>{
 const dom=new JSDOM('<html lang="fr"><div id="intro"></div><div id="pause"></div><canvas></canvas><b id="count"></b></html>',{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
 let next,id=0,cancelled=0,animated=0;w.requestAnimationFrame=fn=>{next=fn;return ++id;};w.cancelAnimationFrame=()=>cancelled++;
 const media={matches:false,addEventListener(){},removeEventListener(){}};w.matchMedia=()=>media;
 w.HTMLElement.prototype.animate=()=>{animated++;return {cancel(){}};};w.eval(source.replace('export function','function'));
 let state=Object.freeze({playing:false,settings:true,found:0,bonus:0,damage:0}),host=d.getElementById('intro');
 const config={family,canvas:d.querySelector('canvas'),snapshot:()=>state,muted:()=>true,host:()=>host,counter:()=>d.getElementById('count')};
 const experience=w.mountPlayerExperience(config);next(0);assert.equal(experience.panel.parentElement,host);
 const guide=experience.panel.querySelector('[data-ui=guide]');assert.equal(guide.hidden,false);
 experience.panel.querySelector('[data-ui=skip]').click();assert.equal(w.localStorage.getItem('hirundu_tutorial_'+family+'_v1'),'skipped');
 experience.panel.querySelector('[data-ui=review]').click();assert.equal(guide.hidden,false);
 for(let i=0;i<3;i++)experience.panel.querySelector('[data-ui=next]').click();assert.equal(w.localStorage.getItem('hirundu_tutorial_'+family+'_v1'),'viewed');
 state=Object.freeze({...state,playing:true,settings:false});next(10);
 state=Object.freeze({...state,bonus:1});next(20);assert.match(d.querySelector('.hirundu-action-status').textContent,/Bonus/);assert.ok(animated>0);
 state=Object.freeze({...state,found:1});next(30);assert.match(d.querySelector('.hirundu-action-status').textContent,/Lieu/);
 media.matches=true;const before=animated;state=Object.freeze({...state,damage:1});next(40);assert.equal(animated,before);assert.match(d.querySelector('.hirundu-action-status').textContent,/Dommage/);
 state=Object.freeze({...state,playing:false,settings:true});host=d.getElementById('pause');next(50);assert.equal(experience.panel.parentElement,host);assert.equal(d.querySelector('.hirundu-action-status').textContent,'');
 state=Object.freeze({...state,settings:false,bonus:10,damage:5});next(60);assert.equal(experience.panel.hidden,true);assert.equal(d.querySelector('.hirundu-action-status').textContent,'');
 for(const language of ['fr','it','en','es']){d.documentElement.lang=language;next(70);assert.ok(experience.panel.querySelector('[data-ui=instruction]').textContent.length>30);}
 experience.dispose();assert.ok(cancelled);assert.equal(d.querySelector('.hirundu-action-status'),null);dom.window.close();
});
