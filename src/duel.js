// src/duel.js
// ---------------------------------------------------------
// Mode "Duel" (battle screen style Street-Fighter)
// ---------------------------------------------------------
import * as ui from './ui.js'; // uniquement pour showEphemeralLabel

// ---- config globale duel ----
const DUEL = {
  PLAYER_HP: 100,
  FOE_HP: 100,

  NORMAL_DMG: 12,
  NORMAL_SPEED: 420,

  SPECIALS: {
    pasticciotto: { dmg: 28, speed: 480, label:'Pasticciotto' },
    rustico:      { dmg: 18, speed: 520, label:'Rustico', burst:2, burstGapMs:160 },
    caffe:        { dmg: 22, speed: 680, label:'Caffè' }
  },

  FOE: {
    jelly: { dmg: 10, speed: 380, fireMs: [700, 1150] },
    crow:  { dmg: 12, speed: 430, fireMs: [580, 960] }
  },

  PROJ_RADIUS: 7,
  ARENA_PAD: 32
};

// ---- état interne ----
let duel = {
  active:false,
  foeType:'jelly',
  player:{ x:0, y:0, hp:DUEL.PLAYER_HP },
  foe:{ x:0, y:0, hp:DUEL.FOE_HP, fireAt:0 },
  projectiles:[],
  ammo: { pasticciotto:0, rustico:0, caffe:0 },
  // callbacks gérés par game.js
  onWin:  ()=>{},
  onLose: ()=>{},
  // boutons tactiles
  aBtn:null, bBtn:null,
};

// utils audio minimalistes : le module duel n’importe pas audio.js
// → on utilise des bips via WebAudio simple pour feedback (léger et optionnel)
function beep(freq=700, dur=0.05){
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+dur);
    o.start(); o.stop(ctx.currentTime+dur+0.02);
  }catch{}
}

function randBetween(a,b){ return a + Math.random()*(b-a); }

// ---------------------------------------------------------
// API (utilisée par game.js)
// ---------------------------------------------------------
export function isDuelActive(){ return duel.active; }

export function setDuelCallbacks({ onWin, onLose }){
  duel.onWin  = typeof onWin  === 'function' ? onWin  : duel.onWin;
  duel.onLose = typeof onLose === 'function' ? onLose : duel.onLose;
}

export function setDuelAmmoFromPicked(pickedCounts){
  duel.ammo.pasticciotto = pickedCounts?.pasticciotto|0;
  duel.ammo.rustico      = pickedCounts?.rustico|0;
  duel.ammo.caffe        = pickedCounts?.caffe|0;
}

/**
 * Lance le duel et renvoie la string de mode ("duel") pour game.js
 */
export function enterDuel(foeType='jelly'){
  // reset état
  duel.active = true;
  duel.foeType = (DUEL.FOE[foeType] ? foeType : 'jelly');
  duel.player.hp = DUEL.PLAYER_HP;
  duel.foe.hp = DUEL.FOE_HP;
  duel.projectiles.length = 0;

  const cfg = DUEL.FOE[duel.foeType];
  duel.foe.fireAt = performance.now() + randBetween(cfg.fireMs[0], cfg.fireMs[1]);

  ensureDuelButtons(true);
  // petit "gong"
  beep(660, 0.1); setTimeout(()=>beep(440,0.08),120);
  return 'duel';
}

/**
 * À appeler chaque frame depuis game.js quand mode === 'duel'
 * dt en secondes, ctx = 2d context
 */
export function tickDuel(dt, ctx){
  if (!duel.active) return;

  const mw = (ctx.canvas.width  / (window.devicePixelRatio||1));
  const mh = (ctx.canvas.height / (window.devicePixelRatio||1));
  const pad = DUEL.ARENA_PAD;
  const leftX = pad + 80, rightX = mw - pad - 80;
  const midY = Math.max(100, Math.min(mh-100, mh*0.55));

  duel.player.x = leftX;  duel.player.y = midY;
  duel.foe.x    = rightX; duel.foe.y    = midY;

  // IA tir ennemi
  const cfg = DUEL.FOE[duel.foeType];
  const now = performance.now();
  if (now >= duel.foe.fireAt){
    fireFoeProjectile(cfg);
    duel.foe.fireAt = now + randBetween(cfg.fireMs[0], cfg.fireMs[1]);
  }

  // projectiles
  for (let i=duel.projectiles.length-1; i>=0; i--){
    const p = duel.projectiles[i];
    p.x += p.vx * dt; p.y += p.vy * dt;

    // collisions cercle ~36px
    if (p.from === 'player'){
      const dx = p.x - duel.foe.x, dy = p.y - duel.foe.y;
      if (dx*dx + dy*dy <= 36*36){
        duel.foe.hp = Math.max(0, duel.foe.hp - p.dmg);
        beep(820, 0.05);
        duel.projectiles.splice(i,1);
        continue;
      }
    } else {
      const dx = p.x - duel.player.x, dy = p.y - duel.player.y;
      if (dx*dx + dy*dy <= 36*36){
        duel.player.hp = Math.max(0, duel.player.hp - p.dmg);
        beep(220, 0.05);
        duel.projectiles.splice(i,1);
        continue;
      }
    }

    if (p.x < -40 || p.x > mw+40) duel.projectiles.splice(i,1);
  }

  // fin
  if (duel.foe.hp <= 0) return exitDuel(true);
  if (duel.player.hp <= 0) return exitDuel(false);
}

