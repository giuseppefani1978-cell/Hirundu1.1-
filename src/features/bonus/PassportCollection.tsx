import React, { useState } from 'react';
import { BONUS_MAPS, type BonusKey } from './bonusData';
import { DISCOVERY_CARDS } from './discoveryCards';
import { collectionCopy } from './collectionCopy';
import { withBase } from '../../utils/basePath.js';
import type { ItineraryStep } from './bonusStorage';
import type { PassportStorage } from '../qr/passport/passportStorage';
import { passportCopy } from '../qr/passport/passportCopy';
import './PassportCollection.css';

export default function PassportCollection({itinerary,passport,onSelect}:{itinerary:ItineraryStep[];passport:PassportStorage;onSelect:(key:BonusKey)=>void}) {
 const t=collectionCopy(),[filter,setFilter]=useState(0);
 const earned=itinerary.filter(s=>s.completed).length;
 return <section className="passport-collection" aria-label={t[1]}>
  <header><span className="passport-collection__eyebrow">HIRUNDU · {t[1]}</span><h2>{earned} / {itinerary.length} · {t[2]}</h2>
   <progress value={earned} max={itinerary.length || 1} aria-label={t[2]}/>
   <p>{earned===itinerary.length ? t[4] : `${itinerary.length-earned} · ${t[3]}`}</p><p>{t[9]}</p><small>{passportCopy.hint}</small>
  </header>
  <div className="passport-collection__filters">{[0,1,2].map(i=><button type="button" key={i} aria-pressed={filter===i} onClick={()=>setFilter(i)}>{t[16+i]}</button>)}</div>
  <div className="passport-collection__grid">{itinerary.filter(s=>filter===0||(filter===1?s.completed:!s.completed)).map(step=>{
   const data=DISCOVERY_CARDS[step.key],ids:readonly string[]=BONUS_MAPS[step.key].poiIds;
   // Intersect with this territory's configured POIs; never count stale or foreign IDs.
   const count=(field:'qrValidated'|'declaredVisited')=>new Set((passport[field][step.key]||[]).filter(id=>ids.includes(id))).size;
   return <article className="passport-collection__tile" key={step.key} data-earned={step.completed}>
    {step.completed ? <img src={withBase('assets/'+data.image)} alt="" loading="lazy"/> : <div className="passport-collection__secret" aria-hidden="true">?</div>}
    <div><small>{t[11]} {step.id}</small><h3>{step.completed?BONUS_MAPS[step.key].title:t[5]}</h3>
     {step.completed ? <><p>✓ {t[2]}</p><dl><div><dt>📝 {t[7]}</dt><dd>{count('declaredVisited')}</dd></div><div><dt>✓ {t[8]}</dt><dd>{count('qrValidated')}</dd></div></dl><button type="button" onClick={()=>onSelect(step.key)}>{data.name} →</button></> : <p>{t[6]}</p>}
    </div>
   </article>;
  })}</div>
 </section>;
}
