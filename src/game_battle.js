// src/game_battle.js
// Couche d’intégration de la battle : intro, callbacks, viewport bas-écran, rendu.
// Utilise battle.js et battle_intro.js, expose une API minimale à game.js.

import { startBattleIntro } from './battle_intro.js';
import {
  setupBattleInputs,
  setBattleCallbacks,
  setBattleAmmo,
  startBattle,
  tickBattle,
  renderBattle,
  isBattleActive
} from './battle.js';

// --- Taille logique de la scène battle (aspect fixe 16:9)
const BTL_VIRTUAL = { W: 800, H: 450 };

// --- Helpers safe-area depuis :root (CSS)
// Assure l’alignement pile en bas (home indicator iOS, etc.)
function getSafeInset(pxName){
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(pxName).trim();
    const n = parseFloat(v || '0');
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
}

// --- Viewport battle : centré horizontalement, collé en bas de l’écran
export function computeBattleViewportBottom(W, H, { sideExtra = 0, bottomExtra = 0 } = {}){
  const safeBottom = getSafeInset('--safe-bottom');
  const safeLeft   = getSafeInset('--safe-left');
  const safeRight  = getSafeInset('--safe-right');

  const targetAR = BTL_VIRTUAL.W / BTL_VIRTUAL.H;
  const availW = Math.max(1, W - safeLeft - safeRight - sideExtra * 2);
  const availH = Math.max(1, H - safeBottom - bottomExtra);

  let dw = availW;
  let dh = Math.round(dw / targetAR);
  if (dh > availH){ dh = availH; dw = Math.round(availH * targetAR); }

  const ox = Math.floor((W - dw) / 2);                         // centré X
  const oy = Math.floor(H - safeBottom - bottomExtra - dh);    // collé en bas
  return { ox, oy, dw, dh };
}

// --- API vers game.js ---

/**
 * Initialise la couche battle : inputs + callbacks.
 * @param {{onWin:Function, onLose:Function}} handlers
 */
export function setupBattleLayer({ onWin, onLose }){
  setupBattleInputs();
  setBattleCallbacks({
    onWin:  () => { document.body.classList.remove('mode-battle'); onWin?.(); },
    onLose: () => { document.body.classList.remove('mode-battle'); onLose?.(); }
  });
}

/**
 * Lance le flow “intro → démarrage battle”.
 * game.js garde son propre `mode`. On lui donne un hook `onStartBattle`
 * pour qu’il puisse basculer en mode 'battle' au moment opportun.
 */
export function startBattleFlow({ ammoCounts, stars, onStartBattle }){
  // masque HUD carte via classe (si tu as du CSS qui s’y accroche)
  document.body.classList.add('mode-battle');

  // Munitions transmises au mini-jeu
  setBattleAmmo({
    pasticciotto: ammoCounts?.pasticciotto | 0,
    rustico:      ammoCounts?.rustico      | 0,
    caffe:        ammoCounts?.caffe        | 0,
    stars:        stars | 0
  });

  startBattleIntro({
    ammo: { ...(ammoCounts||{}), stars: stars|0 },
    onProceed: () => {
      onStartBattle?.();          // ← game.js met `mode = 'battle'`
      startBattle('jelly');       // ton niveau 1
      // petit nudge pour iOS après rotation
      setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
      setTimeout(() => { window.dispatchEvent(new Event('resize')); window.scrollTo(0,0); }, 220);
    }
  });
}

/** Renvoie true si la battle est en cours côté moteur. */
export function isBattleRunning(){
  return !!isBattleActive();
}

/** Tick logique battle (IA/physique interne) */
export function tickBattleLogic(dt, ctx){
  // (ctx est passé à tickBattle selon ton battle.js)
  tickBattle(dt, ctx);
}

/** Rendu battle : scène centrée et collée en bas */
export function renderBattleFrame(ctx, W, H, sprites, { sideExtra = 0, bottomExtra = 16 } = {}){
  const vp = computeBattleViewportBottom(W, H, { sideExtra, bottomExtra });
  renderBattle(ctx, vp, sprites);
}
