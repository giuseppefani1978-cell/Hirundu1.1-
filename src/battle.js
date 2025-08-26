// src/battle.js
// ---------------------------------------------------------
// Mini-jeu "Bataille de Trento" — paysage + pads tactiles
// Exporte: setupBattleInputs, setBattleCallbacks, setBattleAmmo,
//          startBattle, tickBattle, renderBattle, isBattleActive
// ---------------------------------------------------------

const BTL = {
  FLOOR_H: 0,        // ← plus de barre "sol" : on colle en bas de l'arène
  GRAV: 1200,
  SPEED: 300,
  JUMP_VY: -620,
  PLAYER_HP: 120,
  FOE_HP: 100,

  SHOT: 760,
  FOE_SHOT: 520,

  FOE_FIRE_MS_MIN: 900,
  FOE_FIRE_MS_MAX: 1400,

  HIT_R: 28,

  START_GRACE_MS: 1000,
  COUNTDOWN_MS: 900,
  GO_FLASH_MS: 500
};

let state = {
  active: false,
  foeType: 'jelly',
  w: 960, h: 540,

  player: { x: 160, y: 0, vx: 0, vy: 0, hp: BTL.PLAYER_HP, onGround: false, facing: 1 },
  foe:    { x: 760, y: 0, vx: 0, vy: 0, hp: BTL.FOE_HP, fireAt: Infinity },

  shots: [],
  ammo: { pasticciotto:0, rustico:0, caffe:0, stars:0 },

  input: { left:false, right:false, up:false, atk:false, spc:false },

  onWin: ()=>{}, onLose: ()=>{},

  startAt: 0,
  goAt: 0,
  graceUntil: 0,
  foeFireBlockUntil: 0,

  skyline: null,

  // UI battle
  ui: { root:null, move:null, ab:null, rotateOverlay:null }
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------
export function setupBattleInputs(){
  window.removeEventListener('keydown', _onKeyDown, true);
  window.removeEventListener('keyup', _onKeyUp, true);
  window.addEventListener('keydown', _onKeyDown, true);
  window.addEventListener('keyup', _onKeyUp, true);
  _ensureBattleUI(false); // créer mais caché
  _installOrientationWatch();
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
  if (state.active) return;
  state.active = true;
  state.foeType = foeType;

  state.player = { x: 160, y: 0, vx: 0, vy: 0, hp: BTL.PLAYER_HP, onGround: false, facing: 1 };
  state.foe    = { x: state.w - 200, y: 0, vx: 0, vy: 0, hp: BTL.FOE_HP, fireAt: Infinity };
  state.shots.length = 0;

  const now = performance.now();
  state.startAt = now;
  state.goAt = now + BTL.COUNTDOWN_MS;
  state.graceUntil = state.goAt + BTL.GO_FLASH_MS + BTL.START_GRACE_MS;
  state.foeFireBlockUntil = state.goAt + 1000;

  if (!state.skyline) state.skyline = _makeSkyline(12);

  _ensureBattleUI(true);    // affiche les pads battle
  _maybeLockLandscape();    // tente FS + lock paysage
  _updateRotateOverlay();   // si en portrait, montrer overlay
  _maybeLockLandscape();    // re-tente au cas où

  // légère stabilisation taille iOS
  setTimeout(()=>window.dispatchEvent(new Event('resize')), 100);
  setTimeout(()=>window.dispatchEvent(new Event('resize')), 350);
}

export function isBattleActive(){ return state.active; }

export function tickBattle(dt){
  if (!state.active) return;
  dt = Math.min(0.05, Math.max(0.001, dt));

  const now = performance.now();
  const readyPhase = now < state.goAt;
  const inGrace   = now < state.graceUntil;

  _applyPhysics(state.player, dt);
  _applyPhysics(state.foe, dt);

  // Mouvements joueur (bloqués pendant READY…)
  state.player.vx = 0;
  if (!readyPhase){
    if (state.input.left)  { state.player.vx = -BTL.SPEED; state.player.facing = -1; }
    if (state.input.right) { state.player.vx =  BTL.SPEED; state.player.facing =  1; }
    if (state.input.up && state.player.onGround){
      state.player.vy = BTL.JUMP_VY; state.player.onGround = false;
    }
  } else {
    // purge pour éviter buffer
    state.input.atk = false; state.input.spc = false;
  }
  state.player.x = Math.max(60, Math.min(state.w-60, state.player.x + state.player.vx * dt));

  // Attaques joueur
  if (!readyPhase){
    if (_consume('atk'))  _fireNormal();
    if (_consume('spc'))  _fireSpecial();
  }

  // IA simple
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

  // Fin de manche (hors READY/GRACE)
  if (now >= state.graceUntil){
    if (state.foe.hp <= 0) { _endBattle(true);  }
    if (state.player.hp <= 0) { _endBattle(false); }
  }
}

export function renderBattle(ctx, _view, sprites){
  // Dimensions du canvas en pixels CSS (pas bruts)
  const dpr = window.devicePixelRatio || 1;
  const CANVAS_W = ctx.canvas.width  / dpr;
  const CANVAS_H = ctx.canvas.height / dpr;

  // Viewport reçu (ox,oy,dw,dh). Fallback: plein canvas.
  const vp = _view || { ox:0, oy:0, dw:CANVAS_W, dh:CANVAS_H };
  const { ox, oy, dw, dh } = vp;

  // Nettoyer + letterbox autour de l'arène
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#0a1420';
  ctx.fillRect(0, 0, CANVAS_W, oy);                        // top
  ctx.fillRect(0, oy + dh, CANVAS_W, CANVAS_H - (oy + dh)); // bottom
  ctx.fillRect(0, oy, ox, dh);                               // left
  ctx.fillRect(ox + dw, oy, CANVAS_W - (ox + dw), dh);       // right
  ctx.restore();

  // Tout le rendu jeu DANS le viewport
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox, oy, dw, dh);
  ctx.clip();
  ctx.translate(ox, oy);

  // Taille logique = viewport
  const w = dw, h = dh;
  state.w = w; state.h = h;

  // --- Fond : image "cover" si dispo, sinon fallback
  if (sprites?.bgImg && sprites.bgImg.complete && sprites.bgImg.naturalWidth) {
    const img = sprites.bgImg;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight); // cover
    const rw = img.naturalWidth * scale;
    const rh = img.naturalHeight * scale;
    const dx = (w - rw) / 2;
    const dy = (h - rh) / 2;
    ctx.drawImage(img, dx, dy, rw, rh);
  } else {
    // Fallback minimal
    ctx.fillStyle = '#0f1e2d'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#1d3b5a';
    ctx.fillRect(0, h*0.55, w, h*0.45);
    if (state.skyline){
      ctx.fillStyle = '#1d3b5a';
      for (const b of state.skyline){
        ctx.fillRect(b.x*w, h*0.55 - b.h, b.w, b.h);
      }
    }
  }

  // --- Personnages
  const P_W = 140, P_H = 152;
  const pY = h - BTL.FLOOR_H + state.player.y - P_H; // FLOOR_H = 0 ⇒ sprite posé tout en bas
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
  ctx.fillText(`Foe: ${state.foe.hp}`,  Math.max(16, w-120), 28);
  ctx.fillText(`★: ${state.ammo.stars}`, Math.floor(w/2)-12, 28);

  // READY / GO
  const now = performance.now();
  if (now < state.goAt){
    ctx.font='700 42px system-ui';
    ctx.fillStyle='rgba(255,255,255,.9)';
    ctx.fillText('READY…', Math.floor(w/2 - 92), Math.floor(h/2 - 40));
  } else if (now < state.goAt + BTL.GO_FLASH_MS){
    ctx.font='900 56px system-ui';
    ctx.fillStyle='rgba(255,235,0,.95)';
    ctx.fillText('GO!', Math.floor(w/2 - 40), Math.floor(h/2 - 40));
  }

  // Aide
  ctx.font='12px system-ui'; ctx.fillStyle='rgba(255,255,255,.8)';
  ctx.fillText('← → bouger • ↑ sauter • A=Attaque • B=Spécial', 16, Math.max(12, h-12));

  ctx.restore(); // fin viewport
}

