import { mountPlayerExperience } from './playerExperience.js';
import './playerExperience.css';
import './practice.css';
export function actionSoundsEnabled(){try{return localStorage.getItem('hirundu_action_sound_v1')==='on';}catch{return false;}}
export function mountClassicExperience(canvas,snapshot,muted){
 return mountPlayerExperience({family:'classic',canvas,snapshot,muted,existingAudio:true,
  host:()=>document.querySelector('.game-pause__card')||document.getElementById('overlayCard'),
  counter:kind=>document.getElementById(kind==='discovery'?'stars':'__score_live'),
 });
}
