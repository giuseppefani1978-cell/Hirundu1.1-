import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { regionById, tr, type Words } from './regions';
import { copy } from '../ui/copy.js';
import { withBase } from '../paths';
import { markLevelWin, unlockBonus, getProgressList } from '../features/bonus/bonusStorage';
import LanguageSelect from '../ui/LanguageSelect';
import './RegionLevelPage.css';

const text = {
 intro:['Résous les dix énigmes. Sélectionne un lieu puis confirme ton choix.','Risolvi i dieci enigmi. Seleziona un luogo e conferma la scelta.','Solve ten clues. Select a place, then confirm your choice.','Resuelve diez enigmas. Selecciona un lugar y confirma tu elección.'],
 choose:['Confirmer ce lieu','Conferma questo luogo','Confirm this place','Confirmar este lugar'],
 wrong:['Ce n’est pas ce lieu. Essaie encore.','Non è questo il luogo. Riprova.','That is not the place. Try again.','No es ese lugar. Inténtalo de nuevo.'],
 found:['Lieu découvert !','Luogo scoperto!','Place discovered!','¡Lugar descubierto!'],
 map:['Carte de jeu schématique · lieux réels','Mappa di gioco schematica · luoghi reali','Schematic game map · real places','Mapa de juego esquemático · lugares reales'],
 pause:['Pause','Pausa','Pause','Pausa'],resume:['Reprendre','Riprendi','Resume','Continuar'],
 shoot:['Tirer','Spara','Fire','Disparar'],left:['Gauche','Sinistra','Left','Izquierda'],right:['Droite','Destra','Right','Derecha'],up:['Haut','Su','Up','Arriba'],down:['Bas','Giù','Down','Abajo'],
 ready:['Commencer la bataille','Inizia la battaglia','Start battle','Comenzar la batalla'],
 weak:['Point faible exposé : tire !','Punto debole esposto: spara!','Weak spot exposed: fire!','Punto débil expuesto: ¡dispara!'],
 dodge:['Évite les couloirs rouges.','Evita le corsie rosse.','Avoid the red lanes.','Evita los carriles rojos.'],
 shelter:['Rejoins l’abri vert avant la rafale.','Raggiungi il riparo verde prima della raffica.','Reach the green shelter before the gust.','Llega al refugio verde antes de la ráfaga.'],
 battle:['Déplace-toi à gauche ou à droite pour esquiver. Tire seulement quand le point faible apparaît.','Spostati a sinistra o a destra per schivare. Spara solo quando appare il punto debole.','Move left or right to dodge. Fire only when the weak spot appears.','Muévete a izquierda o derecha para esquivar. Dispara solo cuando aparezca el punto débil.'],
 lost:['Bataille perdue','Battaglia persa','Battle lost','Batalla perdida'],retry:['Recommencer la bataille','Riprova la battaglia','Retry battle','Reintentar batalla'],
 finish:['Les six niveaux sont terminés !','Hai completato i sei livelli!','All six levels complete!','¡Has completado los seis niveles!'],
 saved:['Ta chasse reprend au dernier lieu découvert.','La caccia riprende dall’ultimo luogo scoperto.','Your hunt resumes from the last discovered place.','La búsqueda continúa desde el último lugar descubierto.'],
 music:['Musique','Musica','Music','Música'],lane:['Couloir','Corsia','Lane','Carril'],
 again:['Recommencer cette chasse','Ricomincia questa caccia','Restart this hunt','Reiniciar esta búsqueda'],
 locked:['Termine le niveau précédent pour continuer.','Completa il livello precedente per continuare.','Complete the previous level to continue.','Completa el nivel anterior para continuar.'],
} satisfies Record<string,Words>;
export function attackLanes(id:number,round:number):number[] {
 const lane=round%3;
 return id===5 ? [0,1,2].filter(n=>n!==lane) : id===4 ? [lane,(lane+1)%3] : [lane];
}
export default function RegionLevelPage(){
 const {levelId}=useParams(); const location=useLocation();
 const id=Number(levelId); const region=regionById(id);
 if([4,5,6].includes(id))return <Navigate to={`/level/${id}${location.search}`} replace/>;
 if(!region) return <Navigate to="/" replace/>;
 return <RegionalGame key={`${id}:${location.search}`} id={id}/>;
}
function RegionalGame({id}:{id:number}){
 const region=regionById(id)!; const navigate=useNavigate(); const location=useLocation();
 const test=new URLSearchParams(location.search).get('test');
 const allowed=!!test||getProgressList().find(p=>p.id===id)?.unlocked;
 const load=()=>{try {const n=Number(localStorage.getItem(`region${id}_hunt`));return Number.isInteger(n)&&n>=0&&n<=10?n:0;}catch{return 0;}};
 const [count,setCount]=useState(load); const [selected,setSelected]=useState(0);
 const [phase,setPhase]=useState<'intro'|'hunt'|'battleIntro'|'battle'|'lost'|'won'>(test==='battle'?'battleIntro':'intro');
 const [message,setMessage]=useState(''); const [paused,setPaused]=useState(false);
 const [music,setMusic]=useState(true); const audio=useRef<HTMLAudioElement|null>(null);
 const [fight,setFight]=useState({hp:5,boss:8,lane:1,tick:0,round:0});
 const lane=useRef(1); const lastShot=useRef(0); const winSaved=useRef(false);
 const running=phase==='hunt'||phase==='battle';
 const playMusic=(mode:string)=>{if(!music)return;const a=audio.current;if(!a)return;
 const src=withBase(mode==='battle'?'assets/battle_loop.mp3':'assets/hunt_loop.wav');
 if(a.src!==src)a.src=src;void a.play().catch(()=>{});};
 useEffect(()=>{const a=new Audio();a.loop=true;a.volume=.5;audio.current=a;return()=>{a.pause();a.removeAttribute('src');audio.current=null;};},[]);
 useEffect(()=>{if(running&&!paused&&music)playMusic(phase);else audio.current?.pause();},[phase,paused,music]);
 useEffect(()=>{const hide=()=>{if(document.hidden){setPaused(true);audio.current?.pause();}};
 document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
 useEffect(()=>{if(phase!=='battle'||paused)return;
 const timer=window.setInterval(()=>setFight(f=>{
  const tick=f.tick+1;const hit=tick===20&&attackLanes(id,f.round).includes(lane.current);
  const hp=f.hp-(hit?1:0);
  if(hp<=0)return {...f,hp:0,tick};
  return {...f,hp,tick:tick>=40?0:tick,round:tick>=40?f.round+1:f.round};
 }),100);return()=>window.clearInterval(timer);},[phase,paused,id]);
 useEffect(()=>{if(phase==='battle'&&fight.hp<=0)setPhase('lost');},[fight.hp,phase]);
 const move=(delta:number)=>{if(paused)return;if(phase==='battle'){lane.current=Math.max(0,Math.min(2,lane.current+delta));setFight(f=>({...f,lane:lane.current}));}
 else if(phase==='hunt')setSelected(s=>Math.max(0,Math.min(9,s+delta)));};
 const choose=()=>{if(phase!=='hunt'||paused)return;
 if(selected!==count){setMessage(tr(text.wrong));return;}
 const n=count+1;setCount(n);setMessage(tr(text.found));try{localStorage.setItem(`region${id}_hunt`,String(n));}catch{}
 if(n===10)setPhase('battleIntro');};
 const shoot=()=>{if(phase!=='battle'||paused||fight.tick<25||Date.now()-lastShot.current<650)return;
 lastShot.current=Date.now();setFight(f=>({...f,boss:Math.max(0,f.boss-1)}));};
 useEffect(()=>{if(phase==='battle'&&fight.boss===0){setPhase('won');if(!winSaved.current){winSaved.current=true;markLevelWin(id);unlockBonus(region.key);}}},[fight.boss,phase,id]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.matches('input,select,textarea'))return;
 if((e.target as HTMLElement)?.closest('button')&&[' ','Enter'].includes(e.key))return;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(e.key))e.preventDefault();
 if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);
 if(e.key==='ArrowUp')move(phase==='hunt'?-2:-1);if(e.key==='ArrowDown')move(phase==='hunt'?2:1);
 if(e.key===' '||e.key==='Enter'){if(phase==='hunt')choose();else shoot();}};
 window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
 const startFight=()=>{lane.current=1;lastShot.current=0;setFight({hp:5,boss:8,lane:1,tick:0,round:0});setPaused(false);setPhase('battle');playMusic('battle');};
 if(!allowed)return <main className="region-game"><p>{tr(text.locked)}</p><button onClick={()=>navigate('/bonus')}>{copy.bonus}</button></main>;
 return <main className="region-game">
 <header className="region-nav"><button onClick={()=>navigate('/bonus')}>← {copy.bonus}</button><LanguageSelect/><span>v8 · {copy.level} {id}</span></header>
 <h1>{tr(region.title)}</h1>
 <div className="region-status"><span>{region.token} {count}/10</span><button aria-pressed={music} onClick={()=>{setMusic(!music);if(!music){audio.current?.play().catch(()=>{});}}}>{tr(text.music)} {music?'✓':'—'}</button>{running&&<button onClick={()=>{setPaused(!paused);if(paused)playMusic(phase);}}>{tr(paused?text.resume:text.pause)}</button>}</div>
 {paused&&running?<section className="region-panel"><h2>{tr(text.pause)}</h2><button onClick={()=>{setPaused(false);playMusic(phase);}}>{tr(text.resume)}</button></section>:<>
 {phase==='intro'&&<section className="region-panel"><img className="region-hero" src={withBase('assets/aracne .PNG')} alt="Hirundu"/><p>{tr(text.intro)}</p>{count>0&&<p>{tr(text.saved)}</p>}<button onClick={()=>{setPhase(count===10?'battleIntro':'hunt');playMusic('hunt');}}>{copy.start}</button></section>}
 {phase==='hunt'&&<><section className="region-clue" aria-live="polite"><strong>{count+1}/10</strong><p>{tr(region.places[count].clue)}</p><p role="status">{message}</p></section>
 <p className="region-caption">{tr(text.map)}</p><div className="region-board" role="group" aria-label={tr(region.title)}>{region.places.map((poi,i)=><button key={poi.town} aria-pressed={selected===i} className={`region-poi ${i<count?'is-found':''}`} onClick={()=>setSelected(i)}><span aria-hidden="true">{i<count?region.token:poi.icon} {selected===i?'🐦':''}</span><strong>{poi.town}</strong><small>{poi.name}</small>{i<count&&<span>✓</span>}</button>)}</div>
 <footer className="region-controls"><button aria-label={tr(text.left)} onClick={()=>move(-1)}>←</button><button aria-label={tr(text.up)} onClick={()=>move(-2)}>↑</button><button aria-label={tr(text.down)} onClick={()=>move(2)}>↓</button><button aria-label={tr(text.right)} onClick={()=>move(1)}>→</button><button className="region-confirm" onClick={choose}>{tr(text.choose)}</button></footer></>}
 {phase==='battleIntro'&&<section className="region-panel"><h2>{copy.battle} · {region.boss}</h2><img className="region-boss" src={withBase(`assets/boss-${id}.svg`)} alt={region.boss}/><p>{tr(text.battle)}</p><p>{tr(id===5?text.shelter:text.dodge)}</p><button onClick={startFight}>{tr(text.ready)}</button></section>}
 {phase==='battle'&&<section className="region-panel"><h2>{region.boss}</h2><div className="region-life"><span>Hirundu ♥ {fight.hp}/5</span><span>{region.boss} ♥ {fight.boss}/8</span></div><p aria-live="polite">{tr(fight.tick>=25?text.weak:id===5?text.shelter:text.dodge)}</p><img className={`region-boss ${fight.tick>=25?'is-weak':''}`} src={withBase(`assets/boss-${id}.svg`)} alt={region.boss}/><div className="region-lanes">{[0,1,2].map(i=><button key={i} aria-label={`${tr(text.lane)} ${i+1}`} aria-pressed={fight.lane===i} onClick={()=>{lane.current=i;setFight(f=>({...f,lane:i}));}} className={fight.tick<25&&attackLanes(id,fight.round).includes(i)?'danger':'safe'}><span>{fight.tick<25&&attackLanes(id,fight.round).includes(i)?'⚠':'✓'}</span>{fight.lane===i&&<img src={withBase('assets/aracne .PNG')} alt="Hirundu"/>}</button>)}</div><div className="region-controls"><button aria-label={tr(text.left)} onClick={()=>move(-1)}>←</button><button disabled={fight.tick<25} onClick={shoot}>{tr(text.shoot)}</button><button aria-label={tr(text.right)} onClick={()=>move(1)}>→</button></div></section>}
 {phase==='lost'&&<section className="region-panel"><h2>{tr(text.lost)}</h2><button onClick={startFight}>{tr(text.retry)}</button></section>}
 {phase==='won'&&<section className="region-panel"><h2>{copy.won}</h2><button onClick={()=>navigate(`/bonus/${region.key}`,{state:{unlockedKey:region.key}})}>{copy.bonus}</button></section>}
 </>}
 </main>;
}
