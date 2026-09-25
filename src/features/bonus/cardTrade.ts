import { BONUS_MAPS, type BonusKey } from './bonusData';
import { getUnlockedKeys } from './bonusStorage';

const STORAGE_KEY='hirundu_card_inventory_v1';
const DEVICE_KEY='hirundu_card_device_v1';
const PREFIX='HIRUNDU-CARD-1.';
const MAX_AGE=15*60*1000;

type Pending={id:string;card:BonusKey;createdAt:number};
type State={version:1;cards:Partial<Record<BonusKey,number>>;received:Record<string,number>;pending:Pending|null};
type Offer={type:'offer';version:1;id:string;card:BonusKey;sender:string;issuedAt:number};
type Receipt={type:'receipt';version:1;offerId:string;card:BonusKey;receiver:string;issuedAt:number};

function validKey(value:unknown):value is BonusKey{return typeof value==='string'&&Object.prototype.hasOwnProperty.call(BONUS_MAPS,value);}
function id(){return globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;}
function device(){let value=localStorage.getItem(DEVICE_KEY);if(!value){value=id();localStorage.setItem(DEVICE_KEY,value);}return value;}
function blank():State{return{version:1,cards:{},received:{},pending:null};}
function write(state:State){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));window.dispatchEvent(new Event('hirundu:cards'));return state;}
function encode(value:Offer|Receipt){const bytes=new TextEncoder().encode(JSON.stringify(value));let binary='';bytes.forEach(byte=>binary+=String.fromCharCode(byte));return PREFIX+btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
function decode(raw:string):Offer|Receipt{if(!raw.startsWith(PREFIX))throw Error('not-hirundu');const body=raw.slice(PREFIX.length).replaceAll('-','+').replaceAll('_','/');const padded=body+'='.repeat((4-body.length%4)%4);const binary=atob(padded);const parsed=JSON.parse(new TextDecoder().decode(Uint8Array.from(binary,char=>char.charCodeAt(0))));if(parsed?.version!==1||!validKey(parsed.card)||typeof parsed.issuedAt!=='number'||Date.now()-parsed.issuedAt>MAX_AGE||parsed.issuedAt>Date.now()+60000)throw Error('invalid');return parsed;}

export function readCardInventory():State{
 let state=blank();try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(saved?.version===1&&saved.cards&&saved.received)state={...state,...saved};}catch{}
 getUnlockedKeys().forEach(key=>{state.cards[key]=Math.max(1,Number(state.cards[key])||0);});
 return state;
}
export function addTestDuplicate(key:BonusKey='otranto'){const state=readCardInventory();state.cards[key]=Math.max(1,Number(state.cards[key])||0)+1;return write(state);}
export function createCardOffer(card:BonusKey){const state=readCardInventory();if((state.cards[card]||0)<2)throw Error('no-duplicate');const offer:Offer={type:'offer',version:1,id:id(),card,sender:device(),issuedAt:Date.now()};state.pending={id:offer.id,card,createdAt:offer.issuedAt};write(state);return{offer,token:encode(offer)};}
export function inspectCardOffer(raw:string){const offer=decode(raw);if(offer.type!=='offer'||offer.sender===device())throw Error('invalid-offer');const state=readCardInventory();if(state.received[offer.id])throw Error('already-received');return offer;}
export function acceptCardOffer(raw:string){const offer=inspectCardOffer(raw);const state=readCardInventory();state.cards[offer.card]=(state.cards[offer.card]||0)+1;state.received[offer.id]=Date.now();write(state);const receipt:Receipt={type:'receipt',version:1,offerId:offer.id,card:offer.card,receiver:device(),issuedAt:Date.now()};return{offer,receipt,token:encode(receipt)};}
export function completeCardReceipt(raw:string){const receipt=decode(raw);if(receipt.type!=='receipt')throw Error('invalid-receipt');const state=readCardInventory();if(!state.pending||state.pending.id!==receipt.offerId||state.pending.card!==receipt.card||(state.cards[receipt.card]||0)<2)throw Error('no-pending');state.cards[receipt.card]=(state.cards[receipt.card]||0)-1;state.pending=null;write(state);return{card:receipt.card,state};}
export function cancelPendingOffer(){const state=readCardInventory();state.pending=null;return write(state);}
