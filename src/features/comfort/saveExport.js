import { DURABLE_PROGRESS_KEY, syncDurableProgress, getProgressSaveResult, restoreDurableProgressSnapshot } from '../../progressStorage.js';

const CARD_INVENTORY_KEY='hirundu_card_inventory_v1';
const CARD_KEYS=new Set(['otranto','gallipoli','lecce','adriatico','capo','arneo','nardo','messapia','itria']);
const CARD_ORIGINS=new Set(['game','partner','physical','exchange','test','legacy']);

function positive(value){const number=Math.floor(Number(value));return Number.isFinite(number)&&number>0?number:0;}
function cleanTimestamps(value){
 const out={};if(!value||typeof value!=='object'||Array.isArray(value))return out;
 for(const [key,stamp] of Object.entries(value)){const n=Number(stamp);if(key&&Number.isFinite(n)&&n>0)out[key]=n;}
 return out;
}
function sanitizeCardInventory(value){
 if(!value||value.version!==1||typeof value!=='object')return null;
 const cards={},origins={};
 if(value.origins&&typeof value.origins==='object'&&!Array.isArray(value.origins)){
  for(const [key,counts] of Object.entries(value.origins)){
   if(!CARD_KEYS.has(key)||!counts||typeof counts!=='object'||Array.isArray(counts))continue;
   const clean={};let total=0;
   for(const [origin,count] of Object.entries(counts)){if(!CARD_ORIGINS.has(origin))continue;const n=positive(count);if(n){clean[origin]=n;total+=n;}}
   if(total){origins[key]=clean;cards[key]=total;}
  }
 }
 if(value.cards&&typeof value.cards==='object'&&!Array.isArray(value.cards)){
  for(const [key,count] of Object.entries(value.cards)){
   if(!CARD_KEYS.has(key)||cards[key])continue;const n=positive(count);if(n){cards[key]=n;origins[key]={legacy:n};}
  }
 }
 return {version:1,cards,origins,received:cleanTimestamps(value.received),redeemed:cleanTimestamps(value.redeemed),confirmed:cleanTimestamps(value.confirmed),pending:null};
}

export function prepareSaveExport(){
 syncDurableProgress();if(!getProgressSaveResult()?.ok)throw Error('Save failed');
 const raw=localStorage.getItem(DURABLE_PROGRESS_KEY);const data=JSON.parse(raw||'null');
 if(data?.version!==1||!data.values||typeof data.values!=='object')throw Error('Missing save');
 let cardInventory=null;try{cardInventory=sanitizeCardInventory(JSON.parse(localStorage.getItem(CARD_INVENTORY_KEY)||'null'));}catch{}
 return JSON.stringify({format:'hirundu-local-backup',version:2,exportedAt:new Date().toISOString(),snapshot:data,cardInventory},null,2);
}

export function parseSaveImport(raw){
 const backup=JSON.parse(raw);
 if(backup?.format!=='hirundu-local-backup'||![1,2].includes(backup?.version)||backup?.snapshot?.version!==1||!backup.snapshot.values||typeof backup.snapshot.values!=='object'||Array.isArray(backup.snapshot.values))throw Error('Invalid save');
 if(Object.values(backup.snapshot.values).some(value=>typeof value!=='string'))throw Error('Invalid values');
 const cardInventory=backup.version>=2&&backup.cardInventory!=null?sanitizeCardInventory(backup.cardInventory):null;
 if(backup.version>=2&&backup.cardInventory!=null&&!cardInventory)throw Error('Invalid card inventory');
 return {snapshot:backup.snapshot,cardInventory};
}

export function restoreSaveImport(raw){
 const backup=parseSaveImport(raw);
 const restored=restoreDurableProgressSnapshot(backup.snapshot);
 if(!restored)throw Error('Restore failed');
 if(backup.cardInventory){
  localStorage.setItem(CARD_INVENTORY_KEY,JSON.stringify(backup.cardInventory));
  try{window.dispatchEvent(new Event('hirundu:cards'));}catch{}
 }
 return restored;
}
