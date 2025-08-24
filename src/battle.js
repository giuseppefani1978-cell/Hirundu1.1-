// src/battle.js
// ---------------------------------------------------------
// Mini-jeu "Bataille de Trento" (plein écran horizontal)
// API attendue par game.js :
//   setupBattleInputs, setBattleCallbacks, setBattleAmmo,
//   startBattle, tickBattle, renderBattle, isBattleActive
// ---------------------------------------------------------

// --- Config ---
const BATTLE = {
  PLAYER_HP: 120,
  FOE_HP: 100,
  GRAVITY: 1800,        // px/s²
  JUMP_VY: -680,        // px/s
  SPEED_X: 320,         // px/s
  FRICTION: 0.82,       // amorti quand pas d'entrée
  FLOOR_H: 120,         // hauteur du sol
  ARENA_PAD: 28,        // marge latérale
  HIT_RADIUS: 44,       // rayon collision personnages
  STAR_DMG: 10,         // dégâts d’une étoile lancée
  COOLDOWN_ATTACK_MS: 250,

  // projectiles
  PROJ: {
    normal:   { speed: 700, dmg: 12, r: 7 },
    pasticciotto: { speed: 760, dmg: 28, r: 8 },
    rustico:      { speed: 820, dmg: 18, r: 7, burst:2, gapMs:120 },
    caffe:        { speed: 900, dmg: 22, r: 8, pierce: 1 }, // traverse 1 fois
    star:         { speed: 780, dmg: 10, r: 6 }
  },

  // ennemi très simple
  FOE_AI: {
    wanderSpeed: 120,
    fireEveryMs: [700, 1200], // (min,max)
    meleeRange: 72,
    meleeDmg: 10,
  }
};

// --- État interne ---
let S = {
  active: false,
  foeType: 'jelly',

  // physiques en px (coordonnées "CSS pixels", pas devicePixelRatio)
  player: { x: 0, y: 0, vx: 0, vy: 0, hp: BATTLE.PLAYER_HP, face: 1, onGround: false, lastAtkAt: 0 },
  foe:    { x: 0, y: 0, vx: 0, vy: 0, hp: BATTLE.FOE_HP, face:-1, onGround: true, fireAt: 0, dir: -1 },

  projectiles: [], // {x,y,vx,vy,r,dmg,from,type,pierce?}

  // munitions issues de l’overworld
  ammo: { pasticciotto:0, rustico:0, caffe:0, stars:0 },

  // entrées
  input: { left:false, right:false, jump:false, atkNormal:false, atkSpecial:false, atkStar:false },

  // callbacks (set par game.js)
  onWin:  ()=>{},
  onLose: ()=>{},

  // UI touch
  btnRoot: null,
};

// ---------- Helpers ----------
const nowMs = () => performance.now();
const rnd = (a,b)=> a + Math.random()*(b-a);
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function circleHit(ax,ay, ar, bx,by, br){ const dx=ax-bx, dy=ay-by; return (dx*dx+dy*dy) <= (ar+br)*(ar+br); }

// petit bip basique (évite d’importer audio.js)
function beep(freq=700, dur=0.05, vol=0.2){
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type='square'; o.frequency.value=freq; o.connect(g); g.connect(ctx.destination);
    g.gain.value=vol;
    o.start();
    setTimeout(()=>{ o.stop(); ctx.close?.(); }, dur*1000);
  }catch{}
}

// =========================================================
// API
// =========================================================
export function isBattleActive(){ return S.active; }

export function setBattleCallbacks({ onWin, onLose }={}){
  if (typeof onWin  === 'function') S.onWin  = onWin;
  if (typeof onLose === 'function') S.onLose = onLose;
}

export function setBattleAmmo(ammo){
  S.ammo.pasticciotto = ammo?.pasticciotto|0;
  S.ammo.rustico      = ammo?.rustico|0;
  S.ammo.caffe        = ammo?.caffe|0;
  S.ammo.stars        = ammo?.stars|0;
}

export function setupBattleInputs(){
  // clavier
  window.addEventListener('keydown', (e)=>{
    if (!S.active) return;
    if (e.key === 'ArrowLeft'  || e.key === 'q' || e.key === 'Q') S.input.left  = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') S.input.right = true;
    if (e.key === 'ArrowUp'    || e.key === ' ' ) S.input.jump  = true;
    // attaques
    if (e.key.toLowerCase() === 'z') S.input.atkNormal  = true;
    if (e.key.toLowerCase() === 'x') S.input.atkSpecial = true;
    if (e.key.toLowerCase() === 'c') S.input.atkStar    = true;
  });
  window.addEventListener('keyup', (e)=>{
    if (e.key === 'ArrowLeft'  || e.key === 'q' || e.key === 'Q') S.input.left  = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') S.input.right = false;
    if (e.key === 'ArrowUp'    || e.key === ' ' ) S.input.jump  = false;
    if (e.key.toLowerCase() === 'z') S.input.atkNormal  = false;
    if (e.key.toLowerCase() === 'x') S.input.atkSpecial = false;
    if (e.key.toLowerCase() === 'c') S.input.atkStar    = false;
  });

  // boutons tactiles
  ensureTouchButtons();
}

