import { attachPractice } from './practice.js';
import { mountRhythm } from './rhythm.js';
const practice=attachPractice({host:document.getElementById('playerSettings'),family:'flight',allowed:()=>['intro','paused'].includes(S.mode)});
window.addEventListener('pagehide',()=>practice.dispose(),{once:true});
const rhythm=mountRhythm({host:document.getElementById('playerSettings'),canvas:document.getElementById('game'),advance:()=>{if(S.mode==='playing'&&S.phase==='free'&&S.timer>=4.5)S.timer=7.001;else if(S.mode==='playing'&&S.phase==='read'&&S.timer>=1.5)S.timer=3.501;}});
let rhythmFrame;function updateRhythm(){rhythm.update({playing:S.mode==='playing',dangerIn:S.phase==='free'?1.65-S.spawn:Infinity,canAdvance:(S.phase==='free'&&S.timer>=4.5)||(S.phase==='read'&&S.timer>=1.5),advanceKind:S.phase==='read'?'targets':'question'});rhythmFrame=requestAnimationFrame(updateRhythm);}updateRhythm();
window.addEventListener('pagehide',()=>{cancelAnimationFrame(rhythmFrame);rhythm.dispose();},{once:true});
