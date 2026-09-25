import React,{useEffect,useState} from 'react';
import { getProgressSaveResult, PROGRESS_SAVE_EVENT } from '../../progressStorage.js';
import { comfortCopy } from './copy';
export default function SaveStatus(){
 const [result,setResult]=useState(getProgressSaveResult);
 useEffect(()=>{const refresh=()=>setResult(getProgressSaveResult());refresh();window.addEventListener(PROGRESS_SAVE_EVENT,refresh);return()=>window.removeEventListener(PROGRESS_SAVE_EVENT,refresh);},[]);
 const t=comfortCopy();
 return <p className="save-status" role="status">{result?.ok?'✓ ':result?'⚠ ':''}{t[result?.ok?10:result?11:12]}</p>;
}
