// src/game.js
// =====================================================
// CONFIG + GAMEPLAY (imports: i18n, ui, audio uniquement)
// =====================================================
import { t, poiName, poiInfo } from './i18n.js';
import { startMusic, toggleMusic, isMusicOn, ping, starEmphasis, failSfx, resetAudioForNewGame } from './audio.js';
import * as ui from './ui.js';

const DEBUG = false;
function dbg(...a){ if (DEBUG) console.log('[GAME]', ...a); }

// ------------------------
// Config (fusionnée ici)
// ------------------------
const APP_VERSION = (window.APP_VERSION || 'v2025-08-20-g');
const APP_Q = `?v=${APP_VERSION}`;
const asset = (p) => `${p}${APP_Q}`;

// ⚠️ les noms doivent correspondre exactement aux fichiers dans /assets
const ASSETS = {
  MAP_URL:       asset('assets/salento-map.PNG'),
  BIRD_URL:      asset('assets/aracne .PNG'),     // (avec espace si le fichier l’a vraiment)
  TARANTULA_URL: asset('assets/tarantula .PNG'),
  CROW_URL:      asset('assets/crow.PNG'),
  JELLY_URL:     asset('assets/jellyfish.PNG'),
};

const UI_CONST = { TOP: 120, BOTTOM: 160, MAP_ZOOM: 1.30 };

function pickDPR(){ return Math.max(1, Math.min(2, window.devicePixelRatio || 1)); }
function computeMapViewport(canvasW, canvasH, mapW, mapH){
  const availW = canvasW;
  const availH = Math.max(200, canvasH - UI_CONST.BOTTOM - UI_CONST.TOP);
  const baseScale = Math.min(availW / mapW, availH / mapH);
  const scale = baseScale * UI_CONST.MAP_ZOOM;
  const dw = mapW * scale, dh = mapH * scale;
  const ox = (canvasW - dw) / 2;
  const oy = UI_CONST.TOP + (availH - dh) / 2;
  return { ox, oy, dw, dh, scale };
}

// ------------------------
// Données
// ------------------------
const SHIFT_COAST = { x:0.045, y:0.026 };
const SHIFT_EAST  = 0.04;
const POIS = [
  { key:"otranto",       x:0.86+SHIFT_EAST+SHIFT_COAST.x,       y:0.48+SHIFT_COAST.y },
  { key:"portobadisco",  x:0.80+SHIFT_EAST+SHIFT_COAST.x,       y:0.56+SHIFT_COAST.y },
  { key:"santacesarea",  x:0.74+SHIFT_EAST+SHIFT_COAST.x+0.010, y:0.60+SHIFT_COAST.y+0.008 },
  { key:"castro",        x:0.72+SHIFT_EAST+SHIFT_COAST.x+0.012, y:0.65+SHIFT_COAST.y+0.008 },
  { key:"ciolo",         x:0.66+SHIFT_EAST+SHIFT_COAST.x+0.070, y:0.78+SHIFT_COAST.y+0.006 },
  { key:"leuca",         x:0.64+SHIFT_COAST.x+0.10,             y:0.90+SHIFT_COAST.y },
  { key:"gallipoli",     x:0.27,                                y:0.62 },
  { key:"portocesareo",  x:0.22,                                y:0.46 },
  { key:"nardo",         x:0.38,                                y:0.50 },
  { key:"lecce",         x:0.53,                                y:0.28 },
];
const STARS_TARGET = POIS.length;

const PLAYER_BASE = { x:0.55, y:0.25, speed:0.0048, size:0.11 };
const ENERGY = { MAX:100, START:100 };
const ENEMY  = { JELLY:'jelly', CROW:'crow' };

const ENEMY_CONFIG = {
  MAX_ON_SCREEN: 4,
  LIFETIME_S: 14,
  BASE_SPAWN_MS: 4200,
  SPAWN_JITTER_MS: 2600,
  COLLIDE_RADIUS_PX: 36,
  SPEED: { [ENEMY.JELLY]: 0.06, [ENEMY.CROW]: 0.10 },
  FLEE:  { SPEED: 0.38, DURATION_MS_MIN: 1600, DURATION_MS_RAND: 700 },
  SPRITE_PX: { [ENEMY.JELLY]: 42, [ENEMY.CROW]: 42 },
};
const BONUS_CONFIG = { LIFETIME_S:4, BASE_SPAWN_MS:4200, SPAWN_JITTER_MS:3000, PICK_RADIUS_PX:36, HEAL_AMOUNT:25 };
const SHAKE = { MAX_S:2.4, DECAY_PER_S:1.0, HIT_ADD:0.6, BONUS_ADD:0.2 };

