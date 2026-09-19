import { withBase } from './utils/basePath.js';
import { syncDurableProgress } from './progressStorage.js';
// src/audio.js
// ========================================================
// Audio minimaliste : musique, sfx, finale (sans accès DOM)
// ========================================================

let audioCtx = null;
let masterGain = null;

const MUSIC_PREF_KEY = 'hirundu_music_v1';
let musicOn = false;

function isMusicPreferenceEnabled() {
  try { return localStorage.getItem(MUSIC_PREF_KEY) !== 'off'; } catch { return true; }
}

function setMusicPreference(enabled) {
  try {
    localStorage.setItem(MUSIC_PREF_KEY, enabled ? 'on' : 'off');
    syncDurableProgress();
  } catch {}
}
let huntTrack = null;
let loopTimer = null;
let finaleLoopTimer = null;
let musicRequest = 0;
let huntFadeTimer = 0;
const musicVoices = new Set();

function clearHuntFade() {
  if (huntFadeTimer) {
    window.clearInterval(huntFadeTimer);
    huntFadeTimer = 0;
  }
}

function fadeTrack(track, from, to, duration = 420, onDone) {
  if (!track || typeof window === 'undefined') { onDone?.(); return; }
  clearHuntFade();
  const steps = 10;
  let step = 0;
  try { track.volume = Math.max(0, Math.min(1, from)); } catch {}
  huntFadeTimer = window.setInterval(() => {
    step += 1;
    const p = Math.min(1, step / steps);
    try { track.volume = Math.max(0, Math.min(1, from + (to - from) * p)); } catch {}
    if (p >= 1) {
      clearHuntFade();
      onDone?.();
    }
  }, Math.max(20, Math.round(duration / steps)));
}
export const AUDIO_STATE_EVENT = 'hirundu:audio-state';
function notifyAudioState() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUDIO_STATE_EVENT));
}

// ---------- Init ----------
export function createAudioOnce() {
  if (audioCtx) {
    if (audioCtx.state !== 'running') audioCtx.resume().catch(() => {});
    return;
  }
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.onstatechange = notifyAudioState;
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.58;
  masterGain.connect(audioCtx.destination);

  // iOS unlock (zéro buffer bidon pour débloquer l’AudioContext)
  const b = audioCtx.createBuffer(1, 1, 22050);
  const s = audioCtx.createBufferSource();
  s.buffer = b;
  s.connect(masterGain);
  s.start(0);
  audioCtx.resume().catch(() => {});
}

// ---------- Ensure Contexte actif ----------
function ensureCtxActive() {
  try {
    if (!audioCtx) createAudioOnce();
    if (audioCtx.state !== 'running') audioCtx.resume().catch(notifyAudioState);
    return true;
  } catch {
    notifyAudioState();
    return false;
  }
}

// ---------- Utils osc carrée ----------
function scheduleSquare(freq, start, dur = 0.25, amp = 0.30, music = false) {
  if (!audioCtx || !masterGain) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.value = freq;
  g.gain.setValueAtTime(amp, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g).connect(masterGain);
  if (music) {
    musicVoices.add(o);
    o.onended = () => { musicVoices.delete(o); o.disconnect(); g.disconnect(); };
  } else {
    o.onended = () => { o.disconnect(); g.disconnect(); };
  }
  o.start(start);
  o.stop(start + dur);
}

// ---------- SFX publics ----------
export function ping(freq = 440, amp = 0.2) {
  if (!ensureCtxActive() || !audioCtx || !masterGain) return;
  const t = audioCtx.currentTime;
  scheduleSquare(freq, t, 0.16, amp);
}

export function starEmphasis() {
  if (!ensureCtxActive() || !audioCtx || !masterGain) return;
  const base = audioCtx.currentTime;
  [784, 880, 988, 1175].forEach((f, i) =>
    scheduleSquare(f, base + i * 0.08, 0.18, 0.46)
  );
}

export function failSfx() {
  if (!ensureCtxActive() || !audioCtx || !masterGain) return;
  const t = audioCtx.currentTime;
  scheduleSquare(196, t, 0.20, 0.42);
  scheduleSquare(165, t + 0.18, 0.20, 0.36);
  scheduleSquare(147, t + 0.34, 0.25, 0.32);
}

// Short synthetic swallow-like chirp: two quick frequency sweeps, deliberately subtle.
export function birdChirp(mode = 'soft') {
  if (!ensureCtxActive() || !audioCtx || !masterGain) return;
  const t = audioCtx.currentTime + 0.005;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(mode === 'bright' ? 0.075 : 0.045, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
  gain.connect(masterGain);

  const makeSweep = (start, from, to, dur, amp = 1) => {
    const osc = audioCtx.createOscillator();
    const local = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + dur);
    local.gain.setValueAtTime(amp, start);
    local.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(local).connect(gain);
    osc.start(start);
    osc.stop(start + dur + 0.01);
    osc.onended = () => { try { osc.disconnect(); local.disconnect(); } catch {} };
  };

  makeSweep(t, mode === 'bright' ? 1700 : 1450, 2650, 0.09, 0.9);
  makeSweep(t + 0.075, 2200, 1350, 0.11, 0.7);
}

function fadeMediaVolume(media, to, duration = 420, onDone) {
  if (!media) { onDone?.(); return; }
  const token = ++fadeToken;
  const from = Number.isFinite(media.volume) ? media.volume : 0;
  const started = performance.now();
  const step = (now) => {
    if (token !== fadeToken || !media) return;
    const p = Math.min(1, Math.max(0, (now - started) / Math.max(1, duration)));
    media.volume = Math.max(0, Math.min(1, from + (to - from) * p));
    if (p < 1) requestAnimationFrame(step);
    else onDone?.();
  };
  requestAnimationFrame(step);
}

