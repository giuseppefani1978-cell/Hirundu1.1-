// TEMPORARY: remove this component and bootLevel's testBattle option after beta testing.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { markLevelWin, unlockBonus } from '../features/bonus/bonusStorage';
import { copy } from './copy.js';

export default function TestShortcuts() {
 const navigate = useNavigate();
 const levels = ['otranto','gallipoli','lecce'] as const;
 return <details style={{marginTop:'20px',padding:'12px',border:'1px solid #aaa',borderRadius:'10px',textAlign:'left'}}>
  <summary style={{cursor:'pointer',fontWeight:700}}>{copy.testTools} · v4</summary>
  <p>{copy.testWarning}</p>
  {levels.map((key,index) => <section key={key} style={{margin:'12px 0'}}>
   <strong>{copy.level} {index+1} · {key[0].toUpperCase()+key.slice(1)}</strong>
   <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginTop:'8px'}}>
    <button className="app-button" onClick={()=>navigate(`/level/${index+1}`)}>{copy.start}</button>
    <button className="app-button" onClick={()=>navigate(`/level/${index+1}?test=battle`)}>{copy.battle}</button>
    <button className="app-button" onClick={()=>{markLevelWin(index+1);unlockBonus(key);navigate(`/bonus/${key}`,{state:{unlockedKey:key}});}}>{copy.testWin}</button>
   </div>
  </section>)}
 </details>;
}
