// src/battle.js
// ---------------------------------------------------------
// Mini-jeu "Bataille de Otranto" — paysage + pads tactiles
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
  // Entrée de l’ennemi
  FOE_ENTRY_DELAY_MS: 1200,   // temps d’attente avant d’entrer
  FOE_ENTRY_SPEED: 260,       // vitesse de “glissade” vers l’arène
  FOE_TARGET_MARGIN_X: 100,   // position cible = bord droit - marge
  // Ennemi plus agressif
  FOE_FIRE_MS_MIN: 1200,
  FOE_FIRE_MS_MAX: 2000,
  FOE_BURST_COUNT: 2,
  FOE_BURST_GAP_MS: 120,

  // Zap électrique
  FOE_ZAP_SPEED: 640,
  FOE_ZAP_DMG: 14,
  FOE_ZAP_TAIL: 38,

  // Sauts
  FOE_JUMP_VY: -520,
  FOE_JUMP_COOLDOWN_MS: 900,
  FOE_JUMP_DIST: 320,
  FOE_JUMP_PROB: 0.5,

  HIT_R: 28,
  START_GRACE_MS: 1000,
  COUNTDOWN_MS: 900,
  GO_FLASH_MS: 500,
    // Feedback à l'impact (comme la chasse)
  HIT_SHAKE_MAX_S: 0.5,
  HIT_SHAKE_DECAY_PER_S: 1.8,
  HIT_SLOW_FACTOR: 0.45,
  HIT_SLOW_MS: 450,
};

let state = {
  active: false,
  foeType: 'jelly',
  w: 960, h: 540,

  player: { x: 160, y: 0, vx: 0, vy: 0, hp: BTL.PLAYER_HP, onGround: false, facing: 1 },
  foe:    { x: 760, y: 0, vx: 0, vy: 0, hp: BTL.FOE_HP, fireAt: Infinity, onGround:false },

  shots: [],
  ammo: { pasticciotto:0, rustico:0, caffe:0, stars:0 },

  input: { left:false, right:false, up:false, atk:false, spc:false },

  onWin: ()=>{}, onLose: ()=>{},

  startAt: 0,
  goAt: 0,
  graceUntil: 0,
  foeFireBlockUntil: 0,
  foeJumpReadyAt: 0,
  foeWanderUntil: 0,   // timestamp jusqu'à quand on garde la direction courante
  foeDir: -1,          // -1=vers la gauche (avance), +1=vers la droite (recule), 0=pause
  foeEntryUntil: 0,     // timestamp : fin du délai d’entrée
  // ...

  skyline: null,

  shakeT: 0,         // temps restant de secousse
  slowUntil: 0,      // horodatage jusqu'auquel on ralentit le joueur
  // UI battle
  ui: { root:null, move:null, ab:null, rotateOverlay:null, endOverlay:null }
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

  // joueur
  state.player = { x: 160, y: 0, vx: 0, vy: 0, hp: BTL.PLAYER_HP, onGround: false, facing: 1 };

  // foe : démarre hors-écran à droite
  state.foe = { 
    x: state.w + 160, y: 0, vx: 0, vy: 0,
    hp: BTL.FOE_HP, fireAt: Infinity, onGround: false
  };
  state.foeDir = -1;                     // commence en avançant vers la gauche
  state.foeWanderUntil = performance.now() + 700;
  const now = performance.now();
  state.startAt = now;
  state.goAt = now + BTL.COUNTDOWN_MS;
  state.graceUntil = state.goAt + BTL.GO_FLASH_MS + BTL.START_GRACE_MS;

  // délai d’entrée + délai de tir
  state.foeEntryUntil      = state.goAt + BTL.FOE_ENTRY_DELAY_MS;
  state.foeFireBlockUntil  = state.foeEntryUntil + 300;
  state.foeJumpReadyAt     = state.foeEntryUntil + 500;

  // quand elle pourra commencer à viser / tirer
  state.foe.fireAt = state.foeEntryUntil + 600;
  state.goAt = now + BTL.COUNTDOWN_MS;
    // ✅ AMORÇAGE DU PROCHAIN TIR ENNEMI
  
  if (!state.skyline) state.skyline = _makeSkyline(12);

  _ensureBattleUI(true);
  _maybeLockLandscape();
  _updateRotateOverlay();
  _maybeLockLandscape();

  setTimeout(()=>window.dispatchEvent(new Event('resize')), 100);
  setTimeout(()=>window.dispatchEvent(new Event('resize')), 350);
}

