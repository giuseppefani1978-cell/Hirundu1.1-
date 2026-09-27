// Isolated teaching simulation: no game state or progress is imported.
export function createPractice(family){
 const ark=family==='arkanoid';
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 const s={family,step:0,x:.3,y:.7,paddle:.5,ballX:.66,ballY:.18,vx:0,vy:.58,launched:false,moved:0,done:false,misses:0,targetX:.75,targetY:.3};
 function updateStepFromMovement(){if(s.step===0&&s.moved>=.06)s.step=1;}
 function setPaddle(value){
  if(!ark||s.done)return;
  const before=s.paddle;
  s.paddle=clamp(Number(value)||.5,.14,.86);
  s.moved+=Math.abs(before-s.paddle);
  updateStepFromMovement();
 }
 function resetBallForLaunch(){
  const offset=s.paddle<.55?.15:-.15;
  s.ballX=clamp(s.paddle+offset,.18,.82);
  s.ballY=.18;
  s.vx=offset>0?.12:-.12;
  s.vy=.58;
 }
 return {
  state:s,
  setPaddle,
  launch(){
   if(ark&&s.step===1&&!s.launched&&!s.done){
    resetBallForLaunch();
    s.launched=true;
   }
  },
  tick(dt,dx=0,dy=0){
   if(s.done)return;
   dt=Math.max(0,Math.min(dt,.04));
   if(ark){
    const before=s.paddle;
    s.paddle=clamp(s.paddle+dx*dt*1.05,.14,.86);
    s.moved+=Math.abs(before-s.paddle);
    updateStepFromMovement();
   }else{
    const norm=Math.max(1,Math.hypot(dx,dy)),x=s.x,y=s.y;
    s.x=clamp(s.x+dx/norm*dt*.65,.05,.95);
    s.y=clamp(s.y+dy/norm*dt*.65,.05,.95);
    s.moved+=Math.hypot(s.x-x,s.y-y);
    updateStepFromMovement();
   }
   if(ark&&s.launched){
    const oldY=s.ballY;
    s.ballX+=s.vx*dt;
    if(s.ballX<.08){s.ballX=.08;s.vx=Math.abs(s.vx);}
    if(s.ballX>.92){s.ballX=.92;s.vx=-Math.abs(s.vx);}
    s.ballY+=s.vy*dt;
    if(s.vy>0&&oldY<.82&&s.ballY>=.82&&Math.abs(s.ballX-s.paddle)<=.18){
     s.ballY=.82;
     s.vy=-.62;
     s.vx=0;
     s.step=2;
     s.targetX=s.ballX;
     s.targetY=.28;
    }
    if(s.ballY>1.06){
     s.misses++;
     s.launched=false;
     s.step=1;
     resetBallForLaunch();
    }
    if(s.step===2&&Math.hypot(s.ballX-s.targetX,s.ballY-s.targetY)<.055)s.done=true;
   }else if(!ark&&s.step===1&&Math.hypot(s.x-s.targetX,s.y-s.targetY)<.065){
    s.done=true;
   }
  }
 };
}
