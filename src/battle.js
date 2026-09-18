// src/battle.js
// ---------------------------------------------------------
// Mini-jeu "Bataille de Otranto" — paysage + pads tactiles
// Exporte: setupBattleInputs, setBattleCallbacks, setBattleAmmo,
//          startBattle, tickBattle, renderBattle, isBattleActive
// ---------------------------------------------------------
import { copy } from './ui/copy.js';
import { LANG } from './i18n.js';
const battleWords = {
 fr: {attack:'Attaque',special:'Spécial',ready:'PRÊT…',go:'PARTEZ !',dive:'Plongée',dodge:'Esquive',perfect:'ESQUIVE PARFAITE',high:'ATTAQUE HAUTE',low:'ATTAQUE BASSE',aim:'VISÉE',left:'Gauche',right:'Droite',flap:'Battement d’ailes',end:'Fin de la partie',watch:'Attention !',counter:'Maintenant ! Riposte !',hurt:'Touché ! Reprends de l’altitude.',phase:'Le gardien accélère !',strike:'Bien joué !'},
 it: {attack:'Attacco',special:'Speciale',ready:'PRONTI…',go:'VIA!',dive:'Picchiata',dodge:'Schivata',perfect:'SCHIVATA PERFETTA',high:'ATTACCO ALTO',low:'ATTACCO BASSO',aim:'MIRA',left:'Sinistra',right:'Destra',flap:'Battito d’ali',end:'Fine della partita',watch:'Attenzione!',counter:'Ora! Contrattacca!',hurt:'Colpito! Riprendi quota.',phase:'Il guardiano accelera!',strike:'Ben fatto!'},
 en: {attack:'Attack',special:'Special',ready:'READY…',go:'GO!',dive:'Dive',dodge:'Dodge',perfect:'PERFECT DODGE',high:'HIGH ATTACK',low:'LOW ATTACK',aim:'AIM',left:'Left',right:'Right',flap:'Wingbeat',end:'End of battle',watch:'Watch out!',counter:'Now! Counterattack!',hurt:'Hit! Gain altitude.',phase:'The guardian speeds up!',strike:'Nice hit!'},
 es: {attack:'Ataque',special:'Especial',ready:'PREPARADOS…',go:'¡YA!',dive:'Picado',dodge:'Esquiva',perfect:'ESQUIVA PERFECTA',high:'ATAQUE ALTO',low:'ATAQUE BAJO',aim:'APUNTA',left:'Izquierda',right:'Derecha',flap:'Aleteo',end:'Fin de la partida',watch:'¡Atención!',counter:'¡Ahora! ¡Contraataca!',hurt:'¡Golpe! Recupera altura.',phase:'¡El guardián acelera!',strike:'¡Buen golpe!'},
}[LANG] || {attack:'Attack',special:'Special',ready:'READY…',go:'GO!',dive:'Dive',dodge:'Dodge',perfect:'PERFECT DODGE',high:'HIGH ATTACK',low:'LOW ATTACK',aim:'AIM',left:'Left',right:'Right',flap:'Wingbeat',end:'End of battle',watch:'Watch out!',counter:'Now! Counterattack!',hurt:'Hit! Gain altitude.',phase:'The guardian speeds up!',strike:'Nice hit!'};
import { withBase } from './utils/basePath.js';
import { markLevelWin } from './bonus_maps.js';
import { FLOW_PHASES, PAUSE_EVENT, isGamePaused, setGameFlowPhase } from './game_flow.js';

const BTL = {
  FLOOR_H: 0,
  GRAV: 1200,
  SPEED: 300,
  JUMP_VY: -620,
  PLAYER_GRAV: 760,
  FLAP_VY: -560,
  DIVE_VY: 620,
  FLAP_COOLDOWN_MS: 180,
  H_RESPONSE: 8.5,
  H_RELEASE: 5.5,
  V_RESPONSE: 8,
  FLIGHT_ASSIST_MS: 210,
  DODGE_RESPONSE: 18,
  BOSS_SAFE_X: 150,
  BOSS_HARD_X: 88,
  BOSS_SAFE_ALT: -150,
  BOSS_REPEL_SPEED: 250,
  DIVE_NEAR_BOSS_MAX: 360,
  DODGE_SPEED: 820,
  DODGE_MS: 220,
  DODGE_COOLDOWN_MS: 900,
  DODGE_INVULN_MS: 270,
  PERFECT_DODGE_R: 76,
  TELEGRAPH_MS: 620,
  PLAYER_HP: 120,
  FOE_HP: 200,
  SHOT: 760,
  FOE_SHOT: 520,

  // Entrée de l’ennemi
  FOE_ENTRY_DELAY_MS: 1200,
  FOE_ENTRY_SPEED: 260,
  FOE_TARGET_MARGIN_X: 100,

  // Ennemi agressif
  FOE_FIRE_MS_MIN: 1200,
  FOE_FIRE_MS_MAX: 2000,
  FOE_BURST_COUNT: 2,
  FOE_BURST_GAP_MS: 120,

  // Zap
  FOE_ZAP_SPEED: 640,
  FOE_ZAP_DMG: 14,
  FOE_ZAP_TAIL: 38,

  // Sauts
  FOE_JUMP_VY: -520,
  FOE_JUMP_COOLDOWN_MS: 900,
  FOE_JUMP_DIST: 320,
  FOE_JUMP_PROB: 0.5,

  // Collisions & feedback
  HIT_R: 28,
  START_GRACE_MS: 1000,
  COUNTDOWN_MS: 900,
  GO_FLASH_MS: 500,

  HIT_SHAKE_MAX_S: 0.5,
  HIT_SHAKE_DECAY_PER_S: 1.8,
  HIT_SLOW_FACTOR: 0.45,
  HIT_SLOW_MS: 450,

  // --- Sputacchina (boss Lecce)
  SPORE_SPEED: 380,
  SPORE_DMG: 12,
  SPORE_LIFE_S: 1.8,
  SPORE_BURST: 3,
  SPORE_BURST_GAP_MS: 120,
  SPORE_SLOW_FACTOR: 0.55,
  SPORE_SLOW_MS: 700,
};

