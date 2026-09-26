'use strict';
// Adapted to this prototype from HIRUNDU src/battle.js:
// side-view movement/jump, normal A, inventory-powered B, Macina stone volleys and charges.
const Battle={
 completed:false,data:null,snapshot:null,
 start(){
  if(!battleOrientationReady()){syncBattleOrientation();return;}
  document.body.classList.remove('battle-intro');last=0;accumulator=0;
  this.completed=false;if(state.mode==='battleIntro')this.snapshot={...state.food,stars:state.found.length};
  const ammo={...(this.snapshot||{coffee:0,rustico:0,pasticciotto:0,stars:10})};
  this.data={time:0,stage:'entry',stageTime:1.5,phase:1,player:{x:155,y:420,vx:0,vy:0,hp:120,facing:1,inv:0,flapCooldown:0,assist:0,targetVy:0,dodge:0,dodgeCooldown:0,dodgeDir:1},boss:{x:1040,y:420,hp:280,flash:0},ammo,shots:[],fx:[],cooldown:0,combo:0,comboTime:0,shake:0,finishTime:0,fireTimer:0};
  state.mode='battle';keys.clear();state.message=0;$('cover').classList.add('hidden');$('message').classList.remove('visible');document.body.classList.add('battle-active');$('battleHUD').hidden=false;$('speaker').textContent=extra().battle;$('question').textContent=battleUI().help;$('targetsList').textContent='Aracne ✦ Macina';$('tip').textContent=extra().orientation;resize();this.hud();canvas.focus({preventScroll:true});
 },
 hud(){const d=this.data;if(!d)return;$('playerHP').textContent=Math.ceil(d.player.hp);$('bossHP').textContent=Math.ceil(d.boss.hp);$('playerMeter').value=d.player.hp;$('bossMeter').value=d.boss.hp;for(const k of ['coffee','rustico','pasticciotto'])$(k+'Count').textContent=d.ammo[k];$('leaves').textContent=d.ammo.stars;},
 action(kind){
  if(state.mode!=='battle'||!this.data||this.data.stage==='finish'||this.data.stage==='entry')return;const d=this.data,p=d.player;
  if(kind==='jump'){if(p.flapCooldown===0){p.targetVy=Math.max(-620,Math.min(-430,p.vy-220));p.assist=.21;p.flapCooldown=.18}return}
  if(kind==='dive'){p.targetVy=Math.abs(p.x-d.boss.x)<150&&p.y>270?360:620;p.assist=.21;return}
  if(kind==='dodge'){if(p.dodgeCooldown===0){p.dodge=.22;p.dodgeCooldown=.9;p.inv=Math.max(p.inv,.27);p.dodgeDir=p.facing||1}return}
  if(d.cooldown>0)return;d.cooldown=kind==='special'?.45:.22;
  let damage=9,food=null;if(kind==='special'){food=['coffee','rustico','pasticciotto','stars'].find(k=>d.ammo[k]>0);if(food){d.ammo[food]--;damage={coffee:22,rustico:15,pasticciotto:18,stars:12}[food]}}
  const count=food==='rustico'?2:1;
  for(let i=0;i<count;i++)d.shots.push({x:p.x+p.facing*(48-i*18),y:p.y-45-i*9,vx:760*p.facing,vy:0,life:2,from:'player',damage,food});
  this.hud();
 },
 burst(x,y,color,n=22){const d=this.data;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=90+Math.random()*210;d.fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.7,color})}},
 setStage(stage,time){const d=this.data;d.stage=stage;d.stageTime=time;
  if(stage==='warning')notice(extra().warning,time);
  if(stage==='exposed')notice(extra().exposed,time);
 },
 volley(){const d=this.data,b=d.boss,p=d.player;const dx=p.x-b.x,dy=(p.y-42)-(b.y-58),base=Math.atan2(dy,dx),speed=d.phase===2?400:345;
  for(let i=-1;i<=1;i++){const angle=base+i*.15;d.shots.push({x:b.x-42,y:b.y-58,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:3.5,damage:12,from:'boss'})}
 },
 tick(dt){
  const d=this.data,p=d.player,b=d.boss;d.time+=dt;d.stageTime-=dt;d.cooldown=Math.max(0,d.cooldown-dt);d.comboTime=Math.max(0,d.comboTime-dt);if(d.comboTime===0)d.combo=0;p.inv=Math.max(0,p.inv-dt);b.flash=Math.max(0,b.flash-dt);d.shake=Math.max(0,d.shake-dt);
  state.message=Math.max(0,state.message-dt);if(!state.message)$('message').classList.remove('visible');
  d.fx.forEach(f=>{f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=150*dt});d.fx=d.fx.filter(f=>f.life>0);
  if(d.stage==='finish'){d.finishTime+=dt;if(d.finishTime>1.5){this.completed=true;finish()}return}
  if(d.stage==='entry'){b.x=Math.max(790,b.x-185*dt);if(d.stageTime<=0)this.setStage('patrol',1.6);return}
  const move=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0);
  for(const k of ['flapCooldown','assist','dodge','dodgeCooldown'])p[k]=Math.max(0,p[k]-dt);
  if(move)p.facing=move;
  const targetVx=p.dodge>0?820*p.dodgeDir:move*300,response=p.dodge>0?18:move?7.4:4.6;
  p.vx+=(targetVx-p.vx)*(1-Math.exp(-response*dt));if(!move&&p.dodge===0&&Math.abs(p.vx)<2)p.vx=0;
  if(p.assist>0)p.vy+=(p.targetVy-p.vy)*(1-Math.exp(-8*dt));
  p.vy+=760*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
  if(p.y>=420){p.y=420;p.vy=0}if(p.y<85){p.y=85;p.vy=Math.max(0,p.vy);p.assist=0}
  // Gentle separation near the boss prevents repeated contact trapping at low altitude.
  const bossDx=p.x-b.x,distance=Math.abs(bossDx);
  if(p.y>270&&distance<150){const away=Math.sign(bossDx)||-1;p.x+=away*250*(1-distance/150)**2*dt;if(distance<88&&p.y>310)p.x+=(b.x+away*88-p.x)*(1-Math.exp(-9*dt));if(p.vy>360)p.vy+=(360-p.vy)*(1-Math.exp(-7*dt))}
  p.x=Math.max(65,Math.min(895,p.x));
  if(d.stage!=='warning')b.x=760+Math.sin(d.time*1.4)*65;
  b.y=420-Math.max(0,Math.sin(d.time*1.8))*36;
  if(b.hp<=140&&d.phase===1){d.phase=2;notice(extra().phase,2);this.burst(b.x,b.y-60,'#f6b756',32)}
  if(d.stageTime<=0){if(d.stage==='patrol')this.setStage('warning',.85);else if(d.stage==='warning'){this.volley();this.setStage('exposed',1.5)}else if(d.stage==='exposed')this.setStage('patrol',d.phase===2?.75:1.35)}
  for(const shot of d.shots){shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
   const entity=shot.from==='player'?b:p,targetY=entity.y-(shot.from==='player'?55:42);
   if(Math.abs(shot.x-entity.x)<(shot.from==='player'?46:26)&&Math.abs(shot.y-targetY)<(shot.from==='player'?56:34)){
    shot.life=0;if(shot.from==='player'){const damage=shot.damage*(d.stage==='exposed'?1.5:1);b.hp=Math.max(0,b.hp-damage);b.flash=.16;d.combo++;d.comboTime=1.3;this.burst(shot.x,shot.y,shot.food?'#fff0a2':'#f6d780',12)}
    else if(p.inv===0){p.hp=Math.max(0,p.hp-shot.damage);p.inv=.7;d.shake=.18;this.burst(p.x,p.y-40,'#eb936c',14)}this.hud();
   }
  }
  d.shots=d.shots.filter(s=>s.life>0&&s.x>-60&&s.x<1020&&s.y>-60&&s.y<560);
  if(p.inv===0&&Math.abs(p.x-b.x)<65&&Math.abs(p.y-b.y)<70){p.hp=Math.max(0,p.hp-8);p.inv=1;p.x=Math.max(45,p.x-50);d.shake=.15;this.hud()}
  if(b.hp<=0){d.stage='finish';d.shots=[];this.burst(b.x,b.y-70,'#fff4bd',75);state.score+=200;$('score').textContent=state.score;notice(extra().victory,1.5)}else if(p.hp<=0)this.lose();
 },
 lose(){state.mode='battleLost';keys.clear();cover(extra().lost,extra().lostText,extra().battleHelp,extra().retry);syncBattleOrientation()},
 draw(bounds){
  const d=this.data;if(!d)return;ctx.clearRect(0,0,bounds.width,bounds.height);ctx.fillStyle='#a9d6f5';ctx.fillRect(0,0,bounds.width,bounds.height);const k=Math.max(bounds.width/960,bounds.height/540),x=(bounds.width-960*k)/2,y=(bounds.height-540*k)/2;
  ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.beginPath();ctx.rect(0,0,960,540);ctx.clip();if(d.shake>0&&!matchReducedMotion()){ctx.translate(Math.sin(d.time*90)*3,Math.cos(d.time*80)*2)}
  const img=images.battle;if(img?.naturalWidth){const z=Math.max(960/img.naturalWidth,540/img.naturalHeight);ctx.drawImage(img,(960-img.naturalWidth*z)/2,(540-img.naturalHeight*z)/2,img.naturalWidth*z,img.naturalHeight*z)}
  const p=d.player,b=d.boss;
  ctx.fillStyle='#47382833';ctx.beginPath();ctx.ellipse(p.x,432,42,8,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(b.x,432,62,10,0,0,Math.PI*2);ctx.fill();
  if(d.stage==='warning'){ctx.strokeStyle='#f18a39';ctx.lineWidth=5;ctx.beginPath();ctx.arc(b.x,b.y-65,80+Math.sin(d.time*18)*8,0,Math.PI*2);ctx.stroke();ctx.font='bold 42px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff6d8';ctx.fillText('!',b.x,b.y-152)}
  if(d.stage==='exposed'){ctx.strokeStyle='#76dded';ctx.lineWidth=4;ctx.beginPath();ctx.arc(b.x,b.y-65,80,0,Math.PI*2);ctx.stroke()}
  // Port of the current game's battle flight pose, enlarged by 20%.
  const energy=Math.min(1,Math.abs(p.vx)/300+Math.abs(p.vy)/900),now=d.time*1000;
  const flap=Math.sin(now/(p.dodge>0?34:energy>.65?40:62));
  const sy=.965+flap*(.065+energy*.035),sx=1.018-flap*(.022+energy*.008);
  const bob=Math.sin(now/105)*(.9+energy),tilt=Math.max(-.28,Math.min(.28,p.vx/1800+p.vy/2600));
  ctx.save();ctx.globalAlpha=p.inv>0?.65+Math.sin(d.time*40)*.3:1;
  ctx.translate(p.x,p.y-62+bob);ctx.rotate(tilt);
  if(images.bird?.naturalWidth){
   if(energy>.18&&Math.abs(flap)>.45&&!matchReducedMotion()){ctx.save();ctx.globalAlpha*=.1+.07*energy;ctx.scale(p.facing*1.01,flap>0?1.07:.9);ctx.drawImage(images.bird,-65,-67,126,134);ctx.restore()}
   ctx.scale(p.facing*sx,sy);ctx.drawImage(images.bird,-63,-67,126,134);
  }ctx.restore();
  ctx.save();ctx.translate(b.x,b.y-73);ctx.rotate(Math.sin(d.time*3)*.055);ctx.globalAlpha=d.stage==='finish'?Math.max(0,1-d.finishTime):1;if(b.flash>0){ctx.shadowColor='#fff';ctx.shadowBlur=30}if(images.boss?.naturalWidth)ctx.drawImage(images.boss,-80,-78,160,156);ctx.restore();
  for(const s of d.shots){ctx.save();ctx.fillStyle=s.from==='player'?'#ffdd72':'#61b04c';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=12;ctx.beginPath();ctx.ellipse(s.x,s.y,s.food?14:8,s.food?9:6,Math.atan2(s.vy,s.vx),0,Math.PI*2);ctx.fill();if(s.food&&s.food!=='stars')sprite(s.food,s.x,s.y,32);ctx.strokeStyle=s.from==='player'?'#fff5b6':'#bfd880';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-Math.sign(s.vx)*25,s.y);ctx.stroke();ctx.restore()}
  for(const f of d.fx){ctx.globalAlpha=Math.max(0,f.life/.7);ctx.fillStyle=f.color;ctx.fillRect(f.x,f.y,5,5)}ctx.globalAlpha=1;
  if(d.combo>=3&&d.comboTime>0){ctx.font='bold 25px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff8d8';ctx.strokeStyle='#745220';ctx.lineWidth=4;ctx.strokeText(d.combo+' HIT!',p.x,p.y-142);ctx.fillText(d.combo+' HIT!',p.x,p.y-142)}
  if(d.stage==='entry'){ctx.font='bold 40px Georgia';ctx.textAlign='center';ctx.fillStyle='#fff8d8';ctx.strokeStyle='#745220';ctx.lineWidth=4;ctx.strokeText('Macina',480,150);ctx.fillText('Macina',480,150)}ctx.restore();
 }
};
function matchReducedMotion(){return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches}