// ---------------------------------------------------------
// Internes
// ---------------------------------------------------------
function _endBattle(victory){
  state.active = false;
  _ensureBattleUI(false); // masque les pads
  if (victory) state.onWin(); else state.onLose();
}

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
  const [kind, spec] = pick; state.ammo[kind]--;

  const mk = () => state.shots.push({
    x: state.player.x + (state.player.facing>0? 36 : -36),
    y: state.player.y,
    vx: BTL.SHOT * state.player.facing,
    vy: 0,
    from: 'player',
    dmg: spec.dmg
  });

  if (spec.burst){ for (let i=0;i<spec.burst;i++) setTimeout(mk, i*(spec.gap||120)); }
  else mk();
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
function _consume(name){ if (state.input[name]){ state.input[name]=false; return true; } return false; }

// ---------------------------------------------------------
// Entrées clavier
// ---------------------------------------------------------
function _onKeyDown(e){
  if (!state.active) return;
  if (e.repeat) return;
  const k = e.key;
  if (k === 'ArrowLeft')  state.input.left  = true;
  if (k === 'ArrowRight') state.input.right = true;
  if (k === 'ArrowUp')    state.input.up    = true;
  if (k && k.toLowerCase() === 'a') state.input.atk = true;
  if (k && k.toLowerCase() === 'b') state.input.spc = true;
}
function _onKeyUp(e){
  if (!state.active) return;
  const k = e.key;
  if (k === 'ArrowLeft')  state.input.left  = false;
  if (k === 'ArrowRight') state.input.right = false;
  if (k === 'ArrowUp')    state.input.up    = false;
}