let state = {
  // phases: 'play' (jeu), 'end' (écran de fin animé)
  phase: 'play',
  victory: null,
  victoryDance: false,
  active: false,
  foeType: 'jelly',
  foeShotKind: 'zap', // 'zap' (par défaut) ou 'spore' pour Sputacchina
  w: 960, h: 540,

  player: { x: 160, y: 0, vx: 0, vy: 0, hp: BTL.PLAYER_HP, onGround: false, facing: 1 },
  foe:    { x: 760, y: 0, vx: 0, vy: 0, hp: BTL.FOE_HP, fireAt: Infinity, onGround:false },

  initialAmmo: {},
  shots: [],
  ammo: { pasticciotto:0, rustico:0, caffe:0, stars:0 },

  input: { left:false, right:false, up:false, down:false, dodge:false, atk:false, spc:false },

  onWin: ()=>{}, onLose: ()=>{},

  startAt: 0,
  goAt: 0,
  graceUntil: 0,
  foeFireBlockUntil: 0,
  foeJumpReadyAt: 0,
  foeWanderUntil: 0,
  foeDir: -1,
  foeEntryUntil: 0,
  foeDeath: null,
  ending: null,
  skyline: null,

  // feedback
  shakeT: 0,
  slowUntil: 0,
  flapReadyAt: 0,
  dodgeUntil: 0,
  dodgeCooldownUntil: 0,
  invulnerableUntil: 0,
  dodgeDir: 1,
  telegraph: null,
  patternIndex: 0,
  feedbackText: '',
  feedbackUntil: 0,
  phaseAnnounced: false,
  foeMaxHp: BTL.FOE_HP,
  combo: 0,
  comboUntil: 0,
  chirpReadyAt: 0,
  verticalAssistUntil: 0,
  verticalTargetVy: 0,
  renderTilt: 0,
  lastRenderAt: 0,

  // FX fin de partie
  fx: { fireworks: [] },

  // audio
  musicBattle: null,
  musicVictory: null,

  // UI
  ui: { root:null, move:null, ab:null, rotateOverlay:null, endOverlay:null }
};

// ---------------------------------------------------------
// Helpers — unlock registry + legacy flags + navigation
// ---------------------------------------------------------
function __writeUnifiedUnlock(key){
  try {
    const K = 'bonus_unlocked_v1';
    let obj;
    try { obj = JSON.parse(localStorage.getItem(K)) || {}; }
    catch { obj = {}; }
    if (!obj[key]) {
      obj[key] = true;
      localStorage.setItem(K, JSON.stringify(obj));
    }
  } catch {}
}

const REGIONAL_BOSSES = {
  macina: {level:7,key:'nardo',name:'Macina',token:'🫒',hp:380,damage:22,fireMin:850,fireMax:1400},
  argillo: {level:8,key:'messapia',name:'Argillo',token:'🏺',hp:420,damage:24,fireMin:800,fireMax:1350},
  calcara: {level:9,key:'itria',name:'Calcara',token:'💎',hp:460,damage:26,fireMin:750,fireMax:1300},
};

function __persistUnlocksForFoe(foeType){
  try {
    // legacy umbrella bit (kept if some code still checks it)
    localStorage.setItem('bonus_unlocked', '1');

    if (REGIONAL_BOSSES[foeType]) {
      const boss=REGIONAL_BOSSES[foeType];
      __writeUnifiedUnlock(boss.key);
      markLevelWin(boss.level);
      localStorage.setItem('__toast_next__',boss.key);
    } else if (foeType === 'resino') {
      __writeUnifiedUnlock('arneo');
      markLevelWin(6);
      localStorage.setItem('__toast_next__', 'arneo');
    } else if (foeType === 'scirocco') {
      __writeUnifiedUnlock('capo');
      try { markLevelWin?.(5); } catch {}
      localStorage.setItem('__toast_next__', 'capo');
    } else if (foeType === 'nacra') {
      __writeUnifiedUnlock('adriatico');
      try { markLevelWin?.(4); } catch {}
      localStorage.setItem('__toast_next__', 'adriatico');
    } else if (foeType === 'jelly') {
      // Otranto (L1)
      localStorage.setItem('bonus_otranto_unlocked', '1');
      __writeUnifiedUnlock('otranto');
      // progression
      try { markLevelWin?.(1); } catch {}
      localStorage.setItem('__toast_next__', 'otranto');
    } else if (foeType === 'crow') {
      // Gallipoli (L2)
      localStorage.setItem('bonus_gallipoli_unlocked', '1');
      __writeUnifiedUnlock('gallipoli');
      // historic L2 gating kept for compatibility
      localStorage.setItem('level2_unlocked', 'true');
      localStorage.setItem('level2_unlocked_at', String(Date.now()));
      localStorage.setItem('level3_unlocked', 'true');
      // progression
      try { markLevelWin?.(2); } catch {}
      localStorage.setItem('__toast_next__', 'gallipoli');
    } else if (foeType === 'sputacchina') {
      // Lecce (L3)
      localStorage.setItem('bonus_lecce_unlocked', '1');
      __writeUnifiedUnlock('lecce');
      localStorage.setItem('level3_unlocked', 'true');
      // progression
      try { markLevelWin?.(3); } catch {}
      localStorage.setItem('__toast_next__', 'lecce');
    }

    window.dispatchEvent(new CustomEvent('bonus:unlock', { detail:{ foe: foeType }}));
  } catch(e){ console.error(e); }
}

function _onBattlePause(event){
  const paused = !!event?.detail?.paused;
  try {
    if (paused) state.musicBattle?.pause();
    else if (state.active) state.musicBattle?.play().catch(()=>{});
  } catch {}
}

export function disposeBattle() {
  state.active = false;
  _stopBattleTheme();
  _stopVictoryMusic();
  window.removeEventListener('keydown', _onKeyDown, true);
  window.removeEventListener('keyup', _onKeyUp, true);
  window.removeEventListener('orientationchange', _updateRotateOverlay);
  window.removeEventListener('resize', _updateRotateOverlay);
  window.removeEventListener(PAUSE_EVENT, _onBattlePause);
  state.input = { left:false, right:false, up:false, down:false, dodge:false, atk:false, spc:false };
  if (state.ui.root) state.ui.root.style.display = 'none';
}

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
  window.removeEventListener(PAUSE_EVENT, _onBattlePause);
  window.addEventListener(PAUSE_EVENT, _onBattlePause);
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
  state.initialAmmo = { ...state.ammo };
}

