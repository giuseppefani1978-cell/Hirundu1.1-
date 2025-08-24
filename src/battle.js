// src/battle.js
// ---------------------------------------------------------
// Mini-jeu "Bataille de Trento" — version avec GRACE PERIOD + READY/GO
// Exporte: setupBattleInputs, setBattleCallbacks, setBattleAmmo,
//          startBattle, tickBattle, renderBattle, isBattleActive
// ---------------------------------------------------------

const BTL = {
  FLOOR_H: 120,
  GRAV: 1200,
  SPEED: 300,
  JUMP_VY: -620,
  PLAYER_HP: 120,
  FOE_HP: 100,

  SHOT: 760,
  FOE_SHOT: 520,

  FOE_FIRE_MS_MIN: 700,
  FOE_FIRE_MS_MAX: 1200,

  HIT_R: 30, // ← un peu moins permissif

  START_GRACE_MS: 1000,   // ← 1s de mise en route (pas de dégâts)
  COUNTDOWN_MS: 900,      // ← "READY…" avant GO
  GO_FLASH_MS: 500        // ← petit "GO!" visuel
};

let state = {
  active: false,
  foeType: 'jelly',
  w: 960, h: 540,

  player: { x: 160, y: 0, vx: 0, vy: 0, hp: BTL.PLAYER_HP, onGround: false, facing: 1 },
  foe:    { x: 760, y: 0, vx: 0, vy: 0, hp: BTL.FOE_HP, fireAt: 0 },

  shots: [],
  ammo: { pasticciotto:0, rustico:0, caffe:0, stars:0 },

  input: { left:false, right:false, up:false, atk:false, spc:false },

  onWin: ()=>{}, onLose: ()=>{},

  // phases affichage/tempo
  startAt: 0,          // timestamp démarrage battle
  goAt: 0,             // moment du "GO" (fin du READY)
  graceUntil: 0,       // pas de dégâts avant cette date
  foeFireBlockUntil: 0,// l’ennemi ne peut pas tirer avant ça

  // décor pré-calculé
  skyline: null
};

// ---------------------------------------------------------
// API attendue par game.js
// ---------------------------------------------------------
export function setupBattleInputs(){
  window.removeEventListener('keydown', _onKeyDown, true);
  window.removeEventListener('keyup', _onKeyUp, true);
  window.addEventListener('keydown', _onKeyDown, true);
  window.addEventListener('keyup', _onKeyUp, true);
  ensureTouchBtns();
}

export function setBattleCallbacks({ onWin, onLose } = {}){
  if (typeof onWin === 'function')  state.onWin  = onWin;
  if (typeof onLose === 'function') state.onLose = onLose;
}

export function setBattleAmmo(ammo){
  state.ammo.pasticciotto = ammo?.pasticciotto|0;
  state.ammo.rustico      = ammo?.rustico|0;
  state.ammo.caffe        = ammo?.caffe|0;
  state.ammo.stars        = ammo?.stars|0;
}

export function startBattle(foeType='jelly'){
  if (state.active) return; // évite double start
  state.active = true;
  state.foeType = foeType;

  state.player = { x: 160, y: 0, vx: 0, vy: 0, hp: BTL.PLAYER_HP, onGround: false, facing: 1 };
  state.foe    = { x: state.w - 200, y: 0, vx: 0, vy: 0, hp: BTL.FOE_HP, fireAt: Infinity };
  state.shots.length = 0;

  const now = performance.now();
  state.startAt = now;
  state.goAt = now + BTL.COUNTDOWN_MS;                        // READY… jusqu’à goAt
  state.graceUntil = state.goAt + BTL.GO_FLASH_MS + BTL.START_GRACE_MS; // encore 1s de grâce après GO
  state.foeFireBlockUntil = state.goAt + 900;                 // foe attend ~0.9s après GO

  if (!state.skyline) state.skyline = _makeSkyline(12);
}

export function isBattleActive(){ return state.active; }

