const test=require('node:test');
const assert=require('node:assert/strict');
const progression=require('../progression.js');
const save=require('../save.js');

test('her oyunda 12 kozmetik karakterden yalnız ilk karakter başlangıçta açıktır',()=>{
  const records=save.create(2500).records;
  for(const theme of ['red','yellow']){
    const characters=progression.characters(theme);
    assert.equal(characters.length,12);
    assert.equal(new Set(characters.map(character=>character.name)).size,12);
    assert.deepEqual(characters.filter(character=>progression.isUnlocked(character,records)).map(character=>character.id),[0]);
    assert.deepEqual(characters.map(character=>character.shape),Array.from({length:12},(_,index)=>index));
    for(const character of characters){
      assert.ok(character.description.length>0);
      assert.equal(Object.hasOwn(character,'speed'),false);
      assert.equal(Object.hasOwn(character,'hitbox'),false);
    }
  }
});
test('ustalık yalnız aynı bölümde yüzde 100 ve üç enerji kazanıldığında sayılır',()=>{
  const records=save.create(18).records;
  records[0]={...records[0],best:100,energy:2};
  records[1]={...records[1],best:85,energy:3};
  assert.equal(progression.career(records).mastery,0);
  records[0]={...records[0],energy:3};
  assert.equal(progression.career(records).mastery,1);
  assert.equal(progression.isUnlocked(progression.characters('red')[3],records),true);
});
test('XP kalıcı ilerlemeden türetilir ve aynı zafer tekrar ödül vermez',()=>{
  const before=save.create(2500).records;
  const after=before.map((record,index)=>index===0?{...record,best:100,energy:3,attempts:4,wins:1,bestTime:30}:record);
  const characters=progression.characters('red');
  const snapshot=JSON.stringify(before);
  assert.deepEqual(progression.reward(before,after,characters),{xp:600,unlocked:[1,3]});
  const replay=after.map((record,index)=>index===0?{...record,attempts:5,wins:2,bestTime:29}:record);
  assert.deepEqual(progression.reward(after,replay,characters),{xp:0,unlocked:[]});
  assert.equal(JSON.stringify(before),snapshot);
  const career=progression.career(after);
  assert.equal(career.level,4);
  assert.equal(career.levelXp,150);
  assert.equal(career.nextLevelXp,250);
});
test('tüm kilometre taşları ulaşılabilir ve Grief kostümü yalnız Grief zaferiyle açılır',()=>{
  const records=save.create(2500).records.map((record,index)=>index<101&&index!==17?{...record,best:100,energy:3}:record);
  const characters=progression.characters('yellow');
  assert.equal(progression.career(records).completed,100);
  assert.equal(progression.career(records).energy,300);
  assert.deepEqual(characters.filter(character=>progression.isUnlocked(character,records)).map(character=>character.id),Array.from({length:11},(_,index)=>index));
  const won=records.map((record,index)=>index===17?{...record,best:100}:record);
  assert.deepEqual(progression.reward(records,won,characters).unlocked,[11]);
});
test('XP sınırında kariyer doğru seviyeye geçer',()=>{
  const records=save.create(18).records;
  for(let xp=0;xp<100;xp++){
    const career=progression.career([{...records[0],best:xp}]);
    assert.equal(career.level,1);
    assert.equal(career.levelXp,xp);
    assert.equal(career.nextLevelXp,100);
  }
  assert.deepEqual(progression.career([]),{completed:0,energy:0,mastery:0,xp:0,level:1,levelXp:0,nextLevelXp:100});
});
test('deneme ve zafer sayıları XP üretmez ve her kariyer çubuğu sınırları içindedir',()=>{
  const records=save.create(2500).records;
  const inflated=records.map(record=>({...record,attempts:Number.MAX_SAFE_INTEGER,wins:Number.MAX_SAFE_INTEGER}));
  assert.equal(progression.career(inflated).xp,0);
  assert.deepEqual(progression.reward(records,inflated,progression.characters('red')),{xp:0,unlocked:[]});
  for(let completed=0;completed<=2500;completed+=5){
    const progress=records.map((record,index)=>index<completed?{...record,best:100,energy:3}:record);
    const career=progression.career(progress);
    assert.equal(career.xp,completed*600);
    assert.ok(career.levelXp>=0&&career.levelXp<career.nextLevelXp);
  }
});
