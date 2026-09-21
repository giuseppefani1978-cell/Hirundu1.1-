// Shared hunt feedback and family guides. Never writes gameplay state.
const copy={
    fr:['Effets visuels','Sons des actions','Tester le son','Revoir le guide vol','Suivant','Terminer','Passer','Maintiens une flèche du pavé pour piloter. Le décor défile seul ; toucher la carte ne déplace pas Aracne.','Lis la question, puis rejoins la carte du bon lieu. Chaque découverte ajoute une amphore.','Évite les obstacles. Le café redonne de l’énergie ; le rustico protège temporairement.','Bonus collecté','Lieu découvert','Dommage reçu','Chasse terminée !','Son prêt : tu devrais entendre deux notes.','Audio indisponible ou bloqué. Réessaie avec « Tester le son ».','Sons coupés. Active « Sons des actions ».','Musique coupée : les sons des actions sont également coupés.','Préférence non enregistrée sur cet appareil.'],
    it:['Effetti visivi','Suoni delle azioni','Prova il suono','Rivedi la guida volo','Avanti','Fine','Salta','Tieni premuta una freccia del pad per pilotare. Lo sfondo scorre da solo; toccare la mappa non muove Aracne.','Leggi la domanda e raggiungi la carta del luogo giusto. Ogni scoperta aggiunge un’anfora.','Evita gli ostacoli. Il caffè dà energia; il rustico protegge temporaneamente.','Bonus raccolto','Luogo scoperto','Danno subito','Caccia completata!','Audio pronto: dovresti sentire due note.','Audio non disponibile o bloccato. Riprova con « Prova il suono ».','Suoni spenti. Attiva « Suoni delle azioni ».','Musica spenta: anche i suoni delle azioni sono spenti.','Preferenza non salvata su questo dispositivo.'],
    en:['Visual effects','Action sounds','Test sound','Review flight guide','Next','Finish','Skip','Hold a pad arrow to steer. Scenery scrolls automatically; touching the map does not move Aracne.','Read the clue, then reach the correct place card. Each discovery adds an amphora.','Avoid obstacles. Coffee restores energy; rustico provides temporary protection.','Bonus collected','Place discovered','Damage taken','Hunt complete!','Audio ready: you should hear two notes.','Audio unavailable or blocked. Try “Test sound” again.','Sounds off. Enable “Action sounds”.','Music off: action sounds are also muted.','Preference could not be saved on this device.'],
    es:['Efectos visuales','Sonidos de acciones','Probar sonido','Revisar guía de vuelo','Siguiente','Terminar','Omitir','Mantén una flecha pulsada para pilotar. El fondo se desplaza solo; tocar el mapa no mueve a Aracne.','Lee la pregunta y alcanza la carta del lugar correcto. Cada descubrimiento añade un ánfora.','Evita obstáculos. El café da energía; el rustico protege temporalmente.','Bonus recogido','Lugar descubierto','Daño recibido','¡Caza terminada!','Audio listo: deberías oír dos notas.','Audio no disponible o bloqueado. Pulsa « Probar sonido » otra vez.','Sonidos apagados. Activa « Sonidos de acciones ».','Música apagada: los sonidos de acciones también están apagados.','No se pudo guardar la preferencia en este dispositivo.']
  };
