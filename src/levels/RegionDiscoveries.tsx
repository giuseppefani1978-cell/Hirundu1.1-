import React from 'react';
import {Navigate,useNavigate,useParams} from 'react-router-dom';
import {regionById,tr} from './regions';
import {getProgressList} from '../features/bonus/bonusStorage';
import {copy} from '../ui/copy.js';
import LanguageSelect from '../ui/LanguageSelect';
import './RegionLevelPage.css';
export default function RegionDiscoveries(){
 const {levelId}=useParams();const navigate=useNavigate();const r=regionById(Number(levelId));
 if(!r)return <Navigate to="/bonus" replace/>;
 if([4,5,6].includes(r.id))return <Navigate to={`/poi/${r.key}/realmap`} replace/>;
 const won=getProgressList().find(p=>p.id===r.id)?.done;
 return <main className="region-game"><header className="region-nav"><button onClick={()=>navigate('/bonus')}>← {copy.bonus}</button><LanguageSelect/></header><h1>{tr(r.title)}</h1>
 {won?<><p>{r.token} 10/10 · {copy.won}</p><p>{tr(['Ouvre une recherche du lieu sur la carte réelle.','Apri una ricerca del luogo sulla mappa reale.','Search for the place on the real map.','Busca el lugar en el mapa real.'])}</p>
 {r.places.map(p=><article className="region-panel" key={p.town}><h2>{p.icon} {p.name}</h2><p>{p.town}</p><a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(`${p.name} ${p.town} Puglia Italia`)}`} target="_blank" rel="noreferrer">{copy.maps} ↗</a></article>)}</>:<p>{copy.locked}</p>}
 <button onClick={()=>navigate('/passport/otranto')}>{copy.passportOpen}</button></main>;
}
