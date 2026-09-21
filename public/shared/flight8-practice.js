import { attachPractice } from './practice.js';
const practice=attachPractice({host:document.getElementById('playerSettings'),family:'flight',allowed:()=>['intro','paused'].includes(S.mode)});
window.addEventListener('pagehide',()=>practice.dispose(),{once:true});
