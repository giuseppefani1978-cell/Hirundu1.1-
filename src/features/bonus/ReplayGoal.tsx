import React,{useEffect,useState} from 'react';
import { LANG } from '../../i18n.js';
import { loadHallOfFame } from '../../hof/storage.js';
import { replayGoal } from './replayGoal.js';
const words={
 fr:['Pour le plaisir de rejouer','Dépasser le meilleur score enregistré ici','Enregistrer un premier score','Meilleur score conservé sur cet appareil','Objectif facultatif : aucun bonus supplémentaire, aucune perte de carte ni nouvelle condition de progression.','Le score utilise les règles habituelles. Le classement peut contenir plusieurs joueurs sur cet appareil.'],
 it:['Per il piacere di rigiocare','Superare il miglior punteggio registrato qui','Registrare un primo punteggio','Miglior punteggio conservato su questo dispositivo','Obiettivo facoltativo: nessun bonus aggiuntivo, nessuna perdita di carte o nuova condizione di avanzamento.','Il punteggio segue le regole abituali. La classifica può includere più giocatori su questo dispositivo.'],
 en:['Just for the joy of replaying','Beat the best score recorded here','Record a first score','Best score retained on this device','Optional goal: no extra reward, no cards lost and no new progression requirement.','Scoring follows the usual rules. The leaderboard may include several players on this device.'],
 es:['Por el placer de volver a jugar','Superar la mejor puntuación registrada aquí','Registrar una primera puntuación','Mejor puntuación guardada en este dispositivo','Objetivo opcional: sin premio adicional, pérdida de tarjetas ni nueva condición de progreso.','La puntuación sigue las reglas habituales. La clasificación puede incluir varios jugadores en este dispositivo.']
};
export default function ReplayGoal({level}:{level:number}){
 const read=()=>replayGoal(loadHallOfFame(`salento_hof_v${level}`));
 const [best,setBest]=useState<number|null>(read);
 useEffect(()=>{const refresh=()=>setBest(read());refresh();window.addEventListener('storage',refresh);window.addEventListener('hof:update',refresh);return()=>{window.removeEventListener('storage',refresh);window.removeEventListener('hof:update',refresh);};},[level]);
 const t=words[LANG as keyof typeof words]||words.fr;
 return <aside className="hp-replay-goal" style={{borderTop:'1px solid #b6cbd8',marginTop:18,paddingTop:14}}>
  <h4 style={{margin:'0 0 8px'}}>✦ {t[0]}</h4><p>{best===null?t[2]:t[1]}</p>
  {best!==null&&<p>{t[3]} : <strong>{best}</strong></p>}
  <p><small>{t[4]} {t[5]}</small></p>
 </aside>;
}
