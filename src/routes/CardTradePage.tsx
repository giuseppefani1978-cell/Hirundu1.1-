import React,{useEffect,useState} from 'react';
import QRCode from 'qrcode';
import LanguageSelect from '../ui/LanguageSelect';
import QrScanner from '../features/qr/components/QrScanner';
import { LANG } from '../i18n.js';
import { DISCOVERY_CARDS } from '../features/bonus/discoveryCards';
import { BONUS_MAPS,type BonusKey } from '../features/bonus/bonusData';
import { acceptCardOffer,addTestDuplicate,cancelPendingOffer,completeCardReceipt,createCardOffer,inspectCardOffer,readCardInventory } from '../features/bonus/cardTrade';
import { withBase } from '../utils/basePath.js';
import './CardTradePage.css';

const copy={
 fr:{title:'Échange QR direct',intro:'Deux téléphones, aucun compte. Le destinataire scanne l’offre puis l’expéditeur scanne le reçu.',send:'Envoyer un double',receive:'Recevoir une carte',copies:'exemplaires',create:'Créer le QR d’offre',scanOffer:'Scanner l’offre',scanReceipt:'Scanner le reçu',confirm:'Accepter cette carte',cancel:'Annuler l’offre',done:'Transfert terminé',received:'Carte reçue. Montre maintenant ce reçu à l’expéditeur.',test:'Créer un double de test',testHelp:'Ce bouton sert uniquement à essayer le transfert. Il ne valide aucun lieu.',invalid:'QR refusé ou expiré.',expires:'Le QR expire après 15 minutes.',back:'Retour aux cartes'},
 it:{title:'Scambio QR diretto',intro:'Due telefoni, nessun account. Il destinatario scansiona l’offerta, poi il mittente scansiona la ricevuta.',send:'Invia un doppione',receive:'Ricevi una carta',copies:'copie',create:'Crea il QR offerta',scanOffer:'Scansiona l’offerta',scanReceipt:'Scansiona la ricevuta',confirm:'Accetta questa carta',cancel:'Annulla offerta',done:'Trasferimento completato',received:'Carta ricevuta. Mostra ora questa ricevuta al mittente.',test:'Crea un doppione di prova',testHelp:'Questo pulsante serve solo a provare il trasferimento. Non convalida alcun luogo.',invalid:'QR rifiutato o scaduto.',expires:'Il QR scade dopo 15 minuti.',back:'Torna alle carte'},
 en:{title:'Direct QR trade',intro:'Two phones, no account. The recipient scans the offer, then the sender scans the receipt.',send:'Send a duplicate',receive:'Receive a card',copies:'copies',create:'Create offer QR',scanOffer:'Scan offer',scanReceipt:'Scan receipt',confirm:'Accept this card',cancel:'Cancel offer',done:'Transfer complete',received:'Card received. Now show this receipt to the sender.',test:'Create a test duplicate',testHelp:'This button only tests the transfer. It does not validate any place.',invalid:'QR rejected or expired.',expires:'The QR expires after 15 minutes.',back:'Back to cards'},
 es:{title:'Intercambio QR directo',intro:'Dos teléfonos, sin cuenta. El destinatario escanea la oferta y el remitente escanea el recibo.',send:'Enviar un duplicado',receive:'Recibir una tarjeta',copies:'copias',create:'Crear QR de oferta',scanOffer:'Escanear oferta',scanReceipt:'Escanear recibo',confirm:'Aceptar esta tarjeta',cancel:'Cancelar oferta',done:'Transferencia completada',received:'Tarjeta recibida. Muestra ahora este recibo al remitente.',test:'Crear un duplicado de prueba',testHelp:'Este botón solo sirve para probar la transferencia. No valida ningún lugar.',invalid:'QR rechazado o caducado.',expires:'El QR caduca después de 15 minutos.',back:'Volver a las tarjetas'}
};
type ScanMode='offer'|'receipt'|null;
export default function CardTradePage(){
 const t=copy[LANG as keyof typeof copy]||copy.fr;
 const [inventory,setInventory]=useState(readCardInventory),[mode,setMode]=useState<'send'|'receive'>('send'),[scan,setScan]=useState<ScanMode>(null);
 const [offerToken,setOfferToken]=useState(''),[qr,setQr]=useState(''),[incoming,setIncoming]=useState<{token:string;card:BonusKey}|null>(null),[receiptQr,setReceiptQr]=useState(''),[message,setMessage]=useState('');
 const cards=(Object.entries(inventory.cards) as [BonusKey,number][]).filter(([,count])=>count>0);
 useEffect(()=>{const refresh=()=>setInventory(readCardInventory());window.addEventListener('hirundu:cards',refresh);return()=>window.removeEventListener('hirundu:cards',refresh);},[]);
 async function makeOffer(card:BonusKey){try{const result=createCardOffer(card);setOfferToken(result.token);setQr(await QRCode.toDataURL(result.token,{width:300,margin:2,errorCorrectionLevel:'M'}));setMessage('');}catch{setMessage(t.invalid);}}
 function scanned(text:string){setScan(null);try{if(scan==='offer'){const offer=inspectCardOffer(text);setIncoming({token:text,card:offer.card});setMode('receive');}else{const result=completeCardReceipt(text);setMessage(t.done);setOfferToken('');setQr('');setInventory(result.state);}}catch{setMessage(t.invalid);}}
 async function accept(){if(!incoming)return;try{const result=acceptCardOffer(incoming.token);setReceiptQr(await QRCode.toDataURL(result.token,{width:300,margin:2,errorCorrectionLevel:'M'}));setIncoming(null);setMessage(t.received);}catch{setMessage(t.invalid);}}
 function card(key:BonusKey,count?:number){const data=DISCOVERY_CARDS[key];return <article className="card-trade__card"><img src={withBase('assets/'+data.image)} alt=""/><div><h3>{data.name}</h3><p>{BONUS_MAPS[key].title}</p>{count!==undefined&&<strong>{count} {t.copies}</strong>}</div></article>;}
 return <main className="card-trade"><div className="card-trade__inner"><nav><a href="#/trade-preview">← {t.back}</a><LanguageSelect/></nav><header><span>HIRUNDU · COLLECTION</span><h1>{t.title}</h1><p>{t.intro}</p></header>
 <div className="card-trade__tabs"><button aria-pressed={mode==='send'} onClick={()=>setMode('send')}>{t.send}</button><button aria-pressed={mode==='receive'} onClick={()=>setMode('receive')}>{t.receive}</button></div>
 {message&&<p className="card-trade__status" role="status">{message}</p>}
 {mode==='send'&&<section><h2>{t.send}</h2>{cards.map(([key,count])=><div key={key}>{card(key,count)}{count>1&&<button className="trade-primary" onClick={()=>void makeOffer(key)}>{t.create}</button>}</div>)}<button onClick={()=>setInventory(addTestDuplicate())}>{t.test}</button><p><small>{t.testHelp}</small></p>{qr&&<div className="card-trade__qr"><img src={qr} alt={t.create}/><p>{t.expires}</p><button className="trade-primary" onClick={()=>setScan('receipt')}>{t.scanReceipt}</button><button onClick={()=>{cancelPendingOffer();setOfferToken('');setQr('');}}>{t.cancel}</button></div>}</section>}
 {mode==='receive'&&<section><h2>{t.receive}</h2><button className="trade-primary" onClick={()=>setScan('offer')}>{t.scanOffer}</button>{incoming&&<div>{card(incoming.card)}<button className="trade-primary" onClick={()=>void accept()}>{t.confirm}</button></div>}{receiptQr&&<div className="card-trade__qr"><img src={receiptQr} alt={t.scanReceipt}/><p>{t.received}</p></div>}</section>}
 {scan&&<QrScanner onResult={scanned} onClose={()=>setScan(null)} onError={()=>setMessage(t.invalid)}/>}</div></main>;
}
