import React,{useEffect,useRef,useState} from 'react';
import { LANG } from '../i18n.js';
import LanguageSelect from '../ui/LanguageSelect';
import { DISCOVERY_CARDS } from '../features/bonus/discoveryCards';
import { BONUS_MAPS,type BonusKey } from '../features/bonus/bonusData';
import { demoCards,simulateTrade } from '../features/bonus/tradeDemo';
import { withBase } from '../utils/basePath.js';
import './TradePreview.css';
const words={
 fr:['Les cartes voyagent.','Garde tes souvenirs. Fais voyager tes doubles.','Maquette interactive · cartes fictives · aucun envoi réel','Mes cartes','Mes doubles','Découverte en jeu','Remise sur place · exemple','Reçue par échange','exemplaire(s)','double(s) disponible(s)','Proposer un échange','Souvenir conservé','Ton offre','Tu proposes','Offrir ce double','Échanger','Tu souhaites recevoir','Prévisualiser l’offre','Retour','Vue du destinataire · simulation','Accepter dans la démo','Refuser','Échange simulé !','Cadeau simulé !','Ta découverte reste dans ton passeport. Aucun niveau ni aucune visite réelle n’a été validé.','Retour aux cartes','Recommencer la démo','Aucun double disponible. Tes souvenirs restent à toi.','L’envoi par lien ou QR sera étudié ensuite. Cette maquette ne contacte personne.','Tu reçois','En retour','Offre annulée. Aucun exemplaire déplacé.','Voir les découvertes','Une carte reçue ne prouve pas une visite. Les cartes « sur place » ci-dessous sont fictives.'],
 it:['Le carte viaggiano.','Conserva i ricordi. Fai viaggiare i doppioni.','Prototipo interattivo · carte fittizie · nessun invio reale','Le mie carte','I miei doppioni','Scoperta nel gioco','Consegna sul posto · esempio','Ricevuta in scambio','esemplare/i','doppione/i disponibile/i','Proponi uno scambio','Ricordo conservato','La tua offerta','Offri','Regala questo doppione','Scambia','Vorresti ricevere','Anteprima dell’offerta','Indietro','Vista del destinatario · simulazione','Accetta nella demo','Rifiuta','Scambio simulato!','Regalo simulato!','La scoperta resta nel passaporto. Nessun livello o visita reale è stato convalidato.','Torna alle carte','Ricomincia la demo','Nessun doppione disponibile. I tuoi ricordi restano tuoi.','L’invio tramite link o QR sarà studiato in seguito. Questo prototipo non contatta nessuno.','Ricevi','In cambio','Offerta annullata. Nessun esemplare spostato.','Vedi le scoperte','Una carta ricevuta non dimostra una visita. Le carte « sul posto » qui sotto sono fittizie.'],
 en:['Cards travel.','Keep your memories. Send your duplicates on a journey.','Interactive mockup · fictional cards · no real sending','My cards','My duplicates','Discovered in game','Issued on site · example','Received in a trade','copy/copies','duplicate(s) available','Propose a trade','Memory kept','Your offer','You offer','Gift this duplicate','Trade','You would like to receive','Preview offer','Back','Recipient view · simulation','Accept in demo','Decline','Trade simulated!','Gift simulated!','Your discovery stays in your passport. No level or real visit has been validated.','Back to cards','Restart demo','No duplicates available. Your memories stay yours.','Link or QR delivery will be explored later. This mockup contacts nobody.','You receive','In return','Offer cancelled. No copies moved.','View discoveries','Receiving a card does not prove a visit. The “on site” cards below are fictional.'],
 es:['Las tarjetas viajan.','Conserva tus recuerdos. Haz viajar tus duplicados.','Maqueta interactiva · tarjetas ficticias · ningún envío real','Mis tarjetas','Mis duplicados','Descubierta en el juego','Entregada en el lugar · ejemplo','Recibida en intercambio','ejemplar(es)','duplicado(s) disponible(s)','Proponer un intercambio','Recuerdo conservado','Tu oferta','Ofreces','Regalar este duplicado','Intercambiar','Quieres recibir','Vista previa de la oferta','Volver','Vista del destinatario · simulación','Aceptar en la demo','Rechazar','¡Intercambio simulado!','¡Regalo simulado!','Tu descubrimiento sigue en el pasaporte. No se ha validado ningún nivel ni visita real.','Volver a las tarjetas','Reiniciar la demo','No hay duplicados disponibles. Tus recuerdos siguen siendo tuyos.','El envío por enlace o QR se estudiará después. Esta maqueta no contacta con nadie.','Recibes','A cambio','Oferta cancelada. Ningún ejemplar transferido.','Ver descubrimientos','Recibir una tarjeta no demuestra una visita. Las tarjetas « en el lugar » de abajo son ficticias.']
};
export default function TradePreview(){
 const t=words[LANG as keyof typeof words]||words.fr;
 const [cards,setCards]=useState(demoCards),[tab,setTab]=useState(false),[step,setStep]=useState<'cards'|'offer'|'recipient'|'done'>('cards');
 const [give,setGive]=useState<BonusKey>('otranto'),[receive,setReceive]=useState<BonusKey>('messapia'),[gift,setGift]=useState(false),[cancelled,setCancelled]=useState(false);
 const title=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{title.current?.focus();},[step]);
 const doubles=cards.reduce((sum,c)=>sum+Math.max(0,c.copies-1),0);
 function card(key:BonusKey){return <div className="trade-card"><img src={withBase('assets/'+DISCOVERY_CARDS[key].image)} alt=""/><div><small>HIRUNDU · DEMO</small><h3>{DISCOVERY_CARDS[key].name}</h3><p>{BONUS_MAPS[key].title}</p></div></div>;}
 function reset(){setCards(demoCards());setStep('cards');setTab(false);setCancelled(false);setGift(false);}
 return <main className="trade-preview"><div className="trade-preview__inner">
  <nav><a href="#/discovery-preview">← {t[32]}</a><LanguageSelect/></nav>
  <p><a className="trade-primary" href="#/card-trade">QR · {({fr:'Tester un échange entre deux téléphones',it:'Prova uno scambio tra due telefoni',en:'Test a trade between two phones',es:'Probar un intercambio entre dos teléfonos'} as Record<string,string>)[LANG]||'QR'}</a></p>
  <p className="trade-preview__notice">{t[2]}</p>
  <header><span>HIRUNDU · COLLECTION</span><h1 ref={title} tabIndex={-1}>{step==='cards'?t[0]:step==='offer'?t[12]:step==='recipient'?t[19]:gift?t[23]:t[22]}</h1><p>{step==='cards'?t[1]:t[24]}</p></header>
  {step==='cards'&&<>
   <div className="trade-preview__tabs"><button aria-pressed={!tab} onClick={()=>setTab(false)}>{t[3]} · {cards.length}</button><button aria-pressed={tab} onClick={()=>setTab(true)}>{t[4]} · {doubles}</button></div>
   {cancelled&&<p role="status">{t[31]}</p>}
   <p className="trade-preview__hint">{t[33]}</p>
   {tab&&doubles===0&&<p>{t[27]}</p>}
   <div className="trade-preview__grid">{cards.filter(c=>!tab||c.copies>1).map(c=><article key={c.key}>
    {card(c.key)}<div className="trade-preview__meta"><span>{t[c.origin==='game'?5:c.origin==='place'?6:7]}</span><p>{c.copies} {t[8]} · {Math.max(0,c.copies-1)} {t[9]}</p>
    {c.copies>1?<button className="trade-primary" onClick={()=>{setGive(c.key);setGift(false);setReceive('messapia');setCancelled(false);setStep('offer');}}>{t[10]} ↗</button>:<p>✓ {t[11]}</p>}</div>
   </article>)}</div>
  </>}
  {step==='offer'&&<section className="trade-preview__offer">
   <h2>{t[13]} · 1</h2>{card(give)}<p>✓ {t[11]}</p>
   <div className="trade-preview__tabs"><button aria-pressed={!gift} onClick={()=>setGift(false)}>{t[15]}</button><button aria-pressed={gift} onClick={()=>setGift(true)}>{t[14]}</button></div>
   {!gift&&<label className="trade-preview__select">{t[16]}<select value={receive} onChange={e=>setReceive(e.target.value as BonusKey)}>{(['messapia','itria','capo'] as BonusKey[]).map(key=><option key={key} value={key}>{DISCOVERY_CARDS[key].name}</option>)}</select></label>}
   <p>{t[28]}</p><button className="trade-primary" onClick={()=>setStep('recipient')}>{t[17]} →</button><button onClick={()=>setStep('cards')}>{t[18]}</button>
  </section>}
  {step==='recipient'&&<section className="trade-preview__offer">
   <h2>{t[29]}</h2>{card(give)}{!gift&&<><h2>{t[30]}</h2>{card(receive)}</>}
   <p>{t[28]}</p><button className="trade-primary" onClick={()=>{setCards(current=>simulateTrade(current,give,gift?null:receive));setStep('done');}}>{t[20]}</button>
   <button onClick={()=>{setCancelled(true);setStep('cards');}}>{t[21]}</button>
  </section>}
  {step==='done'&&<section className="trade-preview__offer" role="status"><div className="trade-preview__seal" aria-hidden="true">✓</div><h2>{t[11]}</h2><p>{t[24]}</p>{!gift&&card(receive)}<p>{t[2]}</p><button className="trade-primary" onClick={()=>setStep('cards')}>{t[25]}</button></section>}
  <footer><button onClick={reset}>{t[26]}</button><p>{t[2]}</p></footer>
 </div></main>;
}
