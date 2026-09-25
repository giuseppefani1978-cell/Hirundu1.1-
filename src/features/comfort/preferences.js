export const COMFORT_EVENT='hirundu:comfort';
const groups={music:['hirundu_music_v1','hirundu_flight_music_v1'],sound:['hirundu_action_sound_v1'],effects:['hirundu_action_effects_v1'],reduced:['hirundu_reduce_motion_v1'],large:['hirundu_large_text_v1']};
const defaults={music:true,sound:false,effects:true,reduced:false,large:false};
export function readComfort(){
 const state={...defaults};
 for(const [name,keys] of Object.entries(groups))try{state[name]=keys.every(key=>(localStorage.getItem(key)??(defaults[name]?'on':'off'))==='on');}catch{}
 return state;
}
export function applyComfort(){
 if(typeof document==='undefined')return;
 const prefs=readComfort();document.documentElement.dataset.largeText=prefs.large?'on':'off';document.documentElement.dataset.reduceMotion=prefs.reduced?'on':'off';
}
export function setComfort(name,value){
 const keys=groups[name];if(!keys||typeof value!=='boolean')return false;
 const previous=[];
 try{for(const key of keys)previous.push([key,localStorage.getItem(key)]);for(const key of keys)localStorage.setItem(key,value?'on':'off');}
 catch{for(const [key,old] of previous)try{if(old===null)localStorage.removeItem(key);else localStorage.setItem(key,old);}catch{}return false;}
 applyComfort();window.dispatchEvent(new Event(COMFORT_EVENT));return true;
}
