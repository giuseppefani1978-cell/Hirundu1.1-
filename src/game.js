import { copy } from './ui/copy.js';
import { createLevelSession, setupHuntControls } from './legacy/levelSession.js';
// src/game.js
// =====================================================
// CHASSE UNIQUEMENT + LANCEMENT DE battle_intro
// (aucune dépendance vers battle.js)
// =====================================================
import { t, poiName, poiInfo } from './i18n.js';
import { withBase } from './paths';
import {
  startMusic, stopMusic, toggleMusic, isMusicOn, createAudioOnce, stopFinaleLoop,
  ping, starEmphasis, failSfx, resetAudioForNewGame, playFinaleLong
} from './audio.js';
import * as ui from './ui.js';
import { startBattleIntro } from './battle_intro.js';
import { addHallOfFameEntry, getHallOfFameBonusUrl } from './hof/storage.js';
import { prepareLevelIntro, queueLevelTransition } from './level_transition.js';

const DEBUG = false;
function dbg(...a){ if (DEBUG) console.log('[GAME]', ...a); }

// ------------------------
// Config
// ------------------------
const APP_VERSION = (window.APP_VERSION || 'v2025-08-20-g');
const APP_Q = `?v=${APP_VERSION}`;
const asset = (p) => `${withBase(p)}${APP_Q}`;

const LS = {
  OTRANTO_BONUS_UNLOCKED: 'otranto_bonus_unlocked',
  OTRANTO_BONUS_SEEN:     'otranto_bonus_seen',
};
const lsGet = (k, d=null) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ⚠️ Les noms doivent correspondre exactement aux fichiers dans /assets
const ASSETS = {
  MAP_URL:       asset('assets/salento-map.PNG'),
  BIRD_URL:      asset('assets/aracne .PNG'),
  TARANTULA_URL: asset('assets/tarantula .PNG'),
  CROW_URL:      asset('assets/crow.PNG'),
  JELLY_URL:     asset('assets/jellyfish.PNG'),
  BONUS_PASTICCIOTTO: asset('assets/bonus-pasticciotto.PNG'),
  BONUS_RUSTICO: asset('assets/rustico.PNG'),
  BONUS_CAFFE:   asset('assets/caffeleccese .PNG'),
};

// UI carte
const UI_CONST = { TOP: 120, BOTTOM: 160, MAP_ZOOM: 1.30 };

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
// Données chasse
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

const PLAYER_BASE = { x:0.55, y:0.25, speed:0.0048, size:0.08 };
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
const BONUS = { PASTICCIOTTO: 'pasticciotto', RUSTICO: 'rustico', CAFFE: 'caffe' };
const BONUS_TYPES = {
  PASTICCIOTTO: { key:'pasticciotto', score: 20, heal: 15, prob: 0.5 },
  RUSTICO:      { key:'rustico',      score: 40, heal: 25, prob: 0.35 },
  CAFFE:        { key:'caffe',        score: 70, heal: 40, prob: 0.15 }
};
const SHAKE = { MAX_S:2.4, DECAY_PER_S:1.0, HIT_ADD:0.6, BONUS_ADD:0.2 };
const SCORE = { STAR: 100, BONUS: 20, HIT: -30, WIN: 200, GAMEOVER: 0 };

// ----- HOF utilitaires -----
function fmtTime(ms){
  const s = Math.max(0, Math.round(ms/1000));
  const m = Math.floor(s/60), r = s%60;
  return `${m}m${String(r).padStart(2,'0')}s`;
}
function getStoredPlayerName(){
  const stored = lsGet('player_name', null);
  if (typeof stored === 'string' && stored.trim()) {
    return stored.trim();
  }
  if (stored && typeof stored === 'object' && 'name' in stored) {
    const potential = String(stored.name).trim();
    if (potential) {
      return potential;
    }
  }
  try {
    const raw = localStorage.getItem('player_name');
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim();
    }
  } catch {}
  return '';
}
function getCountry(){
  try{
    const lang = navigator.language || (Intl.DateTimeFormat().resolvedOptions().locale);
    const region = (lang && lang.includes('-')) ? lang.split('-')[1] : null;
    if (!region) return { code:'??', flag:'🏳️', label:'??' };
    const flag = region.replace(/./g, c => String.fromCodePoint(127397 + c.toUpperCase().charCodeAt()));
    return { code:region, flag, label:region };
  }catch{ return { code:'??', flag:'🏳️', label:'??' }; }
}

