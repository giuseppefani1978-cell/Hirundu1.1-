// src/game.js
// Jeu: boucle, rendu, progression, énergie, wiring UI + export startGame

import {
  ASSETS, POIS, UI, pickDevicePixelRatio, computeMapViewport,
} from './config.js';
import { t, poiName, poiInfo } from './i18n.js';
import { startMusic, stopMusic, starEmphasis } from './audio.js';
import {
  setSprites, resetEnemies, updateEnemies, drawEnemies,
  getPlayerSpeedFactor, getShakeTimeLeft
} from './enemies.js';
import * as ui from './ui.js';

// ---------- Canvas ----------
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: true });

let W=0, H=0, dpr=1;
function resize(){
  dpr = pickDevicePixelRatio();
  W = canvas.clientWidth  = canvas.parentElement.clientWidth;
  H = canvas.clientHeight = canvas.parentElement.clientHeight;
  canvas.width  = Math.round(W*dpr);
  canvas.height = Math.round(H*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
resize();
addEventListener('resize', resize);

// ---------- Images ----------
const mapImg    = new Image();
const birdImg   = new Image();
const spiderImg = new Image();
const crowImg   = new Image();
const jellyImg  = new Image();

mapImg.src    = ASSETS.MAP_URL;
birdImg.src   = ASSETS.BIRD_URL;
spiderImg.src = ASSETS.TARANTULA_URL;
crowImg.src   = ASSETS.CROW_URL;
jellyImg.src  = ASSETS.JELLY_URL;

// donner les sprites des ennemis au module enemies
setSprites({ crowImg, jellyImg });

// ---------- État ----------
let running = false;
let lastTS = 0;
let frameDT = 0;

const playerBase = { x:0.55, y:0.25, speed:0.0048, size:0.11 };
const player = { ...playerBase };

let collected = new Set();
let QUEST = [];
let currentIdx = 0;

const ENERGY_MAX = 100;
let energy = ENERGY_MAX;
let finale = false;

// ---------- Helpers visuels ----------
function drawMap(bounds){
  const { ox, oy, dw, dh } = bounds;
  if (mapImg.complete && mapImg.naturalWidth) {
    ctx.drawImage(mapImg, ox, oy, dw, dh);
  } else {
    ctx.fillStyle = '#bfe2f8'; ctx.fillRect(ox, oy, dw, dh);
    ctx.fillStyle = '#0e2b4a'; ctx.font = '16px system-ui';
    ctx.fillText(t.mapNotLoaded?.(ASSETS.MAP_URL) || `Map not loaded: ${ASSETS.MAP_URL}`, ox+14, oy+24);
  }
}

function drawStarfish(cx,cy,R){
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
    const x = ox + p.x*dw, y = oy + p.y*dh;
    if (collected.has(p.key)) {
      drawStarfish(x, y-20, Math.max(14, Math.min(22, Math.min(W,H)*0.028)));
    } else {
      ctx.save(); ctx.strokeStyle='#b04123'; ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(x-6,y-6); ctx.lineTo(x+6,y+6);
      ctx.moveTo(x-6,y+6); ctx.lineTo(x+6,y-6);
      ctx.stroke(); ctx.restore();
    }
  }
}

function setEnergy(pct){
  energy = Math.max(0, Math.min(ENERGY_MAX, pct|0));
  ui.updateEnergy((energy / ENERGY_MAX) * 100);
}

// ---------- Questions / Succès ----------
function askQuestionFor(p){
  if(!p) return;
  ui.showAsk(t.ask?.(poiInfo(p.key)) || `Where is ${poiInfo(p.key)}?`);
}
function showTarantulaSuccess(name){
  ui.showSuccess(t.success?.(name) || `Great, that’s exactly it: ${name}!`);
}

// ---------- Contrôles tactiles ----------
function setupControls(){
  document.querySelectorAll('.btn').forEach((el)=>{
    const dx = parseFloat(el.dataset.dx);
    const dy = parseFloat(el.dataset.dy);
    let press=false, rafId=null;

    const step=()=>{
      if(!press || finale || energy<=0) return;
      const speed = playerBase.speed * getPlayerSpeedFactor(1);
      player.x = Math.max(0, Math.min(1, player.x + dx*speed));
      player.y = Math.max(0, Math.min(1, player.y + dy*speed));
      rafId = requestAnimationFrame(step);
    };

    el.addEventListener('touchstart', (e)=>{ press=true; step(); e.preventDefault(); }, {passive:false});
    el.addEventListener('touchend',   ()=>{ press=false; cancelAnimationFrame(rafId); });
  });
}

// ---------- HUD ----------
function refreshHUD(){
  ui.updateScore(collected.size, POIS.length);
  ui.renderStars(collected.size, POIS.length);
  ui.updateEnergy(100);
}

// ---------- Boucle ----------
function draw(ts){
  if(ts){
    if(!lastTS) lastTS=ts;
    frameDT = Math.min(0.05, (ts-lastTS)/1000);
    lastTS = ts;
  }
  ctx.clearRect(0,0,W,H);

  const mw = mapImg.naturalWidth || 1920;
  const mh = mapImg.naturalHeight || 1080;
  const { ox, oy, dw, dh } = computeMapViewport(W, H, mw, mh);

  drawMap({ ox, oy, dw, dh });
  drawPOIs({ ox, oy, dw, dh });

  const bw = Math.min(160, Math.max(90, dw*player.size));
  const bx = ox + player.x*dw;
  const by = oy + player.y*dh;

  // Ennemis + bonus
  const { collided, bonusPicked } = updateEnemies(frameDT, { ox, oy, dw, dh }, { bx, by });

  if (collided)    setEnergy(energy - 18);
  if (bonusPicked) setEnergy(energy + 14);

  // Shake joueur
  let shakeX=0, shakeY=0;
  const shakeT = getShakeTimeLeft();
  if (shakeT > 0) {
    const a = Math.min(1, shakeT/2.4);
    const mag = 6 * a;
    shakeX = (Math.random()*2-1)*mag;
    shakeY = (Math.random()*2-1)*mag;
  }

  // Dessous: bonus/ennemis
  drawEnemies(ctx, { ox, oy, dw, dh });

  // Joueur
  if (birdImg.complete && birdImg.naturalWidth) {
    ctx.drawImage(birdImg, bx-bw/2+shakeX, by-bw/2+shakeY, bw, bw);
  } else {
    ctx.fillStyle = '#333'; ctx.beginPath();
    ctx.arc(bx+shakeX, by+shakeY, bw*0.35, 0, Math.PI*2); ctx.fill();
  }

  // Progression
  if (!finale && currentIdx < QUEST.length){
    const p = QUEST[currentIdx];
    const px = ox + p.x*dw, py = oy + p.y*dh;
    const onTarget = Math.hypot(bx - px, by - py) < 44;
    if (onTarget){
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

  if (running) requestAnimationFrame(draw);
}

// ---------- Publics ----------
export function resetGame(){
  collected = new Set();
  QUEST = shuffle(POIS);
  currentIdx = 0;
  finale = false;
  setEnergy(ENERGY_MAX);

  Object.assign(player, playerBase);

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

    if (!running) { running = true; requestAnimationFrame(draw); }
    resetGame();
  }catch(e){
    alert('Start error: ' + (e?.message || e));
  }
}

export function stopGame(){
  running = false;
  stopMusic();
}

// ---------- Boot (auto-init) ----------
export function boot(){
  ui.initUI();
  refreshHUD();

  // avatars overlay
  const heroAr = document.getElementById('heroAr');
  const heroTa = document.getElementById('heroTa');
  if (heroAr) heroAr.src = ASSETS.BIRD_URL;
  if (heroTa) heroTa.src = ASSETS.TARANTULA_URL;

  // boutons musique / rejouer
  ui.onClickMusic(() => { startMusic(); ui.setMusicLabel(true); });
  ui.onClickReplay(() => { resetGame(); });

  // D-pad
  setupControls();

  // Bulle placeholder tant que l’overlay est visible
  if (POIS?.length) {
    ui.showAsk(t.ask?.(poiInfo(POIS[0].key)) || `Where is ${poiInfo(POIS[0].key)}?`);
  }

  // expose startGame pour le mini-fallback (index.html)
  window.startGame = startGame;
}

// auto-init si le DOM est prêt (index appelle aussi boot() par sécurité)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

// ---------- utils ----------
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
