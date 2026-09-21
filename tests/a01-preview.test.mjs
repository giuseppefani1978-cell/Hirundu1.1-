import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const html = await readFile(new URL('../public/preview-a01.html', import.meta.url), 'utf8');
test('A01 preview covers first visit, resume, completion and four languages without writes', () => {
  const dom = new JSDOM(html, {url:'https://example.test/Hirundu1.1-/preview-a01.html',runScripts:'dangerously',beforeParse(w){
    w.localStorage.setItem('level1_won','true');
    w.localStorage.setItem('level2_won','true');
    w.localStorage.setItem('player_name','Existing player');
    w.Storage.prototype.setItem = () => {throw new Error('Preview must never save');};
    w.Storage.prototype.removeItem = () => {throw new Error('Preview must never delete');};
    w.Storage.prototype.clear = () => {throw new Error('Preview must never reset');};
  }});
  try {
    const w=dom.window,d=w.document;
    const select=(id,value)=>{d.getElementById(id).value=value;d.getElementById(id).dispatchEvent(new w.Event('change'));};
    assert.equal(d.getElementById('territory').textContent,'Lecce');
    assert.equal(d.getElementById('count').textContent,'2 / 9');
    for(const lang of ['fr','it','en','es']){
      select('language',lang);
      assert.equal(d.documentElement.lang,lang);
      for(const node of d.querySelectorAll('[data-t]')) assert.ok(node.textContent.length);
      for(const [scenario,count] of [['first',0],['return',2],['complete',9]]){
        select('scenario',scenario);
        assert.equal(d.getElementById('count').textContent,`${count} / 9`);
        for(const id of ['continue','passport','discoveries','settings']){
          d.getElementById(id).click();assert.ok(d.getElementById('feedback').textContent);
        }
      }
    }
    select('scenario','saved');
    assert.equal(d.getElementById('territory').textContent,'Lecce');
    assert.equal(w.localStorage.getItem('level2_won'),'true');
    assert.equal(w.localStorage.getItem('player_name'),'Existing player');
    assert.equal(w.location.pathname,'/Hirundu1.1-/preview-a01.html');
  }finally{dom.window.close();}
});

test('A01 inaccessible storage does not claim to recover or erase a save',()=>{
  const dom=new JSDOM(html,{runScripts:'dangerously'});
  try{assert.match(dom.window.document.getElementById('source').textContent,/inaccessible/);}finally{dom.window.close();}
});
