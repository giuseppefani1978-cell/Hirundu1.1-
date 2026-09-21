import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const base=new URL('../public/design-review/',import.meta.url);
test('A03/A04 isolated review: languages, layouts, controls and no saved progress',()=>{
 const html=readFileSync(new URL('index.html',base),'utf8'),script=readFileSync(new URL('review.js',base),'utf8');
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://example.org/design-review/'}),w=dom.window,d=w.document;
 let writes=0;w.Storage.prototype.setItem=()=>writes++;w.Storage.prototype.removeItem=()=>writes++;w.Storage.prototype.clear=()=>writes++;
 w.eval(script);
 const change=(id,value)=>{d.querySelector(id).value=value;d.querySelector(id).dispatchEvent(new w.Event('change'));};
 for(const lang of ['fr','it','en','es']){change('#language',lang);assert.equal(d.documentElement.lang,lang);
 for(const mode of ['classic','arkanoid','flight','battle']){change('#mode',mode);assert.ok(d.querySelector('#stage').classList.contains(mode));
 for(const version of ['reference','proposed']){change('#version',version);assert.ok(d.querySelector('#stage').classList.contains(version));assert.doesNotMatch(d.body.textContent,/undefined/);}
 }}
 change('#mode','flight');const bird=d.querySelector('.bird'),before=bird.style.left;d.querySelector('.flight-pad .left').click();assert.notEqual(bird.style.left,before);assert.ok(d.querySelector('#interaction').textContent);
 change('#size','320');assert.equal(d.querySelector('#stage').style.width,'320px');assert.equal(d.querySelector('#stage').style.height,'568px');
 assert.equal(writes,0);assert.doesNotMatch(script,/localStorage|sessionStorage|fetch\(|unlockBonus|markLevelWin/);
 for(const img of d.querySelectorAll('img'))assert.ok(existsSync(new URL(img.getAttribute('src'),base)));
 dom.window.close();
});
