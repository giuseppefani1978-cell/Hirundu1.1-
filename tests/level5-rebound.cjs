const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),storage=new Map();
const ctx=new Proxy({measureText:s=>({width:String(s).length*10})},{get:(o,k)=>o[k]||(()=>{})});
function element(id){
  if(!elements.has(id))elements.set(id,{
    textContent:'',value:'fr',options:[{},{},{}],hidden:false,disabled:false,
    classList:{add(){},remove(){},toggle(){}},style:{},parentElement:{setAttribute(){}},
    setAttribute(){},addEventListener(){},focus(){},setPointerCapture(){},
    getBoundingClientRect:()=>({left:0,top:0,width:390,height:650}),getContext:()=>ctx
  });
  return elements.get(id);
}
const sandbox={
  console,
  document:{
    getElementById:element,documentElement:{},
    body:{classList:{add(){},remove(){},toggle(){}}},
    addEventListener(){},modelContext:null
  },
  navigator:{language:'en'},
  Image:class{
    constructor(){this.naturalWidth=0;this.naturalHeight=0;}
    set src(v){
      this._src=v;
      if(!fs.existsSync('public/level5-arkanoid/'+v.replace(/^\.\//,'')) && v.startsWith('../assets/')){
        const asset='public/assets/'+decodeURIComponent(v.replace('../assets/',''));
        if(!fs.existsSync(asset)){queueMicrotask(()=>this.onerror?.(new Error('Missing asset '+asset)));return;}
      }
      this.complete=true;this.naturalWidth=1024;this.naturalHeight=1536;queueMicrotask(()=>this.onload?.());
    }
    get src(){return this._src;}
  },
  localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,String(v))},
  URLSearchParams,devicePixelRatio:2,
  addEventListener(){},requestAnimationFrame(){},
  location:{reload(){},search:'',origin:'https://example.test'},
  Math,performance:{now:()=>0}
};
sandbox.window=sandbox;sandbox.parent=sandbox;
sandbox.matchMedia=()=>({matches:false,addEventListener(){}});
vm.createContext(sandbox);
for(const f of ['hunt-model.js','places.js','battle.js','game.js']){
  vm.runInContext(fs.readFileSync('public/level5-arkanoid/'+f,'utf8'),sandbox,{filename:f});
}
const run=s=>vm.runInContext(s,sandbox);
(async()=>{
  await new Promise(r=>setImmediate(r));
  assert.equal(run('state.assetsReady'),true,'all Level 5 assets load');
  run('start()');
  assert.equal(run('state.mode'),'ready');
  assert.equal(run('state.bricks.length'),24,'Level 5 has three wall rows');
  assert.equal(run('new Set(state.bricks.map(b=>Math.round(b.y))).size'),3,'wall rows occupy three heights');
  assert.equal(run('ids.length'),10);
  for(const l of ['fr','en','it','es']){
    run(`lang='${l}';translated()`);
    assert.ok(element('question').textContent.length>15,'translated clue present');
  }
  run('lang="fr";translated();launch()');
  const y=run('state.ball.y');run('step(.1)');assert.ok(run('state.ball.y')<y,'bird launches');
  for(let round=0;round<10;round++){
    run('state.cooldown=0;hitTarget(state.targets.find(t=>t.id===active()))');
    run('step(1.6)');
  }
  assert.equal(run('state.mode'),'battleIntro');
  assert.equal(run('state.found.length'),10);
  run('Battle.start()');
  assert.equal(run('state.mode'),'battle');
  assert.equal(run('Battle.data.boss.hp'),240,'Scirocco starts tougher than L3');
  assert.equal(run('Battle.data.ammo.stars'),10);
  run('Battle.tick(1.6);Battle.data.boss.hp=0;Battle.tick(.01);Battle.tick(1.6)');
  assert.equal(run('state.mode'),'won');
  assert.equal(storage.get('hirundu_l5_seal'),'capo');
  console.log('PASS: Level 5 rebound hunt boots, loads assets, uses 3 wall rows, completes 10 POIs and defeats Scirocco.');
})().catch(e=>{console.error(e);process.exitCode=1});
