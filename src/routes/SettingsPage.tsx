import React,{useState} from 'react';
import LanguageSelect from '../ui/LanguageSelect';
import { readComfort,setComfort } from '../features/comfort/preferences.js';
import { comfortCopy } from '../features/comfort/copy';
import SaveStatus from '../features/comfort/SaveStatus';
import { syncDurableProgress } from '../progressStorage.js';
import { prepareSaveExport,restoreSaveImport } from '../features/comfort/saveExport.js';
import '../features/comfort/comfort.css';
export default function SettingsPage(){
 const t=comfortCopy(),[prefs,setPrefs]=useState(readComfort),[notice,setNotice]=useState<number|null>(null);
 function change(key:string,value:boolean){const ok=setComfort(key,value);setPrefs(readComfort());setNotice(ok?null:9);if(ok)syncDurableProgress();}
 function download(){try{const data=prepareSaveExport(),url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='hirundu-sauvegarde-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),30000);setNotice(15);}catch{setNotice(16);}}
 async function restore(file:File|undefined){if(!file)return;try{if(file.size>1_000_000)throw Error('Large file');restoreSaveImport(await file.text());setNotice(23);}catch{setNotice(24);}}
 return <main className="settings-page"><div>
  <nav><a href="#/">← {t[1]}</a><LanguageSelect/></nav><h1>{t[0]}</h1>
  <section><h2>{t[0]}</h2>{(['music','sound','effects','reduced','large'] as const).map((key,i)=><label key={key}><input type="checkbox" checked={prefs[key]} onChange={e=>change(key,e.target.checked)}/><span>{t[2+i]}</span></label>)}<p>{t[7]}</p><p>{t[8]}</p></section>
  <section><h2>{t[20]}</h2><SaveStatus/><p>{t[17]}</p><p>{t[19]}</p><button onClick={()=>syncDurableProgress()}>{t[13]}</button><button onClick={download}>{t[14]}</button><label className="settings-file"><span>{t[22]}</span><input type="file" accept="application/json,.json" onChange={e=>{void restore(e.target.files?.[0]);e.currentTarget.value='';}}/></label><p>{t[18]}</p><small>{t[21]} {t[25]}</small></section>
  <p role="status">{notice!==null?t[notice]:''}</p>
 </div></main>;
}