/**
 * Dessin du duel (overlay, barres, sprites, projectiles, HUD)
 * sprites: { birdImg, crowImg, jellyImg, spiderImg? }
 */
export function renderDuel(ctx, view, sprites){
  const { ox, oy, dw, dh } = view;
  // écran TV
  ctx.save();
  ctx.strokeStyle = '#222'; ctx.lineWidth = 10;
  ctx.strokeRect(ox+14, oy+14, dw-28, dh-28);
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(ox+14, oy+14, dw-28, dh-28);
  ctx.restore();

  // HP bars
  drawHpBar(ctx, ox+34, oy+34, dw-68, 16, duel.player.hp/DUEL.PLAYER_HP, duel.foe.hp/DUEL.FOE_HP);

  // sprites
  const size = Math.min(dw, dh) * 0.22;
  drawFighter(ctx, duel.player.x, duel.player.y, size, sprites.birdImg, true);
  const foeImg = (duel.foeType === 'jelly') ? sprites.jellyImg : sprites.crowImg;
  drawFighter(ctx, duel.foe.x, duel.foe.y, size, foeImg, false);

  // projectiles
  for (const p of duel.projectiles){
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, DUEL.PROJ_RADIUS, 0, Math.PI*2);
    ctx.fillStyle = (p.from === 'player') ? '#ffb400' : '#2b6cb0';
    ctx.fill();
    ctx.restore();
  }

  // HUD munitions
  drawSpecialHud(ctx, ox, oy+dh-64, dw, 48, duel.ammo);
}

// ---------------------------------------------------------
// Entrées (clavier + boutons tactiles)
// ---------------------------------------------------------
export function setupDuelInputs(){
  window.addEventListener('keydown', (e)=>{
    if (!duel.active) return;
    if (e.repeat) return;
    if (e.key === 'z' || e.key === 'Z') { firePlayerNormal(); }
    else if (e.key === 'x' || e.key === 'X') { firePlayerSpecial(); }
  });
}

function ensureDuelButtons(show){
  const rootId = '__duel_btns__';
  let root = document.getElementById(rootId);
  if (!show){
    if (root) root.remove();
    duel.aBtn = duel.bBtn = null;
    return;
  }
  if (!root){
    root = document.createElement('div');
    root.id = rootId;
    root.style.cssText = `
      position:fixed; right:12px; bottom:82px; z-index:10003; display:flex; flex-direction:column; gap:8px;
    `;
    const mkBtn = (txt,bg)=> {
      const b = document.createElement('button');
      b.type='button';
      b.textContent = txt;
      b.style.cssText = `min-width:84px; padding:10px 12px; border-radius:12px; border:0; font:700 14px system-ui; background:${bg}`;
      return b;
    };
    const a = mkBtn('A • Normal', '#ffd166');
    const b = mkBtn('B • Spécial', '#06d6a0');
    root.appendChild(a); root.appendChild(b);
    document.body.appendChild(root);
    duel.aBtn = a; duel.bBtn = b;
    a.addEventListener('click', firePlayerNormal);
    b.addEventListener('click', firePlayerSpecial);
  }
}

// ---------------------------------------------------------
// Tir & rendu internes
// ---------------------------------------------------------
function firePlayerNormal(){
  duel.projectiles.push({
    x: duel.player.x + 24,
    y: duel.player.y - 10 + Math.random()*20,
    vx: DUEL.NORMAL_SPEED,
    vy: 0,
    from: 'player',
    dmg: DUEL.NORMAL_DMG
  });
  beep(720, 0.05);
}

