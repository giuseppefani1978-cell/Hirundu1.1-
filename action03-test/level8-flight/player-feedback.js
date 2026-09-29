/* A07 + first A08 flight guide. Original engine is invoked once, unchanged. */
(() => {
  const get=id=>document.getElementById(id);
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const read=(key,fallback)=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,value);return true;}catch{return false;}};
  const copy={
    fr:['Effets visuels','Sons des actions','Tester le son','Revoir le guide vol','Suivant','Terminer','Passer','Maintiens une flèche du pavé pour piloter. Le décor défile seul ; toucher la carte ne déplace pas Aracne.','Lis la question, puis rejoins la carte du bon lieu. Chaque découverte ajoute une amphore.','Évite les obstacles. Le café redonne de l’énergie ; le rustico protège temporairement.','Bonus collecté','Lieu découvert','Dommage reçu','Chasse terminée !','Son prêt : tu devrais entendre deux notes.','Audio indisponible ou bloqué. Réessaie avec « Tester le son ».','Sons coupés. Active « Sons des actions ».','Musique coupée : les sons des actions sont également coupés.','Préférence non enregistrée sur cet appareil.'],
    it:['Effetti visivi','Suoni delle azioni','Prova il suono','Rivedi la guida volo','Avanti','Fine','Salta','Tieni premuta una freccia del pad per pilotare. Lo sfondo scorre da solo; toccare la mappa non muove Aracne.','Leggi la domanda e raggiungi la carta del luogo giusto. Ogni scoperta aggiunge un’anfora.','Evita gli ostacoli. Il caffè dà energia; il rustico protegge temporaneamente.','Bonus raccolto','Luogo scoperto','Danno subito','Caccia completata!','Audio pronto: dovresti sentire due note.','Audio non disponibile o bloccato. Riprova con « Prova il suono ».','Suoni spenti. Attiva « Suoni delle azioni ».','Musica spenta: anche i suoni delle azioni sono spenti.','Preferenza non salvata su questo dispositivo.'],
    en:['Visual effects','Action sounds','Test sound','Review flight guide','Next','Finish','Skip','Hold a pad arrow to steer. Scenery scrolls automatically; touching the map does not move Aracne.','Read the clue, then reach the correct place card. Each discovery adds an amphora.','Avoid obstacles. Coffee restores energy; rustico provides temporary protection.','Bonus collected','Place discovered','Damage taken','Hunt complete!','Audio ready: you should hear two notes.','Audio unavailable or blocked. Try “Test sound” again.','Sounds off. Enable “Action sounds”.','Music off: action sounds are also muted.','Preference could not be saved on this device.'],
    es:['Efectos visuales','Sonidos de acciones','Probar sonido','Revisar guía de vuelo','Siguiente','Terminar','Omitir','Mantén una flecha pulsada para pilotar. El fondo se desplaza solo; tocar el mapa no mueve a Aracne.','Lee la pregunta y alcanza la carta del lugar correcto. Cada descubrimiento añade un ánfora.','Evita obstáculos. El café da energía; el rustico protege temporalmente.','Bonus recogido','Lugar descubierto','Daño recibido','¡Caza terminada!','Audio listo: deberías oír dos notas.','Audio no disponible o bloqueado. Pulsa « Probar sonido » otra vez.','Sonidos apagados. Activa « Sonidos de acciones ».','Música apagada: los sonidos de acciones también están apagados.','No se pudo guardar la preferencia en este dispositivo.']
  };
  const text=()=>copy[document.documentElement.lang]||copy.fr;
  const status=document.createElement('div');status.id='a07Status';status.setAttribute('role','status');get('arena').append(status);
  let audio,voices=[],audioGeneration=0,fx=null,animations=[],guideStep=0;
  get('actionSound').checked=read('hirundu_action_sound_v1','off')==='on';
  get('actionEffects').checked=read('hirundu_action_effects_v1','on')==='on';
  get('flightGuide').hidden=read('hirundu_tutorial_flight_v1','')!=='';
  function labels(){const c=text();['actionEffectsLabel','actionSoundLabel','testActionSound','replayGuide'].forEach((id,i)=>get(id).textContent=c[i]);get('guideText').textContent=`${guideStep+1}/3 · ${c[7+guideStep]}`;get('guideNext').textContent=c[guideStep===2?5:4];get('guideSkip').textContent=c[6];}
  function silence(){audioGeneration++;voices.forEach(v=>{try{v.stop();}catch{}});voices=[];}
  function clear(){fx=null;status.textContent='';animations.forEach(a=>a.cancel());animations=[];silence();}
  async function unlock(){
    if(!get('actionSound').checked||!musicEnabled)return false;
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('unavailable');audio??=new Audio();if(audio.state!=='running')await audio.resume();if(audio.state!=='running')throw Error('blocked');return true;}catch{get('actionAudioStatus').textContent=text()[15];return false;}
  }
  async function play(kind,test=false){
    if(!get('actionSound').checked){if(test)get('actionAudioStatus').textContent=text()[16];return;}
    if(!musicEnabled){if(test)get('actionAudioStatus').textContent=text()[17];return;}
    silence();const generation=audioGeneration;
    if(!await unlock()||generation!==audioGeneration||document.hidden||!get('actionSound').checked||!musicEnabled)return;
    try{const notes={bonus:[660,880],discovery:[523,784],damage:[180,120],victory:[523,659,784]}[kind];
      notes.forEach((hz,i)=>{const o=audio.createOscillator(),gain=audio.createGain(),at=audio.currentTime+i*.09;o.frequency.value=hz;o.type='sine';gain.gain.setValueAtTime(.001,at);gain.gain.linearRampToValueAtTime(.12,at+.012);gain.gain.exponentialRampToValueAtTime(.001,at+.16);o.connect(gain);gain.connect(audio.destination);o.start(at);o.stop(at+.17);voices.push(o);o.onended=()=>{o.disconnect();gain.disconnect();voices=voices.filter(v=>v!==o);};});
      if(test)get('actionAudioStatus').textContent=text()[14];
    }catch{get('actionAudioStatus').textContent=text()[15];}
  }
  function event(kind){
    const i={bonus:10,discovery:11,damage:12,victory:13}[kind];
    const icon={bonus:'☕ / 🥐',discovery:'✓',damage:'⚠',victory:'★'}[kind];
    status.textContent=icon+' '+text()[i];fx={kind,at:S.clock,x:S.x,y:S.y};
    animations.forEach(a=>a.cancel());animations=[];
    if(get('actionEffects').checked&&!media.matches&&kind==='discovery'){
      const marker=get('progress').children[S.round-1];
      if(marker?.animate)animations.push(marker.animate([{transform:'scale(1)'},{transform:'scale(1.2)'},{transform:'scale(1)'}],{duration:350}));
    }
    play(kind);
  }
  const originalTick=tick;
  tick=function(dt){
    const before={mode:S.mode,coffee:S.coffee,rustico:S.rustico,round:S.round,immune:S.immune};
    originalTick(dt);
    if(before.mode!=='playing')return;
    if(S.immune>before.immune)event('damage');
    else if(S.round>before.round)event(S.mode==='battleReady'?'victory':'discovery');
    else if(S.coffee>before.coffee||S.rustico>before.rustico)event('bonus');
    if(fx&&S.clock-fx.at>1.2){fx=null;status.textContent='';}
  };
  const originalDraw=draw;
  draw=function(){originalDraw();if(!fx||S.mode!=='playing'||!get('actionEffects').checked||media.matches)return;
    const age=S.clock-fx.at;if(age>.45)return;
    ctx.save();try{ctx.globalAlpha=Math.max(0,1-age/.45);ctx.strokeStyle=fx.kind==='damage'?'#fff':'#ffe4a0';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=2;
      if(fx.kind==='damage'){ctx.beginPath();ctx.arc(S.x,S.y,36,0,Math.PI*2);ctx.stroke();}
      else for(let i=0;i<6;i++){const angle=i*Math.PI/3,r=20+age*65;ctx.beginPath();ctx.arc(fx.x+Math.cos(angle)*r,fx.y+Math.sin(angle)*r,2,0,Math.PI*2);ctx.fill();}
    }finally{ctx.restore();}
  };
  get('testActionSound').onclick=()=>play('bonus',true);
  get('actionSound').onchange=()=>{silence();if(!write('hirundu_action_sound_v1',get('actionSound').checked?'on':'off'))get('actionAudioStatus').textContent=text()[18];if(get('actionSound').checked)play('bonus',true);else get('actionAudioStatus').textContent=text()[16];};
  get('actionEffects').onchange=()=>{clear();write('hirundu_action_effects_v1',get('actionEffects').checked?'on':'off');};
  get('start').addEventListener('click',()=>{clear();unlock();});
  get('musicToggle').addEventListener('click',()=>{silence();get('actionAudioStatus').textContent=musicEnabled?'':text()[17];});
  get('pause').addEventListener('click',clear);
  get('replayGuide').onclick=()=>{guideStep=0;get('flightGuide').hidden=false;labels();};
  function finishGuide(value){const saved=write('hirundu_tutorial_flight_v1',value);get('flightGuide').hidden=true;if(!saved)get('actionAudioStatus').textContent=text()[18];}
  get('guideNext').onclick=()=>{if(guideStep===2)finishGuide('viewed');else{guideStep++;labels();}};
  get('guideSkip').onclick=()=>finishGuide('skipped');
  media.addEventListener('change',clear);new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();audio?.suspend();}});window.addEventListener('pagehide',()=>{clear();audio?.close();});labels();
})();
