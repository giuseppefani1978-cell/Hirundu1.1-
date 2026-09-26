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
