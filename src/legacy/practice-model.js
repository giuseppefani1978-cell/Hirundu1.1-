// Isolated teaching simulation: no game state or progress is imported.
export function createPractice(family){
 const ark=family==='arkanoid';
 const s={family,step:0,x:.3,y:.7,paddle:.5,ballX:.72,ballY:.2,vy:.6,launched:false,moved:0,done:false,misses:0,targetX:.75,targetY:.3};
 return {state:s,launch(){if(ark&&s.step===1){s.launched=true;s.ballX=.72;s.ballY=.2;s.vy=.6;}},
 tick(dt,dx=0,dy=0){
  if(s.done)return;dt=Math.max(0,Math.min(dt,.04));const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  if(ark){const before=s.paddle;s.paddle=clamp(s.paddle+dx*dt*.8,.14,.86);s.moved+=Math.abs(before-s.paddle);}
  else{const norm=Math.max(1,Math.hypot(dx,dy)),x=s.x,y=s.y;s.x=clamp(s.x+dx/norm*dt*.65,.05,.95);s.y=clamp(s.y+dy/norm*dt*.65,.05,.95);s.moved+=Math.hypot(s.x-x,s.y-y);}
  if(s.step===0&&s.moved>=.10){s.step=1;}
  if(ark&&s.launched){
   const old=s.ballY;s.ballY+=s.vy*dt;
   if(s.vy>0&&old<.82&&s.ballY>=.82&&Math.abs(s.ballX-s.paddle)<=.14){s.ballY=.82;s.vy=-.6;s.step=2;s.targetX=s.ballX;s.targetY=.24;}
   if(s.ballY>1.06){s.misses++;s.launched=false;s.ballY=.2;s.step=1;}
   if(s.step===2&&Math.hypot(s.ballX-s.targetX,s.ballY-s.targetY)<.045){s.done=true;}
  }else if(!ark&&s.step===1&&Math.hypot(s.x-s.targetX,s.y-s.targetY)<.065){s.done=true;}
 }
 };
}