export function tickBattle(dt /* seconds */){
  if (!state.active) return;

  // clamp dt pour éviter gros sauts
  dt = Math.min(0.05, Math.max(0.001, dt));

  const now = performance.now();
  const readyPhase = now < state.goAt;
  const inGrace   = now < state.graceUntil;

  // Physique (joueur/ennemi)
  _applyPhysics(state.player, dt);
  _applyPhysics(state.foe, dt);

  // Déplacements joueur (bloqués pendant "READY…")
  state.player.vx = 0;
  if (!readyPhase){
    if (state.input.left)  { state.player.vx = -BTL.SPEED; state.player.facing = -1; }
    if (state.input.right) { state.player.vx =  BTL.SPEED; state.player.facing =  1; }
    if (state.input.up && state.player.onGround){
      state.player.vy = BTL.JUMP_VY; state.player.onGround = false;
    }
  }
  state.player.x = Math.max(60, Math.min(state.w-60, state.player.x + state.player.vx * dt));

  // Attaques joueur (bloquées pendant "READY…")
  if (!readyPhase){
    if (_consume('atk'))  _fireNormal();
    if (_consume('spc'))  _fireSpecial();
  } else {
    // on consomme quand même pour éviter mise en mémoire d’un spam pendant READY
    _consume('atk'); _consume('spc');
  }

  // IA de base foe (pas pendant READY)
  if (!readyPhase){
    const dist = state.foe.x - state.player.x;
    if (Math.abs(dist) < 220) state.foe.vx = (dist > 0) ? 120 : -120;
    else state.foe.vx = 0;
    state.foe.x = Math.max(60, Math.min(state.w-60, state.foe.x + state.foe.vx * dt));

    if (now >= state.foe.fireAt && now >= state.foeFireBlockUntil){
      _fireFoe();
      state.foe.fireAt = now + _rnd(BTL.FOE_FIRE_MS_MIN, BTL.FOE_FIRE_MS_MAX);
    }
  }

  // Projectiles
  for (let i = state.shots.length - 1; i >= 0; i--){
    const s = state.shots[i];
    s.x += s.vx * dt; s.y += s.vy * dt;

    // Collisions (désactivées pendant la grâce)
    if (!inGrace){
      if (s.from === 'player'){
        const dx = s.x - state.foe.x, dy = s.y - 0;
        if (dx*dx + dy*dy <= BTL.HIT_R*BTL.HIT_R){
          state.foe.hp = Math.max(0, state.foe.hp - s.dmg);
          state.shots.splice(i,1);
          continue;
        }
      } else {
        const dx = s.x - state.player.x, dy = s.y - 0;
        if (dx*dx + dy*dy <= BTL.HIT_R*BTL.HIT_R){
          state.player.hp = Math.max(0, state.player.hp - s.dmg);
          state.shots.splice(i,1);
          continue;
        }
      }
    }

    if (s.x < -80 || s.x > state.w+80) state.shots.splice(i,1);
  }

  // Fin de manche (pas pendant READY/GO et hors grâce)
  if (!readyPhase && !inGrace){
    if (state.foe.hp <= 0){ state.active = false; state.onWin();  }
    if (state.player.hp <= 0){ state.active = false; state.onLose(); }
  }
}

export function renderBattle(ctx, _view, sprites){
  const dpr = window.devicePixelRatio||1;
  const w = ctx.canvas.width  / dpr;
  const h = ctx.canvas.height / dpr;
  state.w = w; state.h = h;

  // Fond (Trento placeholder)
  ctx.save();
  ctx.fillStyle = '#0f1e2d'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle = '#1d3b5a';
  ctx.fillRect(0, h*0.55, w, h*0.45);
  if (state.skyline){
    ctx.fillStyle = '#1d3b5a';
    for (const b of state.skyline){
      ctx.fillRect(b.x*w, h*0.55 - b.h, b.w, b.h);
    }
  }
  ctx.fillStyle = '#223d33';
  ctx.fillRect(0, h - BTL.FLOOR_H, w, BTL.FLOOR_H);
  ctx.restore();

  // Personnages (gros)
  const P_W = 120, P_H = 132;
  const pY = h - BTL.FLOOR_H + state.player.y - P_H;
  const fY = h - BTL.FLOOR_H + state.foe.y    - P_H;

  // Joueur
  ctx.save();
  ctx.translate(state.player.x, pY);
  if (state.player.facing < 0){ ctx.scale(-1,1); ctx.translate(-P_W,0); }
  if (sprites?.birdImg?.naturalWidth) ctx.drawImage(sprites.birdImg, 0, 0, P_W, P_H);
  else { ctx.fillStyle='#e63946'; ctx.fillRect(0,0,P_W,P_H); }
  ctx.restore();

  // Ennemi
  ctx.save();
  ctx.translate(state.foe.x, fY);
  ctx.scale(-1,1);
  const foeImg = (state.foeType === 'jelly') ? sprites?.jellyImg : sprites?.crowImg;
  if (foeImg?.naturalWidth) ctx.drawImage(foeImg, 0, 0, P_W, P_H);
  else { ctx.fillStyle='#2a9d8f'; ctx.fillRect(0,0,P_W,P_H); }
  ctx.restore();

  // Tirs
  for (const s of state.shots){
    ctx.beginPath();
    ctx.arc(s.x, h - BTL.FLOOR_H + s.y - 60, 8, 0, Math.PI*2);
    ctx.fillStyle = (s.from === 'player') ? '#ffd166' : '#06d6a0';
    ctx.fill();
  }

  // HUD
  ctx.fillStyle='#fff'; ctx.font='700 16px system-ui';
  ctx.fillText(`HP: ${state.player.hp}`, 16, 28);
  ctx.fillText(`Foe: ${state.foe.hp}`,  w-120, 28);
  ctx.fillText(`★: ${state.ammo.stars}`, w/2-12, 28);

  // READY… GO!
  const now = performance.now();
  if (now < state.goAt){
    ctx.font='700 42px system-ui';
    ctx.fillStyle='rgba(255,255,255,.9)';
    ctx.fillText('READY…', w/2 - 92, h/2 - 40);
  } else if (now < state.goAt + BTL.GO_FLASH_MS){
    ctx.font='900 56px system-ui';
    ctx.fillStyle='rgba(255,235,0,.95)';
    ctx.fillText('GO!', w/2 - 40, h/2 - 40);
  }

  // Aide
  ctx.font='12px system-ui'; ctx.fillStyle='rgba(255,255,255,.8)';
  ctx.fillText('← → bouger • ↑ sauter • A=Attaque • B=Spécial', 16, h-12);
}

