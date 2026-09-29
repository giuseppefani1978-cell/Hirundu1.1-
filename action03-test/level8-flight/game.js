'use strict';
const $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d');
const texts={
fr:{title:'Vol sur le Salento',tag:'NIVEAU 8 · CHASSE EN VOL',help:'Utilise le pavé en bas pour guider Hirundu. Rejoins la bonne carte et évite les obstacles.',detail:'☕ Énergie · 🥐 Bouclier. Les touches sur le décor ne commandent rien : pilote uniquement avec le pavé.',start:'Prendre mon envol',ready:'Prête ? Envole-toi avec moi au-dessus du Salento !',free:'Suis la côte ! Évite les déchets et les ennemis volants.',wrong:'Ce n’est pas ce lieu. Essaie une autre cible !',miss:'Les réponses reviennent. Prends ton temps !',hit:'Attention ! Garde tes distances avec les obstacles.',good:'Lieu découvert',pause:'Vol en pause',resume:'Reprendre le vol',again:'Recommencer',win:'Les dix lieux découverts !',end:'Fin de cette chasse. Tes dix amphores sont réunies ; place à la bataille du niveau 8.',lost:'Reprenons notre souffle',lostHelp:'Ton énergie est épuisée. Un nouvel envol ?',slow:'Doux',normal:'Normal',fast:'Rapide',coffee:'Un caffè ! +30 énergie.',shield:'Un rustico ! Bouclier pendant 8 secondes.',read:'Lis la question : les réponses arrivent.'},
it:{title:'Volo sul Salento',tag:'LIVELLO 8 · CACCIA IN VOLO',help:'Usa il pad in basso per guidare Hirundu. Raggiungi la carta giusta ed evita gli ostacoli.',detail:'☕ Energia · 🥐 Scudo. Toccare lo scenario non muove Hirundu: usa solo il pad.',start:'Spicca il volo',ready:'Pronta? Sorvoliamo insieme il Salento!',free:'Segui la costa! Evita i rifiuti e i nemici volanti.',wrong:'Non è questo il luogo. Prova un altro bersaglio!',miss:'Le risposte tornano. Prenditi il tuo tempo!',hit:'Attenzione! Evita gli ostacoli.',good:'Luogo scoperto',pause:'Volo in pausa',resume:'Riprendi il volo',again:'Ricomincia',win:'Dieci luoghi scoperti!',end:'Fine della caccia. Hai raccolto dieci anfore; ora passa alla battaglia del livello 8.',lost:'Riprendiamo fiato',lostHelp:'Energia esaurita. Un altro volo?',slow:'Dolce',normal:'Normale',fast:'Veloce',coffee:'Un caffè! +30 energia.',shield:'Un rustico! Scudo per 8 secondi.',read:'Leggi la domanda: arrivano le risposte.'},
en:{title:'Flight over Salento',tag:'LEVEL 8 · FLIGHT HUNT',help:'Use the pad at the bottom to guide Hirundu. Reach the right card and avoid obstacles.',detail:'☕ Energy · 🥐 Shield. Touching the scenery does not steer Hirundu: use the pad only.',start:'Take flight',ready:'Ready? Fly over Salento with me!',free:'Follow the coast! Avoid waste and flying enemies.',wrong:'Not this place. Try another target!',miss:'The answers will return. Take your time!',hit:'Careful! Stay clear of obstacles.',good:'Place discovered',pause:'Flight paused',resume:'Resume flight',again:'Restart',win:'Ten places discovered!',end:'The hunt is complete. Ten amphorae collected; continue to the level 8 battle.',lost:'Catch your breath',lostHelp:'Out of energy. Try another flight?',slow:'Gentle',normal:'Normal',fast:'Fast',coffee:'A caffè! +30 energy.',shield:'A rustico! Shield for 8 seconds.',read:'Read the question: answers are on their way.'},
es:{title:'Vuelo sobre el Salento',tag:'NIVEL 8 · CAZA EN VUELO',help:'Usa el mando de abajo para guiar a Hirundu. Llega a la carta correcta y evita los obstáculos.',detail:'☕ Energía · 🥐 Escudo. Tocar el paisaje no mueve a Hirundu: usa solo el mando.',start:'Empezar a volar',ready:'¿Lista? ¡Vuela conmigo sobre el Salento!',free:'¡Sigue la costa! Evita los residuos y los enemigos voladores.',wrong:'No es este lugar. ¡Prueba otro objetivo!',miss:'Las respuestas vuelven. ¡Tómate tu tiempo!',hit:'¡Cuidado! Evita los obstáculos.',good:'Lugar descubierto',pause:'Vuelo en pausa',resume:'Continuar',again:'Reiniciar',win:'¡Diez lugares descubiertos!',end:'La caza ha terminado. Has reunido diez ánforas; continúa con la batalla del nivel 8.',lost:'Recuperemos el aliento',lostHelp:'Sin energía. ¿Otro vuelo?',slow:'Suave',normal:'Normal',fast:'Rápido',coffee:'¡Un caffè! +30 energía.',shield:'¡Un rustico! Escudo durante 8 segundos.',read:'Lee la pregunta: llegan las respuestas.'}
};
const SUPPORTED_LANGS=['fr','it','en','es'];
const savedLang=(()=>{try{const value=(localStorage.getItem('__lang__')||'').toLowerCase();return SUPPORTED_LANGS.includes(value)?value:'fr';}catch(_){return 'fr';}})();
let lang=savedLang,W=390,H=600,ratio=1,last=0,keys={},images={},loaded=false;
const FLIGHT_HANDOFF_KEY='hirundu_flight_handoff_v1';
const MUSIC_PREF_KEY='hirundu_flight_music_v1';
let huntAudio=null;
let musicEnabled=(()=>{try{return localStorage.getItem(MUSIC_PREF_KEY)!=='off';}catch(_){return true;}})();
function persistLang(){try{localStorage.setItem('__lang__',lang);}catch(_){}}
function ensureHuntAudio(){
  if(!huntAudio){
    huntAudio=new Audio('../assets/hunt_loop.wav');
    huntAudio.loop=true;
    huntAudio.preload='auto';
    huntAudio.volume=.34;
  }
  return huntAudio;
}
function startHuntMusic(){
  if(!musicEnabled)return;
  const audio=ensureHuntAudio();
  audio.play().catch(()=>{});
}
function pauseHuntMusic(){try{huntAudio?.pause();}catch(_){}}
function stopHuntMusic(){try{if(huntAudio){huntAudio.pause();huntAudio.currentTime=0;}}catch(_){}}
function updatePauseOptions(){
  const langRow=$('pauseLangRow'),music=$('musicToggle');
  const paused=S.mode==='paused';
  if(langRow)langRow.hidden=!paused;
  if(music)music.hidden=!paused;
  if(music)music.textContent=(musicEnabled?'🔊 ':'🔇 ')+(lang==='fr'?'Musique':lang==='it'?'Musica':lang==='es'?'Música':'Music');
}
const S={mode:'intro',phase:'free',round:0,clock:0,timer:0,offset:0,x:195,y:420,tx:195,ty:420,vx:0,vy:0,energy:100,shield:0,immune:0,obstacles:[],targets:[],foods:[],spawn:0,wave:0,foodTimer:0,coffee:0,rustico:0,found:[],notice:'',noticeUntil:0};
const battleTexts={
fr:{title:'La chasse est terminée',help:'Tes dix amphores sont réunies. La bataille du niveau 8 reste exactement celle du jeu actuel.',detail:'Tourne maintenant le téléphone en paysage : seule la chasse a changé.',start:'Continuer vers la bataille'},
it:{title:'La caccia è terminata',help:'Hai raccolto le dieci anfore. La battaglia del livello 8 resta esattamente quella del gioco attuale.',detail:'Ora ruota il telefono in orizzontale: è cambiata solo la caccia.',start:'Continua verso la battaglia'},
en:{title:'The hunt is complete',help:'All ten amphorae are collected. Level 8 keeps exactly the current battle.',detail:'Now rotate the phone to landscape: only the hunt has changed.',start:'Continue to the battle'},
es:{title:'La caza ha terminado',help:'Ya tienes las diez ánforas. El nivel 8 conserva exactamente la batalla actual.',detail:'Ahora gira el teléfono a horizontal: solo ha cambiado la caza.',start:'Continuar a la batalla'}
};
const T=()=>texts[lang],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function resize(){const r=canvas.getBoundingClientRect(),oldW=W,oldH=H;W=r.width;H=r.height;ratio=Math.min(devicePixelRatio||1,2);canvas.width=W*ratio;canvas.height=H*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);for(const o of [...S.obstacles,...S.targets,...S.foods]){o.x*=W/oldW;o.y*=H/oldH;if(o.w)o.w*=W/oldW;}S.x*=W/oldW;S.tx*=W/oldW;S.y*=H/oldH;S.ty*=H/oldH;}
function label(){const t=T(),bt=battleTexts[lang];document.documentElement.lang=lang;if($('lang'))$('lang').value=lang;updatePauseOptions();$('eyebrow').textContent=t.tag;$('title').textContent=S.mode==='paused'?t.pause:S.mode==='battleReady'?bt.title:S.mode==='won'?t.win:S.mode==='lost'?t.lost:t.title;$('help').textContent=S.mode==='battleReady'?bt.help:S.mode==='won'?t.end:S.mode==='lost'?t.lostHelp:t.help;$('detail').textContent=S.mode==='battleReady'?bt.detail:t.detail;$('start').textContent=S.mode==='paused'?t.resume:S.mode==='battleReady'?bt.start:S.mode==='won'||S.mode==='lost'?t.again:t.start;$('again').textContent=t.again;$('again').hidden=S.mode!=='paused';hud();}
function hud(){const t=T();$('count').textContent=S.round+'/10';$('energy').textContent='⚡ '+Math.ceil(S.energy);$('bonuses').textContent='☕ '+S.coffee+' · 🥐 '+S.rustico+(S.shield>0?' 🛡':'');$('question').textContent=S.notice&&S.clock<S.noticeUntil?S.notice:S.mode==='intro'?t.ready:S.phase==='free'?t.free:places[Math.min(S.round,9)].clue[['fr','it','en','es'].indexOf(lang)];$('progress').innerHTML=places.map((p,i)=>'<i class="'+(i<S.round?'done':'')+'" title="'+(i<S.round?p.name:'?')+'">'+(i<S.round?'🏺':'×')+'</i>').join('');}
function say(message,seconds=2){S.notice=message;S.noticeUntil=S.clock+seconds;hud();}
function start(){stopHuntMusic();Object.assign(S,{mode:'playing',phase:'free',round:0,clock:0,timer:0,offset:0,x:W*.5,y:H*.68,tx:W*.5,ty:H*.68,vx:0,vy:0,energy:100,shield:0,immune:0,obstacles:[],targets:[],foods:[],spawn:0,wave:0,foodTimer:0,coffee:0,rustico:0,found:[],notice:'',noticeUntil:0});$('cover').hidden=true;$('microPad').hidden=false;keys={};hud();startHuntMusic();}
function overlay(mode){S.mode=mode;$('cover').hidden=false;$('microPad').hidden=true;padDX=0;padDY=0;keys={};label();}
function pause(){if(S.mode==='playing'){pauseHuntMusic();overlay('paused');}}
function targets(){
  S.phase='answers';S.timer=0;
  const correct=S.round;
  const usedIcons=new Set([places[correct].icon]);
  const candidates=places.map((_,i)=>i).filter(i=>i!==correct).sort(()=>Math.random()-.5);
  const ids=[correct];
  for(const id of candidates){
    if(!usedIcons.has(places[id].icon)){ids.push(id);usedIcons.add(places[id].icon);}
    if(ids.length===3)break;
  }
  for(const id of candidates){if(ids.length===3)break;if(!ids.includes(id))ids.push(id);}
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  S.targets=ids.map((id,i)=>{const w=W/3-28;return {id,x:W*(i+.5)/3,y:-112,w,h:Math.min(150,w*1.43)};});
  hud();
}
function hit(id){if(S.mode!=='playing'||S.phase!=='answers')return;if(id!==S.round){S.targets=S.targets.filter(t=>t.id!==id);say(T().wrong);return;}S.found.push(id);S.round++;S.targets=[];S.energy=Math.min(100,S.energy+5);say(T().good+' · '+places[id].name,2.4);if(S.round===10){overlay('battleReady');return;}S.phase='free';S.timer=0;S.spawn=-1.5;hud();}
function damage(){if(S.shield>0||S.immune>0)return;S.energy=Math.max(0,S.energy-12);S.immune=1.5;say(T().hit,1.4);if(S.energy<=0)overlay('lost');}
const trashKinds=['trash','bottle','can','carton'];
function spawnObstacleWave(){
  const laneW=W/3;
  const openLane=Math.floor(Math.random()*3);
  S.wave++;
  const occupied=[0,1,2].filter(lane=>lane!==openLane);

  occupied.forEach((lane,index)=>{
    const kind=trashKinds[Math.floor(Math.random()*trashKinds.length)];
    const size=Math.round(clamp(W*.248,90,110));
    S.obstacles.push({
      kind,
      x:laneW*(lane+.5)+(Math.random()-.5)*laneW*.22,
      y:-size*(.55+index*1.35),
      size,
      w:size*.56,
      h:size*.56,
      seed:Math.random()*6,
      hit:false
    });
  });

  if(S.timer>1.5&&(S.wave%2===0||Math.random()<.36)){
    const kind=Math.random()<.5?'crow':'jelly';
    const lane=(openLane+1+(S.wave%2))%3;
    const size=Math.round(clamp(W*.176,66,78));
    S.obstacles.push({
      kind,
      x:laneW*(lane+.5)+(Math.random()-.5)*laneW*.30,
      y:-size*(2.9+Math.random()*.6),
      size,
      w:size*.54,
      h:size*.54,
      seed:Math.random()*6,
      hit:false
    });
  }
}
function tick(dt){if(S.mode!=='playing')return;S.clock+=dt;S.timer+=dt;S.shield=Math.max(0,S.shield-dt);S.immune=Math.max(0,S.immune-dt);const scroll=S.phase==='answers'?H*.050:S.phase==='read'?H*.030:H*.085;S.offset+=scroll*dt;
let dx=(keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0)+padDX,dy=(keys.ArrowDown?1:0)-(keys.ArrowUp?1:0)+padDY;if(dx||dy){const norm=Math.hypot(dx,dy);S.tx+=dx/norm*W*.62*dt;S.ty+=dy/norm*H*.52*dt;}S.tx=clamp(S.tx,24,W-24);S.ty=clamp(S.ty,35,H-112);const stiffness=17.2,damping=8.0;S.vx+=((S.tx-S.x)*stiffness-S.vx*damping)*dt;S.vy+=((S.ty-S.y)*stiffness-S.vy*damping)*dt;const maxV=Math.min(W*.80,H*.69);const v=Math.hypot(S.vx,S.vy);if(v>maxV){S.vx=S.vx/v*maxV;S.vy=S.vy/v*maxV;}S.x=clamp(S.x+S.vx*dt,24,W-24);S.y=clamp(S.y+S.vy*dt,35,H-112);
if(S.phase==='free'){S.spawn+=dt;S.foodTimer+=dt;if(S.spawn>1.65){S.spawn=0;spawnObstacleWave();}if(S.foodTimer>4.2){S.foodTimer=0;S.foods.push({kind:Math.random()<.5?'coffee':'rustico',x:W*(.2+Math.random()*.6),y:-25});}if(S.timer>7){S.phase='read';S.timer=0;S.notice='';hud();}}
else if(S.phase==='read'&&S.timer>3.5)targets();
for(const o of S.obstacles){const mobile=o.kind==='crow'||o.kind==='jelly';o.y+=scroll*dt*(mobile?1.18:1);if(mobile)o.x=clamp(o.x+Math.sin(S.clock*1.35+o.seed)*dt*20,(o.size||80)*.45,W-(o.size||80)*.45);if(!o.hit&&Math.abs(o.x-S.x)<o.w/2+10&&Math.abs(o.y-S.y)<o.h/2+11){o.hit=true;damage();}}S.obstacles=S.obstacles.filter(o=>o.y-(o.size||80)/2<H+36);
for(const f of S.foods){f.y+=scroll*dt;if(Math.hypot(f.x-S.x,f.y-S.y)<30){if(f.kind==='coffee'){S.energy=Math.min(100,S.energy+30);S.coffee++;say(T().coffee);}else{S.shield=8;S.rustico++;say(T().shield);}f.y=H+100;}}S.foods=S.foods.filter(f=>f.y<H+48);
for(const o of [...S.targets]){o.y+=scroll*dt;if(Math.abs(o.x-S.x)<o.w/2-3&&Math.abs(o.y-S.y)<o.h/2+10){hit(o.id);break;}}
if(S.phase==='answers'&&S.targets.length&&S.targets.every(o=>o.y>H+80)){say(T().miss);targets();}hud();}
function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}}
function sprite(name,x,y,size,angle=0){const img=images[name];if(!img?.naturalWidth||!img?.naturalHeight)return;const k=size/Math.max(img.naturalWidth,img.naturalHeight),dw=img.naturalWidth*k,dh=img.naturalHeight*k;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(img,-dw/2,-dh/2,dw,dh);ctx.restore();}
function wrap(text,x,y,width){const words=text.split(' ');let line='',lines=[];for(const word of words){if(ctx.measureText(line+' '+word).width>width&&line){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);lines.slice(0,4).forEach((s,i)=>ctx.fillText(s,x,y+i*16));}
function drawLevel8Coast(bg){
  if(!bg?.naturalWidth)return;

  // Level 8 uses a single cinematic aerial shot, not mirrored tiles.
  // Enlarge it into a long virtual reel and move through it slowly.
  // Near the end, crossfade into the start of the next pass so there is
  // no hard seam and Otranto never appears back-to-back or upside-down.
  const sceneH=Math.max(H*2.85,W*bg.naturalHeight/bg.naturalWidth);
  const scale=Math.max(W/bg.naturalWidth,sceneH/bg.naturalHeight);
  const dw=bg.naturalWidth*scale;
  const dh=bg.naturalHeight*scale;
  const travel=Math.max(1,dh-H);
  const scenicOffset=(S.offset*.34)%travel;
  const y=scenicOffset-travel;
  const driftRoom=Math.max(0,(dw-W)/2);
  const drift=Math.sin(S.offset/950)*Math.min(30,driftRoom*.12);
  const x=(W-dw)/2+drift;

  ctx.save();
  ctx.drawImage(bg,x,y,dw,dh);
  window.HirunduScenery?.draw(ctx,x,y,dw,dh,S.clock); // A06 scenery-only hook

  const fadeZone=Math.min(H*.24,Math.max(90,travel*.16));
  if(scenicOffset>travel-fadeZone){
    const t=(scenicOffset-(travel-fadeZone))/fadeZone;
    const eased=t*t*(3-2*t);
    ctx.globalAlpha=eased;
    // Next pass starts from the bottom of the same real aerial image.
    // A small opposite lateral drift prevents a visible identical overlay.
    const nextX=(W-dw)/2-drift*.55;
    ctx.drawImage(bg,nextX,scenicOffset-travel*2,dw,dh);
    window.HirunduScenery?.draw(ctx,nextX,scenicOffset-travel*2,dw,dh,S.clock); // A06 scenery-only hook
  }
  ctx.restore();

  // A light atmospheric veil softens the crossfade without hiding gameplay.
  const haze=ctx.createLinearGradient(0,0,0,H);
  haze.addColorStop(0,'rgba(205,235,246,.08)');
  haze.addColorStop(.55,'rgba(255,255,255,0)');
  haze.addColorStop(1,'rgba(30,110,135,.06)');
  ctx.fillStyle=haze;
  ctx.fillRect(0,0,W,H);
}
function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#369fab';ctx.fillRect(0,0,W,H);const bg=images.coast;if(bg?.naturalWidth)drawLevel8Coast(bg);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.fillStyle='#369fab';
for(const o of S.obstacles){
  if(trashKinds.includes(o.kind)){
    const glyph={trash:'🗑️',bottle:'🧴',can:'🥫',carton:'🧃'}[o.kind]||'🗑️';
    ctx.save();
    ctx.globalAlpha=o.hit?.72:.98;
    ctx.shadowColor='rgba(12,39,58,.26)';
    ctx.shadowBlur=10;
    ctx.shadowOffsetY=5;
    ctx.font=`${Math.round(o.size*.78)}px system-ui`;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(glyph,o.x,o.y);
    ctx.restore();
  }else{
    ctx.save();
    if(o.hit)ctx.globalAlpha=.70;
    sprite(o.kind,o.x,o.y,o.size||92,Math.sin(S.clock*1.4+o.seed)*.08);
    ctx.restore();
  }
}
for(const f of S.foods){sprite(f.kind,f.x,f.y,42);}
for(const t of S.targets){
  const p=places[t.id];
  const suits=['♠','♥','♦','♣'];
  const suit=suits[t.id%4];
  const red=suit==='♥'||suit==='♦';
  const rank=t.id===0?'A':String(t.id+1);
  const left=t.x-t.w/2,top=t.y-t.h/2;

  ctx.save();
  ctx.shadowColor='rgba(14,43,74,.28)';
  ctx.shadowBlur=13;
  ctx.shadowOffsetY=6;
  roundRect(left,top,t.w,t.h,12,'#fffdf7','#bca46d');
  ctx.restore();

  ctx.save();
  ctx.strokeStyle='rgba(142,113,56,.62)';
  ctx.lineWidth=1;
  ctx.beginPath();
  ctx.roundRect(left+5,top+5,t.w-10,t.h-10,9);
  ctx.stroke();

  ctx.fillStyle=red?'#b73737':'#18324a';
  ctx.textAlign='left';
  ctx.textBaseline='top';
  ctx.font='800 13px Georgia,serif';
  ctx.fillText(rank,left+10,top+9);
  ctx.font='15px Georgia,serif';
  ctx.fillText(suit,left+9,top+24);

  ctx.translate(left+t.w-10,top+t.h-9);
  ctx.rotate(Math.PI);
  ctx.font='800 13px Georgia,serif';
  ctx.fillText(rank,0,0);
  ctx.font='15px Georgia,serif';
  ctx.fillText(suit,-1,15);
  ctx.restore();

  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillStyle='#172f48';
  ctx.font='34px system-ui';
  ctx.fillText(p.icon||suit,t.x,t.y+1);
}
ctx.save();ctx.translate(S.x,S.y+Math.sin(S.clock*3.8)*1.5);ctx.rotate(clamp(S.vx*.00215,-.27,.27));if(S.shield>0){ctx.beginPath();ctx.arc(0,0,32,0,Math.PI*2);ctx.fillStyle='#e8f7ff55';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff4b0';ctx.stroke();}if(S.immune>0)ctx.globalAlpha=.45+.35*Math.sin(S.clock*30);ctx.scale(1+Math.sin(S.clock*16)*.08,1-Math.sin(S.clock*16)*.06);sprite('bird',0,0,68);ctx.restore();}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();},{passive:false});
addEventListener('keydown',e=>{if(e.key.startsWith('Arrow')){e.preventDefault();keys[e.key]=true;}});addEventListener('keyup',e=>delete keys[e.key]);
function resume(){S.mode='playing';$('cover').hidden=true;$('microPad').hidden=false;keys={};startHuntMusic();updatePauseOptions();}
function launchBattle(){
  $('microPad').hidden=true;
  stopHuntMusic();
  persistLang();
  const rootPath=location.pathname.replace(/\/level8-flight\/(?:index\.html)?$/,'/');
  const returnUrl=location.origin+rootPath+'level8-flight/';
  try{
    localStorage.setItem(FLIGHT_HANDOFF_KEY,JSON.stringify({
      version:1,
      level:8,
      lang,
      createdAt:Date.now(),
      returnUrl,
      ammo:{
        pasticciotto:0,
        rustico:S.rustico|0,
        caffe:S.coffee|0,
        stars:S.round|0
      }
    }));
  }catch(_){}
  location.href=location.origin+rootPath+'#/level/8?test=battle&from=flight';
}
$('start').onclick=()=>{if(!loaded)return;if(S.mode==='paused')resume();else if(S.mode==='battleReady')launchBattle();else start();};
$('again').onclick=start;
$('pause').onclick=()=>S.mode==='paused'?resume():pause();
$('lang').onchange=e=>{const next=String(e.target.value||'fr').toLowerCase();lang=SUPPORTED_LANGS.includes(next)?next:'fr';persistLang();S.notice='';label();};
if($('musicToggle'))$('musicToggle').onclick=()=>{musicEnabled=!musicEnabled;try{localStorage.setItem(MUSIC_PREF_KEY,musicEnabled?'on':'off');}catch(_){}if(musicEnabled&&S.mode==='playing')startHuntMusic();else pauseHuntMusic();updatePauseOptions();};
let padDX=0,padDY=0,activePadPointer=null;
const resetPad=()=>{padDX=0;padDY=0;activePadPointer=null;for(const b of document.querySelectorAll('#microPad button'))b.classList.remove('is-active');};
for(const btn of document.querySelectorAll('#microPad button')){
  btn.addEventListener('pointerdown',e=>{
    e.preventDefault();
    if(activePadPointer!==null&&activePadPointer!==e.pointerId) return;
    activePadPointer=e.pointerId;
    try{btn.setPointerCapture(e.pointerId);}catch(_){}
    padDX=Number(btn.dataset.dx||0);
    padDY=Number(btn.dataset.dy||0);
    for(const b of document.querySelectorAll('#microPad button'))b.classList.toggle('is-active',b===btn);
  },{passive:false});
  const release=e=>{
    if(e)e.preventDefault();
    if(activePadPointer===null||!e||activePadPointer===e.pointerId)resetPad();
  };
  btn.addEventListener('pointerup',release,{passive:false});
  btn.addEventListener('pointercancel',release,{passive:false});
  btn.addEventListener('lostpointercapture',release,{passive:false});
}
addEventListener('pointerup',e=>{if(activePadPointer===e.pointerId)resetPad();},{passive:true});
addEventListener('pointercancel',e=>{if(activePadPointer===e.pointerId)resetPad();},{passive:true});
const suspendFlight=()=>{keys={};resetPad();if(S.mode==='playing')pause();};
addEventListener('blur',suspendFlight);
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendFlight();});
addEventListener('resize',resize);
Promise.all(['bird','tarantula','crow','jelly','coffee','rustico','coast'].map(name=>new Promise(resolve=>{const im=new Image();images[name]=im;im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src=name==='coast'?'coast.webp':'../level4-flight/assets/'+name+'.png';}))).then(result=>{loaded=result.every(Boolean);$('start').disabled=!loaded;if(!loaded)$('help').textContent='Chargement incomplet. Actualise la page pour réessayer.';});
resize();if($('lang'))$('lang').value=lang;persistLang();label();$('start').disabled=true;const loading=setInterval(()=>{if(loaded){$('start').disabled=false;clearInterval(loading);}},150);
function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;tick(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);

// A04: reuse Pause to read a full clue; keep flight and combat unchanged.
window.hirunduReadQuestion = (clue) => {
 if (S.mode !== "playing") return false;
 pause();
 if (S.mode !== "paused") return false;
 $("detail").textContent = clue;
 return true;
};
