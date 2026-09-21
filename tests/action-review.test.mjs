import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
test('A07 isolated feedback: four events, sound opt-in, reduced motion, family and language, no persistence',()=>{
 const html=readFileSync('public/action-review/index.html','utf8'),js=readFileSync('public/action-review/review.js','utf8');
 const d=new JSDOM(html,{runScripts:'outside-only'}),w=d.window,doc=w.document;
 let animations=0,cancelled=0,audio=0;const media={matches:false,addEventListener(_,fn){this.change=fn;}};
 w.matchMedia=()=>media;w.HTMLElement.prototype.animate=()=>{animations++;return {cancel(){cancelled++;}};};w.AudioContext=function(){audio++;};
 w.eval(js);const click=event=>doc.querySelector(`[data-event="${event}"]`).click();
 click('bonus');assert.match(doc.getElementById('bonus').textContent,/1/);assert.equal(doc.querySelectorAll('#particles i').length,6);assert.equal(audio,0);
 click('discovery');assert.equal(doc.getElementById('target').textContent,'✓');assert.match(doc.getElementById('counter').textContent,/1 \/ 10/);assert.ok(cancelled>0);
 click('damage');assert.equal(doc.getElementById('energy').textContent,'⚡ 88');assert.match(doc.getElementById('feedback').textContent,/⚠/);assert.equal(doc.querySelectorAll('#particles i').length,0);
 click('victory');assert.match(doc.getElementById('feedback').textContent,/★/);
 const before=animations;media.matches=true;media.change();click('bonus');assert.equal(animations,before);assert.equal(doc.querySelectorAll('#particles i').length,0);
 media.matches=false;media.change();doc.getElementById('effects').checked=false;click('discovery');assert.equal(animations,before);assert.match(doc.getElementById('feedback').textContent,/✓/);
 const family=doc.getElementById('family');family.value='arkanoid';family.dispatchEvent(new w.Event('change'));assert.equal(doc.getElementById('paddle').hidden,false);
 for(const lang of ['FR','IT','EN','ES']){doc.getElementById('language').value=lang;doc.getElementById('language').dispatchEvent(new w.Event('change'));assert.equal(doc.documentElement.lang,lang.toLowerCase());click('victory');assert.ok(doc.getElementById('feedback').textContent.length>3);}
 assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\(|setInterval/);w.dispatchEvent(new w.Event('pagehide'));d.window.close();
});
