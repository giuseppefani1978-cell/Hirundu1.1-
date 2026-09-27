import test from 'node:test';
import assert from 'node:assert/strict';

class MemoryStorage {
  constructor(values={}){this.values=new Map(Object.entries(values));}
  get length(){return this.values.size;}
  key(index){return [...this.values.keys()][index]??null;}
  getItem(key){return this.values.has(key)?this.values.get(key):null;}
  setItem(key,value){this.values.set(key,String(value));}
  removeItem(key){this.values.delete(key);}
}

test('A14 restore accepts only HIRUNDU backups and never imports real-visit validation',async()=>{
 const localStorage=new MemoryStorage({salentino_passport_v1:'{"real":"current"}'});
 globalThis.window={localStorage,dispatchEvent(){}};
 globalThis.location={origin:'https://test.invalid'};
 const {parseSaveImport,restoreSaveImport}=await import('../src/features/comfort/saveExport.js');
 assert.throws(()=>parseSaveImport('{}'));
 assert.throws(()=>parseSaveImport(JSON.stringify({format:'hirundu-local-backup',version:1,snapshot:{version:1,values:{level1_won:true}}})));
 const raw=JSON.stringify({format:'hirundu-local-backup',version:1,snapshot:{version:1,values:{level1_won:'true',level2_unlocked:'true',salentino_passport_v1:'{"real":"forged"}',unknown_key:'ignored'}}});
 const restored=restoreSaveImport(raw);
 assert.deepEqual(restored.completedLevels,[1]);
 assert.equal(localStorage.getItem('level1_won'),'true');
 assert.equal(localStorage.getItem('level2_unlocked'),'true');
 assert.equal(localStorage.getItem('salentino_passport_v1'),'{"real":"current"}');
 assert.equal(localStorage.getItem('unknown_key'),null);
 delete globalThis.window;delete globalThis.location;
});


test('A14 portable backup restores card inventory and duplicates on another browser',async()=>{
 const browserA=new MemoryStorage({
  level1_won:'true',
  bonus_unlocked_v1:'{"otranto":true}',
  hirundu_card_inventory_v1:JSON.stringify({version:1,cards:{otranto:2},origins:{otranto:{game:2}},received:{offerA:123},redeemed:{},pending:{id:'stale',card:'otranto',createdAt:1}})
 });
 globalThis.window={localStorage:browserA,dispatchEvent(){}};globalThis.localStorage=browserA;globalThis.location={origin:'https://a.invalid'};
 const mod=await import('../src/features/comfort/saveExport.js?cards='+Date.now());
 const raw=mod.prepareSaveExport();
 const parsed=JSON.parse(raw);
 assert.equal(parsed.version,2);assert.equal(parsed.cardInventory.cards.otranto,2);assert.equal(parsed.cardInventory.pending,null);
 const browserB=new MemoryStorage();
 globalThis.window={localStorage:browserB,dispatchEvent(){}};globalThis.localStorage=browserB;globalThis.location={origin:'https://b.invalid'};
 mod.restoreSaveImport(raw);
 const restored=JSON.parse(browserB.getItem('hirundu_card_inventory_v1'));
 assert.equal(restored.cards.otranto,2);assert.equal(restored.origins.otranto.game,2);assert.equal(restored.received.offerA,123);assert.equal(restored.pending,null);
 delete globalThis.window;delete globalThis.localStorage;delete globalThis.location;
});
