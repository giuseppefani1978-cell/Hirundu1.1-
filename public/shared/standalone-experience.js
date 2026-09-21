import { mountPlayerExperience } from './player-experience.js';
const ark=document.body.classList.contains('hirundu-arkanoid');
const gameCanvas=document.getElementById('game');
const instance=mountPlayerExperience({family:ark?'arkanoid':'flight',canvas:gameCanvas,muted:()=>!(typeof musicEnabled==='boolean'?musicEnabled:typeof hostMusicEnabled==='boolean'?hostMusicEnabled:false),
 advance:ark?undefined:()=>{if(S.mode==='playing'&&S.phase==='free'&&S.timer>=4.5)S.timer=7.001;else if(S.mode==='playing'&&S.phase==='read'&&S.timer>=1.5)S.timer=3.501;},
 host:()=>document.querySelector('#cover .card')||document.querySelector('#cover article'),
 counter:kind=>document.getElementById(ark?(kind==='discovery'?'leaves':kind==='damage'?'energy':'coffeeCount'):'progress'),
 snapshot:()=>ark?{
  playing:['ready','flying','transition'].includes(state.mode),
  settings:state.mode==='intro'||(state.mode==='paused'&&state.previous!=='battle'),
  found:state.found.length,bonus:Object.values(state.food).reduce((sum,n)=>sum+n,0),damage:100-state.energy,
  dangerIn:state.mode==='flying'&&state.enemies.length<HUNT_MODEL.enemy.max?state.enemyIn:Infinity,
 }:{playing:S.mode==='playing',settings:['intro','paused'].includes(S.mode),found:S.round,bonus:S.coffee+S.rustico,damage:S.immune,
  dangerIn:S.phase==='free'?1.65-S.spawn:Infinity,canAdvance:(S.phase==='free'&&S.timer>=4.5)||(S.phase==='read'&&S.timer>=1.5),advanceKind:S.phase==='read'?'targets':'question'},
});
window.addEventListener('pagehide',()=>instance.dispose(),{once:true});
