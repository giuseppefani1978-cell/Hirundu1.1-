import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
test('regional content, progression and reset preserve the six-level journey',async()=>{
 const dom=new JSDOM('',{url:'https://example.test/?lang=it'});
 for(const k of ['window','document','localStorage','location','navigator','CustomEvent','StorageEvent'])Object.defineProperty(globalThis,k,{value:k==='window'?dom.window:dom.window[k],configurable:true});
 const server=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
  const {regions,tr}=await server.ssrLoadModule('/src/levels/regions.ts');
  const store=await server.ssrLoadModule('/src/features/bonus/bonusStorage.ts');
  for(const r of regions){assert.equal(r.places.length,10);assert.equal(new Set(r.places.map(p=>p.town)).size,10);
   for(const p of r.places){assert.equal(p.clue.length,4);assert.ok(p.clue.every(v=>v.length>12));assert.equal(tr(p.clue),p.clue[1]);}}
  assert.equal(store.getProgressList().length,6);
  for(const n of [1,2,3,4,5]){store.markLevelWin(n);assert.equal(store.getNextLevel().id,n+1);}
  store.markLevelWin(6);assert.equal(store.getNextLevel(),undefined);
  for(const r of regions){store.unlockBonus(r.key);localStorage.setItem(`region${r.id}_hunt`,'10');}
  assert.ok(store.getItineraryState().every(x=>x.completed));
  store.resetBonusProgress();
  for(const r of regions){assert.equal(localStorage.getItem(`region${r.id}_hunt`),null);assert.equal(store.isBonusUnlocked(r.key),false);}
  assert.equal(store.getNextLevel().id,1);
 }finally{await server.close();dom.window.close();}
});