// ----- SCORE CONFIG -----
const SCORE = {
  STAR: 100,     // par étoile
  BONUS: 20,     // par bonus
  HIT: -30,      // par coup
  WIN: 200,      // bonus de victoire
  GAMEOVER: 0,   // bonus de fin en cas de mort
};

// ----- HALL OF FAME -----
const HOF_KEY = 'salento_hof_v1';
const HOF_SIZE = 10;
function loadHof(){ try { return JSON.parse(localStorage.getItem(HOF_KEY)) || []; } catch { return []; } }
function saveHof(list){ try { localStorage.setItem(HOF_KEY, JSON.stringify(list)); } catch {} }
function addToHof(entry){
  const hof = loadHof();
  hof.push(entry);
  hof.sort((a,b)=> b.score - a.score);
  const trimmed = hof.slice(0, HOF_SIZE);
  saveHof(trimmed);
  return trimmed;
}
function fmtTime(ms){
  const s = Math.max(0, Math.round(ms/1000));
  const m = Math.floor(s/60), r = s%60;
  return `${m}m${String(r).padStart(2,'0')}s`;
}
function getCountry(){
  try{
    const lang = navigator.language || (Intl.DateTimeFormat().resolvedOptions().locale);
    const region = (lang && lang.includes('-')) ? lang.split('-')[1] : null;
    if (!region) return { code:'??', flag:'🏳️', label:'??' };
    const dn = new Intl.DisplayNames([lang], { type:'region' });
    const label = dn.of(region);
    // petit mapping flag Unicode
    const flag = region.replace(/./g, c => String.fromCodePoint(127397 + c.toUpperCase().charCodeAt()));
    return { code:region, flag, label };
  }catch{
    return { code:'??', flag:'🏳️', label:'??' };
  }
}
function leaderboardText(hof){
  return hof.map((e,i)=>{
    const stats = `${e.stars}★, ${e.bonuses} bonus, ${e.hits} coups, ${fmtTime(e.time)}`;
    const country = e.country?.flag ? `${e.country.flag} ` : '';
    return `#${i+1} ${e.score} — ${country}${e.name} (${stats})`;
  }).join('\n');
}

