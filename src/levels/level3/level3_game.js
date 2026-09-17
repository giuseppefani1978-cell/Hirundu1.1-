import { boot as bootLegacy } from './level3_legacy.js';
import { FLOW_EVENT, getGameFlowState, setGamePaused } from '../../game_flow.js';

const STYLE_ID = '__l3_adventure_style';
const TOAST_ID = '__l3_adventure_toast';
const CHALLENGE_ID = '__l3_fragment_challenge';
const COLLECTION_KEY = 'hirundu_collection_v1';

let activeEnhancementCleanup = null;

const TEXT = {
  fr: {
    start: 'Carnet de Lecce ouvert · 10 feuilles à retrouver.',
    fragmentTitle: 'Un fragment baroque apparaît !',
    fragmentBody: 'Une feuille révèle un éclat ancien. Attrape-le avant que le vent ne l’emporte.',
    fragmentCatch: 'Attraper le fragment',
    fragmentCaught: 'Fragment baroque ajouté au carnet.',
    fragmentMissed: 'Le fragment s’est envolé. Rejoue le niveau pour le retrouver.',
    finalStretch: 'Arachne approche · 2 traces restantes.',
    battleReady: '10/10 · Tes feuilles deviennent des charges pour la bataille.',
    victory: 'Sceau de Lecce ajouté à ta collection.',
    secret: 'Fragment secret conservé dans le carnet.',
  },
  it: {
    start: 'Taccuino di Lecce aperto · trova 10 foglie.',
    fragmentTitle: 'Appare un frammento barocco!',
    fragmentBody: 'Una foglia rivela un antico frammento. Prendilo prima che il vento lo porti via.',
    fragmentCatch: 'Prendi il frammento',
    fragmentCaught: 'Frammento barocco aggiunto al taccuino.',
    fragmentMissed: 'Il frammento è volato via. Rigioca il livello per ritrovarlo.',
    finalStretch: 'Aracne si avvicina · restano 2 tracce.',
    battleReady: '10/10 · Le foglie diventano cariche per la battaglia.',
    victory: 'Sigillo di Lecce aggiunto alla collezione.',
    secret: 'Frammento segreto conservato nel taccuino.',
  },
  en: {
    start: 'Lecce travel journal opened · find 10 olive leaves.',
    fragmentTitle: 'A baroque fragment appears!',
    fragmentBody: 'A leaf reveals an ancient shard. Catch it before the wind carries it away.',
    fragmentCatch: 'Catch the fragment',
    fragmentCaught: 'Baroque fragment added to the journal.',
    fragmentMissed: 'The fragment blew away. Replay the level to find it again.',
    finalStretch: 'Arachne is getting closer · 2 traces left.',
    battleReady: '10/10 · Your leaves become battle charges.',
    victory: 'Seal of Lecce added to your collection.',
    secret: 'Secret fragment saved in the journal.',
  },
  es: {
    start: 'Cuaderno de Lecce abierto · encuentra 10 hojas.',
    fragmentTitle: '¡Aparece un fragmento barroco!',
    fragmentBody: 'Una hoja revela un fragmento antiguo. Atrápalo antes de que se lo lleve el viento.',
    fragmentCatch: 'Atrapar el fragmento',
    fragmentCaught: 'Fragmento barroco añadido al cuaderno.',
    fragmentMissed: 'El fragmento salió volando. Repite el nivel para encontrarlo.',
    finalStretch: 'Arachne se acerca · quedan 2 rastros.',
    battleReady: '10/10 · Tus hojas se convierten en cargas de batalla.',
    victory: 'Sello de Lecce añadido a tu colección.',
    secret: 'Fragmento secreto guardado en el cuaderno.',
  },
};

function currentCopy() {
  const raw = String(document.documentElement.lang || navigator.language || 'fr').toLowerCase();
  const lang = raw.startsWith('it') ? 'it' : raw.startsWith('en') ? 'en' : raw.startsWith('es') ? 'es' : 'fr';
  return TEXT[lang];
}