// ------------------------
// BOOT (chasse uniquement)
// ------------------------
export function boot(){
  const canvas = document.getElementById('c');
  if (!canvas){ alert("Chargement du jeu impossible : canvas introuvable (#c)."); return; }
  const ctx = canvas.getContext('2d', { alpha:true });
  const session = createLevelSession();
  let cleanupIntro = null;
  const requestAnimationFrame = session.frame;
  const setTimeout = session.timeout;

  // UI init
  ui.initUI();
  ui.updateScore(0, STARS_TARGET);
  ui.renderStars(0, STARS_TARGET);
  ui.updateEnergy(100);
  ui.onClickMusic(async () => { await toggleMusic(); ui.setMusicLabel(isMusicOn()); });
  ui.setMusicLabel(false);
  ui.onClickReplay(() => startGame());

  // Déplacer le bouton Rejouer sous le score live
  const replayBtn = document.getElementById('replayFloat');
  if (replayBtn){
    replayBtn.style.position = 'fixed';
    replayBtn.style.top = 'auto';
    replayBtn.style.right = '8px';
    replayBtn.style.left = 'auto';
    replayBtn.style.bottom = '16px';
    replayBtn.style.zIndex = '10001';
  }

  // Score live (top-right)
  ensureScoreLive();

  // Si le bonus Otranto est débloqué, montrer un lien rapide HUD
  ensureBonusQuickLinkInHud();

  // Images
  const mapImg   = new Image();
  const birdImg  = new Image();
  const spiderImg= new Image();
  const crowImg  = new Image();
  const jellyImg = new Image();
  const imgPasticciotto = new Image();
  const imgRustico      = new Image();
  const imgCaffe        = new Image();

  imgPasticciotto.src = ASSETS.BONUS_PASTICCIOTTO;
  imgRustico.src      = ASSETS.BONUS_RUSTICO;
  imgCaffe.src        = ASSETS.BONUS_CAFFE;

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

  prepareLevelIntro({
    level: 1, theme: 'otranto', badge: `${copy.level} 1`,
    title: t.title, subtitle: t.subtitle, description: copy.mission,
    footnote: copy.reward, startLabel: `▶︎ ${copy.start}`,
    highlight: { title: copy.briefing, body: copy.mission },
    accentColor: '#f97316',
  });

  // Charge assets
  mapImg.src    = ASSETS.MAP_URL;
  birdImg.src   = ASSETS.BIRD_URL;
  spiderImg.src = ASSETS.TARANTULA_URL;
  crowImg.src   = ASSETS.CROW_URL;
  jellyImg.src  = ASSETS.JELLY_URL;

  // ===== Canvas sizing (mobile robuste) =====
  let W = 0, H = 0, dpr = 1;

  function resizeCanvasHard() {
    try {
      window.scrollTo(0,0);
      requestAnimationFrame(()=>window.scrollTo(0,0));
    } catch {}
  }
  function resize(){
    const vp = window.visualViewport;
    W = Math.round(vp?.width  || window.innerWidth  || document.documentElement.clientWidth  || 360);
    H = Math.round(vp?.height || window.innerHeight || document.documentElement.clientHeight || 640);

    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width  = Math.max(1, Math.floor(W * dpr));
    canvas.height = Math.max(1, Math.floor(H * dpr));
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // 1er resize
  resize();

  session.listen(window, 'resize', resize, { passive:true });
  if (window.visualViewport) {
    session.listen(window.visualViewport, 'resize', () => { resize(); resizeCanvasHard(); }, { passive:true });
  }
  session.listen(window, 'orientationchange', () => {
    setTimeout(resize, 60);
    setTimeout(() => { resize(); resizeCanvasHard(); }, 220);
  }, { passive:true });

  // ------- Game state (chasse) -------
  // modes: 'splash' | 'play' | 'battle_intro' | 'win' | 'dead'
  let mode = 'splash';
  let running = false;
  let lastTS = 0;
  let collected = new Set();
  let QUEST = shuffle(POIS);
  let currentIdx = 0;

  // timers/questions
  let askTimer = 0;
  function askQuestionAt(idx){
    if (idx >= 0 && idx < QUEST.length) {
      const key = QUEST[idx].key;
      ui.showAsk(t.ask?.(poiInfo(key)) || `Où est ${poiInfo(key)} ?`);
    }
  }
  function queueNextAsk(delayMs = 1200){
    if (askTimer) { clearTimeout(askTimer); askTimer = 0; }
    askTimer = setTimeout(() => {
      if (mode === 'play' && currentIdx < QUEST.length) askQuestionAt(currentIdx);
    }, delayMs);
  }

  const player = { x: PLAYER_BASE.x, y: PLAYER_BASE.y, speed: PLAYER_BASE.speed, size: PLAYER_BASE.size };
  let energy = ENERGY.START;

  let enemies = [];
  let bonuses = [];
  let enemySpawnAt = performance.now() + 800;
  let bonusSpawnAt = performance.now() + 1400;

  let playerSlowTimer = 0;
  let hitShake = 0;

  // anti double-collecte
  let collectLockUntil = 0;

  // SCORE runtime
  let score = 0;
  let hits = 0;
  let bonusesPicked = 0;
  let bonusScore = 0;
  let starsPicked = 0;
  let pickedCounts = { pasticciotto: 0, rustico: 0, caffe: 0 };
  let gameStartAt = 0;
  let finalized = false;
  let playerName = null;
  let country = getCountry();

  function scoreReset(){
    score = 0; hits = 0; bonusesPicked = 0; bonusScore = 0; starsPicked = 0;
    pickedCounts = { pasticciotto: 0, rustico: 0, caffe: 0 };
    gameStartAt = performance.now();
    finalized = false;
    collectLockUntil = 0;
    updateScoreLive();
  }

  // Win animation state
  const winFx = { t:0, fw:[], fwTimer:0 };

  // ----- A button visibility state -----
  let padAEl = null;
  function setPadAVisible(v){
    if (!padAEl) return;
    padAEl.style.display = v ? '' : 'none';
  }
  function updatePadAVisibilityForMode(){
    // visible en 'play' et 'win', caché pendant 'battle_intro'/'battle' et 'dead'
    setPadAVisible(mode === 'play' || mode === 'win');
  }

  // D-pad (actif seulement en mode 'play')
  const movePlayer = setupHuntControls(player, getSpeed, () => mode === 'play', session);
  
  // Start button
  const startBtn = document.getElementById('startBtn');
  if (startBtn) session.listen(startBtn, 'click', startGame);

  // Première question
  askQuestionAt(0);

  // helpers
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
    const r = Math.random();
    let type = BONUS_TYPES.PASTICCIOTTO;
    if (r < BONUS_TYPES.PASTICCIOTTO.prob) type = BONUS_TYPES.PASTICCIOTTO;
    else if (r < BONUS_TYPES.PASTICCIOTTO.prob + BONUS_TYPES.RUSTICO.prob) type = BONUS_TYPES.RUSTICO;
    else type = BONUS_TYPES.CAFFE;

    bonuses.push({
      type: type.key,
      score: type.score,
      heal: type.heal,
      x: Math.random()*0.9+0.05,
      y: Math.random()*0.9+0.05,
      life: BONUS_CONFIG.LIFETIME_S,
      age: 0,
      pulse: 0
    });
  }
  function bonusLabel(b){
    const name =
      (b.type === 'caffe') ? 'Caffè Leccese' :
      (b.type === 'rustico') ? 'Rustico' : 'Pasticciotto';
    return `+${b.score} ${name}  (+${b.heal} NRJ)`;
  }

  function finalizeRun({won}) {
    if (finalized) return;
    finalized = true;

    const total = score + (won ? SCORE.WIN : SCORE.GAMEOVER);

    const entry = {
      name: playerName || copy.player,
      country,
      score: total,
      stars: starsPicked,
      bonuses: bonusesPicked,
      hits,
      time: performance.now() - gameStartAt,
      date: new Date().toISOString(),
      won: !!won,
      bonusScore,
      bonusBreakdown: { ...pickedCounts }
    };
    addHallOfFameEntry(entry);

    const title = won ? (t.win?.() || "Bravo ! Victoire 🌟") : (t.gameover?.() || "Game Over");
    const baseLines = [
      `${title}`,
      `Score: ${total} (Étoiles: +${starsPicked*SCORE.STAR}, Bonus: +${bonusScore}, Coups: ${hits*SCORE.HIT}${won?`, Win: +${SCORE.WIN}`:''})`,
      `Bonus: ${pickedCounts.pasticciotto||0} Pasticciotto · ${pickedCounts.rustico||0} Rustico · ${pickedCounts.caffe||0} Caffè`,
      `Temps: ${fmtTime(entry.time)}`,
      ``,
      `👉 Consulte le Hall of Fame depuis la page Bonus.`
    ];
    ui.showSuccess(baseLines.join('\n'));
    ui.showReplay(true);

    if (won) {
      queueLevelTransition({
        targetLevel: 2,
        theme: 'gallipoli',
        badge: 'Niveau 2',
        subtitle: 'Nouveau terrain de jeu : Gallipoli',
        description: 'Traverse la côte ionienne et récolte les 10 soleils pour continuer l\'aventure.',
        highlight: {
          title: 'Transition',
          body: 'Carte BONUS disponible après la chasse.',
        },
        footnote: 'Victoire = BONUS + accès Niveau 2',
        startLabel: '▶︎ Explorer Gallipoli',
        accentColor: '#facc15',
      });
      // Message clair pour la victoire + indication bonus
      const winExtra = `🌟 BONUS débloqué — utilise le bouton ci-dessous pour l'ouvrir.`;
      ui.showSuccess([...baseLines, winExtra].join('\n'));
      // débloque le bonus dans le LS
      console.log('[GAME] finalizeRun: won=true — unlocking Otranto bonus');
      unlockOtrantoBonus();

      // Dispatch retardé pour que le modal HUD ait le temps d'être créé
      setTimeout(() => {
        try {
          console.log('[GAME] finalizeRun: dispatching otranto:unlocked (delayed)');
          document.dispatchEvent(new Event('otranto:unlocked'));
        } catch (e) { console.error('[GAME] finalizeRun delayed dispatch error', e); }
      }, 360); // 300-500 ms selon perf, ajuste si nécessaire

      // Essai immédiat d'affichage local (s'il fonctionne)
      try { showBonusCta(); } catch (e) { console.error('[GAME] showBonusCta error', e); }
      ui.showReplay(true);
    } else {
      ui.showSuccess(baseLines.join('\n'));
      ui.showReplay(true);
    }
  }

  // ---------- Game loop (chasse) ----------
  function draw(ts){
    if(!running || !session.active) return;
    if (document.hidden) { lastTS = 0; requestAnimationFrame(draw); return; }

    if(ts){
      if(!lastTS) lastTS = ts;
      const dt = Math.min(0.05, (ts - lastTS)/1000);
      lastTS = ts;

      if (mode === 'play') {
        movePlayer(dt);
        tickEnemies(dt);
        if (hitShake > 0)       hitShake = Math.max(0, hitShake - dt * SHAKE.DECAY_PER_S);
        if (playerSlowTimer > 0) playerSlowTimer = Math.max(0, playerSlowTimer - dt);
      } else if (mode === 'win') {
        tickWin(dt);
      }
    }

    // viewport + fond carte
    const mw = mapImg.naturalWidth || 1920;
    const mh = mapImg.naturalHeight || 1080;
    const { ox, oy, dw, dh } = computeMapViewport(W, H, mw, mh);

    const ctx2 = canvas.getContext('2d');
    ctx2.clearRect(0,0,W,H);

    // Fond carte
    if (mapImg.complete && mapImg.naturalWidth){
      ctx2.drawImage(mapImg, ox, oy, dw, dh);
    } else {
      ctx2.fillStyle = '#bfe2f8';
      ctx2.fillRect(ox, oy, dw || W, dh || (H - UI_CONST.TOP - UI_CONST.BOTTOM));
      ctx2.fillStyle = '#0e2b4a'; ctx2.font = '14px system-ui';
      ctx2.fillText(t.mapNotLoaded?.(ASSETS.MAP_URL) || `Map not loaded: ${ASSETS.MAP_URL}`, (ox||14), (oy||24));
    }

    // POIs
    for (const p of POIS){
      const x = ox + p.x*dw, y = oy + p.y*dh;
      if (collected.has(p.key)){
        drawStarfish(ctx2, x, y-20, Math.max(14, Math.min(22, Math.min(W, H)*0.028)));
      } else {
        ctx2.save();
        ctx2.strokeStyle = '#b04123'; ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.moveTo(x-6,y-6); ctx2.lineTo(x+6,y+6);
        ctx2.moveTo(x-6,y+6); ctx2.lineTo(x+6,y-6);
        ctx2.stroke();
        ctx2.restore();
      }
    }

    // joueur + collisions + ennemis/bonus (mode play)
    const playerScale = typeof player.size === 'number' ? player.size : PLAYER_BASE.size;
    const bw = Math.min(120, Math.max(60, dw * playerScale));
    const bx = ox + player.x*dw;
    const by = oy + player.y*dh;

    if (mode === 'play') {
      const { collided } = handleCollisions({ bx, by, ox, oy, dw, dh });
      if (collided) setEnergy(energy - 18);
      if (energy <= 0) { return triggerGameOver(); }

      drawBonuses(ctx2, bonuses, { ox, oy, dw, dh }, { imgPasticciotto, imgRustico, imgCaffe });
      drawEnemies(ctx2, enemies, { ox, oy, dw, dh }, { crowImg, jellyImg });
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
        ctx2.drawImage(birdImg, bx - bw/2 + sx, by - bw/2 + sy, bw, bw);
      } else {
        ctx2.fillStyle = '#333';
        ctx2.beginPath(); ctx2.arc(bx + sx, by + sy, bw*0.35, 0, Math.PI*2); ctx2.fill();
      }
    }

    // progression vers prochaine étoile
    if (mode === 'play' && currentIdx < QUEST.length){
      const now = performance.now();
      if (now >= collectLockUntil){
        const p = QUEST[currentIdx];
        const px = ox + p.x*dw, py = oy + p.y*dh;
        const onTarget = Math.hypot(bx - px, by - py) < 44;
        if (onTarget){
          collectLockUntil = now + 900;
          collected.add(p.key);
          ui.updateScore(collected.size, STARS_TARGET);
          ui.renderStars(collected.size, STARS_TARGET);
          starEmphasis();
          ui.showEphemeralLabel(px, py - 28, poiName(p.key), { color: 'rgba(255,255,255,0.7)', durationMs: 950, dy: -30 });
          score += SCORE.STAR; starsPicked++; updateScoreLive();

          const nameShort = poiName(p.key);
          ui.showSuccess(t.success?.(nameShort) || `Bravo : ${nameShort} !`);

          currentIdx++;
          if (currentIdx === QUEST.length){
            // Transition vers l’intro de la bataille
            enterBattleFlow();
          } else {
            queueNextAsk(1200);
          }
        }
      }
    }

    if (mode === 'win') {
      renderWin(ctx2, {ox, oy, dw, dh}, { birdImg, spiderImg }, winFx);
    }

    requestAnimationFrame(draw);
  }

  // ---------- Battle flow (handoff only) ----------
  function enterBattleFlow(){
    mode = 'battle_intro';
    ui.showTouch(false);
    updatePadAVisibilityForMode(); // cache pendant intro/battle

    if (askTimer) { clearTimeout(askTimer); askTimer = 0; }

    // Petit tip dans la bulle, puis intro
    try {
      const bdText  = document.getElementById('bdText');
      const bdTitle = document.getElementById('bdTitle');
      const tar     = document.getElementById('tarTop');
      if (bdText && bdTitle && tar) {
        bdTitle.textContent = 'Tarantula';
        bdText.textContent  = 'Conseil: en bataille, ←/→ pour bouger, ↑ pour sauter, A attaquer, B spécial. Tourne en paysage.';
        tar.classList.add('show');
        setTimeout(()=> tar.classList.remove('show'), 2200);
      }
    } catch {}

cleanupIntro = startBattleIntro({
  ammo: {
    pasticciotto: pickedCounts.pasticciotto | 0,
    rustico:      pickedCounts.rustico      | 0,
    caffe:        pickedCounts.caffe        | 0,
    stars:        starsPicked               | 0,
  },
  onProceed: async () => {
    if (!session.active) return;
    // anti double-clic
    if (window.__battleBooting) return;
    window.__battleBooting = true;

    try {
      // figer la chasse et passer en mode battle
      running = false;
      mode = 'battle';
      ui.showTouch(false);
      updatePadAVisibilityForMode();
      document.body.classList.add('mode-battle');

      // import unique
      const mod = await import('./game_battle.js');
      const { startBattleFlow } = mod;
      if (typeof startBattleFlow !== 'function') {
        throw new Error('startBattleFlow non exporté par ./game_battle.js');
      }

      if (!session.active) return;
    await startBattleFlow(
        {
          pasticciotto: pickedCounts.pasticciotto | 0,
          rustico:      pickedCounts.rustico      | 0,
          caffe:        pickedCounts.caffe        | 0,
          stars:        starsPicked               | 0,
          backdrop:     'otranto',
          boss:         'sputacchina',
        },
        {
          bottomExtra: 0,
          onWin: () => {
          if (!session.active) return;
            document.body.classList.remove('mode-battle');
            mode = 'win';
            updatePadAVisibilityForMode();
            running = true;
            requestAnimationFrame(draw);
            try { triggerWin(); } catch {}
          },
          onLose: () => {
          if (!session.active) return;
            document.body.classList.remove('mode-battle');
            mode = 'dead';
            updatePadAVisibilityForMode();
            running = false;
            try { triggerGameOver(); } catch {}
          },
        }
      );
    } catch (err) {
      console.error('[battle L1] boot failed:', err);
      // rollback doux sans alert bloquante
      document.body.classList.remove('mode-battle');
      mode = 'play';
      updatePadAVisibilityForMode();
      running = true;
      requestAnimationFrame(draw);
      ui.showSuccess('⚠️ La bataille n’a pas pu être chargée. Retour à la carte.');
    } finally {
      window.__battleBooting = false;
    }
  }
});

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
    let collided=false;
    const now = performance.now();

    // Ennemis
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

        score += SCORE.HIT; hits++; updateScoreLive();
      }
    }

    // Bonus
    for (let i = bonuses.length - 1; i >= 0; i--) {
      const b = bonuses[i];
      const bpx = ox + b.x * dw, bpy = oy + b.y * dh;

      if (Math.hypot(bx - bpx, by - bpy) < BONUS_CONFIG.PICK_RADIUS_PX) {
        playerSlowTimer = 0;
        hitShake = Math.min(SHAKE.MAX_S, hitShake + SHAKE.BONUS_ADD);

        score += b.score; bonusScore += b.score; bonusesPicked++;
        setEnergy(energy + b.heal);

        ui.showEphemeralLabel(bpx, bpy - 24, bonusLabel(b), {
          color: 'transparent', durationMs: 1000, dy: -28
        });

        pickedCounts[b.type] = (pickedCounts[b.type] || 0) + 1;
        const hz = (b.type === 'caffe') ? 980 : (b.type === 'rustico' ? 880 : 780);
        ping(hz, 0.35);

        bonuses.splice(i, 1);
        updateScoreLive();
      }
    }
    return { collided };
  }

  // ---------- modes ----------
  function triggerWin(){
    mode = 'win';
    updatePadAVisibilityForMode();
    finalizeRun({won:true});
    stopMusic();
    playFinaleLong();
    winFx.t = 0; winFx.fw.length = 0; winFx.fwTimer = 0;
   // 🟢 Nouvelle logique : handoff vers la page Bonus (ou transition)
  setTimeout(() => {
    try {
      // Si le bonus Otranto est débloqué, on ouvre la page bonus
      if (localStorage.getItem('otranto_bonus_unlocked') === 'true') {
        console.log('[GAME] triggerWin → ouverture bonus Otranto');
        location.hash = '#bonus-otranto';
      } else {
        // sinon, simple transition vers la page d’intro du niveau suivant
        console.log('[GAME] triggerWin → transition vers niveau 2');
        location.hash = '#/transition';
      }
    } catch (e) {
      console.warn('[GAME] triggerWin navigation error', e);
    }
  }, 800); // délai d’une seconde pour laisser l’écran Win s’afficher
}
  function triggerGameOver(){
    mode = 'dead';
    running = false;
    updatePadAVisibilityForMode();
    finalizeRun({won:false});
  }

  // ---------- controls ----------
  function startGame(){
    createAudioOnce();
    try{
      document.body.classList.remove('mode-battle'); // sécurité si on relance après une battle
      const storedName = playerName && playerName.trim() ? playerName : getStoredPlayerName();
      if (storedName) {
        playerName = storedName.trim();
        if (playerName !== storedName) {
          try { localStorage.setItem('player_name', playerName); } catch {}
          try { lsSet && lsSet('player_name', playerName); } catch {}
        }
      } else {
        const response = prompt(copy.name) || copy.player;
        playerName = (response||'').trim() || copy.player;
        try { localStorage.setItem('player_name', playerName); } catch {}
        try { lsSet && lsSet('player_name', playerName); } catch {}
      }
      country = getCountry();


      ui.hideOverlay();
      ui.showTouch(true);
      if (!isMusicOn()) void startMusic().then(() => { if (session.active) ui.setMusicLabel(isMusicOn()); });
      ui.setMusicLabel(isMusicOn());
      resetGame();
      gameStartAt = performance.now();
      mode = 'play';
      updatePadAVisibilityForMode(); // montre pendant la chasse
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

    if (askTimer) { clearTimeout(askTimer); askTimer = 0; }
    askQuestionAt(0);
  }

  // hash → actions : #hof | #unlock-otranto | #bonus-otranto
  const handleHash = () => {
    if (location.hash === '#hof') {
      try {
        window.location.assign(getHallOfFameBonusUrl());
      } catch (error) {
        console.warn('[GAME] redirection vers le Hall of Fame impossible', error);
      }
      return;
    }
    if (location.hash === '#unlock-otranto'){
      unlockOtrantoBonus();
      document.dispatchEvent(new Event('otranto:unlocked'));
      ensureBonusQuickLinkInHud();
      ui.showSuccess('✅ BONUS Otranto débloqué.');
      return;
    }
    if (location.hash === '#bonus-otranto'){
      if (!lsGet(LS.OTRANTO_BONUS_UNLOCKED, false)){
        unlockOtrantoBonus();
        document.dispatchEvent(new Event('otranto:unlocked'));
      }
      openBonusMap();
    }
  };
  session.listen(window, 'hashchange', handleHash);
  handleHash();

  // helpers UI
  function ensureScoreLive(){
    let el = document.getElementById('__score_live');
    if (!el){
      el = document.createElement('div');
      el.id='__score_live';
      el.style.cssText = `
        position:fixed; top:8px; right:8px; z-index:10002;
        background:linear-gradient(180deg, rgba(255,240,200,.95), rgba(255,226,160,.95));
        color:#8a2a0a; border:1px solid #b08a3c; box-shadow:0 4px 10px rgba(0,0,0,.15);
        padding:6px 10px; border-radius:10px; font:700 18px/1.1 "Courier New", ui-monospace, monospace;
        text-shadow:0 1px 0 #fff, 0 0 8px rgba(255,200,0,.6);
      `;
      el.textContent = '000000';
      document.body.appendChild(el);
    }
    return el;
  }
  function updateScoreLive(){
    const el = document.getElementById('__score_live');
    if (el) el.textContent = String(Math.max(0, score)).padStart(6,'0');
  }
  function ensureBonusQuickLinkInHud(){
    const hud = document.getElementById('hud');
    if (!hud) return;
    if (!lsGet(LS.OTRANTO_BONUS_UNLOCKED, false)) return;
    let link = document.getElementById('__otranto_bonus_link');
    if (!link){
      link = document.createElement('button');
      link.id='__otranto_bonus_link';
      link.type='button';
      link.textContent = '🗺️ BONUS';
      link.style.cssText = `
        margin-top:8px; width:100%;
        background:#0ea5e9; color:#fff; border:0; border-radius:10px; padding:8px 10px;
        font:700 12px system-ui; cursor:pointer;
      `;
      hud.appendChild(link);
      session.listen(link, 'click', openBonusMap);
    }
  }

  function showBonusCta(){
    // évite de spam si déjà affichée
    if (document.getElementById('__bonus_cta')) return;

    const btn = document.createElement('button');
    btn.id = '__bonus_cta';
    btn.type = 'button';
    btn.textContent = '🌟 BONUS — ouvrir';
    btn.style.cssText = `
      position:fixed; left:50%; transform:translateX(-50%);
      bottom:86px; z-index:10003;
      background:linear-gradient(180deg, #34d399, #10b981);
      color:white; border:0; border-radius:999px;
      padding:12px 18px; font:700 14px system-ui; box-shadow:0 8px 18px rgba(0,0,0,.2);
    `;
    document.body.appendChild(btn);
    session.listen(btn, 'click', () => {
      lsSet(LS.OTRANTO_BONUS_SEEN, true);
      openBonusMap();
    });

    // Ajoute en HUD pour les sessions suivantes
    ensureBonusQuickLinkInHud();
  }

  function unlockOtrantoBonus(){
    if (!lsGet(LS.OTRANTO_BONUS_UNLOCKED, false)){
      lsSet(LS.OTRANTO_BONUS_UNLOCKED, true);
      document.dispatchEvent(new Event('otranto:unlocked'));
      ensureBonusQuickLinkInHud();
    }
  }

  function openBonusMap(){
    // base = dossier courant (…/), qu’on concatène avec index.html
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    location.assign(`${base}index.html?embed=1#/poi/otranto/realmap`);
  }


  function isPlayerOnPoiKey(key){
    const p = POIS.find(p=>p.key===key);
    if (!p) return false;
    // Rayon en coordonnées normalisées de la carte
    const R = 0.035;
    return Math.hypot(player.x - p.x, player.y - p.y) < R;
  }
  return () => {
    running = false;
    session.dispose();
    cleanupIntro?.();
    stopMusic();
    stopFinaleLoop();
    ui.onClickMusic(null);
    ui.onClickReplay(null);
  };
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
function drawBonuses(ctx, bonuses, bounds, images){
  const { ox, oy, dw, dh } = bounds;
  const { imgPasticciotto, imgRustico, imgCaffe } = images;

  for (const b of bonuses){
    const x = ox + b.x*dw, y = oy + b.y*dh;
    ctx.save();
    ctx.globalAlpha = 0.9 * (1 - b.age / b.life);

    let img = null;
    if (b.type === 'pasticciotto') img = imgPasticciotto;
    else if (b.type === 'rustico')  img = imgRustico;
    else if (b.type === 'caffe')    img = imgCaffe;

    if (img && img.complete && img.naturalWidth){
      const size = 42;
      ctx.drawImage(img, x - size/2, y - size/2, size, size);
    } else {
      ctx.fillStyle = '#ffe06b';
      ctx.beginPath(); ctx.arc(x,y,14,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

// --------- Win scene rendering + FX ----------
function renderWin(ctx, view, sprites, winFx){
  const { ox, oy, dw, dh } = view;
  const { birdImg, spiderImg } = sprites;
  const cx = ox + dw/2;
  const cy = oy + dh/2;

  const t = winFx.t;
  const base = Math.min(dw, dh) * 0.36;
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


// =====================================================
// DEBUG HELPERS (optionnel pendant le dev)
// =====================================================
window.__unlockOtranto = () => {
  try {
    localStorage.setItem('otranto_bonus_unlocked', 'true');
    document.dispatchEvent(new Event('otranto:unlocked'));
    console.log('✅ Bonus Otranto débloqué manuellement');
  } catch {}
};
window.__openBonusMap = () => {
  location.assign('index.html#/poi/otranto/realmap');
  console.log('🗺️ BONUS ouvert');
};
