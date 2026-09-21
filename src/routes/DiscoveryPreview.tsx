import React from 'react';
import DiscoveryCard from '../features/bonus/DiscoveryCard';
import { DISCOVERY_CARDS } from '../features/bonus/discoveryCards';
import type { BonusKey } from '../features/bonus/bonusData';
import LanguageSelect from '../ui/LanguageSelect';
import { LANG } from '../i18n.js';
export default function DiscoveryPreview(){
 const text={fr:'Aperçu A10 — aucune récompense enregistrée',it:'Anteprima A10 — nessun premio registrato',en:'A10 preview — no reward saved',es:'Vista previa A10 — ninguna recompensa guardada'};
 return <main style={{maxWidth:540,margin:'auto',padding:20}}><LanguageSelect/><h1>{text[LANG as keyof typeof text]||text.fr}</h1>
 {Object.keys(DISCOVERY_CARDS).map(key=><DiscoveryCard key={key} mapKey={key as BonusKey} earned={false} preview/>)}</main>;
}
