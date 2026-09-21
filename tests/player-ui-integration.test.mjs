import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
const baselineHashes={"3": "e04397867ff08cea06539eb0194e454eaecbc442fabf59e170d171e4f994d101", "5": "ecb046b222574c4cacf1778262ff5113b8564eb4875c740b41658b40385d403c", "7": "90ffd66f740a5eadca6f668963766d0e8275fa50ae60dc71a0a968d0b42266be", "4": "8bcb020aa163bd4c262e619eae0a4c525a411f3934a6ec609ce019b84a884a58", "6": "ae3bfdb8b00c76677c956070a8bc93e3fd3cdc8be1f263414af88526ab0b303d", "8": "315accb60b55e824848f12ec0d467f98af8b23fcff68c2c309b890c31c31e086"};
for(const id of [3,5,7,4,6,8]){
 const family=[3,5,7].includes(id)?'arkanoid':'flight',file=`public/level${id}-${family}/game.js`;
 test(`A03/A04 level ${id}: preserve existing engine, clue reader pauses without reset`,()=>{
  const now=readFileSync(file,'utf8');
  const split=now.indexOf('\n// A04: reuse Pause');
  const engine=now.slice(0,split).replace(/^  window\.HirunduScenery\?\.draw\(ctx,x,y,dw,dh,S\.clock\); \/\/ A06 scenery-only hook\n/m,'').replace(/^    window\.HirunduScenery\?\.draw\(ctx,nextX,scenicOffset-travel\*2,dw,dh,S\.clock\); \/\/ A06 scenery-only hook\n/m,'');
  assert.equal(createHash('sha256').update(engine).digest('hex'),baselineHashes[id],'Existing physics and flow must stay byte-identical, excluding the two exact decorative A06 draw calls');
  const adapter=now.slice(split);
  let paused=0;
  const state={mode:family==='arkanoid'?'flying':'playing'};
  const nodes={cardHelp:{textContent:''},detail:{textContent:''}};
  const win={};
  new Function('window','state','S','pause','$',adapter)(win,state,state,()=>{paused++;state.mode='paused';},id=>nodes[id]);
  assert.equal(win.hirunduReadQuestion('Complete clue'),true);assert.equal(paused,1);assert.equal(state.mode,'paused');
  assert.equal(nodes[family==='arkanoid'?'cardHelp':'detail'].textContent,'Complete clue');
  state.mode='battle';assert.equal(win.hirunduReadQuestion('No'),false);assert.equal(paused,1);
  const html=readFileSync(`public/level${id}-${family}/index.html`,'utf8');
  assert.match(html,/shared\/player-ui.css/);assert.match(html,/shared\/question-reader.js/);
 });
}
test('clue reader respects cover, language and battle state; focus goes to Resume',async()=>{
 const d=new JSDOM('<html lang="fr"><body><section class="question"><p id="question">Long clue</p></section><div id="cover" class="hidden"><button id="play">Resume</button></div></body></html>',{runScripts:'outside-only'});
 const doc=d.window.document;
 d.window.hirunduReadQuestion=clue=>{assert.equal(clue,'Long clue');doc.getElementById('cover').className='';return true;};
 d.window.eval(readFileSync('public/shared/question-reader.js','utf8'));
 const button=doc.querySelector('.hirundu-question-reader');assert.equal(button.hidden,false);assert.match(button.getAttribute('aria-label'),/Lire/);button.click();assert.equal(doc.activeElement.id,'play');
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(button.hidden,true);
 d.window.close();
});
test('A04 shared stylesheet cannot resize canvas or move the paddle or HUD',()=>{
 const css=readFileSync('public/shared/player-ui.css','utf8');
 assert.doesNotMatch(css,/(?:canvas|#arena|#microPad|#progress|\.battle-controls)\s*\{/);
});
