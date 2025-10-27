// src/levels/level3/level3_game.js
// =====================================================
// NIVEAU 3 — SALENTO NORD / LECCE
// Objectif : Collecter 10 FEUILLES D’OLIVIER -> Boss "Esprit de pierre" à Lecce
// Base technique : calque du L2 (QR/Leaflet, HUD, audio, battle) avec adaptations N3
// =====================================================

import { t, poiName, poiInfo } from '../../i18n.js';
import { openBonusMap, unlockBonus, isBonusUnlocked } from '../../bonus_maps.js';
import {
  startMusic, stopMusic, toggleMusic, isMusicOn,
  ping, starEmphasis, failSfx, resetAudioForNewGame, playFinaleLong
} from '../../audio.js';
import * as ui from '../../ui.js';
import { startBattleIntro } from '../../battle_intro.js';

const DEBUG = false;
function dbg(...a){ if (DEBUG) console.log('[L3]', ...a); }

// ------------------------
// Config N3
// ------------------------
const APP_VERSION = (window.APP_VERSION || 'dev');
const LEVEL_ID = 'L3';
const INVENTORY_KEY = 'leaf';   // icône HUD (feuille d’olivier)
const INVENTORY_LABEL = t('hud.leaves', 'Feuilles'); // clé i18n conseillée: hud.leaves
const INVENTORY_TARGET = 10;

// Carte centrée Lecce, rayon 30 km, masque inversé (comme L2)
const MAP_CENTER = { lat: 40.3520, lng: 18.1690 }; // Lecce
const MAP_RADIUS_KM = 30;

// Musique / ambiance
const MUSIC_KEY = 'lecce_baroque'; // référence attendue dans audio.js
const VFX_GOLD_DUST = true;        // effet de particules dorées côté UI

// ------------------------
// POI officiels N3 (10)
// ------------------------
const POIS = [
  { id:'lecce',            nameKey:'poi.lecce',            lat:40.3520, lng:18.1690 },
  { id:'acaya',            nameKey:'poi.acaya',            lat:40.3086, lng:18.2910 },
  { id:'parco_rauccio',    nameKey:'poi.parco_rauccio',    lat:40.4710, lng:18.0750 },
  { id:'san_cataldo',      nameKey:'poi.san_cataldo',      lat:40.3890, lng:18.2720 },
  { id:'cavallino',        nameKey:'poi.cavallino',        lat:40.3110, lng:18.2040 },
  { id:'rudiae',           nameKey:'poi.rudiae',           lat:40.3380, lng:18.1530 },
  { id:'punta_prosciutto', nameKey:'poi.punta_prosciutto', lat:40.2959, lng:17.7417 },
  { id:'porto_selvaggio',  nameKey:'poi.porto_selvaggio',  lat:40.1710, lng:17.9560 },
  { id:'galatone',         nameKey:'poi.galatone',         lat:40.1470, lng:18.0710 },
  { id:'calimera',         nameKey:'poi.calimera',         lat:40.2590, lng:18.2510 },
];

// ------------------------
// State
// ------------------------
let state = {
  collected: new Set(), // poi.id collectés
  unlockedBonus: false, // vrai UNIQUEMENT après victoire du boss (QR Lecce)
  startedAt: 0,
  finishedAt: 0,
  musicOn: true,
};

// ------------------------
// Persistence
// ------------------------
function saveState(){
  try {
    localStorage.setItem(`hirundu_${LEVEL_ID}_v${APP_VERSION}`, JSON.stringify({
      c:[...state.collected],
      b:state.unlockedBonus,
      sa:state.startedAt,
      fa:state.finishedAt,
      m:state.musicOn
    }));
  } catch {}
}

function loadState(){
  try {
    const raw = localStorage.getItem(`hirundu_${LEVEL_ID}_v${APP_VERSION}`);
    if(!raw) return;
    const o = JSON.parse(raw);
    state.collected = new Set(o.c || []);
    state.unlockedBonus = !!o.b;
    state.startedAt = o.sa || 0;
    state.finishedAt = o.fa || 0;
    state.musicOn = o.m !== false;
  } catch {}
}

function resetForNewRun(){
  state.collected.clear();
  state.unlockedBonus = false;
  state.startedAt = Date.now();
  state.finishedAt = 0;
  saveState();
}

