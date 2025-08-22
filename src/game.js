// src/game.js
// Boucle principale, wiring et rendu de base (version stable)

import { ASSETS, UI, POIS, STARS_TARGET, makeInitialPlayer } from './config.js';
import { t, poiName, poiInfo } from './i18n.js';
import { startMusic, stopMusic, starEmphasis } from './audio.js';
import {
  setSprites, resetEnemies, updateEnemies, drawEnemies,
  getPlayerSpeedFactor, getShakeTimeLeft
} from './enemies.js';
import * as ui from './ui.js';

// ------- état global -------
let running = false;
let lastTS = 0, frameDT = 0;
let finale = false;

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: true });

// joueur
const playerBase = makeInitialPlayer();
const player = makeInitialPlayer();

// progression
let collected = new Set();
let QUEST = [];
let currentIdx = 0;

// énergie (0..100)
let energy = 100;
const ENERGY_MAX = 100;

// images
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

setSprites({ crowImg, jellyImg });

// ------- resize / dpr -------
let W=0,H=0,dpr=1;
function resize(){
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio||1));
  W = canvas.clientWidth  = canvas.parentElement.clientWidth;
  H = canvas.clientHeight = canvas.parentElement.clientHeight;
  canvas.width  = Math.round(W*dpr);
  canvas.height = Math.round(H*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}

// ------- util -------
function computeMapBounds(){
  const mw = mapImg.naturalWidth || 1920;
  const mh = mapImg.naturalHeight || 1080;
  const availW = W;
  const availH = Math.max(200, H - UI.BOTTOM - UI.TOP);
  const baseScale = Math.min(availW/mw, availH/mh);
  const scale = baseScale * UI.MAP_ZOOM;
  const dw = mw*scale, dh = mh*scale;
  const ox = (W - dw)/2, oy = UI.TOP + (availH - dh)/2;
  return { mw,mh, dw,dh, ox,oy, scale };
}

function drawMap(bounds){
  const {ox,oy,dw,dh} = bounds;
  if (mapImg.complete && mapImg.naturalWidth) ctx.drawImage(mapImg, ox,oy,dw,dh);
  else { ctx.fillStyle='#bfe2f8'; ctx.fillRect(ox,oy,dw,dh); }
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
  const {ox,oy,dw,dh} = bounds;
  for(const p of POIS){
    const x=ox+p.x*dw, y=oy+p.y*dh;
    if(collected.has(p.key)){
      drawStarfish(x, y-20, Math.max(14,Math.min(22,Math.min(W,H)*0.028)));
    }else{
      ctx.save(); ctx.strokeStyle='#b04123'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(x-6,y-6); ctx.lineTo(x+6,y+6);
      ctx.moveTo(x-6,y+6); ctx.lineTo(x+6,y-6); ctx.stroke(); ctx.restore();
    }
  }
}

function setEnergy(p){
  energy = Math.max(0, Math.min(ENERGY_MAX, p|0));
  ui.updateEnergy( (energy/ENERGY_MAX)*100 );
}

// ------- questions / succès -------
function askQuestionFor(p){
  if(!p) return;
  ui.showAsk( t.ask?.(poiInfo(p.key)) || `Where is ${poiInfo(p.key)}?` );
}
function showTarantulaSuccess(name){
  ui.showSuccess( t.success?.(name) || `Great, that’s it: ${name}!` );
}

