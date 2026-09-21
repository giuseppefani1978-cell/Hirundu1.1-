import { createPractice } from './practice-model.js';
const words={
fr:['S’entraîner','Entraînement','Fermer','Passer','Envol','Recommencer','Maintiens une flèche pour déplacer Aracne.','Déplace la barre avec ← ou →.','Rejoins la cible marquée ✓.','Appuie sur Envol, puis place la barre sous Aracne.','Rebond réussi ! Aracne doit maintenant toucher la cible.','✓ Exercice réussi ! Tu peux reprendre la partie.','Raté ? Replace la barre et relance : aucun point perdu.','Flèches du clavier ou pavé tactile. Aucun score de partie n’est modifié.','Impossible de mémoriser cet entraînement sur cet appareil.','Gauche','Droite','Monter','Descendre'],
it:['Allenati','Allenamento','Chiudi','Salta','Volo','Ricomincia','Tieni premuta una freccia per muovere Aracne.','Muovi la barra con ← o →.','Raggiungi il bersaglio ✓.','Premi Volo e metti la barra sotto Aracne.','Rimbalzo riuscito! Ora Aracne deve colpire il bersaglio.','✓ Esercizio riuscito! Puoi riprendere la partita.','Riposiziona la barra e rilancia: nessun punto perso.','Frecce della tastiera o pad tattile. Il punteggio della partita non cambia.','Impossibile salvare questo allenamento sul dispositivo.','Sinistra','Destra','Su','Giù'],
en:['Practise','Practice','Close','Skip','Launch','Restart','Hold an arrow to move Aracne.','Move the paddle with ← or →.','Reach the target marked ✓.','Press Launch, then put the paddle beneath Aracne.','Bounce achieved! Now Aracne must touch the target.','✓ Practice complete! You can return to the game.','Reposition the paddle and launch again: no points lost.','Keyboard arrows or touch pad. Your game score is unchanged.','Unable to remember this practice on this device.','Left','Right','Up','Down'],
es:['Practicar','Entrenamiento','Cerrar','Omitir','Vuelo','Reiniciar','Mantén una flecha para mover a Aracne.','Mueve la barra con ← o →.','Alcanza el objetivo ✓.','Pulsa Vuelo y coloca la barra bajo Aracne.','¡Rebote logrado! Aracne debe tocar el objetivo.','✓ ¡Ejercicio logrado! Puedes volver a la partida.','Coloca la barra y vuelve a lanzar: no pierdes puntos.','Flechas del teclado o mando táctil. La puntuación no cambia.','No se pudo guardar este entrenamiento en el dispositivo.','Izquierda','Derecha','Subir','Bajar']
};
export function attachPractice({host,family,allowed=()=>true,sprite}){
 const language=()=>words[(document.documentElement.lang||'fr').slice(0,2)]||words.fr;
 const button=document.createElement('button');button.type='button';button.dataset.ui='practice';host.prepend(button);
 const key='hirundu_practice_'+family+'_v2';let done=false;
 try{done=localStorage.getItem(key)==='completed';}catch{}
 const label=()=>button.textContent=(done?'✓ ':'')+language()[0];label();
 const observer=new window.MutationObserver(label);observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 let closeCurrent=null;
 function open(){
  if(!allowed()||closeCurrent)return;
  const w=language(),dialog=document.createElement('dialog');dialog.className='hirundu-practice';
  dialog.innerHTML='<h2></h2><p class="practice-instruction" role="status"></p><canvas width="360" height="240"></canvas><div class="practice-pad"></div><div class="practice-actions"></div><p class="practice-note"></p>';
  dialog.querySelector('h2').textContent=w[1];dialog.querySelector('.practice-note').textContent=w[13];
  const instruction=dialog.querySelector('.practice-instruction'),canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),pad=dialog.querySelector('.practice-pad'),actions=dialog.querySelector('.practice-actions');
  const bird=new Image();bird.src=sprite||document.getElementById('heroAr')?.src||'../level4-flight/assets/bird.png';
  let model=createPractice(family),last=0,raf,stopped=false,lastMessage='',saved=false;
  const held=new Map(),keys=new Set();
  const dirs=[['←',-1,0,15],['→',1,0,16],['↑',0,-1,17],['↓',0,1,18]];
  function release(){held.clear();keys.clear();last=0;}
  for(const [glyph,dx,dy,index] of dirs){
   if(family==='arkanoid'&&dy)continue;
   const b=document.createElement('button');b.type='button';b.textContent=glyph;b.setAttribute('aria-label',w[index]);b.style.touchAction='none';pad.append(b);
   b.addEventListener('pointerdown',e=>{e.preventDefault();held.set(e.pointerId,[dx,dy]);try{b.setPointerCapture(e.pointerId);}catch{}});
   for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>held.delete(e.pointerId));
  }
  function add(text,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;actions.append(b);return b;}
  const launch=add(w[4],()=>model.launch());launch.hidden=family!=='arkanoid';
  add(w[5],()=>{release();model=createPractice(family);saved=false;});
  const skip=add(w[3],()=>{try{if(!done)localStorage.setItem(key,'skipped');}catch{}close();});
  const exit=add(w[2],()=>close());
  function onKey(e){if(e.key.startsWith('Arrow')){e.preventDefault();e.stopPropagation();if(e.type==='keydown')keys.add(e.key);else keys.delete(e.key);}else if(e.code==='Space'&&e.target===canvas){e.preventDefault();model.launch();}}
  canvas.tabIndex=0;
  function render(now){
   if(stopped)return;
   if(document.hidden){release();raf=requestAnimationFrame(render);return;}
   const dt=last?Math.min((now-last)/1000,.04):0;last=now;
   let dx=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0),dy=(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0);for(const p of held.values()){dx+=p[0];dy+=p[1];}
   model.tick(dt,Math.max(-1,Math.min(1,dx)),Math.max(-1,Math.min(1,dy)));
   const s=model.state,ark=family==='arkanoid';
   let msg=s.done?w[11]:s.step===0?w[ark?7:6]:ark?(s.step===1?w[9]:w[10]):w[8];
   if(s.misses&&!s.launched)msg=w[12]+' '+w[9];
   if(s.done&&!saved){saved=true;try{localStorage.setItem(key,'completed');done=true;label();}catch{msg+=' '+w[14];}release();}
   if(msg!==lastMessage){instruction.textContent=msg;lastMessage=msg;}
   launch.disabled=s.step!==1||s.launched||s.done;skip.hidden=s.done;
   ctx.clearRect(0,0,360,240);ctx.fillStyle='#d8edf3';ctx.fillRect(0,0,360,240);
   ctx.strokeStyle='#b9d6de';ctx.lineWidth=1;for(let x=30;x<360;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,240);ctx.stroke();}
   if(s.step>0&&(!ark||s.step===2)){ctx.beginPath();ctx.arc(s.targetX*360,s.targetY*240,15,0,Math.PI*2);ctx.fillStyle='#fffdf5';ctx.fill();ctx.strokeStyle='#426e79';ctx.stroke();ctx.fillStyle='#163c4a';ctx.font='bold 20px system-ui';ctx.textAlign='center';ctx.fillText('✓',s.targetX*360,s.targetY*240+7);}
   if(ark){ctx.fillStyle='#b08a3c';ctx.fillRect((s.paddle-.14)*360,.86*240,.28*360,9);}
   const x=(ark?s.ballX:s.x)*360,y=(ark?s.ballY:s.y)*240;
   if(bird.complete&&bird.naturalWidth)ctx.drawImage(bird,x-18,y-18,36,36);else{ctx.fillStyle='#0e2b4a';ctx.beginPath();ctx.moveTo(x-15,y-4);ctx.lineTo(x,y+5);ctx.lineTo(x+15,y-4);ctx.lineTo(x,y-1);ctx.fill();}
   raf=requestAnimationFrame(render);
  }
  function hidden(){if(document.hidden)release();}
  function close(){if(stopped)return;stopped=true;cancelAnimationFrame(raf);release();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('blur',release);dialog.remove();closeCurrent=null;button.focus();}
  closeCurrent=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('keydown',onKey);dialog.addEventListener('keyup',onKey);
  document.addEventListener('visibilitychange',hidden);window.addEventListener('blur',release);
  document.body.append(dialog);if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');
  exit.focus();raf=requestAnimationFrame(render);
 }
 button.onclick=open;
 return {dispose(){closeCurrent?.();observer.disconnect();button.remove();},button};
}