// ---------------------------------------------------------
// Internes
// ---------------------------------------------------------
function _applyPhysics(ent, dt){
  ent.vy += BTL.GRAV * dt;
  ent.y  += ent.vy * dt;
  if (ent.y >= 0){ ent.y = 0; ent.vy = 0; ent.onGround = true; }
}

function _fireNormal(){
  state.shots.push({
    x: state.player.x + (state.player.facing>0? 36 : -36),
    y: state.player.y,
    vx: BTL.SHOT * state.player.facing,
    vy: 0,
    from: 'player',
    dmg: 12
  });
}

function _fireSpecial(){
  const order = [
    ['caffe', { dmg: 26 }],
    ['rustico', { dmg: 18, burst:2, gap:140 }],
    ['pasticciotto', { dmg: 22 }],
    ['stars', { dmg: 14 }]
  ];
  const pick = order.find(([k]) => (state.ammo[k]|0) > 0);
  if (!pick){ _fireNormal(); return; }

  const [kind, spec] = pick;
  state.ammo[kind]--;

  const mk = () => state.shots.push({
    x: state.player.x + (state.player.facing>0? 36 : -36),
    y: state.player.y,
    vx: BTL.SHOT * state.player.facing,
    vy: 0,
    from: 'player',
    dmg: spec.dmg
  });

  if (spec.burst){
    for (let i=0;i<spec.burst;i++) setTimeout(mk, i*(spec.gap||120));
  } else {
    mk();
  }
}

function _fireFoe(){
  state.shots.push({
    x: state.foe.x - 36,
    y: state.foe.y,
    vx: -BTL.FOE_SHOT,
    vy: 0,
    from: 'foe',
    dmg: 10
  });
}

function _rnd(a,b){ return a + Math.random()*(b-a); }

function _consume(name){
  if (state.input[name]){ state.input[name] = false; return true; }
  return false;
}

// ---------------------------------------------------------
// Entrées clavier + boutons tactiles
// ---------------------------------------------------------
function _onKeyDown(e){
  if (!state.active) return;
  if (e.repeat) return;
  if (e.key === 'ArrowLeft')  state.input.left  = true;
  if (e.key === 'ArrowRight') state.input.right = true;
  if (e.key === 'ArrowUp')    state.input.up    = true;
  if (e.key.toLowerCase() === 'a') state.input.atk = true;
  if (e.key.toLowerCase() === 'b') state.input.spc = true;
}
function _onKeyUp(e){
  if (!state.active) return;
  if (e.key === 'ArrowLeft')  state.input.left  = false;
  if (e.key === 'ArrowRight') state.input.right = false;
  if (e.key === 'ArrowUp')    state.input.up    = false;
}

function ensureTouchBtns(){
  const id = '__battle_btns__';
  let root = document.getElementById(id);
  if (!root){
    root = document.createElement('div');
    root.id = id;
    root.style.cssText = `
      position:fixed; right:12px; bottom:82px; z-index:10003; display:flex; flex-direction:column; gap:8px;
    `;
    const mk = (label, onTap) => {
      const b = document.createElement('button');
      b.type='button'; b.textContent = label;
      b.style.cssText = 'min-width:84px;padding:10px 12px;border-radius:12px;border:0;font:700 14px system-ui;background:#ffd166';
      b.addEventListener('click', onTap);
      return b;
    };
    root.appendChild(mk('A • Attaque', ()=>{ if (state.active){ state.input.atk = true; }}));
    root.appendChild(mk('B • Spécial', ()=>{ if (state.active){ state.input.spc = true; }}));
    document.body.appendChild(root);
  }
}

// ---------------------------------------------------------
// Décor
// ---------------------------------------------------------
function _makeSkyline(n){
  const arr = [];
  for (let i=0;i<n;i++){
    const bw = (40 + Math.random()*60);
    const bh = (80 + Math.random()*160);
    const x = (i/n) + (Math.random()*0.03-0.015);
    arr.push({ x, w:bw, h:bh });
  }
  return arr;
}
