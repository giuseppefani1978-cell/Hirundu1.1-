// src/battle.js
const BATTLE = {
  PLAYER_HP: 120,
  FOE_HP: 100,
  GRAVITY: 800,
  JUMP_VELOCITY: -380,
  SPEED: 160,
};

let state = {
  active:false,
  player:{ x:100, y:0, vx:0, vy:0, hp:BATTLE.PLAYER_HP, onGround:false },
  foe:{ x:500, y:0, vx:0, vy:0, hp:BATTLE.FOE_HP },
  projectiles:[],
  starsAmmo:0,
  onWin:()=>{}, onLose:()=>{}
};

export function enterBattle(foeType="jelly"){
  state.active = true;
  state.player.hp = BATTLE.PLAYER_HP;
  state.foe.hp = BATTLE.FOE_HP;
  state.projectiles = [];
  state.starsAmmo = 10; // ex: nombre d’étoiles collectées
  return 'battle';
}

export function tickBattle(dt, ctx){
  if (!state.active) return;

  // physics
  state.player.vy += BATTLE.GRAVITY * dt;
  state.player.y += state.player.vy * dt;
  if (state.player.y >= 0){
    state.player.y = 0; state.player.vy = 0; state.player.onGround = true;
  }

  // TODO : déplacer l’ennemi, gérer projectiles, collisions etc.
}

export function renderBattle(ctx){
  const w = ctx.canvas.width, h = ctx.canvas.height;

  // fond
  ctx.fillStyle="#1d3557"; ctx.fillRect(0,0,w,h);
  ctx.fillStyle="#457b9d"; ctx.fillRect(0,h-100,w,100);

  // joueur
  ctx.fillStyle="#e63946";
  ctx.fillRect(state.player.x, h-100 + state.player.y - 80, 60, 80);

  // ennemi
  ctx.fillStyle="#2a9d8f";
  ctx.fillRect(state.foe.x, h-100 + state.foe.y - 80, 60, 80);

  // HUD
  ctx.fillStyle="#fff";
  ctx.fillText(`HP: ${state.player.hp}`, 20, 30);
  ctx.fillText(`Foe: ${state.foe.hp}`, w-120, 30);
  ctx.fillText(`★: ${state.starsAmmo}`, w/2, 30);
}
