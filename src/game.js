// src/game.js
// ---------------------------------------------------------
// Boucle de rendu, carte/POI, énergie, ennemis, wiring Start
// ---------------------------------------------------------

import { t, poiName, poiInfo } from './i18n.js';
import {
  ASSETS, UI, computeMapViewport, pickDevicePixelRatio, POIS,
  ENERGY as ENERGY_CFG
} from './config.js';
import {
  startMusic, stopMusic, starEmphasis
} from './audio.js';
import {
  setSprites, resetEnemies, updateEnemies, drawEnemies,
  getPlayerSpeedFactor, getShakeTimeLeft
} from './enemies.js';
import * as ui from './ui.js';

// ---------- Debug helper (affiche en bas à gauche si présent) ----------
function dbg(msg){
  const box = document.getElementById('debugBox');
  if (!box) return;
  box.style.display = 'block';
  box.innerHTML += (box.innerHTML ? '<br>' : '') + msg;
}

// ---------- Canvas & contexte ----------
let canvas, ctx;
let W = 0, H = 0, dpr = 1;

// ---------- State global ----------
let running = false;
let lastTS = 0;
let frameDT = 0;

const player = { x: 0.55, y: 0.25, speed: 0.0048, size: 0.11 };

// Progression POI
let collected = new Set();
let QUEST = [];
let currentIdx = 0;

// Énergie (0..100)
const ENERGY_MAX = ENERGY_CFG?.MAX ?? 100;
let energy = ENERGY_MAX;

// Finale (simplifiée)
let finale = false;

// ---------- Images ----------
const mapImg    = new Image();
const birdImg   = new Image();
const spiderImg = new Image();
const crowImg   = new Image();
const jellyImg  = new Image();

// Pour éviter cache agressif sur GH Pages pendant les essais
const CB = (s)=> s + (s.includes('?') ? '&' : '?') + 't=' + Date.now();

// Charge images (map peut être lente → on dessine un placeholder d’abord)
mapImg.onload    = ()=>dbg('Map OK: '+(mapImg.naturalWidth||0)+'x'+(mapImg.naturalHeight||0));
mapImg.onerror   = ()=>dbg('Map ERROR: '+ASSETS.MAP_URL);
birdImg.onerror  = ()=>dbg('Bird ERROR: '+ASSETS.BIRD_URL);
spiderImg.onerror= ()=>dbg('Spider ERROR: '+ASSETS.TARANTULA_URL);
crowImg.onerror  = ()=>dbg('Crow ERROR: '+ASSETS.CROW_URL);
jellyImg.onerror = ()=>dbg('Jelly ERROR: '+ASSETS.JELLY_URL);

mapImg.src    = CB(ASSETS.MAP_URL);
birdImg.src   = CB(ASSETS.BIRD_URL);
spiderImg.src = CB(ASSETS.TARANTULA_URL);
crowImg.src   = CB(ASSETS.CROW_URL);
jellyImg.src  = CB(ASSETS.JELLY_URL);

// Pousse les sprites au module ennemis (il gère fallback si non chargés)
setSprites({ crowImg, jellyImg });

