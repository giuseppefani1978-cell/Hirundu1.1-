import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
test('A06 live: image anchoring, clock-only animation, canvas restoration, toggle, reduced motion and languages',async()=>{
  const dom=new JSDOM('<html lang="fr"><button id="sceneryToggle"></button><p id="sceneryHint"></p></html>',{runScripts:'outside-only'});
  const media={matches:false,addEventListener(_,fn){this.change=fn;}};
  dom.window.matchMedia=()=>media;
  dom.window.eval(readFileSync('public/level8-flight/scenery-effects.js','utf8'));
  let lines=[],stack=[];
  const ctx={globalAlpha:.4,strokeStyle:'original',lineWidth:9,lineCap:'butt',save(){stack.push([this.globalAlpha,this.strokeStyle,this.lineWidth,this.lineCap]);},restore(){[this.globalAlpha,this.strokeStyle,this.lineWidth,this.lineCap]=stack.pop();},beginPath(){},moveTo(x,y){lines.push([x,y,this.globalAlpha]);},quadraticCurveTo(){},stroke(){}};
  const draw=(x=0,y=0,t=2)=>{lines=[];dom.window.HirunduScenery.draw(ctx,x,y,720,1280,t);return lines;};
  const first=draw();assert.equal(first.length,42);assert.deepEqual(draw(),first,'Frozen clock freezes effects');
  const shifted=draw(20,30);first.forEach((p,i)=>{assert.ok(Math.abs(shifted[i][0]-p[0]-20)<1e-8);assert.ok(Math.abs(shifted[i][1]-p[1]-30)<1e-8);assert.ok(p[2]<=.4*.145);});
  assert.notDeepEqual(draw(0,0,4),first);
  assert.deepEqual([ctx.globalAlpha,ctx.strokeStyle,ctx.lineWidth,ctx.lineCap],[.4,'original',9,'butt']);
  const button=dom.window.document.getElementById('sceneryToggle');button.click();assert.equal(draw().length,0);button.click();assert.equal(draw().length,42);
  media.matches=true;media.change();assert.equal(draw().length,0);assert.equal(button.disabled,true);
  media.matches=false;media.change();
  for(const [lang,label] of [['fr','Reflets'],['it','Riflessi'],['en','Reflections'],['es','Reflejos']]){
    dom.window.document.documentElement.lang=lang;await new Promise(r=>setTimeout(r,0));assert.ok(button.title.startsWith(label));
  }
  dom.window.close();
});
test('A06 is wired only into both coast image passes, before obstacles, with existing clock',()=>{
  const game=readFileSync('public/level8-flight/game.js','utf8');
  assert.equal((game.match(/HirunduScenery\?\.draw/g)||[]).length,2);
  assert.ok(game.indexOf('HirunduScenery?.draw')<game.indexOf('function draw(){'));
  const html=readFileSync('public/level8-flight/index.html','utf8');
  assert.ok(html.indexOf('scenery-effects.js')<html.indexOf('game.js?v='));
  const effects=readFileSync('public/level8-flight/scenery-effects.js','utf8');
  assert.doesNotMatch(effects,/requestAnimationFrame|setInterval|localStorage|Date\.now|performance\.now/);
});
