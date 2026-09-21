import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const base=new URL('../public/scenery-review/',import.meta.url);
test('A06 bounded sequence, identical background, language, comparison and reduced motion',()=>{
 const dom=new JSDOM(readFileSync(new URL('index.html',base),'utf8'),{runScripts:'outside-only'}),w=dom.window,d=w.document;
 const media={matches:false,addEventListener:(name,fn)=>{media.change=fn;}};w.matchMedia=()=>media;
 let finish,delay;w.setTimeout=(fn,ms)=>{finish=fn;delay=ms;return 1;};w.clearTimeout=()=>{finish=null;};
 const source=readFileSync(new URL('review.js',base),'utf8');w.eval(source);
 const background=d.querySelector('#background'),src=background.getAttribute('src');
 assert.ok(!d.querySelector('#scene').classList.contains('playing'));assert.equal(finish,undefined);
 for(const lang of ['fr','it','en','es']){d.querySelector('#language').value=lang;d.querySelector('#language').dispatchEvent(new w.Event('change'));assert.equal(d.documentElement.lang,lang);assert.doesNotMatch(d.body.textContent,/undefined/);}
 d.querySelector('#play').click();assert.equal(delay,6000);assert.ok(d.querySelector('#scene').classList.contains('playing'));
 d.querySelector('#compare').click();assert.equal(d.querySelector('#compare').getAttribute('aria-pressed'),'true');assert.equal(background.getAttribute('src'),src);
 d.querySelector('#compare').click();finish();assert.ok(!d.querySelector('#scene').classList.contains('playing'));
 d.querySelector('#play').click();d.querySelector('#reduced').checked=true;d.querySelector('#reduced').dispatchEvent(new w.Event('change'));assert.equal(finish,null);assert.ok(d.querySelector('#play').disabled);
 d.querySelector('#reduced').checked=false;media.matches=true;media.change();assert.ok(d.querySelector('#reduced').disabled);assert.ok(d.querySelector('#play').disabled);
 for(const img of d.querySelectorAll('img'))assert.ok(existsSync(new URL(img.getAttribute('src'),base)));
 assert.doesNotMatch(source,/localStorage|sessionStorage|fetch\(|requestAnimationFrame|setInterval/);
 const css=readFileSync(new URL('style.css',base),'utf8');assert.doesNotMatch(css,/infinite/);assert.match(css,/pointer-events:none/);assert.match(css,/prefers-reduced-motion/);
 dom.window.close();
});