export function startBattle(foeType='jelly'){
  if (state.active) return;
  setGameFlowPhase(FLOW_PHASES.BATTLE, { boss: foeType });
  state.shots.length = 0;
  for (const key of Object.keys(state.input)) state.input[key] = false;
  state.ammo = { ...state.initialAmmo };
  state.phase = 'play';
  state.victory = null;
  state.fx.fireworks.length = 0;

  state.active = true;
  state.foeType = foeType;
  state.victoryDance = false;
  state.flapReadyAt = 0;
  state.dodgeUntil = 0;
  state.dodgeCooldownUntil = 0;
  state.invulnerableUntil = 0;
  state.dodgeDir = 1;
  state.telegraph = null;
  state.patternIndex = 0;
  state.feedbackText = '';
  state.feedbackUntil = 0;
  state.phaseAnnounced = false;
  state.combo = 0;
  state.comboUntil = 0;
  state.chirpReadyAt = 0;
  state.verticalAssistUntil = 0;
  state.verticalTargetVy = 0;
  state.renderTilt = 0;
  state.lastRenderAt = 0;
  // configure tir selon le boss
  state.foeShotKind = (foeType === 'sputacchina') ? 'spore' : 'zap';

  // joueur
  state.player = { x: 160, y: 0, vx: 0, vy: 0, hp: BTL.PLAYER_HP, onGround: false, facing: 1 };

  // ennemi : hors-écran à droite
  state.foe = {
    x: state.w + 160, y: 0, vx: 0, vy: 0,
    hp: REGIONAL_BOSSES[foeType]?.hp ?? (foeType === 'resino' ? 340 : foeType === 'scirocco' ? 300 : foeType === 'nacra' ? 260 : BTL.FOE_HP), fireAt: Infinity, onGround: false
  };
  state.foeMaxHp = state.foe.hp;
  state.foeDir = -1;
  state.foeWanderUntil = performance.now() + 700;

  const now = performance.now();
  state.startAt = now;
  state.goAt = now + BTL.COUNTDOWN_MS;
  state.graceUntil = state.goAt + BTL.GO_FLASH_MS + BTL.START_GRACE_MS;

  // Entrée + verrous pendant l’entrée
  state.foeEntryUntil      = state.goAt + BTL.FOE_ENTRY_DELAY_MS;
  state.foeFireBlockUntil  = state.foeEntryUntil + 300;
  state.foeJumpReadyAt     = state.foeEntryUntil + 500;
  state.foe.fireAt         = state.foeEntryUntil + 600;

  if (!state.skyline) state.skyline = _makeSkyline(12);
  state.foeDeath = null;
  state.ending   = null;

  _stopVictoryMusic();   // si on revenait d’une win précédente
  if (window.__STOP_BG_MUSIC) { try { window.__STOP_BG_MUSIC(); } catch {} }
  _playBattleTheme();

  // UI
  _ensureBattleUI(true);
  if (state.ui.endOverlay) state.ui.endOverlay.style.display = 'none';
  if (state.ui.move) state.ui.move.style.display = 'flex';
  if (state.ui.ab)   state.ui.ab.style.display   = 'flex';

  _maybeLockLandscape();
  _updateRotateOverlay();

  setTimeout(()=>window.dispatchEvent(new Event('resize')), 100);
  setTimeout(()=>window.dispatchEvent(new Event('resize')), 350);
}

export function isBattleActive(){ return state.active; }

