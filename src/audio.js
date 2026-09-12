import { withBase } from './utils/basePath.js';
// src/audio.js
// ========================================================
// Audio minimaliste : musique, sfx, finale (sans accès DOM)
// ========================================================

let audioCtx = null;
let masterGain = null;

let musicOn = false;
let huntTrack = null;
let loopTimer = null;
let finaleLoopTimer = null;
let musicRequest = 0;
const musicVoices = new Set();
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

export async function startMusic() {
  if (isMusicOn()) return;
  const request = ++musicRequest;
  try {
    if (!huntTrack) {
      huntTrack = new window.Audio(withBase('assets/hunt_loop.wav'));
      huntTrack.loop = true;
      huntTrack.volume = 0.65;
      huntTrack.preload = 'auto';
      for (const event of ['playing','pause','ended','error']) huntTrack.addEventListener(event, notifyAudioState);
    }
    musicOn = true;
    await huntTrack.play();
    if (request !== musicRequest) return;
  } catch (error) {
    if (request === musicRequest) musicOn = false;
    console.warn('Hunt audio unavailable', error);
  } finally { notifyAudioState(); }
}

export function stopMusic() {
  ++musicRequest;
  musicOn = false;
  huntTrack?.pause();
  if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
  musicVoices.forEach((o) => { try { o.stop(); } catch {} });
  musicVoices.clear();
  notifyAudioState();
}

export async function toggleMusic() {
  if (isMusicOn()) stopMusic(); else await startMusic();
}

export function isMusicOn() { return musicOn && !!huntTrack && !huntTrack.paused && !huntTrack.error; }

// ---------- Finale longue ----------
export function playFinaleLong() {
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
  _wasPlayingBeforeBattle = musicOn === true;
  // coupe SEULEMENT la boucle (pas le contexte, sinon plus de SFX)
  stopMusic();
  stopFinaleLoop();
}

/** Réactive la musique de fond si elle était active avant la battle */
export async function resumeBgAfterBattle() {
  if (_wasPlayingBeforeBattle) {
    try { await startMusic(); } catch {}
  }
  _wasPlayingBeforeBattle = false;
}

// Expose en global pour battle.js
if (typeof window !== 'undefined') {
  window.__STOP_BG_MUSIC   = () => pauseBgForBattle();
  window.__RESUME_BG_MUSIC = () => resumeBgAfterBattle();
}

// ---------- Export bruts si besoin dans d'autres modules ----------
export { audioCtx, masterGain };