function firePlayerSpecial(){
  // priorité: caffe -> rustico -> pasticciotto (modifiable)
  const order = ['caffe','rustico','pasticciotto'];
  const pick = order.find(k => (duel.ammo[k]|0) > 0);
  if (!pick) { firePlayerNormal(); return; }

  const spec = DUEL.SPECIALS[pick];
  duel.ammo[pick]--;

  const makeBullet = () => ({
    x: duel.player.x + 24,
    y: duel.player.y - 10 + Math.random()*20,
    vx: spec.speed,
    vy: 0,
    from: 'player',
    dmg: spec.dmg
  });

  if (spec.burst && spec.burst > 1){
    for(let i=0;i<spec.burst;i++){
      setTimeout(()=>{ duel.projectiles.push(makeBullet()); beep(900,0.05); }, i*(spec.burstGapMs||120));
    }
  } else {
    duel.projectiles.push(makeBullet());
    beep(900, 0.05);
  }

  ui.showEphemeralLabel(duel.player.x, duel.player.y - 46, spec.label+' !', { color:'transparent', durationMs: 680, dy:-22 });
}

function fireFoeProjectile(cfg){
  duel.projectiles.push({
    x: duel.foe.x - 24,
    y: duel.foe.y - 10 + Math.random()*20,
    vx: -cfg.speed,
    vy: 0,
    from: 'foe',
    dmg: cfg.dmg
  });
}

function exitDuel(victory){
  ensureDuelButtons(false);
  duel.active = false;
  if (victory) duel.onWin();
  else duel.onLose();
}

// ---- helpers dessin ----
function drawHpBar(ctx, x, y, w, h, leftRatio, rightRatio){
  ctx.save();
  ctx.fillStyle='#111'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle='#2ecc71'; ctx.fillRect(x, y, Math.max(0, w*0.5*leftRatio), h);
  ctx.fillStyle='#e74c3c'; ctx.fillRect(x+w*0.5*(1-rightRatio), y, Math.max(0, w*0.5*rightRatio), h);
  ctx.fillStyle='#000'; ctx.fillRect(x+w/2-1, y, 2, h);
  ctx.strokeStyle='#444'; ctx.lineWidth=2; ctx.strokeRect(x+0.5, y+0.5, w-1, h-1);
  ctx.restore();
}

function drawFighter(ctx, cx, cy, size, img, flip){
  ctx.save();
  if (!flip){ ctx.translate(cx, cy); ctx.scale(-1, 1); ctx.translate(-cx, -cy); }
  if (img && img.complete && img.naturalWidth){
    ctx.drawImage(img, cx - size/2, cy - size/2, size, size);
  } else {
    ctx.fillStyle = flip ? '#333' : '#b04123';
    ctx.beginPath(); ctx.arc(cx, cy, size*0.35, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawSpecialHud(ctx, x, y, w, h, ammo){
  ctx.save();
  ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.fillRect(x+20, y, w-40, h);
  ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.strokeRect(x+20.5, y+0.5, w-41, h-1);
  ctx.font='700 14px system-ui'; ctx.fillStyle='#000';

  const items = [
    ['Pasticciotto', ammo.pasticciotto|0],
    ['Rustico',      ammo.rustico|0],
    ['Caffè',        ammo.caffe|0]
  ];
  const colW = (w-40)/3;
  items.forEach((it, i)=>{
    const cx = x+20 + i*colW;
    ctx.fillText(`${it[0]}: ${it[1]}`, cx+12, y+28);
  });

  ctx.fillText('A: Coup normal  /  B: Spécial', x+28, y-8);
  ctx.restore();
}
// duel.js

let duelControls = null;
let attackCb = null;

export function setDuelAttackCallback(cb){
  attackCb = cb; // cb(type) ex: "normal", "pasticciotto", "rustico", "caffe"
}

export function showDuelControls(show=true){
  if (show) {
    if (!duelControls){
      duelControls = document.createElement('div');
      duelControls.id = '__duel_controls';
      duelControls.style.cssText = `
        position:fixed; bottom:16px; left:50%; transform:translateX(-50%);
        display:flex; gap:12px; z-index:10003;
      `;
      const mkBtn = (emoji, type) => {
        const b = document.createElement('button');
        b.textContent = emoji;
        b.style.cssText = `
          font-size:28px; padding:14px 18px;
          border-radius:12px; border:2px solid #444;
          background:#fff; box-shadow:0 4px 10px rgba(0,0,0,.25);
        `;
        b.addEventListener('click', ()=> attackCb && attackCb(type));
        return b;
      };
      duelControls.appendChild(mkBtn("👊", "normal"));
      duelControls.appendChild(mkBtn("🍩", "pasticciotto"));
      duelControls.appendChild(mkBtn("🥟", "rustico"));
      duelControls.appendChild(mkBtn("☕", "caffe"));

      document.body.appendChild(duelControls);
    }
    duelControls.style.display = 'flex';
  } else {
    if (duelControls) duelControls.style.display = 'none';
  }
}
