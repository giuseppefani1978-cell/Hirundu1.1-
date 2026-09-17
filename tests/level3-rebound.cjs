const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),storage=new Map();
const ctx=new Proxy({measureText:s=>({width:s.length*10})},{get:(o,k)=>o[k]||(()=>{})});
function element(id){if(!elements.has(id))elements.set(id,{textContent:'',value:'fr',options:[{},{},{}],classList:{add(){},remove(){},toggle(){}},style:{},setAttribute(){},addEventListener(){},focus(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:390,height:540}),getContext:()=>ctx});return elements.get(id)}
const sandbox={console,document:{getElementById:element,documentElement:{},body:{classList:{add(){},remove(){},toggle(){}}},addEventListener(){}},navigator:{language:'en'},Image:class{set src(v){this.complete=true;this.naturalWidth=1024;this.naturalHeight=1536;this.onload()}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},URLSearchParams,devicePixelRatio:2,addEventListener(){},requestAnimationFrame(){},location:{reload(){},search:'',origin:'https://example.test'},Math};
sandbox.window=sandbox;sandbox.parent=sandbox;
vm.createContext(sandbox);for(const f of ['hunt-model.js','places.js','battle.js','game.js'])vm.runInContext(fs.readFileSync('public/level3-arkanoid/'+f,'utf8'),sandbox);
const run=s=>vm.runInContext(s,sandbox);
(async()=>{await new Promise(r=>setImmediate(r));run('start()');assert.equal(run('state.mode'),'ready');
run('launch()');assert.equal(run('state.mode'),'flying');const launchY=run('state.ball.y');run('step(.1)');assert.ok(run('state.ball.y')<launchY);
run('state.mode="flying";state.paddle=300;state.paddleTarget=520;state.paddleV=0;step(.01)');assert.ok(run('state.paddle>300&&state.paddle<520'),'paddle eases toward target');
run('pause()');const y=run('state.ball.y');run('step(1)');assert.equal(run('state.ball.y'),y);run('resume()');assert.equal(run('state.mode'),'flying');
run('state.ball={x:300,y:PY-R-1,vx:0,vy:450};state.paddle=300;step(.01)');assert.ok(run('state.ball.vy')<0,'paddle bounce');
run('state.ball={x:20,y:H+R+1,vx:0,vy:450};step(.01)');assert.equal(run('state.mode'),'ready','miss is recoverable');assert.equal(run('state.misses'),1);
run('launch();hitTarget(state.targets.find(t=>t.id!==active()))');assert.equal(run('state.found.length'),0);assert.equal(run('state.hinted'),true);
for(let round=0;round<10;round++){
 assert.equal(run('state.round'),round);assert.equal(run('new Set(state.targets.map(t=>t.id)).size'),3);
 assert.equal(run('state.targets.filter(t=>t.id===active()).length'),1);
 run('state.cooldown=0;hitTarget(state.targets.find(t=>t.id===active()))');assert.equal(run('state.found.length'),round+1);run('step(1.6)');
}
assert.equal(run('state.mode'),'battleIntro');assert.equal(storage.get('hirundu_l3_seal'),undefined,'seal requires battle victory');assert.equal(run('state.score'),1000);
run('Battle.start()');assert.equal(run('state.mode'),'battle');assert.equal(run('Battle.data.ammo.stars'),10);
run('Battle.tick(1.6);Battle.action("special")');assert.equal(run('Battle.data.ammo.stars'),9);
run('pause()');let clock=run('Battle.data.time');run('step(1)');assert.equal(run('Battle.data.time'),clock);run('resume()');
run('Battle.data.player.hp=0;Battle.tick(.01)');assert.equal(run('state.mode'),'battleLost');run('Battle.start()');assert.equal(run('Battle.data.ammo.stars'),10,'retry restores hunt ammo');
run('Battle.tick(1.6);Battle.data.boss.hp=0;Battle.tick(.01);Battle.tick(1.6)');assert.equal(run('state.mode'),'won');assert.equal(storage.get('hirundu_l3_seal'),'lecce');
run('start()');assert.equal(run('state.score'),0);assert.equal(run('state.found.length'),0);
for(const l of ['fr','en','it','es']){run(`lang='${l}';translated();draw()`);assert.ok(element('question').textContent.length>20)}
// Exercise 20,000 fixed physics steps with an imperfect moving paddle.
// Wall sections block access and persist between POI rounds.
run('state.bricks[0].alive=false;roundSetup()');assert.equal(run('state.bricks[0].alive'),false);
assert.ok(run('state.targets.every(t=>t.x===pin(t.id).x&&t.y===pin(t.id).y)'));
run('state.energy=50;collectBonus({kind:"coffee",x:0,y:0});collectBonus({kind:"rustico",x:0,y:0});collectBonus({kind:"pasticciotto",x:0,y:0})');
assert.equal(run('state.food.coffee'),1);assert.equal(run('state.focus'),7);assert.equal(run('state.shield'),8);assert.equal(run('state.energy'),100);
run('state.enemies=[{kind:"crow",x:state.ball.x,y:state.ball.y,phase:0,vx:0,life:5}];huntExtras(.01)');assert.equal(run('state.energy'),100,'shield blocks enemy damage');
run('state.invulnerable=0;state.shield=0;state.enemies=[{kind:"crow",x:state.ball.x,y:state.ball.y,phase:0,vx:0,life:5}];huntExtras(.01)');assert.equal(run('state.energy'),85);
run('launch()');for(let i=0;i<20000;i++){run(`state.paddle=300+200*Math.sin(${i}/90);step(1/240)`);if(run('state.mode')==='ready')run('launch()');if(['battleIntro','won'].includes(run('state.mode')))break;assert.ok(run('Number.isFinite(state.ball.x)&&Number.isFinite(state.ball.y)'))}
assert.ok(run('state.particles.length')<300);
// Validate real projectile contact, special ammo and a complete simulated duel.
run('state.found=ids.slice();state.food={coffee:0,rustico:1,pasticciotto:0};battleIntro();Battle.start();Battle.tick(1.6);Battle.action("special")');
assert.equal(run('Battle.data.shots.length'),2);assert.equal(run('Battle.data.ammo.rustico'),0);
run('Battle.data.player.inv=1000');
for(let i=0;i<7200&&run('state.mode')==='battle';i++){if(i%18===0)run('Battle.action("normal")');run('step(1/120)')}
assert.equal(run('state.mode'),'won','ordinary projectiles can complete the battle');
run('start();launch();state.bricks=[{x:200,y:476,w:75,h:30,alive:true}];state.ball={x:240,y:522,vx:0,vy:-400}');
for(let i=0;i<20;i++)run('step(1/240)');assert.equal(run('state.bricks[0].alive'),false,'wall broken by contact');assert.ok(run('state.ball.vy')>0,'wall reflects bird');

// Responsive geometry keeps every target on its map position and the paddle in view.
for(const [width,height] of [[390,610],[430,740],[820,660],[700,300]]){
 element('game').getBoundingClientRect=()=>({left:0,top:0,width,height});
 run('resize()');
 assert.ok(run('PY+17<H'));
 assert.ok(run('state.targets.every(t=>Math.abs(t.x-pin(t.id).x)<.001&&Math.abs(t.y-pin(t.id).y)<.001)'));
 assert.ok(run('mapViewport().w<=W+.001&&mapViewport().h<=H+.001'));
}
run('state.mode="ready";state.paddle=100;state.paddleTarget=500;state.paddleV=0');
for(let i=0;i<36;i++)run('step(1/240)');
assert.ok(run('Math.abs(state.paddle-500)<4'),'paddle tracks within 150 ms without overshoot');
run('touchX=200;touchTarget=300;pointer({clientX:200,pointerType:"touch"})');
assert.equal(run('state.paddleTarget'),300,'touch starts without a position jump');
run('pointer({clientX:220,pointerType:"touch"})');
assert.ok(run('state.paddleTarget>300'),'relative drag moves paddle');

run('start();launch()');
assert.ok(Math.abs(run('Math.hypot(state.ball.vx,state.ball.vy)')-297.5)<.001,'level 3 stays at Slow speed');
run('state.bonuses=[];state.enemies=[];spawnBonus();spawnEnemy()');
assert.equal(run('state.bonuses[0].life'),4,'classic bonus lifetime');
assert.equal(run('state.enemies[0].life'),16,'classic enemy lifetime');
assert.ok(run('Number.isFinite(state.enemies[0].vy)'));
for(let i=0;i<10;i++)run('spawnEnemy()');
assert.equal(run('state.enemies.length'),3,'classic enemy limit');
assert.ok(!fs.readFileSync('public/level3-arkanoid/index.html','utf8').includes('id="pace"'),'no higher speed options');

// Powers: independent effects, capped healing, refresh, pause, expiry and single pickup.
run('start();state.energy=40;collectBonus({kind:"coffee",x:1,y:1})');
assert.equal(run('state.energy'),70);assert.equal(run('state.focus'),0,'coffee does not slow flight');
run('collectBonus({kind:"pasticciotto",x:1,y:1});collectBonus({kind:"rustico",x:1,y:1});launch();step(1/240)');
assert.equal(run('state.energy'),90);
assert.ok(Math.abs(run('Math.hypot(state.ball.vx,state.ball.vy)')-238)<.001,'pasticciotto slows base flight 20 percent');
assert.ok(element('effect').textContent.includes('◉')&&element('effect').textContent.includes('◷'),'both powers visible');
const frozen=run('[state.focus,state.shield].join()');run('pause();step(10)');assert.equal(run('[state.focus,state.shield].join()'),frozen);run('resume()');
run('state.enemies=[];state.bonuses=[];state.spawnIn=100;state.enemyIn=100;huntExtras(8.1);step(1/240)');
assert.equal(run('state.shield'),0);assert.equal(run('state.focus'),0);
assert.ok(Math.abs(run('Math.hypot(state.ball.vx,state.ball.vy)')-297.5)<.001,'normal slow speed restored');
run('state.focus=2;state.shield=2;collectBonus({kind:"pasticciotto",x:1,y:1});collectBonus({kind:"rustico",x:1,y:1})');
assert.equal(run('state.focus'),7);assert.equal(run('state.shield'),8);assert.equal(run('state.energy'),100);
run('globalThis.pickup={kind:"coffee",x:1,y:1};collectBonus(pickup)');const count=run('state.food.coffee');run('collectBonus(pickup)');assert.equal(run('state.food.coffee'),count);
run('start()');assert.equal(run('state.focus+state.shield+state.recharge'),0);assert.equal(element('effect').textContent,'');

// Mobile orientation gate, paused rotation, and explicit battle flight inputs.
sandbox.matchMedia=q=>({matches:q==='(pointer: coarse)',addEventListener(){}});
run('state.found=ids.slice();battleIntro();Battle.start()');
assert.equal(run('state.mode'),'battleIntro','portrait cannot skip the introduction');
assert.equal(element('play').disabled,true);
sandbox.matchMedia=q=>({matches:q==='(pointer: coarse)'||q==='(orientation: landscape)',addEventListener(){}});
run('syncBattleOrientation()');assert.equal(element('play').disabled,false);
assert.equal(run('state.mode'),'battleIntro','rotation alone does not start combat');
run('Battle.start();Battle.tick(1.6);Battle.action("jump")');
for(let i=0;i<35;i++)run('step(1/240)');
assert.ok(run('Battle.data.player.y')<420,'wingbeat lifts the bird');
run('Battle.data.player.flapCooldown=0;Battle.action("jump")');assert.ok(run('Battle.data.player.targetVy')<0,'wingbeat works in midair');
run('Battle.action("dive")');assert.ok(run('Battle.data.player.targetVy')>0,'dive points downward');
run('Battle.action("dodge")');assert.ok(run('Battle.data.player.inv')>0,'dodge briefly protects bird');
run('Battle.data.player.dodge=0;Battle.data.player.vx=0;keys.add("ArrowRight");step(1/240)');
assert.ok(run('Battle.data.player.vx>0&&Battle.data.player.vx<300'),'horizontal acceleration eases in');
run('keys.clear()');for(let i=0;i<240;i++)run('step(1/240)');
assert.equal(run('Battle.data.player.vx'),0,'horizontal release settles');
sandbox.matchMedia=q=>({matches:q==='(pointer: coarse)',addEventListener(){}});
run('syncBattleOrientation()');assert.equal(run('state.mode'),'paused','portrait rotation pauses battle');
const preserved=run('Battle.data.time');run('resume();step(1)');assert.equal(run('Battle.data.time'),preserved,'portrait cannot resume battle');
sandbox.matchMedia=q=>({matches:q==='(pointer: coarse)'||q==='(orientation: landscape)',addEventListener(){}});
run('syncBattleOrientation();resume()');assert.equal(run('state.mode'),'battle');
assert.equal(run('HUNT_MODEL.intendedLevels.join()'),'3,5,7');

console.log('PASS: launch, paddle collision, miss/relaunch, pause, wrong answer, 10 rounds, collection, restart, four languages, fixed-speed simulation, anchored POIs, persistent walls, food effects, enemy collisions, battle ammo/retry/pause/victory.');
})().catch(e=>{console.error(e);process.exitCode=1});