export function startBattle(foeType='jelly'){
  S.active = true;
  S.foeType = foeType;
  S.player.hp = BATTLE.PLAYER_HP;
  S.foe.hp = BATTLE.FOE_HP;
  S.projectiles.length = 0;

  // placement initial (plein écran horizontal)
  const W = Math.max(640, (document.documentElement.clientWidth || 800));
  const H = Math.max(360, (document.documentElement.clientHeight || 600));
  const groundY = H - BATTLE.FLOOR_H;

  S.player.x = BATTLE.ARENA_PAD + 120;
  S.player.y = groundY; S.player.vx=0; S.player.vy=0; S.player.onGround=true; S.player.face = 1;

  S.foe.x = W - (BATTLE.ARENA_PAD + 120);
  S.foe.y = groundY; S.foe.vx=0; S.foe.vy=0; S.foe.onGround=true; S.foe.face = -1;

  S.foe.fireAt = nowMs() + rnd(...BATTLE.FOE_AI.fireEveryMs);

  showTouchButtons(true);
  return 'battle';
}

export function tickBattle(dt /* seconds */, ctx){
  if (!S.active) return;

  // dimensions visibles (en CSS px)
  const W = ctx.canvas.width  / (window.devicePixelRatio||1);
  const H = ctx.canvas.height / (window.devicePixelRatio||1);
  const leftBound  = BATTLE.ARENA_PAD;
  const rightBound = W - BATTLE.ARENA_PAD;
  const groundY    = H - BATTLE.FLOOR_H;

  // --- Entrées & mouvements joueur
  const p = S.player, f = S.foe;

  if (S.input.left)  { p.vx = -BATTLE.SPEED_X; p.face = -1; }
  if (S.input.right) { p.vx =  BATTLE.SPEED_X; p.face =  1; }
  if (!S.input.left && !S.input.right) p.vx *= BATTLE.FRICTION;

  if (S.input.jump && p.onGround){
    p.vy = BATTLE.JUMP_VY;
    p.onGround = false;
    beep(500, 0.05, 0.15);
  }

  // gravité + intégration
  p.vy += BATTLE.GRAVITY * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // sol
  if (p.y >= groundY){
    p.y = groundY; p.vy = 0; p.onGround = true;
  }
  // murs
  p.x = clamp(p.x, leftBound+24, rightBound-24);

  // --- IA ennemie simple
  const toPlayer = Math.sign(p.x - f.x) || 1;
  f.face = toPlayer;
  f.vx = toPlayer * BATTLE.FOE_AI.wanderSpeed;
  f.x += f.vx * dt;
  f.x = clamp(f.x, leftBound+24, rightBound-24);
  f.y = groundY; // ennemi “glisse” au sol (pas de saut pour l’instant)

  // attaque au contact
  if (Math.abs(p.x - f.x) < BATTLE.FOE_AI.meleeRange && Math.abs(p.y - f.y) < 48){
    // petit knock + dégâts
    applyDamage('player', BATTLE.FOE_AI.meleeDmg);
  }

  // tir ennemi
  const t = nowMs();
  if (t >= S.foe.fireAt){
    fireProjectile('foe', 'normal');
    S.foe.fireAt = t + rnd(...BATTLE.FOE_AI.fireEveryMs);
  }

  // --- Attaques joueur (cooldown léger)
  const canAtk = (t - (S.player.lastAtkAt||0)) >= BATTLE.COOLDOWN_ATTACK_MS;
  if (canAtk){
    if (S.input.atkNormal){
      fireProjectile('player', 'normal');
      S.player.lastAtkAt = t;
    } else if (S.input.atkSpecial){
      if      (S.ammo.caffe  > 0){ S.ammo.caffe--;  fireProjectile('player','caffe');  S.player.lastAtkAt = t; }
      else if (S.ammo.rustico> 0){ S.ammo.rustico--;fireProjectile('player','rustico');S.player.lastAtkAt = t; }
      else if (S.ammo.pasticciotto>0){ S.ammo.pasticciotto--; fireProjectile('player','pasticciotto'); S.player.lastAtkAt = t; }
      else { /* pas de munition spéciale → rien */ }
    } else if (S.input.atkStar && S.ammo.stars > 0){
      S.ammo.stars--; fireProjectile('player','star');
      S.player.lastAtkAt = t;
    }
  }

  // --- Projectiles
  for (let i=S.projectiles.length-1; i>=0; i--){
    const b = S.projectiles[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.from === 'player'){
      if (circleHit(b.x,b.y,b.r, f.x, f.y-40, BATTLE.HIT_RADIUS)){
        applyDamage('foe', b.dmg);
        if (b.pierce){ b.pierce--; } else { S.projectiles.splice(i,1); continue; }
      }
    } else {
      if (circleHit(b.x,b.y,b.r, p.x, p.y-40, BATTLE.HIT_RADIUS)){
        applyDamage('player', b.dmg);
        S.projectiles.splice(i,1);
        continue;
      }
    }

    // hors écran
    if (b.x < -60 || b.x > W+60 || b.y < -60 || b.y > H+60){
      S.projectiles.splice(i,1);
    }
  }

  // fin
  if (S.foe.hp <= 0){ finish(true); }
  if (S.player.hp <= 0){ finish(false); }
}

