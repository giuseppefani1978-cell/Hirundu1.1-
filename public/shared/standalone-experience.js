import { mountPlayerExperience } from './player-experience.js';
const ark=document.body.classList.contains('hirundu-arkanoid');
const gameCanvas=document.getElementById('game');
const instance=mountPlayerExperience({family:ark?'arkanoid':'flight',canvas:gameCanvas,muted:()=>!musicEnabled,
 host:()=>document.querySelector('#cover .card')||document.querySelector('#cover article'),
 counter:kind=>document.getElementById(ark?(kind==='discovery'?'leaves':kind==='damage'?'energy':'coffeeCount'):'progress'),
 snapshot:()=>ark?{
  playing:['ready','flying','transition'].includes(state.mode),
  settings:state.mode==='intro'||(state.mode==='paused'&&state.previous!=='battle'),
  found:state.found.length,bonus:Object.values(state.food).reduce((sum,n)=>sum+n,0),damage:100-state.energy,
 }:{playing:S.mode==='playing',settings:['intro','paused'].includes(S.mode),found:S.round,bonus:S.coffee+S.rustico,damage:S.immune},
});
window.addEventListener('pagehide',()=>instance.dispose(),{once:true});