// ------- UI HOF PANEL -------
function ensureHofPanel(){
  let panel = document.getElementById('__hof__');
  if (panel) return panel;
  panel = document.createElement('div');
  panel.id = '__hof__';
  panel.style.cssText = `
    position:fixed; inset:0; z-index:10002; display:none;
    background:linear-gradient(180deg, rgba(0,0,0,.85), rgba(0,0,0,.75));
    color:#fff; font:14px system-ui; overflow:auto; padding:24px;
  `;
  panel.innerHTML = `
    <div style="max-width:720px;margin:0 auto;">
      <div style="display:flex;align-items:center;gap:12px;justify-content:space-between;">
        <h2 style="margin:0;font:600 22px system-ui;">🏆 Hall of Fame</h2>
        <button id="__hof_close" type="button"
          style="background:#fff;color:#000;border:0;border-radius:8px;padding:8px 12px;cursor:pointer">Fermer</button>
      </div>
      <div id="__hof_table" style="margin-top:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.2);border-radius:10px;overflow:hidden"></div>
      <div style="margin-top:18px;opacity:.75">Les scores sont stockés localement sur cet appareil. Pour un classement mondial, on peut brancher un petit serveur (API) — dis-moi et je te prépare ça.</div>
    </div>
  `;
  document.body.appendChild(panel);
  panel.querySelector('#__hof_close').addEventListener('click', ()=> { panel.style.display='none'; history.replaceState(null, '', location.pathname); });
  return panel;
}
function renderHofTable(list){
  const host = ensureHofPanel();
  const box = host.querySelector('#__hof_table');
  const rows = list.map((e,i)=>`
    <tr>
      <td style="padding:10px 12px">${i+1}</td>
      <td style="padding:10px 12px">${e.country?.flag||'🏳️'}</td>
      <td style="padding:10px 12px">${escapeHtml(e.name)}</td>
      <td style="padding:10px 12px;font-weight:600">${e.score}</td>
      <td style="padding:10px 12px">${e.stars}★</td>
      <td style="padding:10px 12px">${e.bonuses}</td>
      <td style="padding:10px 12px">${e.hits}</td>
      <td style="padding:10px 12px">${fmtTime(e.time)}</td>
      <td style="padding:10px 12px">${new Date(e.date).toLocaleString()}</td>
    </tr>`).join('');
  box.innerHTML = `
    <table style="width:100%;border-collapse:collapse">
      <thead style="background:rgba(255,255,255,.08)">
        <tr>
          <th style="text-align:left;padding:10px 12px">#</th>
          <th style="text-align:left;padding:10px 12px">Pays</th>
          <th style="text-align:left;padding:10px 12px">Joueur</th>
          <th style="text-align:left;padding:10px 12px">Score</th>
          <th style="text-align:left;padding:10px 12px">Étoiles</th>
          <th style="text-align:left;padding:10px 12px">Bonus</th>
          <th style="text-align:left;padding:10px 12px">Coups</th>
          <th style="text-align:left;padding:10px 12px">Temps</th>
          <th style="text-align:left;padding:10px 12px">Date</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="9" style="padding:14px 12px;opacity:.8">Aucun score pour l’instant.</td></tr>`}</tbody>
    </table>
  `;
  host.style.display = 'block';
}
function openHofPanel(){ renderHofTable(loadHof()); }

// petite évasion HTML ultra simple
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// ------------------------
// BOOT
// ------------------------
export function boot(){
  const canvas = document.getElementById('c');
  if (!canvas){ alert("Chargement du jeu impossible : canvas introuvable (#c)."); return; }
  const ctx = canvas.getContext('2d', { alpha:true });

  // UI init
  ui.initUI();
  ui.updateScore(0, STARS_TARGET);
  ui.renderStars(0, STARS_TARGET);
  ui.updateEnergy(100);
  ui.onClickMusic(() => { toggleMusic(); ui.setMusicLabel(isMusicOn()); });
  ui.setMusicLabel(false);
  ui.onClickReplay(() => startGame());

  // Bouton Rejouer en haut-droite
  const replayBtn = document.getElementById('replayFloat');
  if (replayBtn){
    replayBtn.style.position = 'fixed';
    replayBtn.style.top = '8px';
    replayBtn.style.right = '8px';
    replayBtn.style.left = 'auto';
    replayBtn.style.bottom = 'auto';
    replayBtn.style.zIndex = '10001';
  }

  // Bouton Hall of Fame en haut-gauche
  let hofBtn = document.getElementById('__hof_btn');
  if (!hofBtn){
    hofBtn = document.createElement('button');
    hofBtn.id='__hof_btn';
    hofBtn.type='button';
    hofBtn.textContent = '🏆 Hall of Fame';
    hofBtn.style.cssText = 'position:fixed;top:8px;left:8px;z-index:10001;background:#fff;border:0;border-radius:8px;padding:6px 10px;font:12px system-ui;cursor:pointer';
    document.body.appendChild(hofBtn);
  }
  hofBtn.onclick = openHofPanel;

  // Images
  const mapImg   = new Image();
  const birdImg  = new Image();
  const spiderImg= new Image();
  const crowImg  = new Image();
  const jellyImg = new Image();

  mapImg.onload    = () => { dbg('map load OK'); resize(); };
  mapImg.onerror   = () => ui.assetFail('Map', ASSETS.MAP_URL);
  birdImg.onerror  = () => ui.assetFail('Aracne', ASSETS.BIRD_URL);
  spiderImg.onerror= () => ui.assetFail('Tarantula', ASSETS.TARANTULA_URL);
  crowImg.onerror  = () => ui.assetFail('Crow', ASSETS.CROW_URL);
  jellyImg.onerror = () => ui.assetFail('Jellyfish', ASSETS.JELLY_URL);

  // Splash avatars
  const heroAr = document.getElementById('heroAr');
  const heroTa = document.getElementById('heroTa');
  const tarAvatar = document.getElementById('tarAvatar');
  if (heroAr) heroAr.src = ASSETS.BIRD_URL;
  if (heroTa) heroTa.src = ASSETS.TARANTULA_URL;
  if (tarAvatar) tarAvatar.src = ASSETS.TARANTULA_URL;

  // Charge assets (avec ?v=...)
  mapImg.src    = ASSETS.MAP_URL;
  birdImg.src   = ASSETS.BIRD_URL;
  spiderImg.src = ASSETS.TARANTULA_URL;
  crowImg.src   = ASSETS.CROW_URL;
  jellyImg.src  = ASSETS.JELLY_URL;

  // ===== Canvas sizing =====
  let W = 0, H = 0, dpr = 1;
  function resize(){
    dpr = pickDPR();
    const parent = canvas.parentElement || document.body;
    W = parent.clientWidth  || window.innerWidth  || 360;
    H = parent.clientHeight || window.innerHeight || 640;

    // IMPORTANT: bitmap + style CSS (évite le bug iOS “readonly property”)
    canvas.width  = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize, { passive:true });

  // ------- Game state -------
  let mode = 'splash'; // 'splash' | 'play' | 'win' | 'dead'
  let running = false;
  let lastTS = 0;
  let collected = new Set();
  let QUEST = shuffle(POIS);
  let currentIdx = 0;

  const player = { x: PLAYER_BASE.x, y: PLAYER_BASE.y, speed: PLAYER_BASE.speed, size: PLAYER_BASE.size };
  let energy = ENERGY.START;

  let enemies = [];
  let bonuses = [];
  let enemySpawnAt = performance.now() + 800;
  let bonusSpawnAt = performance.now() + 1400;

  let playerSlowTimer = 0;
  let hitShake = 0;

  // ------ SCORE RUNTIME ------
  let score = 0;
  let hits = 0;
  let bonusesPicked = 0;
  let starsPicked = 0;
  let gameStartAt = 0;
  let finalized = false;
  let playerName = null;
  let country = getCountry();

  function scoreReset(){
    score = 0; hits = 0; bonusesPicked = 0; starsPicked = 0;
    gameStartAt = performance.now();
    finalized = false;
  }

  // Win animation state
  const winFx = { t:0, fw:[], fwTimer:0 };

  // D-pad (actif seulement en mode 'play')
  setupDpad(player, () => getSpeed(), () => mode === 'play');

  // Start button
  const startBtn = document.getElementById('startBtn');
  if (startBtn) startBtn.addEventListener('click', startGame);

  // Première question
  if (QUEST.length) ui.showAsk(t.ask?.(poiInfo(QUEST[0].key)) || `Où est ${poiInfo(QUEST[0].key)} ?`);

  // ---------- helpers ----------
  function setEnergy(p){
    energy = Math.max(0, Math.min(ENERGY.MAX, p|0));
    ui.updateEnergy((energy / ENERGY.MAX) * 100);
  }
  function getSpeed(){
    const slowFactor = (playerSlowTimer > 0) ? 0.45 : 1.0;
    return PLAYER_BASE.speed * slowFactor;
  }
  function spawnEnemy(now){
    if (enemies.length >= ENEMY_CONFIG.MAX_ON_SCREEN) return;
    const type = (Math.random() < 0.5) ? ENEMY.JELLY : ENEMY.CROW;
    const x = Math.random()*0.9 + 0.05;
    const y = Math.random()*0.9 + 0.05;
    const dir = Math.random() * Math.PI * 2;
    const speed = ENEMY_CONFIG.SPEED[type];
    enemies.push({ type, x, y, vx:Math.cos(dir)*speed, vy:Math.sin(dir)*speed, t:0, bornAt:now, state:'normal', fleeUntil:0 });
  }
  function spawnBonus(){
    bonuses.push({ x:Math.random()*0.9+0.05, y:Math.random()*0.9+0.05, life:BONUS_CONFIG.LIFETIME_S, age:0, pulse:0 });
  }

  function finalizeRun({won}) {
    if (finalized) return;
    finalized = true;

    const total = score + (won ? SCORE.WIN : SCORE.GAMEOVER);

    const entry = {
      name: playerName || 'Joueur',
      country,
      score: total,
      stars: starsPicked,
      bonuses: bonusesPicked,
      hits,
      time: performance.now() - gameStartAt,
      date: new Date().toISOString(),
      won: !!won,
    };
    const hof = addToHof(entry);

    const title = won ? (t.win?.() || "Bravo ! Victoire 🌟") : (t.gameover?.() || "Game Over");
    const lines = [
      `${title}`,
      `Score: ${total} (Étoiles: +${starsPicked*SCORE.STAR}, Bonus: +${bonusesPicked*SCORE.BONUS}, Coups: ${hits*SCORE.HIT}, ${won?`Win: +${SCORE.WIN}`:`Fin: +${SCORE.GAMEOVER}`})`,
      `Temps: ${fmtTime(entry.time)}`,
      ``,
      `Hall of Fame :`,
      leaderboardText(hof),
      ``,
      `👉 <a href="#hof" id="__open_hof__" style="color:#ffe06b">Voir le Hall of Fame</a>`
    ];
    ui.showSuccess(lines.join('\n'));
    ui.showReplay(true);

    // activer le lien
    setTimeout(()=>{
      document.getElementById('__open_hof__')?.addEventListener('click', (e)=>{ e.preventDefault(); openHofPanel(); });
    }, 0);
  }

  // ---------- Game loop ----------
  function draw(ts){
    if(!running) return;

    if(ts){
      if(!lastTS) lastTS = ts;
      const dt = Math.min(0.05, (ts - lastTS)/1000);
      lastTS = ts;

      if (mode === 'play') {
        tickEnemies(dt);
        if (hitShake > 0)       hitShake = Math.max(0, hitShake - dt * SHAKE.DECAY_PER_S);
        if (playerSlowTimer > 0) playerSlowTimer = Math.max(0, playerSlowTimer - dt);
      } else if (mode === 'win') {
        tickWin(dt);
      }
    }

    // viewport + fond
    const mw = mapImg.naturalWidth || 1920;
    const mh = mapImg.naturalHeight || 1080;
    const { ox, oy, dw, dh } = computeMapViewport(W, H, mw, mh);

    ctx.clearRect(0,0,W,H);
    if (mapImg.complete && mapImg.naturalWidth){
      ctx.drawImage(mapImg, ox, oy, dw, dh);
    } else {
      ctx.fillStyle = '#bfe2f8'; ctx.fillRect(ox, oy, dw || W, dh || (H - UI_CONST.TOP - UI_CONST.BOTTOM));
      ctx.fillStyle = '#0e2b4a'; ctx.font = '14px system-ui';
      ctx.fillText(t.mapNotLoaded?.(ASSETS.MAP_URL) || `Map not loaded: ${ASSETS.MAP_URL}`, (ox||14), (oy||24));
    }

    // POIs
    for(const p of POIS){
      const x = ox + p.x*dw, y = oy + p.y*dh;
      if(collected.has(p.key)){
        drawStarfish(ctx, x, y-20, Math.max(14, Math.min(22, Math.min(W, H)*0.028)));
      } else {
        ctx.save();
        ctx.strokeStyle = '#b04123'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x-6,y-6); ctx.lineTo(x+6,y+6);
        ctx.moveTo(x-6,y+6); ctx.lineTo(x+6,y-6);
        ctx.stroke();
        ctx.restore();
      }
    }

    // joueur (px)
    const bw = Math.min(160, Math.max(90, dw * player.size || 90));
    const bx = ox + player.x*dw;
    const by = oy + player.y*dh;

    if (mode === 'play') {
      const { collided, picked } = handleCollisions({ bx, by, ox, oy, dw, dh });
      if (collided) setEnergy(energy - 18);
      if (picked)   setEnergy(energy + 14);
      const dead = energy <= 0;
      if (dead) { return triggerGameOver(); }
    }

    if (mode === 'play') {
      drawBonuses(ctx, bonuses, { ox, oy, dw, dh });
      drawEnemies(ctx, enemies, { ox, oy, dw, dh }, { crowImg, jellyImg });
    }

    let sx=0, sy=0;
    if (mode === 'play' && hitShake > 0){
      const a = Math.min(1, hitShake / SHAKE.MAX_S);
      const mag = 6 * a;
      sx = (Math.random()*2-1)*mag;
      sy = (Math.random()*2-1)*mag;
    }

    if (mode === 'play') {
      if (birdImg.complete && birdImg.naturalWidth){
        ctx.drawImage(birdImg, bx - bw/2 + sx, by - bw/2 + sy, bw, bw);
      }else{
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(bx + sx, by + sy, bw*0.35, 0, Math.PI*2); ctx.fill();
      }
    }

    // progression
    if (mode === 'play' && currentIdx < QUEST.length){
      const p = QUEST[currentIdx];
      const px = ox + p.x*dw, py = oy + p.y*dh;
      const onTarget = Math.hypot(bx - px, by - py) < 44;
      if(onTarget){
        collected.add(p.key);
        ui.updateScore(collected.size, STARS_TARGET);
        ui.renderStars(collected.size, STARS_TARGET);
        starEmphasis();
        const nameShort = poiName(p.key);
        ui.showSuccess(t.success?.(nameShort) || `Bravo : ${nameShort} !`);

        score += SCORE.STAR;
        starsPicked++;

        currentIdx++;
        if (currentIdx === QUEST.length){
          triggerWin();
        } else {
          setTimeout(()=> ui.showAsk(t.ask?.(poiInfo(QUEST[currentIdx].key)) || ''), 900);
        }
      }
    }

    if (mode === 'win') {
      renderWin(ctx, {ox, oy, dw, dh}, { birdImg, spiderImg }, winFx);
    }

    requestAnimationFrame(draw);
  }

  // ---------- ticks ----------
  function tickEnemies(dt){
    const now = performance.now();
    if (now > enemySpawnAt){
      if (enemies.length < ENEMY_CONFIG.MAX_ON_SCREEN) spawnEnemy(now);
      enemySpawnAt = now + ENEMY_CONFIG.BASE_SPAWN_MS + Math.random()*ENEMY_CONFIG.SPAWN_JITTER_MS;
    }
    if (now > bonusSpawnAt){
      spawnBonus();
      bonusSpawnAt = now + BONUS_CONFIG.BASE_SPAWN_MS + Math.random()*BONUS_CONFIG.SPAWN_JITTER_MS;
    }
    enemies = enemies.filter(e => (now - (e.bornAt || now)) < ENEMY_CONFIG.LIFETIME_S*1000);
    const PAD = 0.02;
    for (const e of enemies){
      e.t += dt;
      if (e.state === 'flee'){
        if (now >= e.fleeUntil) e._remove = true;
        else { e.vx*=0.995; e.vy*=0.995; }
      } else if (e.type === ENEMY.JELLY){
        e.vx += Math.sin(e.t*1.7)*0.0008;
        e.vy += Math.cos(e.t*1.3)*0.0008;
      }
      e.x += e.vx*dt; e.y += e.vy*dt;
      if (e.x < PAD || e.x > 1-PAD){ e.vx*=-1; e.x = Math.max(PAD, Math.min(1-PAD, e.x)); }
      if (e.y < PAD || e.y > 1-PAD){ e.vy*=-1; e.y = Math.max(PAD, Math.min(1-PAD, e.y)); }
    }
    enemies = enemies.filter(e => !e._remove);

    for (let i=bonuses.length-1;i>=0;i--){
      const b = bonuses[i];
      b.age += dt; b.pulse += dt;
      if (b.age > b.life) bonuses.splice(i,1);
    }
  }

  function tickWin(dt){
    winFx.t += dt;
    winFx.fwTimer -= dt;
    if (winFx.fwTimer <= 0){
      spawnFirework(winFx.fw);
      winFx.fwTimer = 0.7 + Math.random()*0.7;
    }
    for (let i=winFx.fw.length-1;i>=0;i--){
      const p = winFx.fw[i];
      p.vx *= 0.98; p.vy = p.vy*0.98 + 18*dt;
      p.x += p.vx*dt; p.y += p.vy*dt;
      p.life -= dt;
      if (p.life <= 0) winFx.fw.splice(i,1);
    }
  }

  // ---------- collisions ----------
  function handleCollisions({ bx, by, ox, oy, dw, dh }){
    let collided=false, picked=false;
    const now = performance.now();
    for (const e of enemies){
      if (e.state === 'flee') continue;
      const ex = ox + e.x*dw, ey = oy + e.y*dh;
      if (Math.hypot(bx-ex, by-ey) < ENEMY_CONFIG.COLLIDE_RADIUS_PX){
        collided = true;
        failSfx();
        playerSlowTimer = Math.max(playerSlowTimer, 1.25);
        hitShake = Math.min(SHAKE.MAX_S, hitShake + SHAKE.HIT_ADD);
        const away = Math.atan2((ey - by), (ex - bx));
        e.vx = Math.cos(away) * ENEMY_CONFIG.FLEE.SPEED;
        e.vy = Math.sin(away) * ENEMY_CONFIG.FLEE.SPEED;
        e.state='flee';
        e.fleeUntil = now + ENEMY_CONFIG.FLEE.DURATION_MS_MIN + Math.random()*ENEMY_CONFIG.FLEE.DURATION_MS_RAND;

        score += SCORE.HIT;
        hits++;
      }
    }
    for (let i=bonuses.length-1;i>=0;i--){
      const b = bonuses[i];
      const bpx = ox + b.x*dw, bpy = oy + b.y*dh;
      if (Math.hypot(bx-bpx, by-bpy) < BONUS_CONFIG.PICK_RADIUS_PX){
        picked = true;
        ping(880, 0.35);
        playerSlowTimer = 0;
        hitShake = Math.min(SHAKE.MAX_S, hitShake + SHAKE.BONUS_ADD);
        bonuses.splice(i,1);

        score += SCORE.BONUS;
        bonusesPicked++;
      }
    }
    return { collided, picked };
  }

  // ---------- modes ----------
  function triggerWin(){
    mode = 'win';
    finalizeRun({won:true});
    winFx.t = 0; winFx.fw.length = 0; winFx.fwTimer = 0;
  }

  function triggerGameOver(){
    mode = 'dead';
    running = false;
    finalizeRun({won:false});
  }

  // ---------- controls ----------
  function startGame(){
    try{
      // demander le nom à CHAQUE session
      playerName = prompt("Ton nom/pseudo ?") || "Joueur";
      country = getCountry();

      ui.hideOverlay();
      ui.showTouch(true);
      if (!isMusicOn()) startMusic();
      ui.setMusicLabel(isMusicOn());
      resetGame();
      gameStartAt = performance.now();
      mode = 'play';
      if (!running){ running = true; requestAnimationFrame(draw); }
    }catch(e){
      alert('Chargement du jeu impossible : ' + (e?.message || e));
    }
  }

  function resetGame(){
    collected = new Set();
    QUEST = shuffle(POIS);
    currentIdx = 0;

    scoreReset();

    player.x = PLAYER_BASE.x; player.y = PLAYER_BASE.y;
    setEnergy(ENERGY.START);

    enemies.length = 0; bonuses.length = 0;
    enemySpawnAt = performance.now() + 800;
    bonusSpawnAt = performance.now() + 1400;
    playerSlowTimer = 0; hitShake = 0;

    ui.updateScore(0, STARS_TARGET);
    ui.renderStars(0, STARS_TARGET);
    resetAudioForNewGame();

    if (QUEST.length) ui.showAsk(t.ask?.(poiInfo(QUEST[0].key)) || '');
  }

  // route hash #hof -> ouvrir directement le panel
  window.addEventListener('hashchange', ()=>{
    if (location.hash === '#hof') openHofPanel();
  });
  if (location.hash === '#hof') openHofPanel();
}

// ------------------------
// Rendu utilitaires
// ------------------------
function drawStarfish(ctx, cx, cy, R){
  ctx.save(); ctx.shadowColor='rgba(0,0,0,.2)'; ctx.shadowBlur=6; ctx.shadowOffsetY=3;
  ctx.beginPath(); const pts=5, inner=R*0.45;
  for(let i=0;i<pts*2;i++){
    const ang=(Math.PI/pts)*i - Math.PI/2;
    const r=(i%2===0)?R:inner;
    const x=cx+Math.cos(ang)*r, y=cy+Math.sin(ang)*r;
    if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath(); ctx.fillStyle='#d26f45'; ctx.strokeStyle='#8c3f28'; ctx.lineWidth=3; ctx.fill(); ctx.stroke(); ctx.restore();
}
function drawEnemies(ctx, enemies, bounds, sprites){
  const { ox, oy, dw, dh } = bounds;
  const { crowImg, jellyImg } = sprites;
  const SIZE = 42;
  const now = performance.now();
  for (const e of enemies){
    const x = ox + e.x*dw, y = oy + e.y*dh;
    ctx.save();
    if (e.state === 'flee'){
      const remain = Math.max(0, (e.fleeUntil - now) / 700);
      ctx.globalAlpha = Math.max(0.12, Math.min(1, remain));
    }
    if (e.type === 'jelly'){
      if (jellyImg.complete && jellyImg.naturalWidth){
        ctx.drawImage(jellyImg, x - SIZE/2, y - SIZE/2, SIZE, SIZE);
      } else {
        ctx.fillStyle='rgba(123,200,255,0.85)';
        ctx.beginPath(); ctx.arc(x,y,18,Math.PI,0); ctx.fill();
        ctx.fillRect(x-18,y,36,8);
        for(let i=0;i<5;i++){
          ctx.beginPath();
          ctx.moveTo(x-14+i*7, y+8);
          ctx.quadraticCurveTo(x-14+i*7, y+22+(i%2?6:-4), x-14+i*7, y+32);
          ctx.strokeStyle='rgba(80,150,220,0.9)'; ctx.lineWidth=2; ctx.stroke();
        }
      }
    } else { // crow
      const ang = Math.atan2(e.vy, e.vx);
      ctx.translate(x,y); ctx.rotate(ang);
      if (crowImg.complete && crowImg.naturalWidth){
        ctx.drawImage(crowImg, -SIZE/2, -SIZE/2, SIZE, SIZE);
      } else {
        ctx.fillStyle='#242424';
        ctx.beginPath(); ctx.moveTo(-20,0); ctx.lineTo(10,-8); ctx.lineTo(10,8); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-6,0,10,6,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#ffd400'; ctx.fillRect(10,-2,6,4);
      }
    }
    ctx.restore();
  }
}
function drawBonuses(ctx, bonuses, bounds){
  const { ox, oy, dw, dh } = bounds;
  for (const b of bonuses){
    const x = ox + b.x*dw, y = oy + b.y*dh;
    const r = 10 + Math.sin(b.pulse*6)*2;
    ctx.save();
    ctx.globalAlpha = 0.9 * (1 - b.age / b.life);
    ctx.fillStyle = '#ffe06b'; ctx.strokeStyle = '#8c6a1a'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i=0;i<5;i++){
      const a = i*2*Math.PI/5 - Math.PI/2;
      const xi=x+Math.cos(a)*r, yi=y+Math.sin(a)*r;
      if(i===0) ctx.moveTo(xi,yi); else ctx.lineTo(xi,yi);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

// --------- Win scene rendering + FX ----------
function renderWin(ctx, view, sprites, winFx){
  const { ox, oy, dw, dh } = view;
  const { birdImg, spiderImg } = sprites;
  const cx = ox + dw/2;
  const cy = oy + dh/2;

  // Duo au centre (zoom + légère rotation "danse")
  const t = winFx.t;
  const base = Math.min(dw, dh) * 0.36; // 2× plus gros
  const s = 0.9 + 0.08*Math.sin(t*4);
  const rot = 0.08*Math.sin(t*3.2);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  const w = base*s;
  if (birdImg.complete && birdImg.naturalWidth) {
    ctx.drawImage(birdImg, -w-14, -w, w, w);
  } else {
    ctx.fillStyle='#333'; ctx.beginPath(); ctx.arc(-w*0.5-10, 0, w*0.35, 0, Math.PI*2); ctx.fill();
  }
  if (spiderImg.complete && spiderImg.naturalWidth) {
    ctx.drawImage(spiderImg, 14, -w, w, w);
  } else {
    ctx.fillStyle='#b04123'; ctx.beginPath(); ctx.arc(w*0.5+10, 0, w*0.35, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();

  // Feux d’artifice
  for (const p of winFx.fw){
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.life0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

function spawnFirework(store){
  const COLORS = ['#ffd166','#ef476f','#06d6a0','#118ab2','#f78c6b'];
  const cx = (Math.random()*0.5 + 0.25) * (window.innerWidth  || 800);
  const cy = (Math.random()*0.4 + 0.20) * (window.innerHeight || 600);
  const n = 36 + (Math.random()*24)|0;
  const col = COLORS[(Math.random()*COLORS.length)|0];
  for (let i=0;i<n;i++){
    const a = (i/n)*Math.PI*2;
    const sp = 90 + Math.random()*160;
    store.push({
      x: cx, y: cy,
      vx: Math.cos(a)*sp, vy: Math.sin(a)*sp,
      r: 2 + Math.random()*2,
      color: col,
      life: 0.9 + Math.random()*0.8,
      life0: 1.7
    });
  }
}

// ------------------------
// Utils
// ------------------------
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

/**
 * D-pad tactile/souris. Ne bouge que si canMove() === true
 */
function setupDpad(player, getSpeed, canMove){
  document.querySelectorAll('.btn').forEach((el) => {
    const dx = parseFloat(el.dataset.dx);
    const dy = parseFloat(el.dataset.dy);
    let press = false, rafId = null;

    const step = () => {
      if (!press) return;
      if (!canMove || !canMove()) { press = false; cancelAnimationFrame(rafId); return; }
      const s = getSpeed();
      player.x = Math.max(0, Math.min(1, player.x + dx * s));
      player.y = Math.max(0, Math.min(1, player.y + dy * s));
      rafId = requestAnimationFrame(step);
    };

    el.addEventListener('touchstart', (e) => { press = true; step(); e.preventDefault(); }, { passive:false });
    el.addEventListener('touchend',   () => { press = false; cancelAnimationFrame(rafId); });
    el.addEventListener('mousedown',  (e) => { press = true; step(); e.preventDefault(); });
    window.addEventListener('mouseup',() => { if (press){ press = false; cancelAnimationFrame(rafId); }});
  });
}
