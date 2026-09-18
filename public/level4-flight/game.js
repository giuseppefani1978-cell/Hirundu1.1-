'use strict';
const $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d');
const texts={
fr:{title:'Vol sur l’Adriatique',tag:'NIVEAU 4 · CHASSE EN VOL',help:'Glisse le doigt pour guider Arachné. Rejoins la bonne réponse et évite les obstacles.',detail:'☕ Énergie · 🥐 Bouclier. Sur ordinateur : les flèches. Décor illustré, parcours libre.',start:'Prendre mon envol',ready:'Prête ? Envole-toi avec moi au-dessus de l’Adriatique !',free:'Suis la côte ! Évite les barrages dorés et les ennemis.',wrong:'Ce n’est pas ce lieu. Essaie une autre cible !',miss:'Les réponses reviennent. Prends ton temps !',hit:'Attention ! Garde tes distances avec les obstacles.',good:'Lieu découvert',pause:'Vol en pause',resume:'Reprendre le vol',again:'Recommencer',win:'Les dix lieux découverts !',end:'Fin de ce test de chasse. Tes dix coquillages sont réunis ; la bataille reste dans le jeu principal.',lost:'Reprenons notre souffle',lostHelp:'Ton énergie est épuisée. Un nouvel envol ?',slow:'Doux',normal:'Normal',fast:'Rapide',coffee:'Un caffè ! +30 énergie.',shield:'Un rustico ! Bouclier pendant 8 secondes.',read:'Lis la question : les réponses arrivent.'},
it:{title:'Volo sull’Adriatico',tag:'LIVELLO 4 · CACCIA IN VOLO',help:'Trascina il dito per guidare Aracne. Raggiungi la risposta giusta ed evita gli ostacoli.',detail:'☕ Energia · 🥐 Scudo. Sul computer: le frecce. Paesaggio illustrato, percorso libero.',start:'Spicca il volo',ready:'Pronta? Sorvoliamo insieme l’Adriatico!',free:'Segui la costa! Evita le barriere dorate e i nemici.',wrong:'Non è questo il luogo. Prova un altro bersaglio!',miss:'Le risposte tornano. Prenditi il tuo tempo!',hit:'Attenzione! Evita gli ostacoli.',good:'Luogo scoperto',pause:'Volo in pausa',resume:'Riprendi il volo',again:'Ricomincia',win:'Dieci luoghi scoperti!',end:'Fine del test di caccia. Hai dieci conchiglie; la battaglia resta nel gioco principale.',lost:'Riprendiamo fiato',lostHelp:'Energia esaurita. Un altro volo?',slow:'Dolce',normal:'Normale',fast:'Veloce',coffee:'Un caffè! +30 energia.',shield:'Un rustico! Scudo per 8 secondi.',read:'Leggi la domanda: arrivano le risposte.'},
en:{title:'Flight over the Adriatic',tag:'LEVEL 4 · FLIGHT HUNT',help:'Drag your finger to guide Aracne. Reach the correct answer and avoid obstacles.',detail:'☕ Energy · 🥐 Shield. On desktop: arrow keys. Illustrated scenery, free route.',start:'Take flight',ready:'Ready? Fly over the Adriatic with me!',free:'Follow the coast! Avoid golden barriers and enemies.',wrong:'Not this place. Try another target!',miss:'The answers will return. Take your time!',hit:'Careful! Stay clear of obstacles.',good:'Place discovered',pause:'Flight paused',resume:'Resume flight',again:'Restart',win:'Ten places discovered!',end:'End of this hunt test. Ten shells collected; the battle remains in the main game.',lost:'Catch your breath',lostHelp:'Out of energy. Try another flight?',slow:'Gentle',normal:'Normal',fast:'Fast',coffee:'A caffè! +30 energy.',shield:'A rustico! Shield for 8 seconds.',read:'Read the question: answers are on their way.'},
es:{title:'Vuelo sobre el Adriático',tag:'NIVEL 4 · CAZA EN VUELO',help:'Arrastra el dedo para guiar a Aracne. Alcanza la respuesta correcta y evita los obstáculos.',detail:'☕ Energía · 🥐 Escudo. En ordenador: las flechas. Paisaje ilustrado, ruta libre.',start:'Empezar a volar',ready:'¿Lista? ¡Vuela conmigo sobre el Adriático!',free:'¡Sigue la costa! Evita las barreras doradas y los enemigos.',wrong:'No es este lugar. ¡Prueba otro objetivo!',miss:'Las respuestas vuelven. ¡Tómate tu tiempo!',hit:'¡Cuidado! Evita los obstáculos.',good:'Lugar descubierto',pause:'Vuelo en pausa',resume:'Continuar',again:'Reiniciar',win:'¡Diez lugares descubiertos!',end:'Fin de esta prueba de caza. Diez conchas recogidas; la batalla sigue en el juego principal.',lost:'Recuperemos el aliento',lostHelp:'Sin energía. ¿Otro vuelo?',slow:'Suave',normal:'Normal',fast:'Rápido',coffee:'¡Un caffè! +30 energía.',shield:'¡Un rustico! Escudo durante 8 segundos.',read:'Lee la pregunta: llegan las respuestas.'}
};
let lang='fr',W=390,H=600,ratio=1,last=0,drag=false,keys={},images={},loaded=false;
const S={mode:'intro',phase:'free',round:0,clock:0,timer:0,offset:0,x:195,y:480,tx:195,ty:480,vx:0,vy:0,energy:100,shield:0,immune:0,obstacles:[],targets:[],foods:[],spawn:0,foodTimer:0,coffee:0,rustico:0,found:[],notice:'',noticeUntil:0};
const battleTexts={
fr:{title:'La chasse est terminée',help:'Tes dix coquillages sont réunis. La bataille du niveau 4 reste la bataille HIRUNDU habituelle.',detail:'Tourne ensuite le téléphone en paysage : on ne change pas la bataille, seulement la chasse.',start:'Continuer vers la bataille'},
it:{title:'La caccia è terminata',help:'Hai raccolto le dieci conchiglie. La battaglia del livello 4 resta quella abituale di HIRUNDU.',detail:'Poi ruota il telefono in orizzontale: cambia solo la caccia, non la battaglia.',start:'Continua verso la battaglia'},
en:{title:'The hunt is complete',help:'All ten shells are collected. Level 4 keeps the usual HIRUNDU battle.',detail:'Then rotate the phone to landscape: only the hunt changes, not the battle.',start:'Continue to the battle'},
es:{title:'La caza ha terminado',help:'Ya tienes las diez conchas. El nivel 4 conserva la batalla habitual de HIRUNDU.',detail:'Después gira el teléfono a horizontal: solo cambia la caza, no la batalla.',start:'Continuar a la batalla'}
};
const T=()=>texts[lang],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function resize(){const r=canvas.getBoundingClientRect(),oldW=W,oldH=H;W=r.width;H=r.height;ratio=Math.min(devicePixelRatio||1,2);canvas.width=W*ratio;canvas.height=H*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);for(const o of [...S.obstacles,...S.targets,...S.foods]){o.x*=W/oldW;o.y*=H/oldH;if(o.w)o.w*=W/oldW;}S.x*=W/oldW;S.tx*=W/oldW;S.y*=H/oldH;S.ty*=H/oldH;}
function label(){const t=T(),bt=battleTexts[lang];document.documentElement.lang=lang;$('eyebrow').textContent=t.tag;$('title').textContent=S.mode==='paused'?t.pause:S.mode==='battleReady'?bt.title:S.mode==='won'?t.win:S.mode==='lost'?t.lost:t.title;$('help').textContent=S.mode==='battleReady'?bt.help:S.mode==='won'?t.end:S.mode==='lost'?t.lostHelp:t.help;$('detail').textContent=S.mode==='battleReady'?bt.detail:t.detail;$('start').textContent=S.mode==='paused'?t.resume:S.mode==='battleReady'?bt.start:S.mode==='won'||S.mode==='lost'?t.again:t.start;$('again').textContent=t.again;$('again').hidden=S.mode!=='paused';hud();}
function hud(){const t=T();$('count').textContent=S.round+'/10';$('energy').textContent='⚡ '+Math.ceil(S.energy);$('bonuses').textContent='☕ '+S.coffee+' · 🥐 '+S.rustico+(S.shield>0?' 🛡':'');$('question').textContent=S.notice&&S.clock<S.noticeUntil?S.notice:S.mode==='intro'?t.ready:S.phase==='free'?t.free:places[Math.min(S.round,9)].clue[['fr','it','en','es'].indexOf(lang)];$('progress').innerHTML=places.map((p,i)=>'<i class="'+(i<S.round?'done':'')+'" title="'+(i<S.round?p.name:'?')+'">'+(i<S.round?'🐚':'×')+'</i>').join('');}
function say(message,seconds=2){S.notice=message;S.noticeUntil=S.clock+seconds;hud();}
function start(){Object.assign(S,{mode:'playing',phase:'free',round:0,clock:0,timer:0,offset:0,x:W*.5,y:H*.8,tx:W*.5,ty:H*.8,vx:0,vy:0,energy:100,shield:0,immune:0,obstacles:[],targets:[],foods:[],spawn:0,foodTimer:0,coffee:0,rustico:0,found:[],notice:'',noticeUntil:0});$('cover').hidden=true;$('microPad').hidden=false;keys={};hud();}
function overlay(mode){S.mode=mode;$('cover').hidden=false;$('microPad').hidden=true;drag=false;padDX=0;padDY=0;keys={};label();}
function pause(){if(S.mode==='playing')overlay('paused');}
function targets(){S.phase='answers';S.timer=0;S.obstacles=[];S.foods=[];const ids=[S.round,(S.round+3)%10,(S.round+6)%10];for(let i=2;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}S.targets=ids.map((id,i)=>({id,x:W*(i+.5)/3,y:-90,w:W/3-10,h:114}));hud();}
function hit(id){if(S.mode!=='playing'||S.phase!=='answers')return;if(id!==S.round){S.targets=S.targets.filter(t=>t.id!==id);say(T().wrong);return;}S.found.push(id);S.round++;S.targets=[];S.energy=Math.min(100,S.energy+5);say(T().good+' · '+places[id].name,2.4);if(S.round===10){overlay('battleReady');return;}S.phase='free';S.timer=0;S.spawn=-1.5;hud();}
function damage(){if(S.shield>0||S.immune>0)return;S.energy=Math.max(0,S.energy-12);S.immune=1.5;say(T().hit,1.4);if(S.energy<=0)overlay('lost');}
const trashKinds=['trash','bottle','can','bag'];
function spawnObstacleWave(){
  const laneW=W/3;
  const openLane=Math.floor(Math.random()*3);
  for(let lane=0;lane<3;lane++){
    if(lane===openLane)continue;
    const kind=trashKinds[Math.floor(Math.random()*trashKinds.length)];
    S.obstacles.push({kind,x:laneW*(lane+.5)+(Math.random()-.5)*laneW*.18,y:-42,w:34,h:38,seed:Math.random()*6});
  }
  if(S.timer>2.5&&Math.random()<.48){
    const kind=Math.random()<.5?'crow':'jelly';
    const lane=(openLane+(Math.random()<.5?1:2))%3;
    S.obstacles.push({kind,x:laneW*(lane+.5),y:-105,w:36,h:36,seed:Math.random()*6});
  }
}
function tick(dt){if(S.mode!=='playing')return;S.clock+=dt;S.timer+=dt;S.shield=Math.max(0,S.shield-dt);S.immune=Math.max(0,S.immune-dt);const scroll=S.phase==='answers'?H*.050:S.phase==='read'?H*.030:H*.085;S.offset+=scroll*dt;
let dx=(keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0)+padDX,dy=(keys.ArrowDown?1:0)-(keys.ArrowUp?1:0)+padDY;if(dx||dy){const norm=Math.hypot(dx,dy);S.tx+=dx/norm*W*.48*dt;S.ty+=dy/norm*H*.42*dt;}S.tx=clamp(S.tx,24,W-24);S.ty=clamp(S.ty,35,H-28);const stiffness=13,damping=7.5;S.vx+=((S.tx-S.x)*stiffness-S.vx*damping)*dt;S.vy+=((S.ty-S.y)*stiffness-S.vy*damping)*dt;const maxV=Math.min(W*.56,H*.48);const v=Math.hypot(S.vx,S.vy);if(v>maxV){S.vx=S.vx/v*maxV;S.vy=S.vy/v*maxV;}S.x=clamp(S.x+S.vx*dt,24,W-24);S.y=clamp(S.y+S.vy*dt,35,H-28);
if(S.phase==='free'){S.spawn+=dt;S.foodTimer+=dt;if(S.spawn>1.55){S.spawn=0;spawnObstacleWave();}if(S.foodTimer>4.2){S.foodTimer=0;S.foods.push({kind:Math.random()<.5?'coffee':'rustico',x:W*.5,y:-25});}if(S.timer>7){S.phase='read';S.timer=0;S.obstacles=[];S.foods=[];S.notice='';hud();}}
else if(S.phase==='read'&&S.timer>3.5)targets();
for(const o of S.obstacles){const mobile=o.kind==='crow'||o.kind==='jelly';o.y+=scroll*dt*(mobile?1.3:1);if(mobile)o.x=clamp(o.x+Math.sin(S.clock*1.5+o.seed)*dt*16,25,W-25);if(Math.abs(o.x-S.x)<o.w/2+9&&Math.abs(o.y-S.y)<o.h/2+10)damage();}S.obstacles=S.obstacles.filter(o=>o.y<H+60);
for(const f of S.foods){f.y+=scroll*dt;if(Math.hypot(f.x-S.x,f.y-S.y)<29){if(f.kind==='coffee'){S.energy=Math.min(100,S.energy+30);S.coffee++;say(T().coffee);}else{S.shield=8;S.rustico++;say(T().shield);}f.y=H+100;}}S.foods=S.foods.filter(f=>f.y<H+60);
for(const o of [...S.targets]){o.y+=scroll*dt;if(Math.abs(o.x-S.x)<o.w/2-3&&Math.abs(o.y-S.y)<o.h/2+10){hit(o.id);break;}}
if(S.phase==='answers'&&S.targets.length&&S.targets.every(o=>o.y>H+80)){say(T().miss);targets();}hud();}
function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}}
function sprite(name,x,y,size,angle=0){const img=images[name];if(!img?.naturalWidth)return;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();}
function wrap(text,x,y,width){const words=text.split(' ');let line='',lines=[];for(const word of words){if(ctx.measureText(line+' '+word).width>width&&line){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);lines.slice(0,4).forEach((s,i)=>ctx.fillText(s,x,y+i*16));}
function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#369fab';ctx.fillRect(0,0,W,H);const bg=images.coast;if(bg?.naturalWidth){const th=W*bg.naturalHeight/bg.naturalWidth;const off=S.offset%(th*2);for(let i=-2;i<3;i++){const y=off+i*th;ctx.save();if(Math.abs(i)%2){ctx.translate(0,y+th);ctx.scale(1,-1);ctx.drawImage(bg,0,0,W,th+1);}else ctx.drawImage(bg,0,y,W,th+1);ctx.restore();}}
for(const o of S.obstacles){
  if(o.kind==='wall'){
    roundRect(o.x-o.w/2,o.y-o.h/2,o.w,o.h,6,'#e3ad47','#745126');
  }else if(trashKinds.includes(o.kind)){
    const glyph={trash:'🗑️',bottle:'🧴',can:'🥫',bag:'🛍️'}[o.kind]||'♻️';
    ctx.save();ctx.globalAlpha=.93;ctx.beginPath();ctx.arc(o.x,o.y,22,0,Math.PI*2);ctx.fillStyle='#fffdf5c9';ctx.fill();ctx.strokeStyle='#0e2b4a2b';ctx.stroke();ctx.font='27px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(glyph,o.x,o.y+1);ctx.restore();
  }else sprite(o.kind,o.x,o.y,46);
}
for(const f of S.foods){ctx.beginPath();ctx.arc(f.x,f.y,23,0,Math.PI*2);ctx.fillStyle='#fffdf5df';ctx.fill();sprite(f.kind,f.x,f.y,36);}
for(const t of S.targets){
  const p=places[t.id];
  ctx.save();ctx.shadowColor='#0e2b4a2b';ctx.shadowBlur=12;ctx.shadowOffsetY=5;
  roundRect(t.x-t.w/2,t.y-t.h/2,t.w,t.h,15,'#fffdf5f4','#c8b37a');
  ctx.restore();
  ctx.textAlign='center';ctx.textBaseline='alphabetic';
  ctx.fillStyle='#2546c1';ctx.font='23px system-ui';ctx.fillText(p.icon||'📍',t.x,t.y-29);
  ctx.fillStyle='#0e2b4a';ctx.font='700 12.5px system-ui';wrap(p.name,t.x,t.y-7,t.w-14);
  ctx.fillStyle='#607486';ctx.font='600 10px system-ui';ctx.fillText(p.town,t.x,t.y+43);
}
ctx.save();ctx.translate(S.x,S.y+Math.sin(S.clock*3.2)*1.2);ctx.rotate(clamp(S.vx*.0018,-.22,.22));if(S.shield>0){ctx.beginPath();ctx.arc(0,0,32,0,Math.PI*2);ctx.fillStyle='#e8f7ff55';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff4b0';ctx.stroke();}if(S.immune>0)ctx.globalAlpha=.45+.35*Math.sin(S.clock*30);ctx.scale(1+Math.sin(S.clock*14)*.07,1-Math.sin(S.clock*14)*.05);sprite('bird',0,0,68);ctx.restore();}
function pointer(e){const r=canvas.getBoundingClientRect();S.tx=clamp(e.clientX-r.left,24,W-24);S.ty=clamp(e.clientY-r.top-(e.pointerType==='touch'?52:0),35,H-28);}
canvas.addEventListener('pointerdown',e=>{if(S.mode!=='playing')return;drag=true;canvas.setPointerCapture(e.pointerId);pointer(e);});canvas.addEventListener('pointermove',e=>{if(drag)pointer(e);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,()=>drag=false);
addEventListener('keydown',e=>{if(e.key.startsWith('Arrow')){e.preventDefault();keys[e.key]=true;}if(e.key==='Escape'||e.code==='Space'){e.preventDefault();S.mode==='paused'?resume():pause();}});addEventListener('keyup',e=>delete keys[e.key]);
function resume(){S.mode='playing';$('cover').hidden=true;$('microPad').hidden=false;keys={};}
function launchBattle(){
  $('microPad').hidden=true;
  const rootPath=location.pathname.replace(/\/level4-flight\/(?:index\.html)?$/,'/');
  location.href=location.origin+rootPath+'#/level/4?test=battle';
}
$('start').onclick=()=>{if(!loaded)return;if(S.mode==='paused')resume();else if(S.mode==='battleReady')launchBattle();else start();};
$('again').onclick=start;
$('pause').onclick=()=>S.mode==='paused'?resume():pause();
$('lang').onchange=e=>{lang=e.target.value;S.notice='';label();};
let padDX=0,padDY=0;
for(const btn of document.querySelectorAll('#microPad button')){
  const activate=e=>{e.preventDefault();padDX=Number(btn.dataset.dx||0);padDY=Number(btn.dataset.dy||0);btn.classList.add('is-active');};
  const release=e=>{if(e)e.preventDefault();padDX=0;padDY=0;btn.classList.remove('is-active');};
  btn.addEventListener('pointerdown',activate);
  btn.addEventListener('pointerup',release);
  btn.addEventListener('pointercancel',release);
  btn.addEventListener('lostpointercapture',release);
}
addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});addEventListener('resize',resize);
Promise.all(['bird','tarantula','crow','jelly','coffee','rustico','coast'].map(name=>new Promise(resolve=>{const im=new Image();images[name]=im;im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src=name==='coast'?'coast.webp':'assets/'+name+'.png';}))).then(result=>{loaded=result.every(Boolean);$('start').disabled=!loaded;if(!loaded)$('help').textContent='Chargement incomplet. Actualise la page pour réessayer.';});
resize();label();$('start').disabled=true;const loading=setInterval(()=>{if(loaded){$('start').disabled=false;clearInterval(loading);}},150);
function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;tick(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
