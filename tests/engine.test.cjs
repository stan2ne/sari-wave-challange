const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../engine.js');

test('iki temanın 18 ana bölümü de tamamlanabilir', () => {
  for (const theme of ['yellow','red']) {
    const levels = engine.levels(theme).filter(level=>level.kind==='campaign');
    assert.equal(new Set(levels.map(level => level.name)).size, 18);
    for (const level of levels) {
      let run = {...engine.initial(1),phase:'playing'};
      const hazards = engine.obstacles(level);
      const energy = engine.energies(level);
      for (let frame=0; frame<240*200 && run.phase==='playing'; frame++) {
        const target = engine.corridor(level,run.x+level.speed*engine.modeAt(level,run.x).speed/240).center;
        run = engine.step(run,level,(run.y>target)!==engine.modeAt(level,run.x).inverted,1/240,false,hazards,energy);
      }
      assert.equal(run.phase,'won',`${theme}: ${level.name} tamamlanabilmeli`);
      assert.equal(run.collected.length,3);
    }
  }
});
test('iki temada 2500 kalıcı kimlik ve farklı deterministik parkur var',()=>{
  for(const theme of ['red','yellow']){
    const levels=engine.levels(theme);
    assert.equal(levels.length,2500);
    assert.equal(new Set(levels.map(level=>level.name)).size,2500);
    assert.equal(new Set(levels.map(level=>level.seed)).size,2500);
    assert.deepEqual(levels,engine.levels(theme));
    assert.deepEqual(levels.map(level=>level.id),Array.from({length:2500},(_,id)=>id));
    assert.equal(levels.filter(level=>level.kind==='campaign').length,18);
    assert.equal(levels.filter(level=>level.kind==='expedition').length,2482);
    const fingerprints=levels.map(level=>JSON.stringify([level.length,level.half,...Array.from({length:12},(_,index)=>engine.corridor(level,level.length*(index+.27)/12).center)]));
    assert.equal(new Set(fingerprints).size,2500);
  }
});
test('Grief tüm keşiflerin hız, eğim ve daralma zorluğunun üzerinde kalır',()=>{
  for(const theme of ['red','yellow']){
    const levels=engine.levels(theme);
    const grief=levels[17];
    const fastest=grief.speed*Math.max(...grief.sectionModes.map(mode=>mode.speed));
    for(const level of levels){
      assert.ok(level.district.length>0);
      assert.ok(level.sectionModes.every(mode=>Number.isFinite(mode.speed)&&mode.speed<=1.8));
      if(level.id===17)continue;
      assert.ok(level.half>=24,level.name);
      assert.ok(level.speed*Math.max(...level.sectionModes.map(mode=>mode.speed))<=fastest,level.name);
      assert.ok(Math.max(...level.sectionSlopes)<=grief.slope,level.name);
      assert.ok(engine.duration(level)<engine.duration(grief),level.name);
      for(let sample=0;sample<=64;sample++){
        const bounds=engine.corridor(level,level.length*sample/64);
        assert.ok(Number.isFinite(bounds.top)&&Number.isFinite(bounds.bottom),level.name);
        assert.ok(bounds.top<bounds.center&&bounds.bottom>bounds.center,level.name);
        if(level.kind==='expedition')assert.ok((bounds.bottom-bounds.top)/2>=24,level.name);
      }
    }
  }
});
test('her kademeden ve portal düzeninden keşifler simülasyonda kazanılır',()=>{
  for(const theme of ['red','yellow']){
    const levels=engine.levels(theme).filter(level=>level.kind==='expedition');
    for(let tier=0;tier<=16;tier++)for(let pattern=0;pattern<6;pattern++){
      const level=levels.find(candidate=>candidate.tier===tier&&candidate.portalPattern===pattern);
      assert.ok(level,`${theme} kademe ${tier} portal ${pattern}`);
      let run={...engine.initial(1),phase:'playing'};
      const hazards=engine.obstacles(level);
      const energy=engine.energies(level);
      for(let frame=0;frame<240*100&&run.phase==='playing';frame++){
        const mode=engine.modeAt(level,run.x);
        const target=engine.corridor(level,run.x+level.speed*mode.speed/240).center;
        run=engine.step(run,level,(run.y>target)!==mode.inverted,1/240,false,hazards,energy);
      }
      assert.equal(run.phase,'won',`${theme}: ${level.name}`);
      assert.equal(run.collected.length,3,`${theme}: ${level.name}`);
    }
  }
});
test('kesirli uzunlukta portal tam sınırında yeni hareket ve süre devreye girer',()=>{
  for(const theme of ['red','yellow'])for(const level of engine.levels(theme)){
    let previousMode={speed:1,mini:false,inverted:false};
    let previousX=0;
    let seconds=0;
    for(const portal of engine.portals(level)){
      assert.deepEqual(engine.modeAt(level,portal.x),portal.mode,`${theme}:${level.id}:${portal.x}`);
      const before=portal.x-Math.max(1,portal.x)*Number.EPSILON*4;
      assert.deepEqual(engine.modeAt(level,before),previousMode,`${theme}:${level.id}:portal öncesi`);
      seconds+=(portal.x-previousX)/(level.speed*previousMode.speed);
      previousX=portal.x;
      previousMode=portal.mode;
    }
    seconds+=(level.length-previousX)/(level.speed*previousMode.speed);
    assert.ok(Math.abs(engine.duration(level)-seconds)<1e-9,`${theme}:${level.id}:süre`);
    assert.ok(Math.abs(engine.timeAt(level,level.length)-seconds)<1e-9,`${theme}:${level.id}:konum süresi`);
  }
});
test('duvara çarpma oyunu bitirir ve girdi durumunu değiştirmez', () => {
  const level = engine.levels('red')[0];
  const initial = {...engine.initial(1),phase:'playing'};
  const snapshot = JSON.stringify(initial);
  let run = initial;
  for(let frame=0;frame<200&&run.phase==='playing';frame++) run=engine.step(run,level,true,1/120,false,[],[]);
  assert.equal(run.phase,'dead');
  assert.equal(JSON.stringify(initial),snapshot);
});
test('testereye temas ölüm sayılır', () => {
  const level = engine.levels('yellow')[0];
  const obstacle = engine.obstacles(level)[0];
  assert.equal(engine.collision({...engine.initial(1),x:obstacle.x,y:obstacle.y},level,[obstacle]),true);
});
test('antrenman çarpışması son kontrol noktasından yeniden başlar', () => {
  const level = engine.levels('yellow')[0];
  const x=level.length*.45;
  const initial={...engine.initial(3),phase:'playing',x,y:engine.corridor(level,x).top};
  const run=engine.step(initial,level,true,1/120,true,[],[]);
  assert.equal(run.phase,'playing');assert.equal(run.attempt,4);
  assert.equal(run.x,level.length*.4);
  assert.equal(run.y,engine.corridor(level,run.x).center);
});
test('duraklatılan oyun ilerlemez', () => {
  const run={...engine.initial(1),phase:'paused'};
  assert.equal(engine.step(run,engine.levels('yellow')[0],true,1/120,false,[],[]),run);
});