// ------- frame -------
function draw(ts){
  if(ts){
    if(!lastTS) lastTS=ts;
    frameDT=Math.min(0.05,(ts-lastTS)/1000);
    lastTS=ts;
  }

  const b = computeMapBounds();
  const { ox,oy,dw,dh } = b;

  ctx.clearRect(0,0,W,H);
  drawMap(b);
  drawPOIs(b);

  // joueur
  const bw = Math.min(160, Math.max(90, dw*player.size));
  const bx = ox + player.x*dw;
  const by = oy + player.y*dh;

  const { collided, bonusPicked } =
    updateEnemies(frameDT, {ox,oy,dw,dh}, {bx,by});

  if (collided)   setEnergy(energy - 18);
  if (bonusPicked) setEnergy(energy + 14);

  // shake
  let shakeX=0,shakeY=0;
  const sh = getShakeTimeLeft();
  if (sh > 0){
    const a = Math.min(1, sh/2.4), mag=6*a;
    shakeX=(Math.random()*2-1)*mag; shakeY=(Math.random()*2-1)*mag;
  }

  drawEnemies(ctx, {ox,oy,dw,dh});

  if (birdImg.complete && birdImg.naturalWidth)
    ctx.drawImage(birdImg, bx-bw/2+shakeX, by-bw/2+shakeY, bw, bw);
  else { ctx.fillStyle="#333"; ctx.beginPath(); ctx.arc(bx,by,bw*0.35,0,Math.PI*2); ctx.fill(); }

  // progression POI
  if(!finale && currentIdx < QUEST.length){
    const p = QUEST[currentIdx];
    const px = ox + p.x*dw, py = oy + p.y*dh;
    const onTarget = Math.hypot(bx-px, by-py) < 44;
    if (onTarget){
      collected.add(p.key);
      ui.updateScore(collected.size, POIS.length);
      ui.renderStars(collected.size, POIS.length);
      starEmphasis();
      showTarantulaSuccess(poiName(p.key));
      currentIdx++;
      if(currentIdx === QUEST.length){
        ui.showReplay(true);
        finale = true;
      }else{
        setTimeout(()=> askQuestionFor(QUEST[currentIdx]), 900);
      }
    }
  }

  requestAnimationFrame(draw);
}

// ------- contrôles tactiles -------
function setupControls(){
  document.querySelectorAll('.btn').forEach(el=>{
    const dx=parseFloat(el.dataset.dx), dy=parseFloat(el.dataset.dy);
    let press=false, id=null;
    const step=()=>{
      if(!press || finale || energy<=0) return;
      const speed = playerBase.speed * getPlayerSpeedFactor(1);
      player.x = Math.max(0, Math.min(1, player.x + dx*speed));
      player.y = Math.max(0, Math.min(1, player.y + dy*speed));
      id=requestAnimationFrame(step);
    };
    el.addEventListener('touchstart', (e)=>{ press=true; step(); e.preventDefault(); }, {passive:false});
    el.addEventListener('touchend',   ()=>{ press=false; cancelAnimationFrame(id); });
  });
}

// ------- helpers -------
function shuffle(arr){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

// ------- API publique -------
export function resetGame(){
  collected = new Set();
  QUEST = shuffle(POIS);
  currentIdx = 0;
  finale = false;
  setEnergy(ENERGY_MAX);

  Object.assign(player, makeInitialPlayer());
  resetEnemies();

  ui.updateScore(0, POIS.length);
  ui.renderStars(0, POIS.length);
  askQuestionFor(QUEST[0]);
}

export function startGame(){
  ui.hideOverlay();
  ui.showTouch(true);
  ui.setMusicLabel(true);
  startMusic();
  if(!running){ running=true; requestAnimationFrame(draw); }
  resetGame();
}

export function boot(){
  // base UI
  ui.initUI();
  ui.updateScore(0, STARS_TARGET);
  ui.renderStars(0, STARS_TARGET);
  ui.updateEnergy(100);

  // avatars écran de démarrage
  document.getElementById('heroAr').src = ASSETS.BIRD_URL;
  document.getElementById('heroTa').src = ASSETS.TARANTULA_URL;
  document.getElementById('tarAvatar').src = ASSETS.TARANTULA_URL;

  // boutons
  document.getElementById('startBtn')?.addEventListener('click', startGame);
  ui.onClickMusic(()=>{ startMusic(); ui.setMusicLabel(true); });
  ui.onClickReplay(()=> resetGame());

  // resize
  resize(); addEventListener('resize', resize);

  // question placeholder
  if (POIS.length) ui.showAsk( t.ask?.(poiInfo(POIS[0].key)) || '' );
}
