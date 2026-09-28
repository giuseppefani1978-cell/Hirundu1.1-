(() => {
  const $=id=>document.getElementById(id);
  const copy={
    fr:['Des actions qui se ressentent','Aperçu A07 : touche les quatre boutons pour comparer les réactions. Ici, les événements sont simulés ; le personnage ne se pilote pas.','Effets','Son','Mouvement réduit','DÉMONSTRATION','Vol','Arkanoid','Classique','Bonus collecté','Lieu découvert','Dommage reçu','Victoire !','Compteurs fictifs, sans sauvegarde. La victoire est une simulation, pas une bataille modifiée.','Ouvrir le vrai niveau 8 jouable'],
    it:['Azioni che si sentono','Anteprima A07: tocca i quattro pulsanti per confrontare le reazioni. Gli eventi sono simulati; il personaggio non si controlla.','Effetti','Suono','Movimento ridotto','DIMOSTRAZIONE','Volo','Arkanoid','Classico','Bonus raccolto','Luogo scoperto','Danno subito','Vittoria!','Contatori fittizi, senza salvataggio. La vittoria è simulata, non modifica la battaglia.','Apri il vero livello 8 giocabile'],
    en:['Actions you can feel','A07 preview: tap the four buttons to compare reactions. Events are simulated here; you cannot steer the character.','Effects','Sound','Reduced motion','DEMONSTRATION','Flight','Arkanoid','Classic','Bonus collected','Place discovered','Damage taken','Victory!','Demo counters only, no saves. Victory is simulated; battles are unchanged.','Open the real playable level 8'],
    es:['Acciones que se sienten','Vista previa A07: toca los cuatro botones para comparar reacciones. Los eventos son simulados; el personaje no se controla.','Efectos','Sonido','Movimiento reducido','DEMOSTRACIÓN','Vuelo','Arkanoid','Clásico','Bonus recogido','Lugar descubierto','Daño recibido','¡Victoria!','Contadores ficticios, sin guardar. La victoria es simulada; las batallas no cambian.','Abrir el nivel 8 real jugable']
  };
  const kinds=['bonus','discovery','damage','victory'],icons=['☕','✓','⚠','★'];
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let animations=[],timer,audio,nodes=[],generation=0,counts={discovery:0,bonus:0,energy:100};
  const t=()=>copy[$('language').value.toLowerCase()]||copy.fr;
  const reduced=()=>media.matches||$('reduced').checked;
  function stop(){generation++;animations.forEach(a=>a.cancel());animations=[];clearTimeout(timer);$('particles').replaceChildren();nodes.forEach(n=>{try{n.stop();}catch{}});nodes=[];}
  function animate(el,frames,duration=350){if(!reduced()&&el.animate)animations.push(el.animate(frames,{duration,easing:'ease-out',fill:'forwards'}));}
  function labels(){const c=t();document.documentElement.lang=$('language').value.toLowerCase();['title','intro','effectsLabel','soundLabel','reducedLabel','demo'].forEach((id,i)=>$(id).textContent=c[i]);[...$('family').options].forEach((o,i)=>o.textContent=c[6+i]);document.querySelectorAll('[data-event]').forEach((b,i)=>b.textContent=icons[i]+' '+c[9+i]);$('note').textContent=c[13];$('play').textContent=c[14];$('modeLabel').textContent=$('family').selectedOptions[0].textContent;$('paddle').hidden=$('family').value!=='arkanoid';$('reduced').disabled=media.matches;}
  async function sound(kind){
    if(!$('sound').checked||document.hidden)return;
    const token=generation;
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audio??=new Audio();if(audio.state==='suspended')await audio.resume();if(token!==generation||!$('effects').checked||!$('sound').checked||document.hidden)return;
      const notes={bonus:[660,880],discovery:[523,784],damage:[180,120],victory:[523,659,784]}[kind];
      notes.forEach((freq,i)=>{const oscillator=audio.createOscillator(),gain=audio.createGain(),at=audio.currentTime+i*.075;oscillator.type='sine';oscillator.frequency.value=freq;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.035,at+.008);gain.gain.exponentialRampToValueAtTime(.001,at+.11);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(at);oscillator.stop(at+.12);nodes.push(oscillator);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();nodes=nodes.filter(n=>n!==oscillator);};});
    }catch{/* Silent fallback leaves text feedback intact. */}
  }
  function emit(kind){stop();const i=kinds.indexOf(kind);$('feedback').textContent=icons[i]+' '+t()[9+i];$('target').textContent=kind==='discovery'?'✓':kind==='victory'?'★':'?';
    let counter;
    if(kind==='bonus'){counts.bonus++;$('bonus').textContent='☕ '+counts.bonus;counter=$('bonus');}
    if(kind==='discovery'){counts.discovery=counts.discovery%10+1;$('counter').textContent='🏺 '+counts.discovery+' / 10';counter=$('counter');}
    if(kind==='damage'){counts.energy=Math.max(0,counts.energy-12);$('energy').textContent='⚡ '+counts.energy;counter=$('energy');}
    if($('effects').checked){
      if(counter)animate(counter,[{transform:'scale(1)'},{transform:'scale(1.15)'},{transform:'scale(1)'}]);
      animate(kind==='damage'?$('bird'):$('target'),kind==='damage'?[{transform:'translateX(0)'},{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'translateX(0)'}]:[{transform:'scale(1)'},{transform:'scale(1.14)'},{transform:'scale(1)'}],300);
      if(kind!=='damage'&&!reduced())for(let p=0;p<6;p++){const dot=document.createElement('i');$('particles').append(dot);const a=p*Math.PI/3;animate(dot,[{transform:'translate(0,0)',opacity:1},{transform:`translate(${Math.cos(a)*32}px,${Math.sin(a)*32}px)`,opacity:0}],450);}
      sound(kind);
    }
    timer=setTimeout(()=>{$('particles').replaceChildren();$('feedback').textContent='';},1600);
  }
  document.querySelectorAll('[data-event]').forEach(b=>b.addEventListener('click',()=>emit(b.dataset.event)));
  ['language','family','effects','reduced','sound'].forEach(id=>$(id).addEventListener('change',()=>{stop();$('feedback').textContent='';labels();}));
  media.addEventListener('change',()=>{stop();labels();});document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();audio?.suspend();}});window.addEventListener('pagehide',()=>{stop();audio?.close();});labels();
})();
