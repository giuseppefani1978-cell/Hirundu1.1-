import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';

test('QR direct trade requires a duplicate, a recipient receipt and cannot validate twice',async()=>{
 const domA=new JSDOM('',{url:'https://test.invalid/'}),domB=new JSDOM('',{url:'https://test.invalid/'}),prior={};
 for(const key of ['window','document','localStorage','CustomEvent','Event'])prior[key]=Object.getOwnPropertyDescriptor(globalThis,key);
 const use=dom=>{for(const key of ['window','document','localStorage','CustomEvent','Event'])Object.defineProperty(globalThis,key,{value:key==='window'?dom.window:key==='document'?dom.window.document:dom.window[key],configurable:true,writable:true});};
 use(domA);const server=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
  const trade=await server.ssrLoadModule('/src/features/bonus/cardTrade.ts');
  assert.throws(()=>trade.createCardOffer('otranto'));
  trade.addTestDuplicate('otranto');
  const offer=trade.createCardOffer('otranto');
  assert.equal(trade.readCardInventory().cards.otranto,2);
  use(domB);const accepted=trade.acceptCardOffer(offer.token);
  assert.equal(trade.readCardInventory().cards.otranto,1);
  assert.throws(()=>trade.acceptCardOffer(offer.token));
  use(domA);const completed=trade.completeCardReceipt(accepted.token);
  assert.equal(completed.state.cards.otranto,1);
  assert.throws(()=>trade.completeCardReceipt(accepted.token));
 }finally{await server.close();domA.window.close();domB.window.close();for(const [key,value]of Object.entries(prior)){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}}
});
