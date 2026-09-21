import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const base=new URL('../public/character-review/',import.meta.url);
test('A05: finite reactions, no autoplay, multilingual, reduced motion stops active effects',()=>{
 const html=readFileSync(new URL('index.html',base),'utf8'),js=readFileSync(new URL('review.js',base),'utf8');
 const dom=new JSDOM(html,{runScripts:'outside-only'}),w=dom.window,d=w.document;
 let runs=0,cancelled=0,change;
 const media={matches:false,addEventListener:(name,fn)=>{change=fn;}};w.matchMedia=()=>media;
 w.Element.prototype.animate=(frames,options)=>{runs++;assert.equal(options.iterations,1);assert.ok(options.duration<=650);assert.ok(frames.every(f=>!f.transform.includes('scale')));return {cancel(){cancelled++;}};};
 w.eval(js);assert.equal(runs,0);
 for(const language of ['fr','it','en','es']){d.querySelector('#language').value=language;d.querySelector('#language').dispatchEvent(new w.Event('change'));
 for(const button of d.querySelectorAll('[data-event]')){button.click();assert.ok(d.querySelector('#event-label').textContent);assert.equal(d.querySelectorAll('[aria-pressed="true"]').length,1);assert.doesNotMatch(d.body.textContent,/undefined/);}}
 assert.equal(runs,40);const previous=cancelled;
 d.querySelector('#reduced').checked=true;d.querySelector('#reduced').dispatchEvent(new w.Event('change'));assert.ok(cancelled>previous);
 d.querySelector('#replay').click();assert.equal(runs,40);
 d.querySelector('#reduced').checked=false;media.matches=true;change();d.querySelector('[data-event="impact"]').click();assert.equal(runs,40);assert.equal(d.querySelector('#reduced').disabled,true);
 assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\(|setInterval|Audio/);
 for(const img of d.querySelectorAll('img'))assert.ok(existsSync(new URL(img.getAttribute('src'),base)));
 dom.window.close();
});