export function isBattleActive(){ return state.active; }

// ---------------------------------------------------------
// Ticks
// ---------------------------------------------------------
export function tickBattle(dt){
  if (!state.active) return;

  // Sécurité intégrateur
  dt = Math.min(0.05, Math.max(0.001, dt));

  const now = performance.now();
  const readyPhase = now < state.goAt;
  const inGrace    = now < state.graceUntil;

  // Décroissance du shake (feedback)
  if (state.shakeT > 0) {
    state.shakeT = Math.max(0, state.shakeT - dt * BTL.HIT_SHAKE_DECAY_PER_S);
  }

  // Physique de base (gravité/sol)
  _applyPhysics(state.player, dt);
  _applyPhysics(state.foe, dt);

  // -----------------------------
  // Contrôles joueur (bloqués pendant READY…)
  // -----------------------------
  const slowMul = (now < state.slowUntil) ? BTL.HIT_SLOW_FACTOR : 1;
  state.player.vx = 0;

  if (!readyPhase){
    if (state.input.left)  { state.player.vx = -BTL.SPEED * slowMul; state.player.facing = -1; }
    if (state.input.right) { state.player.vx =  BTL.SPEED * slowMul; state.player.facing =  1; }
    if (state.input.up && state.player.onGround){
      state.player.vy = BTL.JUMP_VY;
      state.player.onGround = false;
    }
  } else {
    // purge pour éviter un buffer d’attaques pendant le READY
    state.input.atk = false;
    state.input.spc = false;
  }

  // Clamp horizontal joueur
  state.player.x = Math.max(60, Math.min(state.w - 60, state.player.x + state.player.vx * dt));

  // -----------------------------
  // Attaques joueur
  // -----------------------------
  if (!readyPhase){
    if (_consume('atk')) _fireNormal();
    if (_consume('spc')) _fireSpecial();
  }

  // -----------------------------
  // IA ENNEMI
  // -----------------------------
  if (!readyPhase){
    // 1) Phase d’entrée : la méduse vient du bord droit, glisse jusqu’à sa position cible
    const targetX = state.w - BTL.FOE_TARGET_MARGIN_X;
    if (now < state.foeEntryUntil) {
      // Pendant l’entrée : pas de tir (déjà bloqué par foeFireBlockUntil)
      state.foe.vx = -BTL.FOE_ENTRY_SPEED;
      state.foe.x  = Math.max(targetX, state.foe.x + state.foe.vx * dt);
    } else {
      // 2) IA "normale" une fois entrée
      const dist = state.foe.x - state.player.x;

     // --- Patrouille aléatoire : avancer/reculer sur la zone droite ---
const minX = Math.max(60, state.w - 260);  // limite gauche de patrouille
const maxX = state.w - 60;                  // bord droit “jouable”
const SPEED = 160;

// change de direction toutes les 0.5–1.4s
if (performance.now() >= state.foeWanderUntil) {
  // 10% de pause, sinon gauche/droite aléatoire, avec petite tendance à aller vers le joueur
  const toward = (state.foe.x > state.player.x) ? -1 : 1; // -1 = vers la gauche
  const r = Math.random();
  state.foeDir = (r < 0.10) ? 0 : (r < 0.55 ? toward : (Math.random() < 0.5 ? -1 : 1));
  state.foeWanderUntil = performance.now() + (500 + Math.random()*900);
}

// avance selon la direction choisie
state.foe.vx = SPEED * state.foeDir;
state.foe.x += state.foe.vx * dt;

// si on touche une borne, on repart dans l’autre sens et on “verrouille” un court instant
if (state.foe.x < minX) { state.foe.x = minX; state.foeDir = 1;  state.foeWanderUntil = performance.now()+600; }
if (state.foe.x > maxX) { state.foe.x = maxX; state.foeDir = -1; state.foeWanderUntil = performance.now()+600; }
      // sauts opportunistes
      if (now >= state.foeJumpReadyAt && state.foe.onGround) {
        const close = Math.abs(dist) <= BTL.FOE_JUMP_DIST;
        if (close && Math.random() < BTL.FOE_JUMP_PROB) {
          state.foe.vy = BTL.FOE_JUMP_VY;
          state.foe.onGround = false;
          state.foeJumpReadyAt = now + BTL.FOE_JUMP_COOLDOWN_MS;
        } else {
          state.foeJumpReadyAt = now + 180; // re-check bientôt
        }
      }

      // tirs (zaps) — cadence temporisée
      if (now >= state.foe.fireAt && now >= state.foeFireBlockUntil) {
        _fireFoeZap();
        state.foe.fireAt = now + _rnd(BTL.FOE_FIRE_MS_MIN, BTL.FOE_FIRE_MS_MAX);
      }
    }
  }

  // -----------------------------
  // Projectiles (déplacement + collisions + durée de vie)
  // -----------------------------
  for (let i = state.shots.length - 1; i >= 0; i--) {
    const s = state.shots[i];
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.life != null) s.life -= dt;

    if (!inGrace){
      if (s.from === 'player'){
        // touche l’ennemi ?
        const dx = s.x - state.foe.x, dy = s.y - 0;
        if (dx*dx + dy*dy <= BTL.HIT_R*BTL.HIT_R){
          state.foe.hp = Math.max(0, state.foe.hp - s.dmg);
          state.shots.splice(i,1);
          continue;
        }
      } else {
        // touche le joueur ?
        const dx = s.x - state.player.x, dy = s.y - 0;
        if (dx*dx + dy*dy <= BTL.HIT_R*BTL.HIT_R){
          state.player.hp = Math.max(0, state.player.hp - s.dmg);
          // feedback type "chasse"
          state.shakeT   = Math.min(BTL.HIT_SHAKE_MAX_S, state.shakeT + 0.35);
          state.slowUntil = now + BTL.HIT_SLOW_MS;
          state.shots.splice(i,1);
          continue;
        }
      }
    }

    // sortie écran / fin de vie
    const out  = (s.x < -80 || s.x > state.w + 80);
    const dead = (s.life != null && s.life <= 0);
    if (out || dead) state.shots.splice(i,1);
  }

  // -----------------------------
  // Fin de manche
  // -----------------------------
  if (now >= state.graceUntil){
    if (state.foe.hp    <= 0) _endBattle(true);
    if (state.player.hp <= 0) _endBattle(false);
  }
}

