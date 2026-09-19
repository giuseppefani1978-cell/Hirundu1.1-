import { copy } from './ui/copy.js';

export const FLOW_EVENT = 'hirundu:flow';
export const PAUSE_EVENT = 'hirundu:pause';
export const PERF_EVENT = 'hirundu:perf';
export const LANGUAGE_EVENT = 'hirundu:language';

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
  paused: false,
};

let orientationWatchInstalled = false;
let interruptionWatchInstalled = false;
let perfHandle = 0;
let perfRunning = false;
let perfLast = 0;
let perfFrames = 0;
let perfJank = 0;
let perfWorst = 0;
let perfWindowStart = 0;

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

export function isGamePaused() {
  return !!state.paused;
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
  guard.className = 'game-orientation-guard';
  const panel = document.createElement('div');
  panel.className = 'game-orientation-guard__panel';
  panel.innerHTML = `<div class="game-orientation-guard__icon">📱↕️</div><div>${copy.rotatePortrait || copy.huntOrientation}</div>`;
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

  if (shouldBlockHunt) (huntGuard || ensureHuntOrientationGuard()).style.display = 'flex';
  else if (huntGuard) huntGuard.style.display = 'none';

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
  try { window.visualViewport?.addEventListener('resize', syncOrientationUI, { passive: true }); } catch {}
}

function installInterruptionWatch() {
  if (interruptionWatchInstalled || typeof window === 'undefined' || typeof document === 'undefined') return;
  interruptionWatchInstalled = true;
  const pauseForInterruption = () => {
    if (![FLOW_PHASES.HUNT, FLOW_PHASES.BATTLE].includes(state.phase)) return;
    if (!state.paused) setGamePaused(true);
  };
  window.addEventListener('blur', pauseForInterruption);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseForInterruption();
  });
}

function pulsePhaseTransition(phase) {
  if (typeof document === 'undefined') return;
  document.body.classList.remove('game-phase-transition');
  void document.body.offsetWidth;
  document.body.dataset.transitionTo = phase;
  document.body.classList.add('game-phase-transition');
  window.setTimeout(() => document.body.classList.remove('game-phase-transition'), 360);
}

export function setGameFlowPhase(phase, detail = {}) {
  state = {
    ...state,
    phase,
    level: detail.level ?? state.level ?? null,
    boss: detail.boss ?? null,
    requiredOrientation: requiredOrientationForPhase(phase),
  };

  if (typeof document !== 'undefined') {
    document.body.dataset.gamePhase = phase;
    if (state.requiredOrientation) document.body.dataset.requiredOrientation = state.requiredOrientation;
    else document.body.removeAttribute('data-required-orientation');
    pulsePhaseTransition(phase);
  }

  installOrientationWatch();
  installInterruptionWatch();
  syncOrientationUI();

  if (typeof window !== 'undefined') {
    try { window.dispatchEvent(new CustomEvent(FLOW_EVENT, { detail: getGameFlowState() })); } catch {}
  }
  return getGameFlowState();
}

export function setGamePaused(paused) {
  const next = !!paused;
  if (state.paused === next) return getGameFlowState();
  state = { ...state, paused: next };
  if (typeof document !== 'undefined') document.body.classList.toggle('game-paused', next);
  if (typeof window !== 'undefined') {
    try { window.dispatchEvent(new CustomEvent(PAUSE_EVENT, { detail: { paused: next } })); } catch {}
  }
  return getGameFlowState();
}

export function toggleGamePaused() {
  return setGamePaused(!state.paused);
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
  try { window.visualViewport?.addEventListener('resize', emit, { passive: true }); } catch {}
  emit();
  return () => {
    window.removeEventListener('resize', emit);
    window.removeEventListener('orientationchange', emit);
    try { window.visualViewport?.removeEventListener('resize', emit); } catch {}
  };
}

function emitPerf(now) {
  const elapsed = Math.max(1, now - perfWindowStart);
  const fps = Math.round((perfFrames * 1000) / elapsed);
  const payload = { fps, jank: perfJank, worstFrameMs: Math.round(perfWorst), phase: state.phase, level: state.level };
  try { window.dispatchEvent(new CustomEvent(PERF_EVENT, { detail: payload })); } catch {}
  try { sessionStorage.setItem('hirundu_perf_last', JSON.stringify(payload)); } catch {}
  perfFrames = 0; perfJank = 0; perfWorst = 0; perfWindowStart = now;
}

function perfTick(ts) {
  if (!perfRunning) return;
  if (!perfWindowStart) perfWindowStart = ts;
  if (perfLast) {
    const delta = ts - perfLast;
    perfWorst = Math.max(perfWorst, delta);
    if (delta > 34) perfJank += 1;
  }
  perfLast = ts;
  perfFrames += 1;
  if (ts - perfWindowStart >= 2000) emitPerf(ts);
  perfHandle = window.requestAnimationFrame(perfTick);
}

export function startPerformanceMonitor() {
  if (perfRunning || typeof window === 'undefined') return;
  perfRunning = true;
  perfLast = 0; perfFrames = 0; perfJank = 0; perfWorst = 0; perfWindowStart = 0;
  perfHandle = window.requestAnimationFrame(perfTick);
}

export function stopPerformanceMonitor() {
  perfRunning = false;
  if (perfHandle) window.cancelAnimationFrame(perfHandle);
  perfHandle = 0;
}

export function clearGameFlow() {
  stopPerformanceMonitor();
  state = {
    phase: FLOW_PHASES.IDLE,
    level: null,
    boss: null,
    requiredOrientation: null,
    paused: false,
  };
  if (typeof document !== 'undefined') {
    document.body.dataset.gamePhase = FLOW_PHASES.IDLE;
    document.body.classList.remove('game-paused','game-phase-transition');
    document.body.removeAttribute('data-required-orientation');
    document.getElementById('__hunt_orientation__')?.remove();
  }
}