function injectStyle() {
  document.getElementById(STYLE_ID)?.remove();
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${TOAST_ID}{
      position:fixed;left:50%;top:calc(78px + env(safe-area-inset-top,0px));transform:translate(-50%,-8px);
      z-index:12030;max-width:min(86vw,440px);padding:10px 14px;border-radius:16px;
      background:rgba(15,23,42,.92);color:#fff;border:1px solid rgba(255,255,255,.18);
      box-shadow:0 10px 30px rgba(0,0,0,.22);font:800 14px/1.25 system-ui,-apple-system,Segoe UI,sans-serif;
      text-align:center;opacity:0;transition:opacity .2s ease,transform .2s ease;pointer-events:none;
      backdrop-filter:blur(8px);
    }
    #${TOAST_ID}.is-visible{opacity:1;transform:translate(-50%,0)}
    #${CHALLENGE_ID}{position:fixed;inset:0;z-index:12040;display:grid;place-items:center;padding:22px;
      background:radial-gradient(circle at 50% 40%,rgba(255,228,153,.22),rgba(3,12,25,.78));backdrop-filter:blur(3px)}
    #${CHALLENGE_ID} .l3-fragment-card{width:min(88vw,430px);padding:22px 20px 18px;border-radius:24px;text-align:center;
      background:rgba(255,250,235,.97);color:#253047;border:1px solid rgba(122,91,37,.24);box-shadow:0 22px 70px rgba(0,0,0,.38)}
    #${CHALLENGE_ID} .l3-fragment-icon{font-size:58px;line-height:1;margin-bottom:8px;animation:l3Float 1.2s ease-in-out infinite alternate}
    #${CHALLENGE_ID} h2{margin:0 0 8px;font:900 22px/1.15 system-ui,-apple-system,Segoe UI,sans-serif}
    #${CHALLENGE_ID} p{margin:0 0 16px;font:600 15px/1.4 system-ui,-apple-system,Segoe UI,sans-serif;color:#4b5563}
    #${CHALLENGE_ID} button{border:0;border-radius:999px;padding:12px 18px;background:#7c3f1d;color:#fff;
      font:900 15px/1 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 8px 22px rgba(124,63,29,.25)}
    #${CHALLENGE_ID} .l3-fragment-timer{height:5px;margin:16px 2px 0;border-radius:999px;background:rgba(124,63,29,.14);overflow:hidden}
    #${CHALLENGE_ID} .l3-fragment-timer::after{content:'';display:block;width:100%;height:100%;background:#c77b30;
      transform-origin:left center;animation:l3Timer 6s linear forwards}
    body.l3-final-stretch #c{filter:saturate(1.08) contrast(1.035)}
    @keyframes l3Float{from{transform:translateY(-2px) rotate(-4deg)}to{transform:translateY(4px) rotate(4deg)}}
    @keyframes l3Timer{from{transform:scaleX(1)}to{transform:scaleX(0)}}
    @media (prefers-reduced-motion:reduce){#${CHALLENGE_ID} .l3-fragment-icon,#${CHALLENGE_ID} .l3-fragment-timer::after{animation:none}}
  `;
  document.head.appendChild(style);
}

function showToast(message, duration = 2200) {
  let toast = document.getElementById(TOAST_ID);
  if (!toast) {
    toast = document.createElement('div');
    toast.id = TOAST_ID;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.remove('is-visible');
  void toast.offsetWidth;
  toast.classList.add('is-visible');
  clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => toast?.classList.remove('is-visible'), duration);
}

function unlockCollectible(id, extra = {}) {
  try {
    let collection = {};
    try { collection = JSON.parse(localStorage.getItem(COLLECTION_KEY) || '{}') || {}; } catch {}
    if (!collection || typeof collection !== 'object' || Array.isArray(collection)) collection = {};
    if (!collection[id]) {
      collection[id] = { id, city: 'Lecce', level: 3, unlockedAt: new Date().toISOString(), ...extra };
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
      try { window.dispatchEvent(new CustomEvent('hirundu:collection', { detail: collection[id] })); } catch {}
      return true;
    }
  } catch {}
  return false;
}

function readProgress() {
  const match = String(document.getElementById('score')?.textContent || '').match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return { current: 0, total: 10 };
  return { current: Number(match[1]) || 0, total: Number(match[2]) || 10 };
}

function installLevel3Adventure() {
  injectStyle();
  const copy = currentCopy();
  const state = {
    seen: new Set(),
    fragmentCaught: false,
    fragmentOpen: false,
    shieldReady: false,
    victoryHandled: false,
    disposed: false,
  };

  let scoreObserver = null;
  let challengeTimer = 0;
  let retryTimer = 0;

  const closeChallenge = (caught) => {
    const challenge = document.getElementById(CHALLENGE_ID);
    challenge?.remove();
    state.fragmentOpen = false;
    if (challengeTimer) window.clearTimeout(challengeTimer);
    challengeTimer = 0;
    if (caught) {
      state.fragmentCaught = true;
      try { sessionStorage.setItem('hirundu_l3_fragment_run', '1'); } catch {}
      showToast(`🧩 ${copy.fragmentCaught}`, 2600);
    } else {
      showToast(copy.fragmentMissed, 2600);
    }
    try { setGamePaused(false); } catch {}
  };

  const showFragmentChallenge = () => {
    if (state.fragmentOpen || document.getElementById(CHALLENGE_ID)) return;
    state.fragmentOpen = true;
    let wasPaused = false;
    try {
      wasPaused = !!getGameFlowState().paused;
      if (!wasPaused) setGamePaused(true);
    } catch {}

    const challenge = document.createElement('div');
    challenge.id = CHALLENGE_ID;
    challenge.setAttribute('role', 'dialog');
    challenge.setAttribute('aria-modal', 'true');
    challenge.innerHTML = `
      <div class="l3-fragment-card">
        <div class="l3-fragment-icon" aria-hidden="true">🧩</div>
        <h2>${copy.fragmentTitle}</h2>
        <p>${copy.fragmentBody}</p>
        <button type="button">${copy.fragmentCatch}</button>
        <div class="l3-fragment-timer" aria-hidden="true"></div>
      </div>`;
    document.body.appendChild(challenge);
    challenge.querySelector('button')?.addEventListener('click', () => closeChallenge(true), { once: true });
    challengeTimer = window.setTimeout(() => closeChallenge(false), 6000);
  };

  const handleProgress = () => {
    if (state.disposed) return;
    const { current } = readProgress();
    if (current >= 1 && !state.seen.has('start')) {
      state.seen.add('start');
      showToast(`🗺️ ${copy.start}`);
    }
    if (current >= 5 && !state.seen.has('fragment')) {
      state.seen.add('fragment');
      showFragmentChallenge();
    }
    if (current >= 8 && !state.seen.has('final')) {
      state.seen.add('final');
      document.body.classList.add('l3-final-stretch');
      showToast(`⚠️ ${copy.finalStretch}`, 2600);
    }
    if (current >= 10 && !state.seen.has('ready')) {
      state.seen.add('ready');
      state.shieldReady = true;
      showToast(`🍃 ${copy.battleReady}`, 3000);
    }
  };

  const attachScoreObserver = () => {
    const score = document.getElementById('score');
    if (!score) {
      retryTimer = window.setTimeout(attachScoreObserver, 60);
      return;
    }
    scoreObserver = new MutationObserver(handleProgress);
    scoreObserver.observe(score, { childList: true, characterData: true, subtree: true });
    handleProgress();
  };

  const onFlow = (event) => {
    const detail = event?.detail || {};
    if (Number(detail.level) !== 3) return;
    if (detail.phase === 'hunt') {
      document.body.classList.remove('l3-final-stretch');
    }
    if ((detail.phase === 'battle-intro' || detail.phase === 'battle') && state.shieldReady && !state.seen.has('battle')) {
      state.seen.add('battle');
      showToast(`⚔️ ${copy.battleReady}`, 3000);
    }
    if (detail.phase === 'victory' && !state.victoryHandled) {
      state.victoryHandled = true;
      document.body.classList.remove('l3-final-stretch');
      const newSeal = unlockCollectible('lecce-seal', { kind: 'level-seal' });
      if (state.fragmentCaught) unlockCollectible('lecce-baroque-fragment', { kind: 'secret-fragment' });
      window.setTimeout(() => {
        if (state.disposed) return;
        const messages = [];
        if (newSeal) messages.push(`🏛️ ${copy.victory}`);
        if (state.fragmentCaught) messages.push(`🧩 ${copy.secret}`);
        if (messages.length) showToast(messages.join(' · '), 4200);
      }, 350);
    }
    if (detail.phase === 'defeat') document.body.classList.remove('l3-final-stretch');
  };

  window.addEventListener(FLOW_EVENT, onFlow);
  attachScoreObserver();

  return () => {
    state.disposed = true;
    scoreObserver?.disconnect();
    window.removeEventListener(FLOW_EVENT, onFlow);
    if (challengeTimer) window.clearTimeout(challengeTimer);
    if (retryTimer) window.clearTimeout(retryTimer);
    clearTimeout(showToast._timer);
    document.getElementById(CHALLENGE_ID)?.remove();
    document.getElementById(TOAST_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    document.body.classList.remove('l3-final-stretch');
    try { if (getGameFlowState().paused) setGamePaused(false); } catch {}
  };
}

export function boot(options = {}) {
  activeEnhancementCleanup?.();
  activeEnhancementCleanup = null;

  const cleanupLegacy = bootLegacy(options);

  // Levels 4–9 currently reuse the L3 engine through options.region.
  // Keep them byte-for-byte in behaviour for this first gameplay prototype.
  if (options?.region) return cleanupLegacy;

  const cleanupEnhancement = installLevel3Adventure();
  activeEnhancementCleanup = cleanupEnhancement;

  return () => {
    cleanupEnhancement?.();
    if (activeEnhancementCleanup === cleanupEnhancement) activeEnhancementCleanup = null;
    cleanupLegacy?.();
  };
}

export const startLevel3 = boot;
export const start = boot;
