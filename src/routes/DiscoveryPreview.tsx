import React, { useState } from 'react';
import DiscoveryCard from '../features/bonus/DiscoveryCard';
import { DISCOVERY_CARDS } from '../features/bonus/discoveryCards';
import type { BonusKey } from '../features/bonus/bonusData';
import LanguageSelect from '../ui/LanguageSelect';
import { LANG } from '../i18n.js';
import PassportCollection from '../features/bonus/PassportCollection';
import { collectionCopy } from '../features/bonus/collectionCopy';
import type { ItineraryStep } from '../features/bonus/bonusStorage';
export default function DiscoveryPreview(){
 const [selected,setSelected]=useState<BonusKey>('otranto');
 const keys:BonusKey[]=['otranto','gallipoli','lecce','adriatico','capo','arneo','nardo','messapia','itria'];
 const [count,setCount]=useState(3);
 const itinerary:ItineraryStep[]=keys.map((key,i)=>({id:i+1,key,name:key,completed:i<count,available:i<=count}));
 const t=collectionCopy();
 const text={fr:'Aperçu A10 — aucune récompense enregistrée',it:'Anteprima A10 — nessun premio registrato',en:'A10 preview — no reward saved',es:'Vista previa A10 — ninguna recompensa guardada'};
 return <main className="discovery-preview"><div><LanguageSelect/><h1>A10 + A11</h1><p>{t[15]}</p>
 <a className="app-button" href="#/trade-preview">{({fr:'Tester les échanges · DEMO',it:'Prova gli scambi · DEMO',en:'Try trading · DEMO',es:'Probar intercambios · DEMO'} as Record<string,string>)[LANG]||'DEMO'} →</a>
 <div className="passport-collection__filters">{[0,3,9].map(n=><button className="app-button" key={n} aria-pressed={count===n} onClick={()=>setCount(n)}>{n} / 9</button>)}</div>
 <PassportCollection itinerary={itinerary} passport={{pois:{},qrValidated:{otranto:['poi_cathedral']},declaredVisited:{otranto:['poi_castle']},consultedMaps:[]}} onSelect={key=>{setSelected(key);requestAnimationFrame(()=>document.getElementById('preview-card')?.scrollIntoView({block:'start'}));}}/>
 <section id="preview-card"><h2>{t[14]}</h2><DiscoveryCard mapKey={selected} earned={false} preview/></section>
 <details><summary>{text[LANG as keyof typeof text]||text.fr} · 9</summary>{Object.keys(DISCOVERY_CARDS).map(key=><DiscoveryCard key={key} mapKey={key as BonusKey} earned={false} preview/>)}</details>
 </div></main>;
}
