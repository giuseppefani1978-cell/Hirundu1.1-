import { copy } from './ui/copy.js';

export const FLOW_EVENT = 'hirundu:flow';
export const FLOW_PHASES = Object.freeze({
  IDLE: 'idle',
  LEVEL_INTRO: 'level-intro',
  HUNT: 'hunt',
  BATTLE_INTRO: 'battle-intro',
  BATTLE: 'battle',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
});

let state = {
  phase: FLOW_PHASES.IDLE,
  level: null,
  boss: null,
  requiredOrientation: null,
};

let orientationWatchInstalled = false;

export function isMobileGameDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const touch = Number(navigator.maxTouchPoints || 0) > 0;
  let coarse = false;
  try { coarse = !!window.matchMedia?.('(pointer: coarse)')?.matches; } catch {}
  const shortestSide = Math.min(window.innerWidth || 0, window.innerHeight || 0);
  return (touch || coarse) && shortestSide > 0 && shortestSide <= 1024;
}

export function getViewportOrientation() {
  if (typeof window === 'undefined') return 'portrait';
  return (window.innerWidth || 0) >= (window.innerHeight || 0) ? 'landscape' : 'portrait';
}

export function orientationMatches(required) {
  if (!required) return true;
  if (!isMobileGameDevice()) return true;
  return getViewportOrientation() === required;
}

export function getGameFlowState() {
  return { ...state };
}

function requiredOrientationForPhase(phase) {
  if (phase === FLOW_PHASES.HUNT || phase === FLOW_PHASES.LEVEL_INTRO) return 'portrait';
  if (phase === FLOW_PHASES.BATTLE_INTRO || phase === FLOW_PHASES.BATTLE) return 'landscape';
  return null;
}

function ensureHuntOrientationGuard() {
  if (typeof document === 'undefined') return null;
  let guard = document.getElementById('__hunt_orientation__');
  if (guard) return guard;

  guard = document.createElement('div');
  guard.id = '__hunt_orientation__';
  guard.setAttribute('role', 'dialog');
  guard.setAttribute('aria-live', 'polite');
  guard.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:10010',
    'display:none',
    'align-items:center',
    'justify-content:center',
    'padding:24px',
    'background:rgba(5,15,30,.94)',
    'color:#fff',
    'text-align:center',
    'font:700 18px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
    'pointer-events:auto'
  ].join(';');

  const panel = document.createElement('div');
  panel.style.cssText = 'max-width:420px;padding:24px;border:1px solid rgba(255,255,255,.2);border-radius:20px;background:rgba(255,255,255,.08)';
  panel.innerHTML = `<div style="font-size:42px;margin-bottom:12px">📱↕️</div><div>${copy.rotatePortrait || copy.huntOrientation}</div>`;
  guard.appendChild(panel);
  document.body.appendChild(guard);
  return guard;
}

function syncOrientationUI() {
  if (typeof document === 'undefined') return;
  const orientation = getViewportOrientation();
  document.body.dataset.gameOrientation = orientation;

  const huntGuard = document.getElementById('__hunt_orientation__');
  const shouldBlockHunt =
    state.phase === FLOW_PHASES.HUNT &&
    isMobileGameDevice() &&
    !orientationMatches('portrait');

  if (shouldBlockHunt) {
    (huntGuard || ensureHuntOrientationGuard()).style.display = 'flex';
  } else if (huntGuard) {
    huntGuard.style.display = 'none';
  }

  try {
    window.dispatchEvent(new CustomEvent('hirundu:orientation', {
      detail: {
        orientation,
        required: state.requiredOrientation,
        matches: orientationMatches(state.requiredOrientation),
        phase: state.phase,
      }
    }));
  } catch {}
}

function installOrientationWatch() {
  if (orientationWatchInstalled || typeof window === 'undefined') return;
  orientationWatchInstalled = true;
  window.addEventListener('resize', syncOrientationUI, { passive: true });
  window.addEventListener('orientationchange', syncOrientationUI, { passive: true });
  try {
    window.visualViewport?.addEventListener('resize', syncOrientationUI, { passive: true });
  } catch {}
}

export function setGameFlowPhase(phase, detail = {}) {
  state = {
    phase,
    level: detail.level ?? state.level ?? null,
    boss: detail.boss ?? null,
    requiredOrientation: requiredOrientationForPhase(phase),
  };

  if (typeof document !== 'undefined') {
    document.body.dataset.gamePhase = phase;
    if (state.requiredOrientation) {
      document.body.dataset.requiredOrientation = state.requiredOrientation;
    } else {
      document.body.removeAttribute('data-required-orientation');
    }
  }

  installOrientationWatch();
  syncOrientationUI();

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(FLOW_EVENT, { detail: getGameFlowState() }));
    } catch {}
  }

  return getGameFlowState();
}

export function watchRequiredOrientation(required, onChange) {
  if (typeof window === 'undefined') return () => undefined;

  const emit = () => {
    const current = getViewportOrientation();
    const mobile = isMobileGameDevice();
    const matches = !mobile || current === required;
    onChange?.({ required, current, mobile, matches });
  };

  window.addEventListener('resize', emit, { passive: true });
  window.addEventListener('orientationchange', emit, { passive: true });
  try {
    window.visualViewport?.addEventListener('resize', emit, { passive: true });
  } catch {}

  emit();

  return () => {
    window.removeEventListener('resize', emit);
    window.removeEventListener('orientationchange', emit);
    try { window.visualViewport?.removeEventListener('resize', emit); } catch {}
  };
}

export function clearGameFlow() {
  state = {
    phase: FLOW_PHASES.IDLE,
    level: null,
    boss: null,
    requiredOrientation: null,
  };
  if (typeof document !== 'undefined') {
    document.body.dataset.gamePhase = FLOW_PHASES.IDLE;
    document.body.removeAttribute('data-required-orientation');
    document.getElementById('__hunt_orientation__')?.remove();
  }
}
