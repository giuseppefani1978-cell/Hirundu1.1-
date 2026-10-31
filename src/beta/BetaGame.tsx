import React, { useState } from "react";
import { Provider } from "react-redux";
import App from "../app";
import { store } from "../store";
import { betaRpc } from "./betaApi";
import "leaflet/dist/leaflet.css";
import "../leaflet-icons";
import "../ui/styles.css";
import "../features/comfort/mobile-accessibility.css";

export default function BetaGame(){
 const [open,setOpen] = useState(false);
 const [category,setCategory] = useState("bug");
 const [level,setLevel] = useState("");
 const [message,setMessage] = useState("");
 const [status,setStatus] = useState("");
 const [busy,setBusy] = useState(false);
 async function send(event:React.FormEvent){
   event.preventDefault();setBusy(true);setStatus("");
   try {
     await betaRpc("feedback",{category,level:level.slice(0,30),message:message.trim(),device:navigator.userAgent.slice(0,200)});
     setStatus("Retour enregistré, merci !");setMessage("");
   }catch{setStatus("Impossible d'envoyer le retour. Vérifie ta connexion.");}
   finally {setBusy(false);}
 }
 return <><Provider store={store}><App/></Provider>
 <button type="button" className="hb-report-button" onClick={()=>setOpen(!open)} aria-label="Signaler un problème pendant la bêta">Bêta · Signaler</button>
 {open && <aside className="hb-report" aria-label="Retour bêta"><div className="hb-inline"><h2>Signaler un problème</h2><button type="button" onClick={()=>setOpen(false)} aria-label="Fermer">✕</button></div>
 <form onSubmit={send} className="hb-fields"><label>Catégorie<select value={category} onChange={e=>setCategory(e.target.value)}><option value="bug">Bug</option><option value="idea">Suggestion</option><option value="other">Autre</option></select></label>
 <label>Niveau (facultatif)<input maxLength={30} value={level} onChange={e=>setLevel(e.target.value)} placeholder="L1, L2…"/></label>
 <label>Description<textarea required maxLength={2000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Qu'est-ce qui ne fonctionne pas ?"/></label>
 <button disabled={busy||!message.trim()}>{busy?"Envoi…":"Envoyer le retour"}</button></form><p role="status">{status}</p></aside>}
 </>;
}