test('normal wave anında yön değiştirir ve iki yönde 45 derece ilerler',()=>{
  const level=engine.levels('yellow')[0];
  const run={...engine.initial(1),phase:'playing'};
  const up=engine.step(run,level,true,1/240,false,[],[]);
  assert.ok(Math.abs((up.y-run.y)+(up.x-run.x))<1e-9);
  const down=engine.step(up,level,false,1/240,false,[],[]);
  assert.ok(Math.abs((down.y-up.y)-(down.x-up.x))<1e-9);
  assert.ok(Math.abs(down.y-run.y)<1e-9);
});
test('mini wave eğimi 2, ters yerçekiminde basılı tutmak aşağı gider',()=>{
  const miniLevel=engine.levels('yellow')[2];
  const x=miniLevel.length*.4;
  const run={...engine.initial(1),phase:'playing',x,y:engine.corridor(miniLevel,x).center};
  const next=engine.step(run,miniLevel,true,1/240,false,[],[]);
  assert.ok(Math.abs((next.y-run.y)+2*(next.x-run.x))<1e-8);
  const reverseLevel=engine.levels('red')[3];
  const reverseX=reverseLevel.length*.4;
  const reversed={...run,x:reverseX,y:engine.corridor(reverseLevel,reverseX).center};
  const reversedNext=engine.step(reversed,reverseLevel,true,1/240,false,[],[]);
  assert.ok(reversedNext.y>reversed.y);
});
test('simülasyon 60 ve 240 Hz zaman adımlarında aynı konuma gider',()=>{
  const level=engine.levels('yellow')[0];
  let slow={...engine.initial(1),phase:'playing'};
  let fast={...slow};
  for(let index=0;index<12;index++)slow=engine.step(slow,level,true,1/60,false,[],[]);
  for(let index=0;index<48;index++)fast=engine.step(fast,level,true,1/240,false,[],[]);
  assert.ok(Math.abs(slow.x-fast.x)<1e-8);assert.ok(Math.abs(slow.y-fast.y)<1e-8);
});