function collectedCount(){ return state.collected.size; }
function isCompleted(){ return collectedCount() >= INVENTORY_TARGET; }

// ------------------------
// UI / HUD
// ------------------------
function renderHUD(){
  ui.setCounter(`${INVENTORY_LABEL}: ${collectedCount()}/${INVENTORY_TARGET}`, INVENTORY_KEY);
  ui.setMusicToggle(isMusicOn());
  ui.setLevelBadge('Niveau 3 — Salento Nord');
  if (VFX_GOLD_DUST) ui.enableGoldDust(true);
}

// ------------------------
// Collecte / progression
// ------------------------
function onCollect(poi){
  if (state.collected.has(poi.id)) { ping(); return; }

  state.collected.add(poi.id);
  starEmphasis(); // feedback sfx/anim (réutilisé du L2)
  saveState();
  renderHUD();

  if (isCompleted()){
    ui.flashMessage(t('level3.complete','Toutes les feuilles d’olivier sont collectées !'));
    playFinaleLong();
    // Lancement de l’intro bataille (boss à Lecce), passage du callback de victoire
    startBattleIntro({
      bossKey: 'baroque_golem',
      next: () => import('../level3/level3_battle.js')
        .then(m => m.startBattleL3('golem', { onWin: onBattleWinL3 }))
    });
  }
}

// Appelé par le système de battle quand le boss est vaincu
function onBattleWinL3(){
  dbg('Battle won — unlocking QR bonus Lecce');
  state.finishedAt = Date.now();
  state.unlockedBonus = true;
  saveState();

  // Débloque le bonus QR de Lecce (post-bataille uniquement)
  unlockBonus(LEVEL_ID, 'qr_bonus_lecce');

  ui.flashMessage(t('level3.bonus_unlocked','Bonus QR Lecce débloqué !'));
  ui.showCTA(t('level3.open_bonus','Scanner le QR bonus à Lecce'), () => {
    openBonusMap(LEVEL_ID, 'qr_bonus_lecce');
  });
}

// ------------------------
// Carte / POI
// ------------------------
let mapInstance = null;

function mountMap(){
  mapInstance = ui.createMaskedMap('map-root', {
    center: MAP_CENTER,
    radiusKm: MAP_RADIUS_KM,
    invertedMask: true
  });

  for (const poi of POIS){
    ui.addPoi(mapInstance, {
      id: poi.id,
      name: poiName(poi.nameKey),
      info: poiInfo(poi.nameKey),
      lat: poi.lat, lng: poi.lng,
      icon: INVENTORY_KEY, // icône feuille d’olivier
      collected: state.collected.has(poi.id),
      onClick: () => onCollect(poi)
    });
  }
}

// ------------------------
// Cycle de vie du niveau
// ------------------------
export function startLevel3(){
  dbg('startLevel3');
  resetAudioForNewGame();
  loadState();

  // Musique
  try {
    if (state.musicOn) startMusic(MUSIC_KEY);
    ui.onToggleMusic(() => {
      toggleMusic(MUSIC_KEY);
      state.musicOn = isMusicOn();
      saveState();
      renderHUD();
    });
  } catch (e){ console.warn(e); }

  // HUD + Map
  renderHUD();
  mountMap();

  // Si le bonus a déjà été gagné, s'assurer qu'il est bien actif dans le système
  if (state.unlockedBonus && !isBonusUnlocked(LEVEL_ID, 'qr_bonus_lecce')){
    unlockBonus(LEVEL_ID, 'qr_bonus_lecce');
  }

  // Sécurité : si collecte terminée mais bataille non encore lancée
  if (isCompleted()){
    ui.showCTA(t('level3.battle_cta','Lancer la bataille de Lecce'), () => {
      startBattleIntro({
        bossKey: 'baroque_golem',
        next: () => import('../level3/level3_battle.js')
          .then(m => m.startBattleL3('golem', { onWin: onBattleWinL3 }))
      });
    });
  }
}

export function stopLevel3(){
  try { stopMusic(MUSIC_KEY); } catch {}
  ui.teardownMap(mapInstance);
  ui.enableGoldDust(false);
}
