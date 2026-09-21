import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const script=readFileSync('public/level8-flight/player-feedback.js','utf8');
function setup(saved={}){
 const dom=new JSDOM(readFileSync('public/level8-flight/index.html','utf8'),{url:'https://example.test/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;
 for(const [k,v] of Object.entries(saved))w.localStorage.setItem(k,v);
 const media={matches:false,addEventListener(_,fn){this.change=fn;}};w.matchMedia=()=>media;
 let sounds=0;w.AudioContext=class{state='suspended';currentTime=0;destination={};async resume(){this.state='running';}suspend(){this.state='suspended';}close(){this.state='closed';}createOscillator(){return {frequency:{},connect(){},disconnect(){},start(){sounds++;},stop(){}};}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}};
 w.eval('var S={mode:"playing",coffee:0,rustico:0,round:0,immune:0,clock:0,x:50,y:100};var musicEnabled=true;var next={},ticks=0,draws=0;function tick(dt){ticks++;S.clock+=dt;Object.assign(S,next);next={};}function draw(){draws++;}var ctx={globalAlpha:1,save(){this.saved=this.globalAlpha;},restore(){this.globalAlpha=this.saved;},beginPath(){},arc(){},stroke(){},fill(){}};');
 w.eval(script);return {dom,w,media,sounds:()=>sounds};
}
test('A07 real events invoke engine once, respect mute, expire, reduced motion, canvas restore',async()=>{
 const {dom,w,media,sounds}=setup();const d=w.document;
 w.next={coffee:1};w.tick(.1);assert.equal(w.ticks,1);assert.match(d.getElementById('a07Status').textContent,/Bonus/);assert.equal(sounds(),0);
 w.draw();assert.equal(w.draws,1);assert.equal(w.ctx.globalAlpha,1);
 w.next={round:1};w.tick(.1);assert.match(d.getElementById('a07Status').textContent,/Lieu/);
 w.next={immune:1.5};w.tick(.1);assert.match(d.getElementById('a07Status').textContent,/Dommage/);
 w.tick(2);assert.equal(d.getElementById('a07Status').textContent,'');
 d.getElementById('actionSound').checked=true;d.getElementById('testActionSound').click();await new Promise(r=>setTimeout(r,0));assert.equal(sounds(),2);assert.match(d.getElementById('actionAudioStatus').textContent,/Son prêt/);
 w.musicEnabled=false;d.getElementById('testActionSound').click();await new Promise(r=>setTimeout(r,0));assert.equal(sounds(),2);assert.match(d.getElementById('actionAudioStatus').textContent,/Musique coupée/);
 media.matches=true;media.change();w.next={round:10,mode:'battleReady'};w.tick(.1);assert.match(d.getElementById('a07Status').textContent,/Chasse terminée/);
 w.dispatchEvent(new w.Event('pagehide'));dom.window.close();
});
test('A07 explicit audio failure, A08 viewed/skipped/replay and four languages',async()=>{
 const {dom,w}=setup();const d=w.document;
 w.AudioContext=class{state='suspended';async resume(){throw Error('blocked');}};d.getElementById('actionSound').checked=true;d.getElementById('testActionSound').click();await new Promise(r=>setTimeout(r,0));assert.match(d.getElementById('actionAudioStatus').textContent,/bloqué/);
 assert.equal(d.getElementById('flightGuide').hidden,false);for(let i=0;i<3;i++)d.getElementById('guideNext').click();assert.equal(w.localStorage.getItem('hirundu_tutorial_flight_v1'),'viewed');assert.equal(d.getElementById('flightGuide').hidden,true);
 d.getElementById('replayGuide').click();assert.match(d.getElementById('guideText').textContent,/1\/3/);d.getElementById('guideSkip').click();assert.equal(w.localStorage.getItem('hirundu_tutorial_flight_v1'),'skipped');
 for(const [lang,label] of [['fr','Tester'],['it','Prova'],['en','Test'],['es','Probar']]){d.documentElement.lang=lang;await new Promise(r=>setTimeout(r,0));assert.ok(d.getElementById('testActionSound').textContent.startsWith(label));}
 dom.window.close();const next=setup({'hirundu_tutorial_flight_v1':'viewed'});assert.equal(next.w.document.getElementById('flightGuide').hidden,true);next.dom.window.close();
});