// ---------------------------------------------------------
// Ticks
// ---------------------------------------------------------
export function tickBattle(dt){
  if((REGIONAL_BOSSES[state.foeType] || ['nacra','scirocco','resino'].includes(state.foeType)) && (document.hidden || !_isLandscape())) return;
  // même si la battle est finie, on continue certains FX
  if (!state.active){
    if (state.ending?.mode === 'win') _tickFireworks(dt);
    if (state.foeDeath && !state.foeDeath.done) _tickFoeDeath(dt);
    if (state.phase === 'end' && state.victory) {
      // petite animation "victoire" possible ici
    }
    return;
  }

  // clamp dt
  dt = Math.min(0.05, Math.max(0.001, dt));

  const now = performance.now();
  const readyPhase = now < state.goAt;
  const inGrace    = now < state.graceUntil;

  // Décroissance du shake
  if (state.shakeT > 0) {
    state.shakeT = Math.max(0, state.shakeT - dt * BTL.HIT_SHAKE_DECAY_PER_S);
  }

  // Hirundu reste en vol; le boss conserve sa physique existante.
  _applyPhysics(state.player, dt, true);
  _applyPhysics(state.foe, dt, false);

  // ----------------------------------------------------------------
  // GAMEPLAY — uniquement pendant 'play'
  // ----------------------------------------------------------------
  if (state.phase === 'play') {
    // Contrôles joueur (bloqués pendant READY…)
    const slowMul = (now < state.slowUntil) ? BTL.HIT_SLOW_FACTOR : 1;

    if (!readyPhase){
      if (_consume('dodge') && now >= state.dodgeCooldownUntil) _startDodge(now);
      if (now < state.dodgeUntil) {
        const dodgeTargetVx = BTL.DODGE_SPEED * state.dodgeDir * slowMul;
        const dodgeBlend = 1 - Math.exp(-BTL.DODGE_RESPONSE * dt);
        state.player.vx += (dodgeTargetVx - state.player.vx) * dodgeBlend;
      } else {
        const horizontalInput = (state.input.right ? 1 : 0) - (state.input.left ? 1 : 0);
        if (horizontalInput) state.player.facing = horizontalInput;
        const targetVx = horizontalInput * BTL.SPEED * slowMul;
        const response = horizontalInput ? BTL.H_RESPONSE : BTL.H_RELEASE;
        const blend = 1 - Math.exp(-response * dt);
        state.player.vx += (targetVx - state.player.vx) * blend;
        if (!horizontalInput && Math.abs(state.player.vx) < 2) state.player.vx = 0;
      }
      if (_consume('up') && now >= state.flapReadyAt){
        state.verticalTargetVy = Math.max(-620, Math.min(-430, state.player.vy - 220));
        state.verticalAssistUntil = now + BTL.FLIGHT_ASSIST_MS;
        state.player.onGround = false;
        state.flapReadyAt = now + BTL.FLAP_COOLDOWN_MS;
        if (now >= state.chirpReadyAt) {
          try { window.__HIRUNDU_CHIRP?.('soft'); } catch {}
          state.chirpReadyAt = now + 950;
        }
      }
      if (_consume('down')){
        const nearBoss = Math.abs(state.player.x - state.foe.x) < BTL.BOSS_SAFE_X && state.player.y > BTL.BOSS_SAFE_ALT;
        const diveMax = nearBoss ? BTL.DIVE_NEAR_BOSS_MAX : BTL.DIVE_VY;
        state.verticalTargetVy = diveMax;
        state.verticalAssistUntil = now + BTL.FLIGHT_ASSIST_MS;
        state.feedbackText = '↓ ' + battleWords.dive;
        state.feedbackUntil = now + 420;
      }
      if (now < state.verticalAssistUntil) {
        const vBlend = 1 - Math.exp(-BTL.V_RESPONSE * dt);
        state.player.vy += (state.verticalTargetVy - state.player.vy) * vBlend;
      }
    } else {
      state.input.up = false;
      state.input.down = false;
      state.input.dodge = false;
      state.input.atk = false;
      state.input.spc = false;
    }
    if (state.combo > 0 && now >= state.comboUntil) state.combo = 0;

    // Déplacement horizontal + zone de respiration autour du boss à basse altitude.
    state.player.x = Math.max(60, Math.min(state.w - 110, state.player.x + state.player.vx * dt));
    if (state.player.y > BTL.BOSS_SAFE_ALT) {
      const bossDx = state.player.x - state.foe.x;
      const absDx = Math.abs(bossDx);
      if (absDx < BTL.BOSS_SAFE_X) {
        const away = bossDx === 0 ? -1 : Math.sign(bossDx);
        const proximity = 1 - absDx / BTL.BOSS_SAFE_X;
        state.player.x += away * BTL.BOSS_REPEL_SPEED * proximity * proximity * dt;
        if (state.player.vy > BTL.DIVE_NEAR_BOSS_MAX) {
          const soften = 1 - Math.exp(-7 * dt);
          state.player.vy += (BTL.DIVE_NEAR_BOSS_MAX - state.player.vy) * soften;
        }
        if (absDx < BTL.BOSS_HARD_X && state.player.y > -110) {
          const safeX = state.foe.x + away * BTL.BOSS_HARD_X;
          const safetyBlend = 1 - Math.exp(-9 * dt);
          state.player.x += (safeX - state.player.x) * safetyBlend;
        }
        state.player.x = Math.max(60, Math.min(state.w - 110, state.player.x));
      }
    }

    // Attaques joueur
    if (!readyPhase){
      if (_consume('atk')) _fireNormal();
      if (_consume('spc')) _fireSpecial();
    }

    // IA ENNEMI
    if (!readyPhase){
      const targetX = state.w - BTL.FOE_TARGET_MARGIN_X;
      if (now < state.foeEntryUntil) {
        state.foe.vx = -BTL.FOE_ENTRY_SPEED;
        state.foe.x  = Math.max(targetX, state.foe.x + state.foe.vx * dt);
      } else {
        const dist = state.foe.x - state.player.x;

        // Patrouille aléatoire
        const minX = Math.max(60, state.w - 260);
        const maxX = state.w - 60;
        const SPEED = 160;

        if (performance.now() >= state.foeWanderUntil) {
          const toward = (state.foe.x > state.player.x) ? -1 : 1;
          const r = Math.random();
          state.foeDir = (r < 0.10) ? 0 : (r < 0.55 ? toward : (Math.random() < 0.5 ? -1 : 1));
          state.foeWanderUntil = performance.now() + (500 + Math.random()*900);
        }

        state.foe.vx = SPEED * state.foeDir;
        state.foe.x += state.foe.vx * dt;

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
            state.foeJumpReadyAt = now + 180;
          }
        }

        // Trois patterns lisibles : haut, bas, puis visée directe.
        if (state.telegraph && now >= state.telegraph.fireAt) {
          _executeFoePattern(state.telegraph.pattern);
          state.feedbackText = battleWords.counter;
          state.feedbackUntil = now + 650;
          state.telegraph = null;
        }
        if (!state.telegraph && now >= state.foe.fireAt && now >= state.foeFireBlockUntil) {
          const pattern = ['high','low','aim'][state.patternIndex % 3];
          state.patternIndex += 1;
          state.telegraph = { pattern, fireAt: now + BTL.TELEGRAPH_MS, until: now + BTL.TELEGRAPH_MS };
          const attackLabel = pattern === 'high' ? battleWords.high : pattern === 'low' ? battleWords.low : battleWords.aim;
          state.feedbackText = '⚠ ' + battleWords.watch + ' ' + attackLabel;
          state.feedbackUntil = now + BTL.TELEGRAPH_MS;
          const profile=REGIONAL_BOSSES[state.foeType];
          const cooldown = profile ? _rnd(profile.fireMin,profile.fireMax) : state.foeType==='resino' ? _rnd(900,1450) : state.foeType==='scirocco' ? _rnd(950,1550) : state.foeType==='nacra' ? _rnd(1050,1750) : _rnd(BTL.FOE_FIRE_MS_MIN, BTL.FOE_FIRE_MS_MAX);
          state.foe.fireAt = state.telegraph.fireAt + cooldown;
        }
      }
    }

    // Projectiles (déplacement + collisions + durée de vie)
    for (let i = state.shots.length - 1; i >= 0; i--) {
      const s = state.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life != null) s.life -= dt;

      if (!inGrace){
        if (s.from === 'player'){
          const dx = s.x - state.foe.x, dy = s.y - state.foe.y;
          if (dx*dx + dy*dy <= BTL.HIT_R*BTL.HIT_R){
            state.foe.hp = Math.max(0, state.foe.hp - s.dmg);
            state.feedbackText = battleWords.strike;
            state.feedbackUntil = now + 360;
            state.shots.splice(i,1);
            continue;
          }
        } else {
          const dx = s.x - state.player.x, dy = s.y - state.player.y;
          const d2 = dx*dx + dy*dy;
          if (now < state.invulnerableUntil && d2 <= BTL.PERFECT_DODGE_R*BTL.PERFECT_DODGE_R){
            _awardPerfectDodge(now);
            state.shots.splice(i,1);
            continue;
          }
          if (d2 <= BTL.HIT_R*BTL.HIT_R){
            state.player.hp = Math.max(0, state.player.hp - s.dmg);
            state.shakeT   = Math.min(BTL.HIT_SHAKE_MAX_S, state.shakeT + 0.35);
            state.slowUntil = now + (s.kind === 'spore' ? (BTL.SPORE_SLOW_MS || BTL.HIT_SLOW_MS) : BTL.HIT_SLOW_MS);
            state.feedbackText = battleWords.hurt;
            state.feedbackUntil = now + 780;
            state.combo = 0;
            state.shots.splice(i,1);
            continue;
          }
        }
      }

      const out  = (s.x < -80 || s.x > state.w + 80);
      const dead = (s.life != null && s.life <= 0);
      if (out || dead) state.shots.splice(i,1);
    }

    if (!state.phaseAnnounced && state.foeMaxHp > 0 && state.foe.hp > 0 && state.foe.hp <= state.foeMaxHp * 0.5) {
      state.phaseAnnounced = true;
      state.feedbackText = battleWords.phase;
      state.feedbackUntil = now + 1200;
    }

    // Fin de manche
    if (now >= state.graceUntil){
      if (state.foe.hp    <= 0) _endBattle(true);
      if (state.player.hp <= 0) _endBattle(false);
    }
  }

  // ---------------------------------------------------------
  // Effets d'écran de fin — phase 'end' (victoire)
  // ---------------------------------------------------------
  if (state.phase === 'end' && state.victory) {
    if (Math.random() < 0.03) _spawnFireworks(1);
    _tickFireworks(dt);
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
  const renderNow = performance.now();
  const renderDt = state.lastRenderAt ? Math.min(0.05, Math.max(0.001, (renderNow - state.lastRenderAt) / 1000)) : 1/60;
  state.lastRenderAt = renderNow;

  // Shake hit
  if (state.shakeT > 0) {
    const a = Math.min(1, state.shakeT / BTL.HIT_SHAKE_MAX_S);
    const mag = 6 * a;
    const sx = (Math.random()*2 - 1) * mag;
    const sy = (Math.random()*2 - 1) * mag;
    ctx.translate(sx, sy);
  }

  // Fond
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
  if (BTL.FLOOR_H > 0) {
    ctx.fillStyle = '#223d33';
    ctx.fillRect(0, h - BTL.FLOOR_H, w, BTL.FLOOR_H);
  }

  // Personnages
  // V9.7: Hirundu is ~20% larger; boss dimensions remain unchanged.
  const P_W = 116, P_H = 130;
  const playerBaseline = h - BTL.FLOOR_H + state.player.y;
  const foeBaseline = h - BTL.FLOOR_H + state.foe.y;
  const pY = playerBaseline - P_H;

  // Joueur : inclinaison lissée + respiration/battement d’ailes simulé.
  const dodgeActive = renderNow < state.dodgeUntil;
  const targetTilt = dodgeActive ? 0.08 * state.dodgeDir : Math.max(-0.34, Math.min(0.46, state.player.vy / 1250));
  state.renderTilt += (targetTilt - state.renderTilt) * (1 - Math.exp(-7 * renderDt));
  const tilt = state.renderTilt;
  if (dodgeActive || state.player.vy > 500) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.38)';
    ctx.lineWidth = 2;
    const trailY = pY + P_H * 0.55;
    for (let i=0;i<4;i++){
      const len = 22 + i*11;
      ctx.beginPath();
      ctx.moveTo(state.player.x - 8 - i*5, trailY + (i-1.5)*7);
      ctx.lineTo(state.player.x - len, trailY + (i-1.5)*7);
      ctx.stroke();
    }
    ctx.restore();
  }
  const flightEnergy = Math.min(1, Math.abs(state.player.vx) / BTL.SPEED + Math.abs(state.player.vy) / 900);
  // More readable wingbeat: ~4 Hz in active flight, calmer while gliding.
  const flapPeriod = dodgeActive ? 34 : flightEnergy > 0.65 ? 40 : 62;
  const flap = Math.sin(renderNow / flapPeriod);
  const wingScaleY = 0.965 + flap * (0.065 + flightEnergy * 0.035);
  const wingScaleX = 1.018 - flap * (0.022 + flightEnergy * 0.008);
  const bob = Math.sin(renderNow / 105) * (0.9 + flightEnergy * 1.0);

  ctx.save();
  ctx.translate(state.player.x + P_W/2, pY + P_H/2 + bob);
  ctx.rotate(tilt);

  // A faint secondary pose during strong beats gives a wing-motion impression
  // without adding a heavy sprite sheet.
  if (sprites?.birdImg?.naturalWidth && flightEnergy > 0.18 && Math.abs(flap) > 0.45) {
    ctx.save();
    ctx.globalAlpha = 0.10 + 0.07 * flightEnergy;
    const ghostScaleY = flap > 0 ? 1.07 : 0.90;
    ctx.scale((state.player.facing < 0 ? -1 : 1) * 1.01, ghostScaleY);
    ctx.drawImage(sprites.birdImg, -P_W/2 - 2, -P_H/2, P_W, P_H);
    ctx.restore();
  }

  ctx.scale((state.player.facing < 0 ? -1 : 1) * wingScaleX, wingScaleY);
  if (sprites?.birdImg?.naturalWidth) ctx.drawImage(sprites.birdImg, -P_W/2, -P_H/2, P_W, P_H);
  else { ctx.fillStyle='#e63946'; ctx.fillRect(-P_W/2,-P_H/2,P_W,P_H); }
  ctx.restore();

  // --- Ennemi (size kept independent from the enlarged bird)
  const F_W_BASE = 173;
  const F_H_BASE = 194;

  let foeImg = null;
  if (REGIONAL_BOSSES[state.foeType] || ['jelly','nacra','scirocco','resino'].includes(state.foeType)) foeImg = sprites?.jellyImg;
  else if (state.foeType === 'crow')    foeImg = sprites?.crowImg;
  else if (state.foeType === 'sputacchina') foeImg = sprites?.sputImg;

  // jelly/crow "face droite" → flip pour viser la gauche ; Sputacchina déjà à gauche
  const needFlip = (state.foeType === 'jelly' || state.foeType === 'crow');

  let foeAlpha = 1, foeScale = 1;
  if (state.foeDeath) { foeAlpha = Math.max(0, state.foeDeath.fade); foeScale = Math.max(0.5, 0.8 + 0.5*foeAlpha); }
  const drawW = Math.round(F_W_BASE * foeScale);
  const drawH = Math.round(F_H_BASE * foeScale);
  const FOE_BASELINE_OFFSET = -18;

  ctx.save();
  ctx.translate(state.foe.x, foeBaseline - drawH + FOE_BASELINE_OFFSET);
  if (needFlip) ctx.scale(-1, 1);
  ctx.globalAlpha = foeAlpha;

  if (!state.foeDeath?.done) {
    if (foeImg?.naturalWidth) {
      if (needFlip) ctx.drawImage(foeImg, 0, 0, drawW, drawH);
      else          ctx.drawImage(foeImg, -drawW, 0, drawW, drawH);
    } else {
      if (needFlip) { ctx.fillStyle='#2a9d8f'; ctx.fillRect(0, 0, drawW, drawH); }
      else          { ctx.fillStyle='#2a9d8f'; ctx.fillRect(-drawW, 0, drawW, drawH); }
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Télégraphie de l’attaque : lisible avant le tir.
  if (state.telegraph && renderNow < state.telegraph.until) {
    const pulse = 0.55 + 0.35 * Math.sin(renderNow / 55);
    ctx.save();
    ctx.globalAlpha = Math.max(.35, pulse);
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(state.foe.x - 4, Math.max(72, foeBaseline - drawH * .45), 44, 0, Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff7bf';
    ctx.font = '900 17px system-ui';
    ctx.textAlign = 'center';
    const label = state.telegraph.pattern === 'high' ? '↓ ' + battleWords.high : state.telegraph.pattern === 'low' ? '↑ ' + battleWords.low : '◎ ' + battleWords.aim;
    ctx.fillText(label, Math.max(120, state.foe.x - 92), 58);
    ctx.restore();
  }

  // Explosion ennemi
  if (state.foeDeath && !state.foeDeath.done){
    _renderFoeDeath(ctx);
  }

  // Tirs
  for (const s of state.shots){
    if (s.kind === 'zap'){
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
      const cx = s.x, cy = h - BTL.FLOOR_H + s.y - 60;
      if (s.kind === 'spore'){
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate( (Math.atan2(s.vy, s.vx)) );
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(40,200,120,0.95)';
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI*2);
        ctx.fillStyle = (s.from === 'player') ? '#ffd166' : '#06d6a0';
        ctx.fill();
      }
    }
  } // ← ferme bien la boucle des tirs

  // Effets de victoire
  if (state.phase === 'end' && state.victory) {
    _renderFireworks(ctx, w, h);
  }

  // HUD
  ctx.fillStyle='#fff'; ctx.font='700 16px system-ui';
  ctx.fillText(`♥ ${state.player.hp}`, 16, 28);
  ctx.fillText(`${REGIONAL_BOSSES[state.foeType]?.name ?? (state.foeType==='resino'?'Resino':state.foeType==='scirocco'?'Scirocco':state.foeType==='nacra'?'Nacra':'')} ♥ ${state.foe.hp}`, Math.max(16,w-140),28);
  ctx.fillText(`${REGIONAL_BOSSES[state.foeType]?.token ?? (state.foeType==='resino'?'🌲':state.foeType==='scirocco'?'💧':state.foeType==='nacra'?'🐚':'★')}: ${state.ammo.stars}`, Math.floor(w/2)-12, 28);

  // Short dialogue bubble, shared by every battle (same readable language as L3).
  if (renderNow < state.feedbackUntil && state.feedbackText) {
    ctx.save();
    const combo = state.combo > 1 ? '  ×' + state.combo : '';
    const label = state.feedbackText + combo;
    ctx.font = '800 18px system-ui';
    const padX = 16, bubbleH = 44;
    const bubbleW = Math.min(w - 32, Math.max(150, ctx.measureText(label).width + padX * 2));
    const centerX = Math.min(w - bubbleW / 2 - 16, Math.max(bubbleW / 2 + 16, state.player.x + 44));
    const centerY = Math.max(78, pY - 20);
    const bx = centerX - bubbleW / 2, by = centerY - bubbleH / 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bubbleW, bubbleH, 14);
    ctx.fillStyle = 'rgba(255,253,245,.96)';
    ctx.fill();
    ctx.strokeStyle = '#c8b37a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0e2b4a';
    ctx.shadowColor = 'rgba(15,23,42,.14)';
    ctx.shadowBlur = 5;
    ctx.fillText(label, centerX, centerY + 1);
    ctx.restore();
  }

  // READY / GO
  const now = renderNow;
  if (now < state.goAt){
    ctx.font='700 42px system-ui';
    ctx.fillStyle='rgba(255,255,255,.9)';
    ctx.fillText(battleWords.ready, Math.floor(w/2 - 92), Math.floor(h/2 - 40));
  } else if (now < state.goAt + BTL.GO_FLASH_MS){
    ctx.font='900 56px system-ui';
    ctx.fillStyle='rgba(255,235,0,.95)';
    ctx.fillText(battleWords.go, Math.floor(w/2 - 40), Math.floor(h/2 - 40));
  }

  // Aide
  ctx.font='12px system-ui'; ctx.fillStyle='rgba(255,255,255,.8)';
  ctx.fillText(copy.battleHint, 16, Math.max(12, h-12));

  ctx.restore();
}