// ---------------------------------------------------------
// Rendu
// ---------------------------------------------------------
export function renderBattle(ctx, _view, sprites){
  const dpr = window.devicePixelRatio || 1;
  const CANVAS_W = ctx.canvas.width  / dpr;
  const CANVAS_H = ctx.canvas.height / dpr;

  const vp = _view || { ox:0, oy:0, dw:CANVAS_W, dh:CANVAS_H };
  const { ox, oy, dw, dh } = vp;

  // letterbox
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#0a1420';
  ctx.fillRect(0, 0, CANVAS_W, oy);
  ctx.fillRect(0, oy + dh, CANVAS_W, CANVAS_H - (oy + dh));
  ctx.fillRect(0, oy, ox, dh);
  ctx.fillRect(ox + dw, oy, CANVAS_W - (ox + dw), dh);
  ctx.restore();

  // viewport
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox, oy, dw, dh);
  ctx.clip();
  ctx.translate(ox, oy);

  const w = dw, h = dh;
  state.w = w; state.h = h;
    // Effet de shake quand touché
  if (state.shakeT > 0) {
    const a = Math.min(1, state.shakeT / BTL.HIT_SHAKE_MAX_S);
    const mag = 6 * a;
    const sx = (Math.random()*2 - 1) * mag;
    const sy = (Math.random()*2 - 1) * mag;
    ctx.translate(sx, sy);
  }

  // Fond (image cover si dispo)
  if (sprites?.bgImg && sprites.bgImg.complete && sprites.bgImg.naturalWidth) {
    const img = sprites.bgImg;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const rw = img.naturalWidth * scale;
    const rh = img.naturalHeight * scale;
    const dx = (w - rw) / 2;
    const dy = (h - rh) / 2;
    ctx.drawImage(img, dx, dy, rw, rh);
  } else {
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

  // Sol
  ctx.fillStyle = '#223d33';
  ctx.fillRect(0, h - BTL.FLOOR_H, w, BTL.FLOOR_H);

  // Personnages
  const P_W = 140, P_H = 152;
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
    if (s.kind === 'zap'){
      // rendu éclair dentelé
      const tail = BTL.FOE_ZAP_TAIL;
      const vx = s.vx, vy = s.vy;
      const L = Math.max(1, Math.hypot(vx, vy));
      const nx = vx / L, ny = vy / L;
      const x2 = s.x;
      const y2 = h - BTL.FLOOR_H + s.y - 60;
      const x1 = x2 - nx * tail;
      const y1 = y2 - ny * tail;

      const segs = 5;
      const pts = [{x:x1, y:y1}];
      for (let i=1;i<segs;i++){
        const t = i / segs;
        const bx = x1 + (x2 - x1) * t;
        const by = y1 + (y2 - y1) * t;
        const perp = (Math.random() * 10 - 5);
        pts.push({ x: bx + (-ny)*perp, y: by + (nx)*perp });
      }
      pts.push({x:x2, y:y2});

      // lueur
      ctx.save();
      ctx.strokeStyle = 'rgba(120,220,255,0.85)';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(120,220,255,0.7)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();

      // cœur
      ctx.strokeStyle = '#bdf';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.restore();
    } else {
      // projectile rond classique
      ctx.beginPath();
      ctx.arc(s.x, h - BTL.FLOOR_H + s.y - 60, 8, 0, Math.PI*2);
      ctx.fillStyle = (s.from === 'player') ? '#ffd166' : '#06d6a0';
      ctx.fill();
    }
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

  ctx.restore();
}

