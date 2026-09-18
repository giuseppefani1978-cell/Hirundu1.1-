'use strict';
// Standalone alternative hunt for L3. Original assets, places and clues from HIRUNDU.
const $=id=>document.getElementById(id), canvas=$('game'), ctx=canvas.getContext('2d');
const effectHud=$('effect'),topTools=document.querySelector?.('header .tools');
if(effectHud&&topTools)topTools.prepend(effectHud);
const W=HUNT_MODEL.width,R=HUNT_MODEL.radius,PW=HUNT_MODEL.paddleWidth;
// Level 5 uses the former Slow setting. Higher speeds belong to later levels.
const BIRD_SPEED=HUNT_MODEL.birdSpeed;
const POWERS=HUNT_MODEL.powers;
let H=820,PY=752;
const mapPoints={capo_0:[.78,.92],capo_1:[.81,.825],capo_2:[.62,.84],capo_3:[.57,.79],capo_4:[.47,.745],capo_5:[.57,.715],capo_6:[.78,.62],capo_7:[.73,.69],capo_8:[.80,.755],capo_9:[.33,.60]};
const ids=['capo_0','capo_1','capo_2','capo_3','capo_4','capo_5','capo_6','capo_7','capo_8','capo_9'];
const ui={
fr:{subtitle:'NIVEAU 5 · LE VOL DES GOUTTES',speaker:'Tarantula',ask:'Où trouver',title:'Vise la bonne découverte.',intro:'La tarentule pose une énigme. Fais rebondir Aracne vers le lieu qui répond à sa question.',help:'Glisse le doigt pour déplacer la plateforme. Ses bords orientent le rebond. Touche le terrain pour lancer.',play:'Jouer',launch:'Envol ↗',hint:'Indice',pace:'Rythme',speeds:['Doux','Vif','Rapide'],tip:'Glisse pour diriger · touche pour lancer · espace / ← →',ready:'À toi ! Déplace la plateforme puis lance Aracne.',wrong:'Pas ce lieu. Cherche encore !',found:'Découverte !',retry:'Aracne revient. Relance depuis la plateforme !',pause:'Le vol est en pause',resume:'Reprendre',restart:'Recommencer',win:'Les 10 lieux du Capo retrouvés !',won:'Le Sceau du Capo rejoint ta collection dans ce navigateur.',score:'points',hintText:'Vise',loading:'Chargement…',error:'Les images ne se sont pas chargées. Réessaie.',reload:'Réessayer',again:'Rejouer',tag:'LE VOL D’ARACNE',paused:'Prends ton temps. La question et ta progression restent là.',bricks:'💧 +5',collection:'Sceau du Capo',recall:'Retour d’Aracne',recallTip:'Rappelle Aracne sur la plateforme pour viser à nouveau.'},
en:{subtitle:'LEVEL 5 · FLIGHT OF THE DROPS',speaker:'Tarantula',ask:'Where can you find',title:'Aim for the right discovery.',intro:'The tarantula gives a clue. Bounce Aracne towards the place that answers her question.',help:'Slide to move the paddle. Its edges change your rebound angle. Tap the field to launch.',play:'Play',launch:'Launch ↗',hint:'Hint',pace:'Pace',speeds:['Gentle','Lively','Fast'],tip:'Slide to steer · tap to launch · space / ← →',ready:'Your turn! Move the paddle, then launch Aracne.',wrong:'Not that place. Try another!',found:'Discovered!',retry:'Aracne is back. Launch again from the paddle!',pause:'Flight paused',resume:'Resume',restart:'Restart',win:'All 10 Capo places discovered!',won:'The Capo Seal joins your collection in this browser.',score:'points',hintText:'Aim for',loading:'Loading…',error:'The images could not load. Please retry.',reload:'Retry',again:'Play again',tag:'ARACNE’S FLIGHT',paused:'Take your time. Your clue and progress are waiting.',bricks:'💧 +5',collection:'Capo Seal',recall:'Recall Aracne',recallTip:'Bring Aracne back to the paddle to aim again.'},
it:{subtitle:'LIVELLO 5 · IL VOLO DELLE GOCCE',speaker:'Tarantula',ask:'Dove si trova',title:'Mira alla scoperta giusta.',intro:'La tarantola propone un enigma. Fai rimbalzare Aracne verso il luogo che risponde alla domanda.',help:'Scorri per muovere la piattaforma. I bordi cambiano la direzione del rimbalzo. Tocca il campo per partire.',play:'Gioca',launch:'Vola ↗',hint:'Indizio',pace:'Ritmo',speeds:['Dolce','Vivace','Veloce'],tip:'Scorri per dirigere · tocca per partire · spazio / ← →',ready:'Muovi la piattaforma e fai volare Aracne!',wrong:'Non è questo luogo. Riprova!',found:'Scoperto!',retry:'Aracne è tornata. Riparti dalla piattaforma!',pause:'Il volo è in pausa',resume:'Riprendi',restart:'Ricomincia',win:'Tutti i 10 luoghi del Capo scoperti!',won:'Il Sigillo del Capo entra nella tua collezione in questo browser.',score:'punti',hintText:'Mira a',loading:'Caricamento…',error:'Immagini non caricate. Riprova.',reload:'Riprova',again:'Rigioca',tag:'IL VOLO DI ARACNE',paused:'Prenditi il tuo tempo. La domanda e i progressi ti aspettano.',bricks:'💧 +5',collection:'Sigillo del Capo',recall:'Richiama Aracne',recallTip:'Riporta Aracne sulla piattaforma per mirare di nuovo.'},
es:{subtitle:'NIVEL 5 · EL VUELO DE LAS GOTAS',speaker:'Tarantula',ask:'¿Dónde está',title:'Apunta al descubrimiento correcto.',intro:'La tarántula propone un enigma. Haz rebotar a Aracne hacia el lugar que responde a su pregunta.',help:'Desliza para mover la plataforma. Sus bordes cambian el ángulo del rebote. Toca el campo para despegar.',play:'Jugar',launch:'Vuela ↗',hint:'Pista',pace:'Ritmo',speeds:['Suave','Ágil','Rápido'],tip:'Desliza para dirigir · toca para lanzar · espacio / ← →',ready:'Mueve la plataforma y lanza a Aracne.',wrong:'No es ese lugar. ¡Prueba otro!',found:'¡Descubierto!',retry:'Aracne ha vuelto. ¡Lánzala de nuevo!',pause:'Vuelo en pausa',resume:'Continuar',restart:'Reiniciar',win:'¡Los 10 lugares del Capo descubiertos!',won:'El Sello del Capo se añade a tu colección en este navegador.',score:'puntos',hintText:'Apunta a',loading:'Cargando…',error:'No se cargaron las imágenes. Inténtalo de nuevo.',reload:'Reintentar',again:'Volver a jugar',tag:'EL VUELO DE ARACNE',paused:'Tómate tu tiempo. Tu pregunta y progreso te esperan.',bricks:'💧 +5',collection:'Sello del Capo',recall:'Llamar a Aracne',recallTip:'Devuelve a Aracne a la plataforma para apuntar otra vez.'}
};
let lang='fr';try{lang=new URLSearchParams(location.search).get('lang')||localStorage.getItem('__lang__')||localStorage.getItem('hirundu_arcade_language')||navigator.language.slice(0,2)}catch{}if(!ui[lang])lang='fr';
const languageLabels={fr:'Langue',en:'Language',it:'Lingua',es:'Idioma'};
const pauseMusicLabels={
 fr:{on:'♪ Couper la musique',off:'♪ Activer la musique'},
 en:{on:'♪ Mute music',off:'♪ Play music'},
 it:{on:'♪ Disattiva musica',off:'♪ Attiva musica'},
 es:{on:'♪ Silenciar música',off:'♪ Activar música'}
};
let hostMusicEnabled=true;
function updatePauseMusicLabel(){const labels=pauseMusicLabels[lang]||pauseMusicLabels.en;$('pauseMusic').textContent=hostMusicEnabled?labels.on:labels.off;}
const state={mode:'intro',previous:'ready',round:0,score:0,misses:0,wrong:0,energy:100,food:{coffee:0,rustico:0,pasticciotto:0},bonuses:[],enemies:[],spawnIn:HUNT_MODEL.bonus.initial,enemyIn:HUNT_MODEL.enemy.initial,focus:0,shield:0,recharge:0,invulnerable:0,paddle:300,paddleTarget:300,paddleV:0,ball:{x:300,y:PY-R-12,vx:0,vy:0},targets:[],bricks:[],particles:[],trail:[],cooldown:0,transition:0,elapsed:0,message:0,speech:0,hinted:false,found:[],assetsReady:false};
const keys=new Set(), images={};let last=0,accumulator=0,scale=1,ox=0,oy=0;
function text(){return ui[lang]}function place(id){return POI_TEXT[lang][id]}function active(){return ids[state.round]}
function notice(value,duration=2){$('message').textContent=value;state.message=duration;$('message').classList.add('visible')}
function tarantulaSay(value,duration=2.2){
 state.speech=duration;state.message=0;$('message').classList.remove('visible');
 $('speaker').textContent=text().speaker;$('question').textContent=value;
}
function rect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
function question(){if(['battle','battleIntro','battleLost'].includes(state.mode)||(state.mode==='paused'&&state.previous==='battle'))return;state.speech=0;$('speaker').textContent=text().speaker;$('question').textContent=text().ask+' '+place(ids[Math.min(9,state.round)]).info+' ?';$('round').textContent=Math.min(10,state.round+1)+'/10'; }
function hud(){ $('leaves').textContent=state.found.length;$('score').textContent=state.score;$('energy').textContent=Math.round(state.energy);for(const kind of ['coffee','rustico','pasticciotto'])$(kind+'Count').textContent=state.food[kind]; }
function translated(){const t=text();document.documentElement.lang=lang;$('language').value=lang;$('pauseLanguageLabel').textContent=languageLabels[lang]||'Language';updatePauseMusicLabel();for(const [id,key] of [['subtitle','subtitle'],['speaker','speaker'],['hint','hint'],['tip','tip'],['cardTag','tag'],['restart','restart']])$(id).textContent=t[key];$('launch').textContent=state.mode==='flying'?t.recall:t.launch;$('launch').title=t.recallTip;question();extraLabels();updatePowerHUD();if(state.mode==='intro')showIntro();else if(state.mode==='paused')showPause();else if(state.mode==='won')showWin();else if(state.mode==='battleIntro')battleIntro();else if(state.mode==='battleLost')Battle.lose();}
function cover(title,description,help,label){const intro=state.mode==='battleIntro',paused=state.mode==='paused';document.body.classList.toggle('battle-intro',intro);document.body.classList.toggle('pause-active',paused);$('battlePreview').hidden=!intro;$('battleSupplies').hidden=!intro;$('orientationPrompt').hidden=!intro;$('pauseLanguage').hidden=!paused;$('pauseScore').hidden=!paused;if(paused)$('pauseScore').textContent=(text().score.charAt(0).toUpperCase()+text().score.slice(1))+' · '+state.score;$('play').disabled=!state.assetsReady;$('cover').classList.remove('hidden');$('cardTitle').textContent=title;$('cardText').textContent=description;$('cardHelp').textContent=help;$('play').textContent=label;$('restart').hidden=!paused;$('pauseMusic').hidden=!paused;$('continueLevel').hidden=state.mode!=='won'||trainingBattle;$('discoveries').hidden=!(paused||state.mode==='won')||trainingBattle;$('exitLevel').hidden=state.mode!=='won';$('installApp').hidden=!paused||!hostInstallAvailable;}
function showIntro(){const t=text();cover(t.title,t.intro,t.help,state.assetsReady?t.play:t.loading)}
function showPause(){const t=text();cover(t.pause,t.paused,state.previous==='battle'?extra().battleHelp:t.help,t.resume);syncBattleOrientation()}
function showWin(){const t=text();cover(t.win,t.won,state.score+' '+t.score+' · 💧 10/10',t.again)}
function mapViewport(){const f=Math.min((W-2)/1024,(H-2)/1536);return {x:(W-1024*f)/2,y:(H-1536*f)/2,w:1024*f,h:1536*f};}
function resize(){
 const b=canvas.getBoundingClientRect();if(!b.width||!b.height)return;syncBattleOrientation();
 const dpr=Math.min(devicePixelRatio||1,2),oldH=H;
 H=Math.max(540,Math.min(1400,W*b.height/b.width));PY=H-54;
 canvas.width=Math.round(b.width*dpr);canvas.height=Math.round(b.height*dpr);
 scale=Math.min(b.width/W,b.height/H);ox=(b.width-W*scale)/2;oy=(b.height-H*scale)/2;
 ctx.setTransform(dpr,0,0,dpr,0,0);
 if(oldH!==H){
  state.ball.y*=H/oldH;state.trail=[];
  state.targets.forEach(t=>Object.assign(t,pin(t.id)));
  state.bricks.forEach((brick,i)=>brick.y=wallY(Math.floor(i/8)));
  for(const item of [...state.bonuses,...state.enemies])item.y*=H/oldH;
  if(state.mode==='ready'||state.mode==='intro')state.ball.y=PY-R-12;
 }
}
function pin(id){const p=mapPoints[id],m=mapViewport();return {x:m.x+p[0]*m.w,y:m.y+p[1]*m.h};}
function roundSetup(){
 const choices=[active()];const pool=ids.filter(id=>id!==active());
 while(choices.length<3){pool.sort((a,b)=>Math.min(...choices.map(c=>Math.hypot(pin(b).x-pin(c).x,pin(b).y-pin(c).y)))-Math.min(...choices.map(c=>Math.hypot(pin(a).x-pin(c).x,pin(a).y-pin(c).y))));choices.push(pool.shift())}
 choices.sort((a,b)=>pin(a).x-pin(b).x);
 state.targets=choices.map((id,i)=>({id,...pin(id),number:i+1,flash:0}));
 $('targetsList').textContent=state.targets.map(t=>t.number+' · '+place(t.id).name).join('   /   ');
 state.hinted=false;state.cooldown=0;question();serve();
}
function wallY(row){return row===2?H*.50:H*.58+row*31}
function makeWalls(){state.bricks=Array.from({length:24},(_,i)=>{const row=Math.floor(i/8);return{x:(i%8)*75,y:wallY(row),w:75,h:30,alive:true}});}
function serve(){state.mode='ready';state.ball={x:state.paddle,y:PY-R-12,vx:0,vy:0};state.trail=[];$('launch').textContent=text().launch;}
function start(){if(!state.assetsReady)return;touchPointer=null;last=0;accumulator=0;Battle.completed=false;document.body.classList.remove('battle-active','battle-intro','pause-active');$('battleHUD').hidden=true;keys.clear();Object.assign(state,{round:0,score:0,misses:0,wrong:0,paddle:300,paddleTarget:300,paddleV:0,found:[],particles:[],elapsed:0,transition:0,energy:100,food:{coffee:0,rustico:0,pasticciotto:0},bonuses:[],enemies:[],spawnIn:HUNT_MODEL.bonus.initial,enemyIn:HUNT_MODEL.enemy.initial,focus:0,shield:0,recharge:0,invulnerable:0,speech:0});makeWalls();$('cover').classList.add('hidden');roundSetup();translated();hud();updatePowerHUD();resize();notice(text().ready,3);canvas.focus({preventScroll:true});}
function launch(){if(state.mode!=='ready')return;state.mode='flying';const speed=BIRD_SPEED*(state.focus>0?.8:1);state.ball.vx=speed*.2;state.ball.vy=-Math.sqrt(speed*speed-state.ball.vx**2);$('launch').textContent=text().recall;state.message=0;$('message').classList.remove('visible');}
function launchOrRecall(){canvas.focus({preventScroll:true});if(state.mode==='ready')launch();else if(state.mode==='flying'){serve();notice(text().ready,2)}}
function pause(){touchPointer=null;if(!['ready','flying','transition','battle'].includes(state.mode))return;state.previous=state.mode;state.mode='paused';keys.clear();showPause();}
function resume(){if(state.previous==='battle'&&!battleOrientationReady()){syncBattleOrientation();return}accumulator=0;state.mode=state.previous;document.body.classList.remove('pause-active');$('cover').classList.add('hidden');last=0;canvas.focus({preventScroll:true});}
function burst(x,y,color){for(let i=0;i<18;i++){const angle=Math.random()*Math.PI*2,s=60+Math.random()*170;state.particles.push({x,y,vx:Math.cos(angle)*s,vy:Math.sin(angle)*s,life:.65,color})}}
function hitTarget(target){if(state.cooldown>0)return;state.cooldown=.55;target.flash=.5;
 if(target.id!==active()){state.wrong++;state.hinted=true;tarantulaSay(text().wrong+' '+text().hintText+' '+place(active()).name,2.2);burst(state.ball.x,state.ball.y,'#db7358');return}
 state.found.push(target.id);state.score+=100;burst(state.ball.x,state.ball.y,'#fff4a0');notice('💧 '+place(target.id).name+' · '+text().found,1.5);hud();state.mode='transition';state.transition=1.5;
}
function finish(){state.mode='won';sendHost('victory',{score:state.score,leaves:state.found.length,elapsed:state.elapsed,misses:state.misses,food:{...state.food}});state.message=0;$('message').classList.remove('visible');try{if(!trainingBattle)localStorage.setItem('hirundu_l5_seal','capo');if(!trainingBattle)localStorage.setItem('hirundu_arcade_l5_best',String(Math.max(state.score,Number(localStorage.getItem('hirundu_arcade_l5_best'))||0)))}catch{}showWin()}
function hitRect(b,r){const x=Math.max(r.x,Math.min(b.x,r.x+r.w)),y=Math.max(r.y,Math.min(b.y,r.y+r.h)),dx=b.x-x,dy=b.y-y;if(dx*dx+dy*dy>R*R)return false;
 let nx=dx,ny=dy,len=Math.hypot(nx,ny);if(len<.001){const distances=[Math.abs(b.x-r.x),Math.abs(b.x-r.x-r.w),Math.abs(b.y-r.y),Math.abs(b.y-r.y-r.h)],i=distances.indexOf(Math.min(...distances));nx=[-1,1,0,0][i];ny=[0,0,-1,1][i];len=1;b.x+=nx*(distances[i]+R);b.y+=ny*(distances[i]+R)}else{b.x+=nx/len*(R-len+.2);b.y+=ny/len*(R-len+.2)}nx/=len;ny/=len;const dot=b.vx*nx+b.vy*ny;if(dot<0){b.vx-=2*dot*nx;b.vy-=2*dot*ny}return true;
}
function step(dt){
 if(['intro','paused','won','battleIntro','battleLost'].includes(state.mode))return;
 if(state.mode==='battle'){Battle.tick(dt);return;}
 state.elapsed+=dt;state.cooldown=Math.max(0,state.cooldown-dt);state.message=Math.max(0,state.message-dt);if(!state.message)$('message').classList.remove('visible');
 const hadSpeech=state.speech>0;state.speech=Math.max(0,state.speech-dt);if(hadSpeech&&state.speech===0)question();
 state.targets.forEach(t=>t.flash=Math.max(0,t.flash-dt));state.particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt});state.particles=state.particles.filter(p=>p.life>0);
 if(keys.has('ArrowLeft')||keys.has('a'))state.paddleTarget-=760*dt;if(keys.has('ArrowRight')||keys.has('d'))state.paddleTarget+=760*dt;state.paddleTarget=Math.max(PW/2+8,Math.min(W-PW/2-8,state.paddleTarget));const paddleDelta=state.paddleTarget-state.paddle;const movement=paddleDelta*(-Math.expm1(-HUNT_MODEL.paddleResponse*dt));state.paddleV=movement/dt;state.paddle+=movement;state.paddle=Math.max(PW/2+8,Math.min(W-PW/2-8,state.paddle));
 const b=state.ball;
 if(state.mode==='transition'){state.transition-=dt;if(state.transition<=0){state.round++;if(state.round===10)battleIntro();else{roundSetup();notice(text().ready,1.8)}}return}
 if(state.mode==='ready'){b.x=state.paddle;b.y=PY-R-12;return}
 const speed=BIRD_SPEED*(state.focus>0?.8:1),len=Math.hypot(b.vx,b.vy)||speed;b.vx*=speed/len;b.vy*=speed/len;
 // A minimum vertical component prevents endless horizontal loops.
 if(Math.abs(b.vy)<speed*.3){b.vy=(Math.sign(b.vy)||-1)*speed*.3;b.vx=(Math.sign(b.vx)||1)*Math.sqrt(speed*speed-b.vy*b.vy)}
 const oldY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;
 if(b.x<R){b.x=R;b.vx=Math.abs(b.vx)}if(b.x>W-R){b.x=W-R;b.vx=-Math.abs(b.vx)}if(b.y<R){b.y=R;b.vy=Math.abs(b.vy)}
 if(b.vy>0&&oldY+R<=PY&&b.y+R>=PY&&Math.abs(b.x-state.paddle)<=PW/2+R){
  const offset=Math.max(-1,Math.min(1,(b.x-state.paddle)/(PW/2)));const angle=offset*1.06;
  b.vx=speed*Math.sin(angle);b.vy=-speed*Math.cos(angle);b.y=PY-R-.1;burst(b.x,PY,'#f6d478');
 }
 huntExtras(dt);if(state.mode!=='flying')return;
 for(const t of state.targets){if(Math.hypot(b.x-t.x,b.y-t.y)<R+28){hitTarget(t);break}}
 if(state.mode!=='flying')return;
 for(const brick of state.bricks){if(brick.alive&&hitRect(b,brick)){brick.alive=false;state.score+=5;burst(brick.x+brick.w/2,brick.y,'#d5b77f');hud();break}}
 if(b.y>H+R){state.misses++;state.energy=Math.max(20,state.energy-5);hud();serve();notice(text().retry,2)}
}
function wrap(value,x,y,maxWidth){const words=value.split(' ');let line='',rows=[];for(const word of words){const trial=line?line+' '+word:word;if(ctx.measureText(trial).width>maxWidth&&line){rows.push(line);line=word}else line=trial}rows.push(line);rows.forEach((s,i)=>ctx.fillText(s,x,y+(i-(rows.length-1)/2)*Math.max(22,15/scale)))}
// Same flight animation as the classic hunt's legacy/levelSession.js.
function drawFlyingBird(x,y,size,velocity=0,active=false){
 const motion=active?1:0,now=state.elapsed*1000;
 const mx=active?velocity/BIRD_SPEED:0,my=active?state.ball.vy/BIRD_SPEED:0;
 const flap=Math.sin(now/(motion>.15?74:118));
 const bob=Math.sin(now/(motion>.15?105:155))*(1.2+motion*1.5);
 const scaleY=.95+flap*(.045+motion*.025),scaleX=1.015-flap*.018;
 const tilt=Math.max(-.15,Math.min(.15,my*.10+mx*.035));
 ctx.save();ctx.translate(x,y+bob);ctx.rotate(tilt);ctx.scale(scaleX,scaleY);
 if(images.bird?.naturalWidth>0)ctx.drawImage(images.bird,-size/2,-size/2,size,size);
 ctx.restore();
}
function draw(){
 const bounds=canvas.getBoundingClientRect();if(state.mode==='battle'||state.mode==='battleLost'||(state.mode==='paused'&&state.previous==='battle')||(state.mode==='won'&&Battle.completed)){Battle.draw(bounds);return;}ctx.clearRect(0,0,bounds.width,bounds.height);ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
 ctx.fillStyle='#bfe2f8';ctx.fillRect(0,0,W,H);
 if(images.map?.naturalWidth>0){const m=mapViewport();ctx.drawImage(images.map,m.x,m.y,m.w,m.h)}
 
 ctx.textAlign='center';
 // POIs use the original L3 coordinates projected through the same map viewport.
 for(const id of ids){if(state.found.includes(id)||state.targets.some(t=>t.id===id))continue;const p=pin(id);ctx.strokeStyle='#317b48';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x-5,p.y-5);ctx.lineTo(p.x+5,p.y+5);ctx.moveTo(p.x+5,p.y-5);ctx.lineTo(p.x-5,p.y+5);ctx.stroke()}
 for(const id of state.found){const p=pin(id);ctx.fillStyle='#317e44';ctx.font='bold 22px system-ui';ctx.fillText('✓',p.x,p.y+7)}
 for(const t of state.targets){const highlighted=state.hinted&&t.id===active();ctx.save();ctx.translate(t.x,t.y);ctx.shadowColor='#50371166';ctx.shadowBlur=9;ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.fillStyle=t.flash>0?'#f3bf7c':highlighted?'#ffcf67':'#fffdf5';ctx.fill();ctx.lineWidth=highlighted?5:3;ctx.strokeStyle=highlighted?'#e3812e':'#a98238';ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#59411d';ctx.font='800 26px system-ui';ctx.fillText(t.number,0,9);if(highlighted){ctx.beginPath();ctx.arc(0,0,34+Math.sin(state.elapsed*4)*3,0,Math.PI*2);ctx.strokeStyle='#fff9dd';ctx.lineWidth=2;ctx.stroke()}ctx.restore()}
 for(const b of state.bricks){if(!b.alive)continue;rect(b.x,b.y,b.w,b.h,3,'#c3a272','#82653d');ctx.strokeStyle='#f4e1ba';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x+4,b.y+4);ctx.lineTo(b.x+b.w-4,b.y+4);ctx.stroke();ctx.strokeStyle='#967646';ctx.beginPath();ctx.moveTo(b.x+b.w*.65,b.y+9);ctx.lineTo(b.x+b.w*.48,b.y+16);ctx.lineTo(b.x+b.w*.6,b.y+23);ctx.stroke()}
 for(const item of state.bonuses){ctx.save();ctx.globalAlpha=.9*Math.min(1,item.life/2);sprite(item.kind,item.x,item.y,42/scale);ctx.restore()}
 for(const enemy of state.enemies){ctx.save();ctx.translate(enemy.x,enemy.y);if(enemy.kind==='crow')ctx.rotate(Math.atan2(enemy.vy||0,enemy.vx));sprite(enemy.kind,0,0,42/scale);ctx.restore();}
 state.trail.forEach((p,i)=>{ctx.globalAlpha=i/state.trail.length*.28;ctx.fillStyle='#fff8b5';ctx.beginPath();ctx.arc(p.x,p.y,5+i*.25,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;
 const ball=state.ball;if(state.shield>0){ctx.save();ctx.beginPath();ctx.arc(ball.x,ball.y,39+Math.sin(state.elapsed*5)*2,0,Math.PI*2);ctx.fillStyle='#72e6ed20';ctx.fill();ctx.strokeStyle='#72e6ed';ctx.shadowColor='#72e6ed';ctx.shadowBlur=12;ctx.lineWidth=3;ctx.stroke();ctx.restore()}if(state.recharge>0){ctx.save();ctx.globalAlpha=state.recharge;ctx.beginPath();ctx.arc(ball.x,ball.y,37+(1-state.recharge)*22,0,Math.PI*2);ctx.strokeStyle='#b7ef9a';ctx.lineWidth=3;ctx.stroke();ctx.restore()}if(state.invulnerable>0)ctx.globalAlpha=.6+.4*Math.sin(state.elapsed*28);drawFlyingBird(ball.x,ball.y,70,ball.vx,state.mode==='flying');ctx.globalAlpha=1;
 if(state.mode==='ready'){ctx.save();ctx.setLineDash([5,7]);ctx.strokeStyle='#fffcdb';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ball.x,ball.y-32);ctx.lineTo(ball.x+20,ball.y-110);ctx.stroke();ctx.restore()}
 ctx.save();ctx.shadowColor='#243d3655';ctx.shadowBlur=10;rect(state.paddle-PW/2,PY,PW,17,8,'#285448','#f6d27a');rect(state.paddle-PW/2+7,PY+3,PW-14,3,2,'#eaca78');ctx.restore();
 state.particles.forEach(p=>{ctx.globalAlpha=p.life/.65;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,5,5)});ctx.globalAlpha=1;ctx.restore();
}
function frame(now){if(state.mode!==lastHostMode){lastHostMode=state.mode;sendHost('phase',{mode:state.mode,previous:state.previous})}const dt=last?Math.min(.05,(now-last)/1000):0;last=now;accumulator+=dt;while(accumulator>=1/240){step(1/240);accumulator-=1/240}if(state.mode==='flying'){state.trail.push({x:state.ball.x,y:state.ball.y});if(state.trail.length>14)state.trail.shift()}draw();requestAnimationFrame(frame)}
let touchPointer=null,touchX=0,touchTarget=300;
function pointer(e){
 const r=canvas.getBoundingClientRect();
 const x=e.pointerType==='mouse'?(e.clientX-r.left-ox)/scale:touchTarget+(e.clientX-touchX)/scale;
 state.paddleTarget=Math.max(PW/2+8,Math.min(W-PW/2-8,x));
 if(e.pointerType!=='mouse'){touchX=e.clientX;touchTarget=state.paddleTarget;}
}
canvas.addEventListener('pointerdown',e=>{
 if(!['ready','flying'].includes(state.mode)||touchPointer!==null)return;
 e.preventDefault();touchPointer=e.pointerId;touchX=e.clientX;touchTarget=state.paddleTarget;
 canvas.setPointerCapture(e.pointerId);pointer(e);if(state.mode==='ready')launch();
});
canvas.addEventListener('pointermove',e=>{
 if(!['ready','flying'].includes(state.mode))return;
 if(e.pointerId===touchPointer||(e.pointerType==='mouse'&&touchPointer===null))pointer(e);
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(e.pointerId===touchPointer)touchPointer=null;});
$('play').onclick=()=>state.mode==='paused'?resume():state.mode==='battleIntro'||state.mode==='battleLost'?Battle.start():start();$('restart').onclick=start;$('launch').onclick=launchOrRecall;$('pause').onclick=()=>state.mode==='paused'?resume():pause();
$('hint').onclick=()=>{if(!['ready','flying'].includes(state.mode))return;state.hinted=true;notice(text().hintText+' '+place(active()).name,3)};
$('language').onchange=e=>{e.stopPropagation();const wasPaused=state.mode==='paused',pausedFrom=state.previous;lang=$('language').value;try{localStorage.setItem('hirundu_arcade_language',lang);localStorage.setItem('__lang__',lang)}catch{}translated();labelBridge();if(wasPaused){state.previous=pausedFrom;state.mode='paused';showPause();$('language').focus({preventScroll:true})}};['pointerdown','pointerup','touchstart','touchend','click'].forEach(type=>$('language').addEventListener(type,e=>e.stopPropagation(),{passive:true}));
for(const [id,key] of [['left','ArrowLeft'],['right','ArrowRight']]){const button=$(id);button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);keys.add(key)});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys.delete(key));}
addEventListener('keydown',e=>{if(e.target?.tagName==='SELECT'||e.target?.tagName==='BUTTON')return;if(state.mode==='battle'){if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Shift','a','A','b','B',' ','Escape'].includes(e.key)){e.preventDefault();if(e.key==='Escape')pause();else if(['a','A','b','B',' '].includes(e.key)){if(!e.repeat)Battle.action(e.key.toLowerCase()==='b'?'special':'normal')}else if(['ArrowUp','ArrowDown','Shift'].includes(e.key)){if(!e.repeat)Battle.action(e.key==='ArrowUp'?'jump':e.key==='ArrowDown'?'dive':'dodge')}else keys.add(e.key)}return;}if(['ArrowLeft','ArrowRight',' ','a','d','Escape'].includes(e.key)){e.preventDefault();if(e.key===' '&&!e.repeat)launchOrRecall();else if(e.key==='Escape')state.mode==='paused'?resume():pause();else keys.add(e.key)}});addEventListener('keyup',e=>keys.delete(e.key));addEventListener('blur',()=>{keys.clear();pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();pause()}});addEventListener('resize',resize);
async function loadAssets(){try{await Promise.all(['map','bird','tarantula','battle','boss','coffee','rustico','pasticciotto','crow','jelly'].map(name=>new Promise((resolve,reject)=>{const img=new Image();images[name]=img;img.onload=resolve;img.onerror=reject;img.src={"bird": "../assets/aracne%20.PNG", "map": "../assets/salento-map.PNG", "tarantula": "../assets/tarantula%20.PNG", "coffee": "../assets/caffeleccese%20.PNG", "rustico": "../assets/rustico.PNG", "pasticciotto": "../assets/bonus-pasticciotto.PNG", "boss": "../assets/boss-5.svg", "battle": "../assets/battle_bg_leuca.webp", "crow": "../assets/crow.PNG", "jelly": "../assets/jellyfish.PNG"}[name]})));state.assetsReady=true;$('play').disabled=false;if(trainingBattle){state.found=ids.slice();state.food={coffee:1,rustico:1,pasticciotto:1};hud();battleIntro()}else showIntro()}catch{$('cardText').textContent=text().error;$('play').textContent=text().reload;$('play').disabled=false;$('play').onclick=()=>location.reload()}}

const extras={
fr:{intro:'Traverse trois niveaux de murs de pierre pour atteindre les lieux du Capo di Leuca. La tarentule te donne l’indice : guide Aracne vers le bon repère numéroté.',wall:'Murs de pierre',coffee:'Caffè leccese · énergie +30',rustico:'Rustico · bouclier 8 s',pasticciotto:'Pasticciotto · énergie +20 · vol ralenti 7 s',hit:'Attention aux ennemis !',energy:'Énergie',battle:'Bataille du Capo',battleIntro:'Les dix lieux sont retrouvés. Affronte le Scirocco avec les provisions récoltées avant la rafale du Scirocco.',battleHelp:'← → bouger · ↑ sauter · A attaquer · B spécial. Les provisions alimentent les attaques spéciales.',fight:'Combattre',jump:'Saut',attack:'Attaque',special:'Spécial',warning:'Attention : rafale de vent !',exposed:'Maintenant ! Le boss est vulnérable.',phase:'Le Scirocco accélère !',lost:'Aracne reprend son souffle',retry:'Réessayer la bataille',lostText:'Tes découvertes et tes provisions sont conservées pour réessayer.',victory:'Le Capo est libéré !',boss:'Scirocco',safe:'Bouclier actif',focus:'Vol ralenti',normal:'Vol calme',orientation:'Bataille : le mode paysage offre plus de place.',victoryText:'Victoire sur le Scirocco ! Le Sceau du Capo est conservé dans ce navigateur.'},
en:{intro:'Break through three tiers of stone walls to reach the places of Capo di Leuca. Follow the tarantula’s clue and guide Aracne into the right numbered marker.',wall:'Stone walls',coffee:'Caffè leccese · energy +30',rustico:'Rustico · shield 8 s',pasticciotto:'Pasticciotto · energy +20 · slower flight 7 s',hit:'Watch out for enemies!',energy:'Energy',battle:'Battle of the Capo',battleIntro:'All ten places found. Face Scirocco with the provisions you collected before Scirocco’s gust.',battleHelp:'← → move · ↑ jump · A attack · B special. Collected food powers special attacks.',fight:'Fight',jump:'Jump',attack:'Attack',special:'Special',warning:'Incoming wind blast!',exposed:'Now! The boss is vulnerable.',phase:'The Scirocco speeds up!',lost:'Aracne catches her breath',retry:'Retry battle',lostText:'Your discoveries and provisions are kept for the retry.',victory:'The Capo is free!',boss:'Scirocco',safe:'Shield active',focus:'Slow flight',normal:'Easy flight',orientation:'Battle: landscape gives you more space.',victoryText:'The Scirocco is defeated! The Capo Seal is saved in this browser.'},
it:{intro:'Supera tre livelli di muri di pietra per raggiungere i luoghi del Capo di Leuca. Segui l’indizio della tarantola e guida Aracne sul segnaposto giusto.',wall:'Muri di pietra',coffee:'Caffè leccese · energia +30',rustico:'Rustico · scudo 8 s',pasticciotto:'Pasticciotto · energia +20 · volo lento 7 s',hit:'Attenzione ai nemici!',energy:'Energia',battle:'Battaglia del Capo',battleIntro:'Hai trovato i dieci luoghi. Affronta lo Scirocco con le provviste raccolte prima della raffica di Scirocco.',battleHelp:'← → muovi · ↑ salta · A attacco · B speciale. Le provviste alimentano gli attacchi speciali.',fight:'Combatti',jump:'Salto',attack:'Attacco',special:'Speciale',warning:'Attenzione: raffica di vento!',exposed:'Ora! Il boss è vulnerabile.',phase:'Lo Scirocco accelera!',lost:'Aracne riprende fiato',retry:'Riprova la battaglia',lostText:'Le scoperte e le provviste restano disponibili per riprovare.',victory:'Il Capo è libero!',boss:'Scirocco',safe:'Scudo attivo',focus:'Volo lento',normal:'Volo tranquillo',orientation:'Battaglia: in orizzontale hai più spazio.',victoryText:'Lo Scirocco è sconfitto! Il Sigillo del Capo è salvato in questo browser.'},
es:{intro:'Supera tres niveles de muros de piedra para alcanzar los lugares del Capo di Leuca. Sigue la pista de la tarántula y guía a Aracne al marcador correcto.',wall:'Muros de piedra',coffee:'Caffè leccese · energía +30',rustico:'Rustico · escudo 8 s',pasticciotto:'Pasticciotto · energía +20 · vuelo lento 7 s',hit:'¡Cuidado con los enemigos!',energy:'Energía',battle:'Batalla del Capo',battleIntro:'Has encontrado los diez lugares. Enfréntate al Scirocco con las provisiones recogidas antes de la ráfaga de Scirocco.',battleHelp:'← → mover · ↑ saltar · A atacar · B especial. La comida alimenta los ataques especiales.',fight:'Combatir',jump:'Salto',attack:'Ataque',special:'Especial',warning:'¡Atención: ráfaga de viento!',exposed:'¡Ahora! El jefe es vulnerable.',phase:'¡El Scirocco acelera!',lost:'Aracne recupera el aliento',retry:'Reintentar batalla',lostText:'Conservas tus descubrimientos y provisiones para reintentar.',victory:'¡El Capo es libre!',boss:'Scirocco',safe:'Escudo activo',focus:'Vuelo lento',normal:'Vuelo tranquilo',orientation:'Batalla: en horizontal tienes más espacio.',victoryText:'¡Scirocco derrotado! El Sello del Capo se guarda en este navegador.'}
};
function extra(){return extras[lang]}
function extraLabels(){ui[lang].intro=extra().intro;ui[lang].win=extra().victory;ui[lang].won=extra().victoryText;$('jump').textContent='↑';$('jump').setAttribute('aria-label',battleUI().flap);$('dive').setAttribute('aria-label',battleUI().dive);$('dodge').textContent='↯ '+battleUI().dodge;$('attack').textContent='A · '+extra().attack;$('special').textContent='B · '+extra().special;$('energyLabel').textContent=extra().energy;$('bonusHelp').textContent=extra().coffee+' · '+extra().rustico+' · '+extra().pasticciotto;for(const kind of ['coffee','rustico','pasticciotto'])$(kind+'Count').parentElement?.setAttribute('title',extra()[kind]);$('targetsList').textContent=state.targets.map(t=>t.number+' · '+place(t.id).name).join('   /   ');if(state.mode==='battle'||(state.mode==='paused'&&state.previous==='battle')){Battle.hud();$('speaker').textContent=extra().battle;$('question').textContent=extra().battleHelp;$('targetsList').textContent='Aracne ✦ Scirocco';$('tip').textContent=extra().orientation;}}
function sprite(name,x,y,size){const img=images[name];if(!img?.naturalWidth)return;ctx.drawImage(img,x-size/2,y-size/2,size,size)}
function randomMapPosition(){const m=mapViewport();return {x:m.x+m.w*(.08+Math.random()*.84),y:m.y+m.h*(.08+Math.random()*.78)};}
function spawnBonus(){if(state.bonuses.length>=HUNT_MODEL.bonus.max)return;const r=Math.random(),kind=r<.5?'pasticciotto':r<.85?'rustico':'coffee';state.bonuses.push({kind,...randomMapPosition(),life:HUNT_MODEL.bonus.life})}
function spawnEnemy(){if(state.enemies.length>=HUNT_MODEL.enemy.max)return;const kind=Math.random()<.5?'crow':'jelly',angle=Math.random()*Math.PI*2,speed=kind==='crow'?48:30;state.enemies.push({kind,...randomMapPosition(),phase:0,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:HUNT_MODEL.enemy.life})}
function collectBonus(item){
 if(item.collected||!POWERS[item.kind])return;
 item.collected=true;item.life=0;state.food[item.kind]++;state.score+=20;
 const power=POWERS[item.kind];
 if(power.energy){state.energy=Math.min(100,state.energy+power.energy);state.recharge=1;}
 // Recollecting refreshes duration; it never multiplies strength or stacks indefinitely.
 if(power.shield)state.shield=power.shield;
 if(power.slow)state.focus=power.slow;
 updatePowerHUD();notice(extra()[item.kind],2.5);burst(item.x,item.y,'#fff2a2');hud();
}
function updatePowerHUD(){
 const effects=[];
 if(state.shield>0)effects.push('◉ '+extra().safe+' '+Math.ceil(state.shield)+'s');
 if(state.focus>0)effects.push('◷ '+extra().focus+' '+Math.ceil(state.focus)+'s');
 $('effect').textContent=effects.join(' · ');
}
function huntExtras(dt){
 for(const k of ['focus','shield','recharge','invulnerable'])state[k]=Math.max(0,state[k]-dt);
 state.spawnIn-=dt;if(state.spawnIn<=0){spawnBonus();state.spawnIn=HUNT_MODEL.bonus.interval+Math.random()*HUNT_MODEL.bonus.jitter}
 state.enemyIn-=dt;if(state.enemyIn<=0){spawnEnemy();state.enemyIn=HUNT_MODEL.enemy.interval+Math.random()*HUNT_MODEL.enemy.jitter}
 for(const item of state.bonuses){item.life-=dt;if(item.life>0&&Math.hypot(item.x-state.ball.x,item.y-state.ball.y)<R+21/scale)collectBonus(item)}state.bonuses=state.bonuses.filter(i=>i.life>0);
 for(const e of state.enemies){e.life-=dt;e.phase+=dt;e.x+=e.vx*dt;e.y+=(e.vy||0)*dt;if(e.kind==='jelly')e.y+=Math.sin(e.phase*1.7)*12*dt;if(e.x<28||e.x>W-28){e.vx*=-1;e.x=Math.max(28,Math.min(W-28,e.x))}if(e.y<28||e.y>PY-40){e.vy=-(e.vy||0);e.y=Math.max(28,Math.min(PY-40,e.y))}if(state.invulnerable===0&&Math.hypot(e.x-state.ball.x,e.y-state.ball.y)<R+21/scale){e.life=0;state.invulnerable=1.5;if(state.shield<=0){state.energy=Math.max(0,state.energy-15);state.ball.vx*=-1;notice(extra().hit,1.5);if(state.energy===0){state.energy=40;serve()}}else notice(extra().safe,1);burst(e.x,e.y,'#e29b64');hud()}}state.enemies=state.enemies.filter(e=>e.life>0);
 updatePowerHUD();
}
const battleCopy={
 fr:{rotate:'Tourne ton téléphone',orientation:'Portrait → paysage pour la bataille.',ready:'Prêt pour la bataille',readyHelp:'Le paysage est activé. Lance le combat quand tu es prêt.',complete:'Chasse terminée · 10/10',flap:'Battement d’ailes',dive:'Plongée',dodge:'Esquive',help:'← → se déplacer · ↑ battre des ailes · ↓ plonger · ↯ esquiver · A attaquer · B spécial'},
 en:{rotate:'Turn your phone',orientation:'Portrait → landscape for battle.',ready:'Ready for battle',readyHelp:'Landscape is ready. Start when you are ready.',complete:'Hunt complete · 10/10',flap:'Wingbeat',dive:'Dive',dodge:'Dodge',help:'← → move · ↑ flap · ↓ dive · ↯ dodge · A attack · B special'},
 it:{rotate:'Ruota il telefono',orientation:'Da verticale a orizzontale per la battaglia.',ready:'Pronto per la battaglia',readyHelp:'Modalità orizzontale pronta. Inizia quando vuoi.',complete:'Caccia completata · 10/10',flap:'Battito d’ali',dive:'Picchiata',dodge:'Schivata',help:'← → muovi · ↑ batti le ali · ↓ picchiata · ↯ schivata · A attacco · B speciale'},
 es:{rotate:'Gira el teléfono',orientation:'De vertical a horizontal para la batalla.',ready:'Listo para la batalla',readyHelp:'Modo horizontal listo. Empieza cuando quieras.',complete:'Caza completada · 10/10',flap:'Aleteo',dive:'Picado',dodge:'Esquiva',help:'← → mover · ↑ aletear · ↓ picado · ↯ esquivar · A atacar · B especial'}
};
for(const language of Object.keys(battleCopy))extras[language].battleHelp=battleCopy[language].help;
function battleUI(){return battleCopy[lang]}
function battleOrientationReady(){return typeof matchMedia!=='function'||!matchMedia('(pointer: coarse)').matches||matchMedia('(orientation: landscape)').matches;}
function syncBattleOrientation(){
 const ready=battleOrientationReady();
 document.body.classList.toggle('battle-orientation-ready',ready);
 if(state.mode==='battle'&&!ready){pause();return}
 const gated=state.mode==='battleIntro'||state.mode==='battleLost'||(state.mode==='paused'&&state.previous==='battle');
 if(!gated)return;
 $('orientationPrompt').hidden=state.mode!=='battleIntro'&&ready;
 $('orientationTitle').textContent=ready?battleUI().ready:battleUI().rotate;
 $('orientationText').textContent=ready?battleUI().readyHelp:battleUI().orientation;
 $('play').disabled=!ready||!state.assetsReady;
}
function battleIntro(){
 state.mode='battleIntro';state.message=0;touchPointer=null;keys.clear();
 $('message').classList.remove('visible');$('question').textContent=extra().battle;$('targetsList').textContent='';
 cover(extra().battle,extra().battleIntro,battleUI().help,extra().fight);
 $('cardTag').textContent=battleUI().complete;
 $('battleSupplies').textContent='💧 '+state.found.length+' · ☕ '+state.food.coffee+' · 🥟 '+state.food.rustico+' · 🥧 '+state.food.pasticciotto;
 syncBattleOrientation();
}

const trainingBattle=new URLSearchParams(location.search).get('test')==='battle';
let lastHostMode='',hostInstallAvailable=false;
function sendHost(type,data={}){if(window.parent!==window)window.parent.postMessage({source:'hirundu-level5',type,...data},location.origin)}
const bridgeLabels={fr:['Niveau suivant','Mes découvertes','Accueil','Installer l’application'],en:['Next level','My discoveries','Home','Install app'],it:['Livello successivo','Le mie scoperte','Home','Installa app'],es:['Siguiente nivel','Mis descubrimientos','Inicio','Instalar aplicación']};
function labelBridge(){['continueLevel','discoveries','exitLevel','installApp'].forEach((id,i)=>$(id).textContent=bridgeLabels[lang][i])}
for(const [id,type] of [['continueLevel','continue'],['discoveries','discoveries'],['exitLevel','exit'],['installApp','install'],['pauseMusic','music-toggle']])$(id).onclick=()=>sendHost(type);
addEventListener('message',e=>{if(e.source!==window.parent||e.origin!==location.origin||e.data?.source!=='hirundu-host')return;if(e.data.type==='install-state'){hostInstallAvailable=!!e.data.available;$('installApp').hidden=state.mode!=='paused'||!hostInstallAvailable}if(e.data.type==='music-state'){hostMusicEnabled=!!e.data.enabled;updatePauseMusicLabel()}if(e.data.type==='pause')pause()});
labelBridge();sendHost('ready');
roundSetup();makeWalls();state.mode='intro';translated();resize();loadAssets();requestAnimationFrame(frame);
if(typeof matchMedia==='function'){matchMedia('(orientation: landscape)').addEventListener?.('change',syncBattleOrientation);}
if(document.modelContext?.registerTool){const lifecycle=new AbortController();try{Promise.resolve(document.modelContext.registerTool({name:'read_level5_progress',description:'Read progress in the Aracne rebound level 5.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({mode:state.mode,discoveries:state.found.length,score:state.score,question:state.round<10?place(active()).info:null,inventory:{...state.food},battle:state.mode==='battle'?{playerHP:Battle.data.player.hp,bossHP:Battle.data.boss.hp}:null})},{signal:lifecycle.signal})).catch(()=>{})}catch{}addEventListener('pagehide',()=>lifecycle.abort(),{once:true})}

for(const [id,key] of [['battleLeft','ArrowLeft'],['battleRight','ArrowRight']]){const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(key);canvas.focus({preventScroll:true})});for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>keys.delete(key));}
$('attack').onclick=()=>{Battle.action('normal');canvas.focus({preventScroll:true})};$('special').onclick=()=>{Battle.action('special');canvas.focus({preventScroll:true})};

if(typeof ResizeObserver==='function'){new ResizeObserver(resize).observe(canvas);}

for(const [id,action] of [['jump','jump'],['dive','dive'],['dodge','dodge']])$(id).addEventListener('pointerdown',e=>{e.preventDefault();Battle.action(action);canvas.focus({preventScroll:true})});

for(const [id,action] of [['jump','jump'],['dive','dive'],['dodge','dodge']])$(id).onclick=e=>{if(e.detail===0)Battle.action(action)};