// ---------------------------------------------------------
// Internes
// ---------------------------------------------------------
function _endBattle(victory){
  setGameFlowPhase(victory ? FLOW_PHASES.VICTORY : FLOW_PHASES.DEFEAT, { boss: state.foeType });

  // 1) Phase fin
  state.phase   = 'end';
  state.victory = !!victory;
  state.victoryDance = !!victory;
  state.active  = false;

  // 2) Masquer pads
  if (state.ui.move) state.ui.move.style.display = 'none';
  if (state.ui.ab)   state.ui.ab.style.display   = 'none';

  // 3) Overlay de fin + bouton
  if (state.ui.endOverlay){
    const t = state.ui.endOverlay.querySelector('#__battle_end_title');
    if (t) t.textContent = victory ? copy.won : copy.defeat;

    const btn = state.ui.endOverlay.querySelector('#__battle_replay_btn');
    if (btn){
      btn.disabled = false;
      btn.textContent = victory ? copy.continue : copy.replay;
      btn.style.padding = '12px 16px';
      btn.style.fontSize = '16px';
      btn.style.transform = 'none';

      btn.onclick = () => {
        try {
          if (victory) {
            btn.disabled = true;
            const foe = state.foeType;
            __persistUnlocksForFoe(foe);
            try { state.onWin(); } finally {
              // Route ownership belongs to the level/React flow, never to the battle engine.
              disposeBattle();
            }
          } else {
            state.ui.endOverlay.style.display = 'none';
            startBattle(state.foeType);
          }
        } catch (e) { console.error(e); }
      };
    }
    state.ui.endOverlay.style.display = 'flex';
  }

  // 4) Marquer la fin (FX)
  state.ending = { mode: victory ? 'win' : 'lose', t: 0, fw: state.ending?.fw || [] };

  // 5) Effets finaux
  if (victory){
    _triggerFoeDeath();
    _spawnFireworks(6);
    _stopBattleTheme();
    if (window.__RESUME_BG_MUSIC) { try { window.__RESUME_BG_MUSIC(); } catch {} }
    _playVictoryMusic();
  } else {
    state.fx.fireworks.length = 0;
  }

  // Keep the wrapper and its render loop alive until retrying this battle.
  if (!victory) _stopBattleTheme();
}