// ---------------------------------------------------------
// Internes
// ---------------------------------------------------------
function _endBattle(victory){
  state.active = false;
  // on laisse les pads visibles si tu veux tester tout de suite; sinon masque-les :
  _ensureBattleUI(true);
  if (state.ui.endOverlay){
    // met un titre différent selon victoire/défaite (facultatif)
    const t = state.ui.endOverlay.querySelector('#__battle_end_title');
    if (t) t.textContent = victory ? 'Victoire !' : 'Défaite…';
    state.ui.endOverlay.style.display = 'flex';
  }
  // IMPORTANT : on NE déclenche pas onWin/onLose, pour rester sur l’écran battle.
  // (si un jour tu veux revenir automatiquement à la carte, ré-appelle state.onWin()/onLose() ici.)
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

function _fireFoe(){ // (non utilisé, gardé si besoin)
  state.shots.push({
    x: state.foe.x - 36,
    y: state.foe.y,
    vx: -BTL.FOE_SHOT,
    vy: 0,
    from: 'foe',
    dmg: 10
  });
}

function _fireFoeZapOnce() {
  const dx = (state.player.x - state.foe.x);
  const dy = (state.player.y - state.foe.y);
  const L  = Math.max(1, Math.hypot(dx, dy));
  const vx = (dx / L) * BTL.FOE_ZAP_SPEED;
  const vy = (dy / L) * BTL.FOE_ZAP_SPEED;

  state.shots.push({
    x: state.foe.x - 36,
    y: state.foe.y,
    vx, vy,
    from: 'foe',
    dmg: BTL.FOE_ZAP_DMG,
    kind: 'zap',
    life: 1.2,
  });
}

function _fireFoeZap(){
  _fireFoeZapOnce();
  for (let i = 1; i < BTL.FOE_BURST_COUNT; i++){
    setTimeout(_fireFoeZapOnce, i * BTL.FOE_BURST_GAP_MS);
  }
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
    // overlay fin de partie
   const end = document.createElement('div');
   end.id = '__battle_end__';
   end.style.cssText = `
   position:absolute; inset:0; display:none; align-items:center; justify-content:center;
   pointer-events:auto; background:rgba(0,0,0,.55);
   `;
    end.innerHTML = `
    <div style="background:#fff; padding:16px 18px; border-radius:14px;
              box-shadow:0 8px 30px rgba(0,0,0,.35); text-align:center">
    <div id="__battle_end_title" style="font:800 18px system-ui; margin-bottom:10px">Fin de la partie</div>
    <button id="__battle_replay_btn"
            style="padding:10px 14px; border:0; border-radius:12px; font:700 14px system-ui;
                   background:#06d6a0; color:#083d2b">↻ Rejouer</button>
    </div>
    `;

    root.appendChild(end);
    document.body.appendChild(root);
// bouton Rejouer
end.querySelector('#__battle_replay_btn').addEventListener('click', ()=>{
  // cacher l’overlay, relancer avec le même type d’ennemi
  if (state.ui.endOverlay) state.ui.endOverlay.style.display = 'none';
  // réinitialise l’état et relance
  startBattle(state.foeType || 'jelly');
});
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
