import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

test('received card survives inventory re-read and receiver finish is idempotent', async () => {
 const domA=new JSDOM('',{url:'https://trade-a.invalid/'});
 const domB=new JSDOM('',{url:'https://trade-b.invalid/'});
 const keys=['window','document','localStorage','sessionStorage','CustomEvent','Event','__HIRUNDU_TEST_EPHEMERAL_IDENTITY__'];
 const old=Object.fromEntries(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const use=(dom)=>keys.forEach(key=>Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:key==='__HIRUNDU_TEST_EPHEMERAL_IDENTITY__'?true:key==='window'?dom.window:key==='document'?dom.window.document:dom.window[key]}));
 use(domA);
 const server=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
  const trade=await server.ssrLoadModule('/src/features/bonus/cardTrade.ts');
  trade.recordGameVictoryCard('otranto',false);
  trade.recordGameVictoryCard('otranto',true);
  const offer=await trade.createCardOffer('otranto','lecce');
  use(domB);
  trade.recordGameVictoryCard('lecce',false);
  trade.recordGameVictoryCard('lecce',true);
  const receipt=await trade.acceptCardOffer(offer.token);
  use(domA);
  const confirmation=await trade.completeCardReceipt(receipt.token);
  trade.finishSenderTrade(confirmation.confirmation.offerId);
  use(domB);
  const first=trade.finishReceiverAfterReceipt(offer.offer.id);
  assert.equal(first.cards.otranto,1);
  assert.equal(first.origins.otranto.exchange,1);
  const stored=domB.window.localStorage.getItem('hirundu_card_inventory_v1');
  assert.ok(stored);
  const reread=trade.readCardInventory();
  assert.equal(reread.cards.otranto,1);
  assert.equal(reread.origins.otranto.exchange,1);
  assert.equal(reread.confirmed[offer.offer.id]>0,true);
  const repeated=trade.finishReceiverAfterReceipt(offer.offer.id);
  assert.equal(repeated.cards.otranto,1);
  assert.equal(domB.window.localStorage.getItem('hirundu_card_inventory_v1'),stored);
 }finally{
  await server.close();
  domA.window.close();domB.window.close();
  for(const [key,desc] of Object.entries(old)){if(desc)Object.defineProperty(globalThis,key,desc);else delete globalThis[key];}
 }
});