function _applyPhysics(ent, dt, isPlayer=false){
  ent.vy += (isPlayer ? BTL.PLAYER_GRAV : BTL.GRAV) * dt;
  ent.y  += ent.vy * dt;
  if (isPlayer) {
    const ceiling = -Math.max(150, state.h * 0.58);
    if (ent.y < ceiling) { ent.y = ceiling; if (ent.vy < 0) ent.vy *= 0.25; }
  }
  if (ent.y >= 0){ ent.y = 0; ent.vy = 0; ent.onGround = true; }
  else ent.onGround = false;
}

function _startDodge(now){
  const dir = state.input.left ? -1 : state.input.right ? 1 : (state.player.facing || 1);
  state.dodgeDir = dir;
  state.player.facing = dir;
  state.dodgeUntil = now + BTL.DODGE_MS;
  state.invulnerableUntil = now + BTL.DODGE_INVULN_MS;
  state.dodgeCooldownUntil = now + BTL.DODGE_COOLDOWN_MS;
  state.feedbackText = '↯ ' + battleWords.dodge;
  state.feedbackUntil = now + 360;
}

function _awardPerfectDodge(now){
  state.combo += 1;
  state.comboUntil = now + 2400;
  state.feedbackText = battleWords.perfect;
  state.feedbackUntil = now + 720;
  state.shakeT = Math.min(BTL.HIT_SHAKE_MAX_S, state.shakeT + 0.08);
  try { navigator.vibrate?.(18); } catch {}
  try { window.__HIRUNDU_CHIRP?.('bright'); } catch {}
}