// ---------- Resize / DPR ----------
function resize(){
  if (!canvas) return;
  dpr = pickDevicePixelRatio ? pickDevicePixelRatio() : Math.max(1, Math.min(2, window.devicePixelRatio||1));
  // IMPORTANT: on force le canvas à remplir .game avec un transform propre
  const parent = canvas.parentElement;
  W = canvas.clientWidth  = parent.clientWidth;
  H = canvas.clientHeight = parent.clientHeight;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function safeResize(){ try{ resize(); }catch(e){} }

// ---------- Helpers POI ----------
function drawStarfish(cx, cy, R){
  ctx.save(); ctx.shadowColor='rgba(0,0,0,.2)'; ctx.shadowBlur=6; ctx.shadowOffsetY=3;
  ctx.beginPath(); const pts=5,inner=R*0.45;
  for(let i=0;i<pts*2;i++){
    const ang=(Math.PI/pts)*i - Math.PI/2;
    const r=(i%2===0)?R:inner;
    const x=cx+Math.cos(ang)*r, y=cy+Math.sin(ang)*r;
    if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath(); ctx.fillStyle='#d26f45'; ctx.strokeStyle='#8c3f28'; ctx.lineWidth=3; ctx.fill(); ctx.stroke(); ctx.restore();
}

function drawPOIs(bounds){
  const { ox, oy, dw, dh } = bounds;
  for(const p of POIS){
    const x=ox+p.x*dw, y=oy+p.y*dh;
    if(collected.has(p.key)){
      drawStarfish(x, y-20, Math.max(14,Math.min(22,Math.min(W,H)*0.028)));
    }else{
      ctx.save(); ctx.strokeStyle='#b04123'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(x-6,y-6); ctx.lineTo(x+6,y+6);
      ctx.moveTo(x-6,y+6); ctx.lineTo(x+6,y-6); ctx.stroke();
      ctx.restore();
    }
  }
}

// ---------- Texte Tarantula ----------
function askQuestionFor(p){
  if(!p) return;
  ui.showAsk( t.ask?.( poiInfo(p.key) ) || `Where is ${poiInfo(p.key)}?` );
}
function showTarantulaSuccess(name){
  ui.showSuccess( t.success?.(name) || `Great, that’s it: ${name}!` );
}

// ---------- Énergie / HUD ----------
function setEnergy(pct){
  energy = Math.max(0, Math.min(ENERGY_MAX, pct|0));
  ui.updateEnergy( (energy/ENERGY_MAX)*100 );
}

// ---------- Boucle de rendu ----------
function draw(ts){
  if(!running) return;

  if(ts){
    if(!lastTS) lastTS=ts;
    frameDT = Math.min(0.05, (ts - lastTS)/1000);
    lastTS = ts;
  }

  // Sécu si resize pas encore passé
  if(!W || !H) safeResize();

  // Viewport carte
  const mw = mapImg.naturalWidth || 1920;
  const mh = mapImg.naturalHeight || 1080;
  const vp = computeMapViewport ? computeMapViewport(W, H, mw, mh) : (()=> {
    const availW=W, availH=Math.max(200,H-UI.BOTTOM-UI.TOP);
    const base=Math.min(availW/mw, availH/mh);
    const scale=base*(UI.MAP_ZOOM||1.3);
    const dw=mw*scale, dh=mh*scale;
    const ox=(W-dw)/2, oy=UI.TOP+(availH-dh)/2;
    return { ox, oy, dw, dh };
  })();

  ctx.clearRect(0,0,W,H);

  // Carte ou placeholder
  if (mapImg.complete && mapImg.naturalWidth){
    ctx.drawImage(mapImg, vp.ox, vp.oy, vp.dw, vp.dh);
  } else {
    ctx.fillStyle="#bfe2f8"; ctx.fillRect(vp.ox, vp.oy, vp.dw, vp.dh);
    ctx.fillStyle="#0e2b4a"; ctx.font="16px system-ui";
    ctx.fillText(t.mapNotLoaded?.(ASSETS.MAP_URL) || `Map not loaded: ${ASSETS.MAP_URL}`, vp.ox+14, vp.oy+24);
  }

  // POI
  drawPOIs(vp);

  // Joueur
  const bw = Math.min(160, Math.max(90, vp.dw*player.size));
  const bx = vp.ox + player.x*vp.dw;
  const by = vp.oy + player.y*vp.dh;

  // Ennemis/bonus + collisions
  const { collided, bonusPicked } = updateEnemies(frameDT, { ox:vp.ox, oy:vp.oy, dw:vp.dw, dh:vp.dh }, { bx, by });

  if (collided)   setEnergy(energy - (ENERGY_CFG?.HIT_DAMAGE ?? 18));
  if (bonusPicked) setEnergy(energy + (ENERGY_CFG?.HEAL_AMOUNT ?? 14));

  // Shake
  let shakeX=0, shakeY=0;
  const shakeT = getShakeTimeLeft();
  if (shakeT > 0){
    const a = Math.min(1, shakeT / 2.4);
    const mag = 6*a;
    shakeX = (Math.random()*2-1)*mag;
    shakeY = (Math.random()*2-1)*mag;
  }

  // Dessine bonus/ennemis sous le joueur
  drawEnemies(ctx, { ox:vp.ox, oy:vp.oy, dw:vp.dw, dh:vp.dh });

  // Joueur (sprite oiseau)
  if (birdImg.complete && birdImg.naturalWidth){
    ctx.drawImage(birdImg, bx-bw/2+shakeX, by-bw/2+shakeY, bw, bw);
  } else {
    ctx.fillStyle="#333";
    ctx.beginPath(); ctx.arc(bx+shakeX, by+shakeY, bw*0.35, 0, Math.PI*2); ctx.fill();
  }

  // Progression
  if (!finale && currentIdx < QUEST.length){
    const p = QUEST[currentIdx];
    const px = vp.ox + p.x*vp.dw, py = vp.oy + p.y*vp.dh;
    if (Math.hypot(bx - px, by - py) < 44){
      collected.add(p.key);
      ui.updateScore(collected.size, POIS.length);
      ui.renderStars(collected.size, POIS.length);
      starEmphasis();

      const nameShort = poiName(p.key);
      showTarantulaSuccess(nameShort);

      currentIdx++;
      if (currentIdx === QUEST.length){
        finale = true;
        ui.showReplay(true);
      } else {
        setTimeout(()=> askQuestionFor(QUEST[currentIdx]), 900);
      }
    }
  }

  requestAnimationFrame(draw);
}

// ---------- Contrôles (D-pad) ----------
function setupControls(){
  document.querySelectorAll('.btn').forEach((el)=>{
    const dx = parseFloat(el.dataset.dx)||0;
    const dy = parseFloat(el.dataset.dy)||0;
    let press=false, rafId=null;

    const step=()=>{
      if(!press || finale || energy<=0) return;
      const speed = player.speed * getPlayerSpeedFactor(1);
      player.x = Math.max(0, Math.min(1, player.x + dx*speed));
      player.y = Math.max(0, Math.min(1, player.y + dy*speed));
      rafId = requestAnimationFrame(step);
    };

    el.addEventListener('touchstart',(e)=>{ press=true; step(); e.preventDefault(); }, { passive:false });
    el.addEventListener('touchend',()=>{ press=false; cancelAnimationFrame(rafId); });
  });
}

// ---------- Reset / Start / Boot ----------
function refreshHUD(){
  ui.updateScore(collected.size, POIS.length);
  ui.renderStars(collected.size, POIS.length);
  ui.updateEnergy(100);
}

export function resetGame(){
  collected = new Set();
  QUEST = shuffle(POIS);
  currentIdx = 0;
  finale = false;
  setEnergy(ENERGY_MAX);
  player.x = 0.55; player.y = 0.25;

  resetEnemies();
  refreshHUD();
  askQuestionFor(QUEST[currentIdx]);
}

export function startGame(){
  try{
    ui.hideOverlay();
    ui.showTouch(true);
    ui.setMusicLabel(true);
    startMusic();

    if (!running){
      running = true;
      requestAnimationFrame(draw);
      dbg('Loop OK (started)');
    }
    resetGame();
  }catch(e){
    alert('Start error: '+(e?.message||e));
  }
}

export function stopGame(){
  stopMusic();
  running = false;
}

export function boot(){
  // DOM refs canvas
  canvas = document.getElementById('c');
  if (!canvas){
    console.error('Canvas #c introuvable');
    return;
  }
  ctx = canvas.getContext('2d', { alpha:true });
  if (!ctx){
    console.error('ctx 2D introuvable');
    return;
  }

  ui.initUI();
  refreshHUD();

  // Avatars écran démarrage
  const heroAr = document.getElementById('heroAr');
  const heroTa = document.getElementById('heroTa');
  if (heroAr) heroAr.src = ASSETS.BIRD_URL;
  if (heroTa) heroTa.src = ASSETS.TARANTULA_URL;

  // Boutons
  const startBtn = document.getElementById('startBtn');
  startBtn?.addEventListener('click', ()=> startGame());
  ui.onClickMusic(()=> { /* toggle simple */ startMusic(); ui.setMusicLabel(true); });
  ui.onClickReplay(()=> resetGame());

  // Resize
  safeResize();
  addEventListener('resize', safeResize);

  // Placeholder carte au boot (même si la map n’est pas encore chargée)
  ctx.fillStyle='#bfe2f8'; ctx.fillRect(0,0,canvas.width,canvas.height);
  dbg('Boot OK');
}

// ---------- Utilitaires ----------
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
