import test from 'node:test';
import assert from 'node:assert/strict';

function audioWindow() {
 const host = new EventTarget();
 class Context {
  state = 'suspended'; currentTime = 0; destination = {};
  resume() { this.state = 'running'; this.onstatechange?.(); return Promise.resolve(); }
  createGain() { return {gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return this},disconnect(){}}; }
  createBuffer() { return {}; }
  createBufferSource() { return {connect(){},start(){}}; }
  createOscillator() { return {frequency:{value:0},connect(){return this},start(){},stop(){},disconnect(){}}; }
 }
 host.AudioContext = Context;
 globalThis.window = host;
 return host;
}

test('music can resume after interruption with one gesture; status reflects the audio context', async () => {
 audioWindow();
 const audio = await import('../src/audio.js?interruption');
 try {
  await audio.startMusic();
  assert.equal(audio.isMusicOn(),true);
  audio.audioCtx.state = 'interrupted';
  assert.equal(audio.isMusicOn(),false);
  await audio.toggleMusic();
  assert.equal(audio.isMusicOn(),true);
  await audio.toggleMusic();
  assert.equal(audio.isMusicOn(),false);
 } finally { audio.stopMusic(); }
});

test('leaving a hunt cancels a pending audio start', async () => {
 audioWindow();
 const audio = await import('../src/audio.js?cancel');
 try {
  const pending = audio.startMusic();
  audio.stopMusic();
  await pending;
  assert.equal(audio.isMusicOn(),false);
 } finally { audio.stopMusic(); }
});

test('missing audio support does not crash pickup effects', async () => {
 globalThis.window = new EventTarget();
 const audio = await import('../src/audio.js?unavailable');
 assert.doesNotThrow(() => audio.ping());
 assert.doesNotThrow(() => audio.starEmphasis());
 assert.doesNotThrow(() => audio.failSfx());
 assert.equal(audio.isMusicOn(),false);
});