// ---------------------------------------------------------
// UI Battle (pads + overlay rotation)
// ---------------------------------------------------------
function _ensureBattleUI(show){
  if (!state.ui.root){
    const root = document.createElement('div');
    root.id = '__battle_ui__';
    root.style.cssText = `
      position:fixed; inset:0; pointer-events:none; z-index:10003; display:none;
    `;
 // pad déplacement (gauche)
const move = document.createElement('div');
move.style.cssText = `
  position:absolute;
  left:12px;
  bottom: max(8px, env(safe-area-inset-bottom, 0px));
  display:flex;
  gap:8px;
  align-items:center;
  pointer-events:auto;
`;
move.innerHTML = `
  <button data-act="left"  class="__padbtn">←</button>
  <button data-act="up"    class="__padbtn">↑</button>
  <button data-act="right" class="__padbtn">→</button>
`;

// pad A/B (droite)
const ab = document.createElement('div');
ab.style.cssText = `
  position:absolute;
  right:12px;
  bottom: max(8px, env(safe-area-inset-bottom, 0px));
  display:flex;
  flex-direction:column;
  gap:8px;
  pointer-events:auto;
`;
ab.innerHTML = `
  <button data-act="atk" class="__padbtn" style="background:#ffd166">A • Attaque</button>
  <button data-act="spc" class="__padbtn" style="background:#06d6a0">B • Spécial</button>
`;
    // style boutons
    const style = document.createElement('style');
    style.textContent = `
      .__padbtn{
        min-width:84px; padding:12px 14px; border-radius:12px; border:0;
        font:700 14px system-ui; background:#eee; box-shadow:0 4px 10px rgba(0,0,0,.25);
      }
    `;

    // overlay rotation (portrait)
    const rot = document.createElement('div');
    rot.id = '__battle_rotate__';
    rot.style.cssText = `
      position:absolute; inset:0; display:none; align-items:center; justify-content:center;
      background:rgba(0,0,0,.75); color:#fff; font:700 18px system-ui; text-align:center; padding:20px; pointer-events:auto;
    `;
    rot.innerHTML = `<div>📱 Tourne ton téléphone en mode paysage pour la bataille.</div>`;

    root.appendChild(style);
    root.appendChild(move);
    root.appendChild(ab);
    root.appendChild(rot);
    document.body.appendChild(root);

    // handlers tactiles
    const press = (act, on)=> {
      if (act === 'left')  state.input.left  = on;
      if (act === 'right') state.input.right = on;
      if (act === 'up')    state.input.up    = on;
      if (on === true && act === 'atk') state.input.atk = true;
      if (on === true && act === 'spc') state.input.spc = true;
    };
    root.querySelectorAll('.__padbtn').forEach(b=>{
      const act = b.dataset.act;
      b.addEventListener('touchstart', e=>{ e.preventDefault(); press(act, true); }, {passive:false});
      b.addEventListener('touchend',   e=>{ e.preventDefault(); press(act, false); }, {passive:false});
      b.addEventListener('mousedown',  e=>{ e.preventDefault(); press(act, true); });
      b.addEventListener('mouseup',    e=>{ e.preventDefault(); press(act, false); });
      b.addEventListener('mouseleave', e=>{ press(act, false); });
      b.addEventListener('click',      e=>{ e.preventDefault(); }); // éviter double déclenchement
    });

    state.ui.root = root;
    state.ui.move = move;
    state.ui.ab = ab;
    state.ui.rotateOverlay = rot;
  }

  state.ui.root.style.display = show ? 'block' : 'none';
}

function _installOrientationWatch(){
  window.addEventListener('orientationchange', _updateRotateOverlay, {passive:true});
  window.addEventListener('resize', _updateRotateOverlay, {passive:true});
}

function _isLandscape(){
  const o = screen.orientation;
  if (o && o.type) return o.type.startsWith('landscape');
  // fallback
  return window.innerWidth >= window.innerHeight;
}

async function _maybeLockLandscape(){
  try {
    if (document.fullscreenElement == null && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch{}
  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('landscape');
    }
  } catch {}
}

function _updateRotateOverlay(){
  if (!state.ui.rotateOverlay) return;
  const need = state.active && !_isLandscape();
  state.ui.rotateOverlay.style.display = need ? 'flex' : 'none';
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
