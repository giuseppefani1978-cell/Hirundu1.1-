import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LANG } from '../../i18n.js';
import { withBase } from '../../utils/basePath.js';
import { BONUS_MAPS,type BonusKey } from './bonusData';
import { DISCOVERY_CARDS } from './discoveryCards';
import { collectionCopy } from './collectionCopy';
import './DiscoveryCard.css';
const labels={
 fr:['Acquis dans le jeu','Dans ton passeport','Illustration du territoire','Le savais-tu ?','Voir la source','Ouvrir le passeport','Une découverte virtuelle ne valide pas une visite réelle.','Échange de cartes','Acquis par échange'],
 it:['Ottenuto nel gioco','Nel tuo passaporto','Illustrazione del territorio','Lo sapevi?','Leggi la fonte','Apri il passaporto','Una scoperta virtuale non convalida una visita reale.','Scambio di carte','Acquisito con scambio'],
 en:['Earned in the game','In your passport','Territory illustration','Did you know?','View source','Open passport','A virtual discovery does not validate a real visit.','Trade cards','Acquired by trade'],
 es:['Obtenido en el juego','En tu pasaporte','Ilustración del territorio','¿Lo sabías?','Ver fuente','Abrir pasaporte','Un descubrimiento virtual no valida una visita real.','Intercambio de tarjetas','Adquirido por intercambio']
};
export default function DiscoveryCard({mapKey,earned,passport=false,preview=false,acquiredBy=['game']}:{mapKey:BonusKey;earned:boolean;passport?:boolean;preview?:boolean;acquiredBy?:Array<'game'|'exchange'>}){
 const navigate=useNavigate();if(!earned&&!preview)return null;
 const data=DISCOVERY_CARDS[mapKey];if(!data)return null;
 const language=(LANG in labels?LANG:'fr') as keyof typeof labels;
 const t=labels[language],index=['fr','it','en','es'].indexOf(language);
 return <article className="discovery-keepsake" data-discovery={mapKey}>
  <figure><img src={withBase('assets/'+data.image)} alt="" loading="lazy"/><figcaption>{t[2]}</figcaption></figure>
  <div className="discovery-keepsake__body"><div className="discovery-keepsake__stamps">{preview?<span className="discovery-keepsake__stamp">A10 · DEMO</span>:<>
   {acquiredBy.includes('game')?<span className="discovery-keepsake__stamp">✓ {t[0]}</span>:null}
   {acquiredBy.includes('exchange')?<span className="discovery-keepsake__stamp discovery-keepsake__stamp--exchange">⇄ {t[8]}</span>:null}
  </>}</div><h3>{data.name}</h3>
  <p><strong>{t[3]}</strong> {data.fact[index]}</p><a href={data.source} target="_blank" rel="noopener noreferrer">{t[4]} ↗</a>
  {!preview&&<p className="discovery-keepsake__saved">📔 {t[1]} · {BONUS_MAPS[mapKey].title}</p>}
  {!preview&&<div className="discovery-keepsake__actions">
   {!passport&&<button className="app-button" onClick={()=>navigate('/passport/'+mapKey)}>{t[5]}</button>}
   <button className="app-button" onClick={()=>navigate('/card-trade?card='+mapKey)}>⇄ {t[7]}</button>
   <button className="app-button" onClick={()=>navigate('/poi/'+mapKey+'/realmap')}>{collectionCopy()[10]} ↗</button>
  </div>}
  <small>{t[6]}</small></div>
 </article>;
}
