// src/game.js
// ---------------------------------------------------------
// Boucle principale, rendu carte/POI, progression, énergie
// ---------------------------------------------------------

import {
  ASSETS,
  UI,
  POIS,
  STARS_TARGET,
  ENERGY,
  pickDevicePixelRatio,
  computeMapViewport,
  makeInitialPlayer,
} from './config.js';

import { t, poiName, poiInfo } from './i18n.js';

import {
  startMusic,
  stopMusic,
  starEmphasis,
  resetAudioForNewGame,
} from './audio.js';

import {
  setSprites,
  resetEnemies,
  updateEnemies,
  drawEnemies,
  getPlayerSpeedFactor,
  getShakeTimeLeft,
} from './enemies.js';

import * as ui from './ui.js';

// ---------- État module ----------
let canvas, ctx;
let W = 0, H = 0, dpr = 1;

let running = false;
let lastTS = 0;

let player = makeInitialPlayer();
let collected = new Set();
let QUEST = [];
let currentIdx = 0;
let finale = false;

let mapImg, birdImg, spiderImg, crowImg, jellyImg;

// ---------- Utils ----------
function shuffle(arr){
  const a = arr.slice();
  for (let i=a.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadImage(url){
  const im = new Image();
  im.decoding = 'async';
  im.src = url;
  return im;
}

// ---------- Dimensions canvas ----------
function resize(){
  if (!canvas || !ctx) return;
  dpr = pickDevicePixelRatio();
  W = canvas.clientWidth  = canvas.parentElement.clientWidth;
  H = canvas.clientHeight = canvas.parentElement.clientHeight;
  canvas.width  = Math.round(W*dpr);
  canvas.height = Math.round(H*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}

// ---------- Energie ----------
function setEnergy(next){
  player.energy = Math.max(0, Math.min(player.energyMax, next|0));
  const pct = (player.energy / player.energyMax) * 100;
  ui.updateEnergy(pct);
}

// ---------- Questions / bulle ----------
function askQuestionFor(p){
  if(!p) return;
  ui.showAsk( t.ask( poiInfo(p.key) ) );
}
function showTarantulaSuccess(name){
  ui.showSuccess( t.success(name) );
}

// ---------- Rendu éléments “fixes” ----------
function drawMap(bounds){
  const { ox, oy, dw, dh } = bounds;
  if (mapImg.complete && mapImg.naturalWidth){
    ctx.drawImage(mapImg, ox, oy, dw, dh);
  } else {
    ctx.fillStyle = '#bfe2f8'; ctx.fillRect(ox, oy, dw, dh);
    ctx.fillStyle = '#0e2b4a'; ctx.font = '16px system-ui';
    ctx.fillText(t.mapNotLoaded(ASSETS.MAP_URL), ox+14, oy+24);
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

// ---------- Boucle principale ----------
function frame(ts){
  if(!running) return;

  if (ts){
    if(!lastTS) lastTS = ts;
    const dt = Math.min(0.05, (ts - lastTS)/1000);
    lastTS = ts;

    // timers internes ennemis (slow/shake) + spawns/update
    // Calcul viewport
    const bounds = computeMapViewport(W, H, mapImg.naturalWidth||1920, mapImg.naturalHeight||1080);

    // fond
    ctx.clearRect(0,0,W,H);
    drawMap(bounds);
    drawPOIs(bounds);

    // position joueur
    const bw = Math.min(160, Math.max(90, bounds.dw*player.size));
    const bx = bounds.ox + player.x*bounds.dw;
    const by = bounds.oy + player.y*bounds.dh;

    // ennemis/bonus + collisions
    const { collided, bonusPicked } = updateEnemies(dt, bounds, { bx, by });

    // énergie
    if(collided && player.invulnTimer<=0){
      setEnergy(player.energy - ENERGY.HIT_DAMAGE);
      player.invulnTimer = ENERGY.INVULN_AFTER_HIT_S;
    }
    if (bonusPicked){
      setEnergy(player.energy + 14); // petit heal “bonus”
    }
    if (player.invulnTimer > 0) player.invulnTimer = Math.max(0, player.invulnTimer - dt);

    // shake visuel (issu d'enemies)
    let shakeX=0, shakeY=0;
    const shakeT = getShakeTimeLeft();
    if (shakeT > 0){
      const a = Math.min(1, shakeT/2.4);
      const mag = 6*a;
      shakeX = (Math.random()*2-1)*mag;
      shakeY = (Math.random()*2-1)*mag;
    }

    // dessine bonus/ennemis (sous le joueur)
    drawEnemies(ctx, bounds);

    // joueur
    if (birdImg.complete && birdImg.naturalWidth){
      ctx.drawImage(birdImg, bx - bw/2 + shakeX, by - bw/2 + shakeY, bw, bw);
    } else {
      ctx.fillStyle='#333'; ctx.beginPath(); ctx.arc(bx+shakeX,by+shakeY,bw*0.35,0,Math.PI*2); ctx.fill();
    }

    // progression POI
    if(!finale && currentIdx < QUEST.length){
      const p = QUEST[currentIdx];
      const px = bounds.ox + p.x*bounds.dw, py = bounds.oy + p.y*bounds.dh;
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
          // fin simplifiée
          ui.showReplay(true);
          finale = true;
        } else {
          setTimeout(()=> askQuestionFor(QUEST[currentIdx]), 900);
        }
      }
    }
  }

  requestAnimationFrame(frame);
}

// ---------- Contrôles tactiles (D-pad) ----------
function setupControls(){
  document.querySelectorAll('.btn').forEach((el)=>{
    const dx = parseFloat(el.dataset.dx);
    const dy = parseFloat(el.dataset.dy);
    let press=false, rafId=null;

    const step = ()=>{
      if(!press || finale || player.energy<=0) return;
      const speed = player.speed * getPlayerSpeedFactor(1);
      player.x = Math.max(0, Math.min(1, player.x + dx * speed));
      player.y = Math.max(0, Math.min(1, player.y + dy * speed));
      rafId = requestAnimationFrame(step);
    };

    el.addEventListener('touchstart', (e)=>{ press=true; step(); e.preventDefault(); }, {passive:false});
    el.addEventListener('touchend',   ()=>{ press=false; cancelAnimationFrame(rafId); });
  });
}

// ---------- Public : reset / start / stop ----------
export function resetGame(){
  collected = new Set();
  QUEST = shuffle(POIS).slice(0, STARS_TARGET);
  currentIdx = 0;
  finale = false;

  // réinit joueur
  player = makeInitialPlayer();
  setEnergy(ENERGY.START);

  // ennemis & audio
  resetEnemies();
  resetAudioForNewGame();

  // HUD
  ui.updateScore(0, POIS.length);
  ui.renderStars(0, POIS.length);
  askQuestionFor(QUEST[0]);
}

export function startGame(){
  ui.hideOverlay();
  ui.showTouch(true);
  ui.setMusicLabel(true);
  startMusic();

  if (!running){
    running = true;
    lastTS = 0;
    requestAnimationFrame(frame);
  }
  resetGame();
}

export function stopGame(){
  running = false;
  stopMusic();
}

// ---------- Boot (appelé depuis index.html) ----------
export function boot(){
  // Canvas/ctx
  canvas = document.getElementById('c');
  ctx     = canvas.getContext('2d', { alpha:true });

  ui.initUI();

  // Images
  mapImg    = loadImage(ASSETS.MAP_URL);
  birdImg   = loadImage(ASSETS.BIRD_URL);
  spiderImg = loadImage(ASSETS.TARANTULA_URL);
  crowImg   = loadImage(ASSETS.CROW_URL);
  jellyImg  = loadImage(ASSETS.JELLY_URL);

  // Sprites ennemis
  setSprites({ crowImg, jellyImg });

  // Avatars (écran de démarrage)
  const heroAr = document.getElementById('heroAr');
  const heroTa = document.getElementById('heroTa');
  if (heroAr) heroAr.src = ASSETS.BIRD_URL;
  if (heroTa) heroTa.src = ASSETS.TARANTULA_URL;
  const tarAvatar = document.getElementById('tarAvatar');
  if (tarAvatar) tarAvatar.src = ASSETS.TARANTULA_URL;

  // Start button
  const startBtn = document.getElementById('startBtn');
  startBtn?.addEventListener('click', startGame);
  // Compat éventuelle :
  window.startGame = startGame;

  // Resize
  resize(); addEventListener('resize', resize);

  // HUD initial
  ui.updateScore(0, POIS.length);
  ui.renderStars(0, POIS.length);
  ui.updateEnergy(100);

  // Bulle placeholder
  if (POIS.length) askQuestionFor(POIS[0]);
}
