import type { BonusKey } from './bonusData';
export type DemoCard = { key:BonusKey; origin:'game'|'place'|'exchange'; copies:number };
export function demoCards():DemoCard[]{return [
 {key:'otranto',origin:'game',copies:2}, {key:'gallipoli',origin:'game',copies:1},
 {key:'lecce',origin:'place',copies:2}, {key:'arneo',origin:'exchange',copies:1}
];}
// Demo only: one retained copy represents the permanent souvenir. No storage/network.
export function simulateTrade(cards:DemoCard[],give:BonusKey,receive:BonusKey|null):DemoCard[]{
 const offered=cards.find(c=>c.key===give);
 if(!offered||offered.copies<2||receive===give)return cards;
 const result=cards.map(c=>({...c,copies:c.key===give?c.copies-1:c.copies}));
 if(receive){const existing=result.find(c=>c.key===receive);if(existing)existing.copies++;else result.push({key:receive,origin:'exchange',copies:1});}
 return result;
}