const guides={
classic:{
fr:['Revoir le guide classique','Maintiens les flèches pour déplacer Aracne sur la carte.','Lis l’énigme de Tarantula, puis rejoins le lieu qui répond à la question.','Évite les ennemis et ramasse les bonus. Dix découvertes ouvrent la bataille.'],
it:['Rivedi la guida classica','Tieni premute le frecce per muovere Aracne sulla mappa.','Leggi l’enigma di Tarantula e raggiungi il luogo corretto.','Evita i nemici e raccogli i bonus. Dieci scoperte aprono la battaglia.'],
en:['Review classic guide','Hold the arrows to move Aracne around the map.','Read Tarantula’s clue, then reach the correct place.','Avoid enemies and collect bonuses. Ten discoveries open the battle.'],
es:['Revisar guía clásica','Mantén las flechas para mover a Aracne por el mapa.','Lee la pista de Tarantula y alcanza el lugar correcto.','Evita enemigos y recoge bonus. Diez descubrimientos abren la batalla.']},
arkanoid:{
fr:['Revoir le guide Arkanoid','Déplace la barre avec les flèches ou en glissant le doigt. Appuie sur Envol pour lancer Aracne.','Replace la barre sous Aracne pour le faire rebondir. Les bords de la barre orientent le rebond.','Brise les murs et vise le lieu de l’énigme. Ramasse les bonus, évite les ennemis.'],
it:['Rivedi la guida Arkanoid','Muovi la barra con le frecce o trascinando il dito. Premi Volo per lanciare Aracne.','Metti la barra sotto Aracne per farlo rimbalzare. I bordi dirigono il rimbalzo.','Rompi i muri e mira al luogo dell’enigma. Raccogli i bonus ed evita i nemici.'],
en:['Review Arkanoid guide','Move the paddle with arrows or drag your finger. Press Launch to release Aracne.','Keep the paddle beneath Aracne to bounce. Its edges steer the rebound.','Break walls and aim at the clue’s place. Collect bonuses and avoid enemies.'],
es:['Revisar guía Arkanoid','Mueve la barra con las flechas o deslizando el dedo. Pulsa Vuelo para lanzar a Aracne.','Coloca la barra bajo Aracne para rebotar. Los bordes dirigen el rebote.','Rompe muros y apunta al lugar de la pista. Recoge bonus y evita enemigos.']}
};
export function mountPlayerExperience(config){
 const media=window.matchMedia('(prefers-reduced-motion: reduce)');
 const read=(key,fallback)=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback;}};
 const save=(key,value)=>{try{localStorage.setItem(key,value);return true;}catch{return false;}};
 const key='hirundu_tutorial_'+config.family+'_v1';
 const panel=document.createElement('section');panel.className='hirundu-player-settings';
 panel.innerHTML='<label><input data-ui="effects" type="checkbox"><span data-ui="effectsLabel"></span></label> <label><input data-ui="sound" type="checkbox"><span data-ui="soundLabel"></span></label><button type="button" data-ui="test"></button><p data-ui="audio" role="status"></p><button type="button" data-ui="review"></button><div data-ui="guide"><p data-ui="instruction"></p><button type="button" data-ui="next"></button><button type="button" data-ui="skip"></button></div>';
 const el=name=>panel.querySelector('[data-ui="'+name+'"]');
 const status=document.createElement('div');status.className='hirundu-action-status';status.setAttribute('role','status');document.body.append(status);
 el('effects').checked=read('hirundu_action_effects_v1','on')==='on';
 el('sound').checked=read('hirundu_action_sound_v1','off')==='on';
 el('guide').hidden=read(key,'')!=='';
 let step=0,previous=null,frame=0,active=true,expires=0,animations=[],voices=[],audio,generation=0,lastLanguage='';
 const lang=()=>{const l=(config.language?.()||document.documentElement.lang||'fr').slice(0,2);return copy[l]?l:'fr';};
 const text=()=>copy[lang()];
 function labels(){const c=text(),g=guides[config.family]?.[lang()]||[c[3],...c.slice(7,10)];el('effectsLabel').textContent=c[0];el('soundLabel').textContent=c[1];el('test').textContent=c[2];el('review').textContent=g[0];el('instruction').textContent=(step+1)+'/3 · '+g[step+1];el('next').textContent=c[step===2?5:4];el('skip').textContent=c[6];}
 function silence(){generation++;voices.forEach(v=>{try{v.stop();}catch{}});voices=[];}
 function clear(){silence();animations.forEach(a=>a.cancel());animations=[];status.textContent='';}
 async function sound(kind,test=false){
  if(!active||document.hidden)return;
  if(!el('sound').checked){if(test)el('audio').textContent=text()[16];return;}
  if(config.muted()){if(test)el('audio').textContent=text()[17];return;}
  silence();const token=generation;
  try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error();
   audio??=new Audio();if(audio.state!=='running')await audio.resume();
   if(!active||token!==generation||document.hidden||config.muted()||!el('sound').checked)return;
   if(audio.state!=='running')throw Error();
   ({bonus:[660,880],discovery:[523,784],damage:[180,120],victory:[523,659,784]})[kind].forEach((hz,i)=>{
    const o=audio.createOscillator(),g=audio.createGain(),at=audio.currentTime+i*.09;o.frequency.value=hz;
    g.gain.setValueAtTime(.001,at);g.gain.linearRampToValueAtTime(.12,at+.012);g.gain.exponentialRampToValueAtTime(.001,at+.16);o.connect(g);g.connect(audio.destination);o.start(at);o.stop(at+.17);voices.push(o);o.onended=()=>{o.disconnect();g.disconnect();voices=voices.filter(v=>v!==o);};
   });if(test)el('audio').textContent=text()[14];
  }catch{if(active)el('audio').textContent=text()[15];}
 }
 function emit(kind,now){
  clear();status.textContent=({bonus:'✦',discovery:'✓',damage:'⚠',victory:'★'})[kind]+' '+text()[({bonus:10,discovery:11,damage:12,victory:13})[kind]];
  const rect=config.canvas.getBoundingClientRect();status.style.left=Math.max(8,rect.right-Math.min(250,rect.width*.7)-8)+'px';status.style.top=Math.max(8,rect.top+8)+'px';status.style.maxWidth=Math.min(250,rect.width*.7)+'px';expires=now+1200;
  if(el('effects').checked&&!media.matches){const target=config.counter?.(kind);if(target?.animate)animations.push(target.animate([{transform:'scale(1)'},{transform:'scale(1.16)'},{transform:'scale(1)'}],{duration:350}));if(status.animate)animations.push(status.animate([{opacity:.5,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:180}));}
  if(el('effects').checked&&!media.matches&&kind!=='damage')for(let i=0;i<6;i++){const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');dot.style.cssText='position:absolute;left:50%;top:50%;width:3px;height:3px;border-radius:50%;background:#b08a3c;pointer-events:none';status.append(dot);if(dot.animate){const angle=i*Math.PI/3;animations.push(dot.animate([{opacity:1,transform:'translate(0,0)'},{opacity:0,transform:'translate('+Math.cos(angle)*28+'px,'+Math.sin(angle)*28+'px)'}],{duration:450,fill:'forwards'}));}}
  // Classic engines already provide their own event sounds; do not double them.
  if(!config.existingAudio)sound(kind);
 }
 function update(now){
  if(!active)return;
  const current=config.snapshot();
  if(lang()!==lastLanguage){lastLanguage=lang();labels();}
  const host=current.settings?config.host():null;
  if(host&&panel.parentElement!==host)host.append(panel);
  panel.hidden=!host;
  if(document.hidden||!current.playing){if(previous?.playing||(!current.settings&&previous?.settings))clear();}
  else if(previous?.playing){
   if(current.damage>previous.damage)emit('damage',now);
   else if(current.found>previous.found)emit(current.found>=10?'victory':'discovery',now);
   else if(current.bonus>previous.bonus)emit('bonus',now);
  }
  if(status.textContent&&now>expires)clear();
  if(config.muted()&&voices.length)silence();
  previous={...current};frame=requestAnimationFrame(update);
 }
 el('test').onclick=()=>sound('bonus',true);
 el('sound').onchange=()=>{silence();save('hirundu_action_sound_v1',el('sound').checked?'on':'off');if(el('sound').checked)sound('bonus',true);else el('audio').textContent=text()[16];};
 el('effects').onchange=()=>{clear();save('hirundu_action_effects_v1',el('effects').checked?'on':'off');};
 el('review').onclick=()=>{step=0;el('guide').hidden=false;labels();};
 function finish(value){if(!save(key,value))el('audio').textContent=text()[18];el('guide').hidden=true;}
 el('next').onclick=()=>{if(step===2)finish('viewed');else{step++;labels();}};
 el('skip').onclick=()=>finish('skipped');
 function onHidden(){if(document.hidden){clear();audio?.suspend();}}
 function arm(){if(!el('sound').checked||config.muted()||!active||(!config.snapshot().playing&&!config.snapshot().settings))return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio){audio??=new Audio();audio.resume().catch(()=>{if(active)el('audio').textContent=text()[15];});}}catch{el('audio').textContent=text()[15];}}
 document.addEventListener('pointerdown',arm);document.addEventListener('keydown',arm);
 media.addEventListener?.('change',clear);document.addEventListener('visibilitychange',onHidden);
 labels();frame=requestAnimationFrame(update);
 return {dispose(){active=false;cancelAnimationFrame(frame);clear();audio?.close();panel.remove();status.remove();media.removeEventListener?.('change',clear);document.removeEventListener('visibilitychange',onHidden);document.removeEventListener('pointerdown',arm);document.removeEventListener('keydown',arm);},panel};
}