export function renderBattle(ctx, _view, sprites){
  // On ignore view (ox,oy,dw,dh) et on dessine plein écran en px CSS
  const W = ctx.canvas.width  / (window.devicePixelRatio||1);
  const H = ctx.canvas.height / (window.devicePixelRatio||1);

  // fond placeholder ville de Trento
  ctx.save();
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#0e1320'; ctx.fillRect(0,0,W,H);
  // ciel dégradé simple
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#19274e'); g.addColorStop(1,'#0b1b2a');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

  // sol
  ctx.fillStyle = '#1f3b4d'; ctx.fillRect(0, H-BATTLE.FLOOR_H, W, BATTLE.FLOOR_H);
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  for(let x=0;x<W;x+=28){ ctx.fillRect(x, H-BATTLE.FLOOR_H, 18, 6); }

  // Personnages (grands)
  const P_SIZE = Math.min(W,H) * 0.28;
  drawFighter(ctx, S.player.x, S.player.y, P_SIZE, sprites?.birdImg, S.player.face>0);
  const foeImg = (S.foeType === 'jelly') ? sprites?.jellyImg : sprites?.crowImg;
  drawFighter(ctx, S.foe.x, S.foe.y, P_SIZE, foeImg, S.foe.face>0);

  // Projectiles
  for (const b of S.projectiles){
    ctx.beginPath();
    ctx.arc(b.x, b.y-40, b.r, 0, Math.PI*2);
    ctx.fillStyle = (b.from==='player') ? '#ffb000' : '#36a1ff';
    ctx.fill();
  }

  // HP bars + munitions
  drawHud(ctx, W, H);

  ctx.restore();
}

// =========================================================
// Internes
// =========================================================
function fireProjectile(from, type){
  const spec = BATTLE.PROJ[type] || BATTLE.PROJ.normal;
  const isPlayer = (from === 'player');
  const sx = isPlayer ? S.player.x : S.foe.x;
  const sy = isPlayer ? S.player.y : S.foe.y;
  const dir = isPlayer ? (S.player.face||1) : (S.foe.face||-1);

  const b = {
    x: sx + dir*44,
    y: sy - 40,
    vx: spec.speed * dir,
    vy: 0,
    r:  spec.r|0,
    dmg: spec.dmg|0,
    type,
    from,
  };
  if (spec.pierce) b.pierce = spec.pierce|0;

  S.projectiles.push(b);

  // feedback audio léger
  if (isPlayer){
    const f = (type==='normal') ? 760 : (type==='caffe'? 900 : 820);
    beep(f, 0.06, 0.18);
  }else{
    beep(360, 0.04, 0.14);
  }

  // rafales rustico
  if (isPlayer && spec.burst && spec.burst>1){
    for(let i=1;i<spec.burst;i++){
      setTimeout(()=> {
        const b2 = { ...b };
        b2.x = (S.player.x + (S.player.face||1)*44);
        S.projectiles.push(b2);
        beep(860, 0.05, 0.16);
      }, i*(spec.gapMs||120));
    }
  }
}

function applyDamage(who, dmg){
  if (who === 'player'){
    S.player.hp = Math.max(0, S.player.hp - dmg);
    beep(240, 0.05, 0.18);
  } else {
    S.foe.hp = Math.max(0, S.foe.hp - dmg);
    beep(980, 0.05, 0.18);
  }
}

function finish(victory){
  S.active = false;
  showTouchButtons(false);
  if (victory) S.onWin();
  else S.onLose();
}