function _fireNormal(){
  state.shots.push({
    x: state.player.x + (state.player.facing>0? 36 : -36),
    y: state.player.y,
    vx: BTL.SHOT * state.player.facing,
    vy: 0,
    from: 'player',
    dmg: 9
  });
}

function _fireSpecial(){
  const order = [
    ['caffe', { dmg: 22 }],
    ['rustico', { dmg: 15, burst:2, gap:140 }],
    ['pasticciotto', { dmg: 18 }],
    ['stars', { dmg: 12 }]
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

// ---- Tir ennemi — ZAP (générique jelly/crow)
function _fireFoeZapOnce(targetY = state.player.y, speedMul = 1) {
  const dx = (state.player.x - state.foe.x);
  const dy = (targetY - state.foe.y);
  const L  = Math.max(1, Math.hypot(dx, dy));
  const vx = (dx / L) * BTL.FOE_ZAP_SPEED * speedMul;
  const vy = (dy / L) * BTL.FOE_ZAP_SPEED * speedMul;

  state.shots.push({
    x: state.foe.x - 36,
    y: state.foe.y,
    vx, vy,
    from: 'foe',
    dmg: REGIONAL_BOSSES[state.foeType]?.damage ?? (state.foeType==='resino' ? 20 : state.foeType==='scirocco' ? 18 : state.foeType==='nacra' ? 16 : BTL.FOE_ZAP_DMG),
    kind: 'zap',
    life: 1.2,
  });
}

// ---- Tir ennemi — SPORES (Sputacchina)
function _fireFoeSporeOnce(targetY = state.player.y, speedMul = 1) {
  const dx = (state.player.x - state.foe.x);
  const dy = (targetY - state.foe.y);
  const L  = Math.max(1, Math.hypot(dx, dy));
  const vx = (dx / L) * BTL.SPORE_SPEED * speedMul;
  const vy = (dy / L) * BTL.SPORE_SPEED * speedMul;

  state.shots.push({
    x: state.foe.x - 36,
    y: state.foe.y,
    vx, vy,
    from: 'foe',
    dmg: BTL.SPORE_DMG,
    kind: 'spore',
    life: BTL.SPORE_LIFE_S,
  });
}

function _executeFoePattern(pattern){
  const highY = -Math.max(145, state.h * 0.38);
  const lowY = -18;
  const fireOne = (targetY, speedMul=1) => {
    if (state.foeShotKind === 'spore') _fireFoeSporeOnce(targetY, speedMul);
    else _fireFoeZapOnce(targetY, speedMul);
  };
  if (pattern === 'high') { fireOne(highY, 1.02); return; }
  if (pattern === 'low') { fireOne(lowY, 1.04); return; }
  fireOne(state.player.y, 1.0);
  setTimeout(() => { if (state.active) fireOne(state.player.y, 1.06); }, state.foeShotKind === 'spore' ? 150 : 120);
}

function _rnd(a,b){ return a + Math.random()*(b-a); }
function _consume(name){ if (state.input[name]){ state.input[name]=false; return true; } return false; }

// ---------------------------------------------------------
// Entrées clavier
// ---------------------------------------------------------
function _onKeyDown(e){
  if (!state.active || isGamePaused()) return;
  if (e.repeat) return;
  const k = e.key;
  const lower = k?.toLowerCase?.();
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Shift',' '].includes(k)) e.preventDefault();
  if (k === 'ArrowLeft')  state.input.left  = true;
  if (k === 'ArrowRight') state.input.right = true;
  if (k === 'ArrowUp')    state.input.up    = true;
  if (k === 'ArrowDown')  state.input.down  = true;
  if (k === 'Shift' || k === ' ') state.input.dodge = true;
  if (lower === 'a') state.input.atk = true;
  if (lower === 'b') state.input.spc = true;
}
function _onKeyUp(e){
  if (!state.active) return;
  const k = e.key;
  if (k === 'ArrowLeft')  state.input.left  = false;
  if (k === 'ArrowRight') state.input.right = false;
  if (k === 'ArrowUp')    state.input.up    = false;
  if (k === 'ArrowDown')  state.input.down  = false;
}

// ---------------------------------------------------------
// UI Battle (pads + overlay rotation)
// ---------------------------------------------------------
function _ensureBattleUI(show){
  if (!state.ui.root?.isConnected){
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
      gap:6px;
      align-items:center;
      pointer-events:auto;
    `;
    move.innerHTML = `
      <button data-act="left" class="__padbtn __movebtn" aria-label="${battleWords.left}">←</button>
      <button data-act="up" class="__padbtn __movebtn" aria-label="${battleWords.flap}">↑</button>
      <button data-act="down" class="__padbtn __movebtn" aria-label="${battleWords.dive}">↓</button>
      <button data-act="right" class="__padbtn __movebtn" aria-label="${battleWords.right}">→</button>
      <button data-act="dodge" class="__padbtn __dodgebtn" aria-label="${battleWords.dodge}">↯ ${battleWords.dodge}</button>
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
      <button data-act="atk" class="__padbtn" aria-label="${battleWords.attack}" style="background:#ffd166">A • ${battleWords.attack}</button>
      <button data-act="spc" class="__padbtn" aria-label="${battleWords.special}" style="background:#06d6a0">B • ${battleWords.special}</button>
    `;

    // style boutons
    const style = document.createElement('style');
    style.textContent = `
      .__padbtn{
        min-width:84px; padding:12px 14px; border-radius:12px; border:0;
        font:700 14px system-ui; background:#eee; box-shadow:0 4px 10px rgba(0,0,0,.25);
        touch-action:none; user-select:none;
      }
      .__movebtn{ min-width:48px; width:48px; padding:11px 6px; font-size:20px; }
      .__dodgebtn{ min-width:82px; padding:11px 9px; background:#dbeafe; }
      @media (max-width:740px){
        .__movebtn{ min-width:43px; width:43px; padding:9px 5px; }
        .__dodgebtn{ min-width:68px; font-size:11px; }
      }
    `;

    // overlay rotation (portrait)
    const rot = document.createElement('div');
    rot.id = '__battle_rotate__';
    rot.style.cssText = `
      position:absolute; inset:0; display:none; align-items:center; justify-content:center;
      background:rgba(0,0,0,.75); color:#fff; font:700 18px system-ui; text-align:center; padding:20px; pointer-events:auto;
    `;
    rot.textContent = `📱 ${copy.battleOrientation}`;

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
        <div id="__battle_end_title" style="font:800 18px system-ui; margin-bottom:10px">${battleWords.end}</div>
        <button id="__battle_replay_btn"
                style="padding:10px 14px; border:0; border-radius:12px; font:700 14px system-ui;
                       background:#06d6a0; color:#083d2b">↻ ${copy.replay}</button>
      </div>
    `;

    // structure DOM
    root.appendChild(style);
    root.appendChild(move);
    root.appendChild(ab);
    root.appendChild(rot);
    root.appendChild(end);
    document.body.appendChild(root);

    // handlers pads
    const press = (act, on)=> {
      if (act === 'left')  state.input.left  = on;
      if (act === 'right') state.input.right = on;
      if (on === true && act === 'up') state.input.up = true;
      if (on === true && act === 'down') state.input.down = true;
      if (on === true && act === 'dodge') state.input.dodge = true;
      if (on === true && act === 'atk') state.input.atk = true;
      if (on === true && act === 'spc') state.input.spc = true;
    };

    root.querySelectorAll('.__padbtn').forEach(b=>{
      const act = b.dataset.act;
      b.addEventListener('touchstart', e=>{ e.preventDefault(); press(act, true); }, {passive:false});
      b.addEventListener('touchend',   e=>{ e.preventDefault(); press(act, false); }, {passive:false});
      b.addEventListener('mousedown',  e=>{ e.preventDefault(); press(act, true); });
      b.addEventListener('mouseup',    e=>{ e.preventDefault(); press(act, false); });
      b.addEventListener('mouseleave', ()=>{ press(act, false); });
      b.addEventListener('click',      e=>{ e.preventDefault(); });
    });

    // références UI
    state.ui.root = root;
    state.ui.move = move;
    state.ui.ab = ab;
    state.ui.rotateOverlay = rot;
    state.ui.endOverlay = end;
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
// Décor & effets
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
function _triggerFoeDeath(){
  const parts = [];
  const cx = state.foe.x, cy = (state.h - BTL.FLOOR_H + state.foe.y - Math.round(152*1.3));
  const N = 28;
  for (let i=0;i<N;i++){
    const a = Math.random() * Math.PI*2;
    const sp = 220 + Math.random()*260;
    parts.push({
      x: cx, y: cy,
      vx: Math.cos(a)*sp,
      vy: Math.sin(a)*sp,
      life: 0.6 + Math.random()*0.5,
      r: 2 + Math.random()*3
    });
  }
  state.foeDeath = { t:0, parts, fade:1, done:false };
}
function _tickFoeDeath(dt){
  const D = state.foeDeath; if (!D || D.done) return;
  D.t += dt;
  D.fade = Math.max(0, 1 - D.t * 1.6);
  for (let i=D.parts.length-1; i>=0; i--){
    const p = D.parts[i];
    p.vy += 700 * dt;
    p.x  += p.vx * dt;
    p.y  += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) D.parts.splice(i,1);
  }
  if (D.fade <= 0 && D.parts.length === 0) D.done = true;
}
function _renderFoeDeath(ctx){
  const D = state.foeDeath; if (!D) return;
  ctx.save();
  for (const p of D.parts){
    const a = Math.max(0, Math.min(1, p.life / 0.5));
    ctx.fillStyle = `rgba(120,220,255,${a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Feux d’artifice (victoire) ----------
function _spawnFireworks(count=1){
  const w = state.w, h = state.h;
  for (let k=0;k<count;k++){
    const cx = 80 + Math.random()*(w-160);
    const cy = 80 + Math.random()*Math.min(240, h*0.45);
    const n = 36;
    for (let i=0;i<n;i++){
      const a = (i/n) * Math.PI*2;
      const sp = 140 + Math.random()*140;
      state.fx.fireworks.push({
        x: cx, y: cy,
        vx: Math.cos(a)*sp,
        vy: Math.sin(a)*sp,
        life: 0.9 + Math.random()*0.6,
        age: 0
      });
    }
  }
}
function _tickFireworks(dt){
  const g = 260;
  for (let i = state.fx.fireworks.length-1; i>=0; i--){
    const p = state.fx.fireworks[i];
    p.age += dt;
    p.vy += g*dt*0.25;
    p.x += p.vx*dt;
    p.y += p.vy*dt;
    if (p.age >= p.life) state.fx.fireworks.splice(i,1);
  }
}
function _renderFireworks(ctx, w, h){
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of state.fx.fireworks){
    const t = Math.min(1, p.age / p.life);
    const alpha = (1 - t) * 0.9;
    ctx.fillStyle = `rgba(${200+Math.floor(55*Math.random())},${180+Math.floor(70*Math.random())},255,${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.0 + (1.6*(1-t)), 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Audio ----------
function _fadeHtmlAudio(audio, from, to, duration = 420, done){
  if (!audio) { done?.(); return; }
  const steps = 10;
  let step = 0;
  try { audio.volume = Math.max(0, Math.min(1, from)); } catch {}
  const timer = window.setInterval(() => {
    step += 1;
    const p = Math.min(1, step / steps);
    try { audio.volume = Math.max(0, Math.min(1, from + (to - from) * p)); } catch {}
    if (p >= 1) {
      window.clearInterval(timer);
      done?.();
    }
  }, Math.max(20, Math.round(duration / steps)));
}
function _playBattleTheme(){
  try{
    const url = window.__BATTLE_THEME_URL__ || withBase('assets/battle_loop.mp3');
    if (!url) return;
    if (state.musicBattle){ try{state.musicBattle.pause();}catch{} }
    const track = new Audio(url);
    state.musicBattle = track;
    track.loop = true;
    track.volume = 0;
    track.play().then(() => _fadeHtmlAudio(track, 0, 0.60, 480)).catch(()=>{});
  }catch{}
}
function _stopBattleTheme(){
  try{
    const track = state.musicBattle;
    state.musicBattle = null;
    if (!track) return;
    const from = Number.isFinite(track.volume) ? track.volume : 0.60;
    _fadeHtmlAudio(track, from, 0, 360, () => {
      try { track.pause(); } catch {}
    });
  }catch{}
}
function _playVictoryMusic(){
  try{
    const url = window.__BATTLE_VICTORY_MUSIC_URL__; // optionnel
    if (!url) return;
    if (state.musicVictory){ try{state.musicVictory.pause();}catch{} }
    state.musicVictory = new Audio(url);
    state.musicVictory.loop = false;
    state.musicVictory.volume = 0.75;
    state.musicVictory.play().catch(()=>{});
  }catch{}
}
function _stopVictoryMusic(){
  try{ if (state.musicVictory){ state.musicVictory.pause(); state.musicVictory = null; } }catch{}
}
if (typeof window !== 'undefined') {
  window.addEventListener('hirundu:pause', (event) => {
    const track = state.musicBattle;
    if (!track || track.paused) return;
    const from = Number.isFinite(track.volume) ? track.volume : 0.60;
    _fadeHtmlAudio(track, from, event.detail?.paused ? 0.12 : 0.60, 220);
  });
}
