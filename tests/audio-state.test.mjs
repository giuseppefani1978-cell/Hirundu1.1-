import test from 'node:test';
import assert from 'node:assert/strict';

function audioWindow() {
 const host = new EventTarget();
 globalThis.document={baseURI:'https://example.test/Hirundu1.1-/'};
 class Track extends EventTarget {
  static latest; paused=true; error=null;
  constructor(url) {super();this.url=url;Track.latest=this;}
  play() {this.paused=false;return Promise.resolve();}
  pause() {this.paused=true;}
 }
 host.Audio=Track;globalThis.window=host;return Track;
}

test('hunt music uses its own loop file and resumes with one gesture after a pause', async () => {
 const Track=audioWindow();const audio=await import('../src/audio.js?interruption');
 try {
  await audio.startMusic();
  assert.equal(Track.latest.url,'/Hirundu1.1-/assets/hunt_loop.wav');
  assert.equal(Track.latest.loop,true);
  assert.equal(audio.isMusicOn(),true);
  Track.latest.pause();assert.equal(audio.isMusicOn(),false);
  await audio.toggleMusic();assert.equal(audio.isMusicOn(),true);
  await audio.toggleMusic();assert.equal(audio.isMusicOn(),false);
 } finally {audio.stopMusic();}
});

test('leaving a hunt cancels a pending audio start',async()=>{
 audioWindow();const audio=await import('../src/audio.js?cancel');
 const pending=audio.startMusic();audio.stopMusic();await pending;
 assert.equal(audio.isMusicOn(),false);
});

test('missing audio support does not crash pickup effects',async()=>{
 globalThis.window=new EventTarget();const audio=await import('../src/audio.js?unavailable');
 assert.doesNotThrow(()=>audio.ping());assert.doesNotThrow(()=>audio.starEmphasis());assert.doesNotThrow(()=>audio.failSfx());
});