// ---------- Rendu helpers ----------
function drawFighter(ctx, cx, cy, size, img, faceRight){
  const y = cy - size*0.9; // ancrage pieds au sol
  ctx.save();
  ctx.translate(cx, y);
  if (!faceRight){ ctx.scale(-1,1); }

  if (img && img.complete && img.naturalWidth){
    ctx.drawImage(img, -size*0.5, -size, size, size);
  } else {
    // fallback : disque coloré
    ctx.fillStyle = faceRight ? '#e94e3c' : '#2aa198';
    ctx.beginPath(); ctx.arc(0, -size*0.45, size*0.38, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawHud(ctx, W, H){
  // HP bars
  const w = Math.min(520, W-80), h = 18, x = (W - w)/2, y = 18;
  ctx.save();
  ctx.fillStyle='#000'; ctx.globalAlpha=0.4; ctx.fillRect(x-8,y-6,w+16,h+12); ctx.globalAlpha=1;

  // player (gauche → centre)
  const lp = Math.max(0, Math.min(1, S.player.hp / BATTLE.PLAYER_HP));
  const rp = Math.max(0, Math.min(1, S.foe.hp    / BATTLE.FOE_HP));
  ctx.fillStyle='#2ecc71'; ctx.fillRect(x, y, (w/2)*lp, h);
  ctx.fillStyle='#e74c3c'; ctx.fillRect(x + w/2*(1-rp), y, (w/2)*rp, h);
  ctx.fillStyle='#000'; ctx.fillRect(x + w/2 - 1, y, 2, h);
  ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=2; ctx.strokeRect(x+0.5,y+0.5,w-1,h-1);

  // Ammo (étoiles + spé)
  const hudY = y + 36;
  ctx.font='700 14px system-ui'; ctx.fillStyle='#fff';
  ctx.fillText(`★ Étoiles: ${S.ammo.stars|0}`, x, hudY);
  ctx.fillText(`Pasticciotto: ${S.ammo.pasticciotto|0}`, x + 180, hudY);
  ctx.fillText(`Rustico: ${S.ammo.rustico|0}`, x + 360, hudY);
  ctx.fillText(`Caffè: ${S.ammo.caffe|0}`, x + 520, hudY);
  ctx.restore();
}

// ---------- Touch controls ----------
function ensureTouchButtons(){
  // crée si pas existant (réutilisé entre battles)
  if (S.btnRoot) return;
  const root = document.createElement('div');
  root.id = '__battle_btns__';
  root.style.cssText = `
    position:fixed; inset:0; pointer-events:none; z-index:10006;
    display:none;
  `;

  const leftPad = document.createElement('div');
  leftPad.style.cssText = `
    position:absolute; left:10px; bottom:12px; pointer-events:auto;
    display:flex; gap:8px;
  `;
  const mkBtn = (label, w=64)=> {
    const b = document.createElement('button');
    b.type='button';
    b.textContent = label;
    b.style.cssText = `
      width:${w}px; height:64px; border-radius:12px; border:0;
      background:rgba(255,255,255,.9); font:700 16px system-ui; box-shadow:0 6px 14px rgba(0,0,0,.2);
    `;
    return b;
  };
  const btnLeft  = mkBtn('◄');
  const btnRight = mkBtn('►');
  const btnJump  = mkBtn('⤴', 72);
  leftPad.append(btnLeft, btnRight, btnJump);

  const rightPad = document.createElement('div');
  rightPad.style.cssText = `
    position:absolute; right:10px; bottom:12px; pointer-events:auto;
    display:flex; gap:8px;
  `;
  const btnA = mkBtn('A'); // normal
  const btnB = mkBtn('B'); // spécial
  const btnS = mkBtn('★'); // étoile
  rightPad.append(btnA, btnB, btnS);

  root.append(leftPad, rightPad);
  document.body.appendChild(root);
  S.btnRoot = root;

  // events press/hold
  const hold = (el, set, key) => {
    let press=false, raf=0;
    const down = (e)=>{ e.preventDefault(); press=true; set(true); loop(); };
    const up   = ()=>{ press=false; set(false); cancelAnimationFrame(raf); };
    const loop = ()=> { if(!press) return; raf = requestAnimationFrame(loop); };
    el.addEventListener('touchstart', down, {passive:false});
    el.addEventListener('mousedown',  down);
    window.addEventListener('touchend', up, {passive:true});
    window.addEventListener('mouseup', up);
  };

  hold(btnLeft,  v=> S.input.left  = v);
  hold(btnRight, v=> S.input.right = v);
  hold(btnJump,  v=> S.input.jump  = v);
  hold(btnA,     v=> S.input.atkNormal  = v);
  hold(btnB,     v=> S.input.atkSpecial = v);
  hold(btnS,     v=> S.input.atkStar    = v);
}

function showTouchButtons(show){
  if (!S.btnRoot) return;
  S.btnRoot.style.display = show ? 'block' : 'none';
}