// ---------- Musique (boucle courte) ----------
function playPhrase() {
  if (!musicOn || !audioCtx) return;
  const notes = [262, 294, 330, 349, 392, 440, 494, 523];
  let t = audioCtx.currentTime;
  notes.forEach(f => {
    scheduleSquare(f, t, 0.24, 0.28, true);
    t += 0.28;
  });
  loopTimer = setTimeout(playPhrase, 2800);
}

export async function startMusic({ fadeInMs = 0, force = false } = {}) {
  if (!force && !isMusicPreferenceEnabled()) { notifyAudioState(); return; }
  if (isMusicOn()) return;
  const request = ++musicRequest;
  try {
    if (!huntTrack) {
      huntTrack = new window.Audio(withBase('assets/hunt_loop.wav'));
      huntTrack.loop = true;
      huntTrack.volume = fadeInMs > 0 ? 0 : 0.65;
      huntTrack.preload = 'auto';
      for (const event of ['playing','pause','ended','error']) huntTrack.addEventListener(event, notifyAudioState);
    }
    musicOn = true;
    await huntTrack.play();
    if (request !== musicRequest) return;
    if (fadeInMs > 0) fadeTrack(huntTrack, 0, 0.65, fadeInMs);
  } catch (error) {
    if (request === musicRequest) musicOn = false;
    console.warn('Hunt audio unavailable', error);
  } finally { notifyAudioState(); }
}

export function stopMusic() {
  ++musicRequest;
  clearHuntFade();
  musicOn = false;
  huntTrack?.pause();
  if (huntTrack) huntTrack.volume = 0.65;
  if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
  musicVoices.forEach((o) => { try { o.stop(); } catch {} });
  musicVoices.clear();
  notifyAudioState();
}

export async function toggleMusic() {
  if (isMusicOn()) {
    setMusicPreference(false);
    stopMusic();
  } else {
    setMusicPreference(true);
    await startMusic({ force: true });
  }
}

export function isMusicOn() { return musicOn && !!huntTrack && !huntTrack.paused && !huntTrack.error; }

// ---------- Finale longue ----------
export function playFinaleLong() {
  if (!isMusicPreferenceEnabled()) { stopMusic(); return; }
  stopMusic();
  if (!ensureCtxActive() || !audioCtx || !masterGain) return;

  // on coupe la boucle courte si active
  if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
  musicOn = false;

  const t0 = (audioCtx.currentTime || 0) + 0.05;
  const seq1 = [523, 659, 784, 988, 1175, 1319];
  const seq2 = [1319, 1175, 988, 784, 659, 523];
  const chord = [523, 659, 784];

  let t = t0;
  seq1.forEach((f, i) => scheduleSquare(f, t + i * 0.14, 0.24, 0.58));
  t += seq1.length * 0.14 + 0.12;

  seq2.forEach((f, i) => scheduleSquare(f, t + i * 0.14, 0.24, 0.52));
  t += seq2.length * 0.14 + 0.24;

  chord.forEach(f => scheduleSquare(f,   t, 1.0, 0.50)); t += 1.05;
  chord.forEach(f => scheduleSquare(f*2, t, 1.0, 0.48));

  // relance périodique de la finale
  finaleLoopTimer = setTimeout(playFinaleLong, 10500);
}

export function stopFinaleLoop() {
  if (finaleLoopTimer) { clearTimeout(finaleLoopTimer); finaleLoopTimer = null; }
}

// ---------- Reset global (utile quand on relance une partie) ----------
export function resetAudioForNewGame() {
  stopFinaleLoop();
}

// ---- Hooks battle : pause/reprise de la musique de fond ----
let _wasPlayingBeforeBattle = false;

/** Coupe la musique de fond (et la finale) pour laisser la place à la musique de battle */
export function pauseBgForBattle() {
  _wasPlayingBeforeBattle = isMusicOn();
  ++musicRequest;
  musicOn = false;
  if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
  musicVoices.forEach((o) => { try { o.stop(); } catch {} });
  musicVoices.clear();
  stopFinaleLoop();

  const track = huntTrack;
  if (track && !track.paused) {
    const startVolume = Number.isFinite(track.volume) ? track.volume : 0.65;
    fadeTrack(track, startVolume, 0, 420, () => {
      try { track.pause(); track.volume = 0.65; } catch {}
      notifyAudioState();
    });
  } else {
    notifyAudioState();
  }
}

/** Réactive la musique de fond avec un fondu si elle était active avant la battle */
export async function resumeBgAfterBattle() {
  if (_wasPlayingBeforeBattle) {
    try { await startMusic({ fadeInMs: 520 }); } catch {}
  }
  _wasPlayingBeforeBattle = false;
}

// Expose en global pour battle.js
if (typeof window !== 'undefined') {
  window.__STOP_BG_MUSIC   = () => pauseBgForBattle();
  window.__RESUME_BG_MUSIC = () => resumeBgAfterBattle();
  window.__HIRUNDU_CHIRP    = (mode) => birdChirp(mode);
  window.addEventListener('hirundu:pause', (event) => {
    if (!huntTrack || huntTrack.paused) return;
    const paused = Boolean(event.detail?.paused);
    const from = Number.isFinite(huntTrack.volume) ? huntTrack.volume : 0.65;
    fadeTrack(huntTrack, from, paused ? 0.14 : 0.65, 220);
  });
}

// ---------- Export bruts si besoin dans d'autres modules ----------
export { audioCtx, masterGain };
