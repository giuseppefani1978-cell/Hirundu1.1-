import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LANG } from '../../i18n.js';
import { withBase } from '../../utils/basePath.js';
import { BONUS_MAPS,type BonusKey } from './bonusData';
import { DISCOVERY_CARDS } from './discoveryCards';
import './DiscoveryCard.css';
const labels={
 fr:['Acquis dans le jeu','Dans ton passeport','Illustration du territoire','Le savais-tu ?','Voir la source','Ouvrir le passeport','Une découverte virtuelle ne valide pas une visite réelle.'],
 it:['Ottenuto nel gioco','Nel tuo passaporto','Illustrazione del territorio','Lo sapevi?','Leggi la fonte','Apri il passaporto','Una scoperta virtuale non convalida una visita reale.'],
 en:['Earned in the game','In your passport','Territory illustration','Did you know?','View source','Open passport','A virtual discovery does not validate a real visit.'],
 es:['Obtenido en el juego','En tu pasaporte','Ilustración del territorio','¿Lo sabías?','Ver fuente','Abrir pasaporte','Un descubrimiento virtual no valida una visita real.']
};
export default function DiscoveryCard({mapKey,earned,passport=false,preview=false}:{mapKey:BonusKey;earned:boolean;passport?:boolean;preview?:boolean}){
 const navigate=useNavigate();if(!earned&&!preview)return null;
 const data=DISCOVERY_CARDS[mapKey];if(!data)return null;
 const language=(LANG in labels?LANG:'fr') as keyof typeof labels;
 const t=labels[language],index=['fr','it','en','es'].indexOf(language);
 return <article className="discovery-keepsake" data-discovery={mapKey}>
  <figure><img src={withBase('assets/'+data.image)} alt="" loading="lazy"/><figcaption>{t[2]}</figcaption></figure>
  <div className="discovery-keepsake__body"><span className="discovery-keepsake__stamp">{preview?'A10 · DEMO':'✓ '+t[0]}</span><h3>{data.name}</h3>
  <p><strong>{t[3]}</strong> {data.fact[index]}</p><a href={data.source} target="_blank" rel="noopener noreferrer">{t[4]} ↗</a>
  {!preview&&<p className="discovery-keepsake__saved">📔 {t[1]} · {BONUS_MAPS[mapKey].title}</p>}
  {!passport&&!preview&&<button className="app-button" onClick={()=>navigate('/passport/'+mapKey)}>{t[5]}</button>}
  <small>{t[6]}</small></div>
 </article>;
}
