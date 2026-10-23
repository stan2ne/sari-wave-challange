const test=require('node:test');
const assert=require('node:assert/strict');
const save=require('../save.js');

test('eski 6 bölümün rekorları kaybolmadan 18 bölüme taşınır',()=>{
  const old={version:1,character:4,records:Array.from({length:6},(_,index)=>({best:index===0?100:35,energy:2}))};
  const migrated=save.parse(JSON.stringify(old),18);
  assert.equal(migrated.character,4);assert.equal(migrated.records.length,18);
  assert.equal(migrated.records[0].best,100);assert.equal(migrated.records[0].wins,1);
  assert.equal(migrated.records[5].energy,2);assert.equal(migrated.records[17].best,0);
  assert.deepEqual(old.records[0],{best:100,energy:2});
});
test('ayarlar ve yeni kayıt biçimi tekrar okunabilir',()=>{
  const state={...save.create(2500),character:11,lastLevel:2499,volume:.7,reducedFlashes:true};
  state.records[2499]={best:100,energy:3,attempts:20,wins:2,bestTime:32.6};
  assert.deepEqual(save.parse(JSON.stringify(state),2500),state);
  assert.equal(state.version,3);
});
test('18 bölümlük v2 kaydı ayarları ve seçimiyle 2500 bölüme taşınır',()=>{
  const old={...save.create(18),version:2,character:5,lastLevel:17,volume:.23,reducedFlashes:true};
  old.records[17]={best:100,energy:3,attempts:83,wins:2,bestTime:131};
  const snapshot=JSON.stringify(old);
  const migrated=save.parse(snapshot,2500);
  assert.equal(migrated.version,3);
  assert.equal(migrated.character,5);
  assert.equal(migrated.lastLevel,17);
  assert.equal(migrated.volume,.23);
  assert.equal(migrated.reducedFlashes,true);
  assert.deepEqual(migrated.records.slice(0,18),old.records);
  assert.equal(migrated.records.length,2500);
  assert.equal(migrated.records[2499].best,0);
  assert.equal(JSON.stringify(old),snapshot);
  assert.deepEqual(save.parse(JSON.stringify(migrated),2500),migrated);
});
test('v1 ve v2 aktarımı bütün eski rekorları yeni kayıtta aynen saklar',()=>{
  const legacy={version:1,character:3,records:Array.from({length:6},(_,index)=>({best:index*20,energy:index%4}))};
  const first=save.parse(JSON.stringify(legacy),2500);
  assert.deepEqual(first.records.slice(0,6).map(record=>({best:record.best,energy:record.energy})),legacy.records);
  assert.deepEqual(save.parse(JSON.stringify(first),2500),first);
  const versionTwo={...save.create(18),version:2,character:5,lastLevel:16,records:save.create(18).records.map((record,index)=>({best:index===17?100:index*5,energy:index%4,attempts:index*11,wins:index===17?3:0,bestTime:index===17?131.125:null}))};
  const second=save.parse(JSON.stringify(versionTwo),2500);
  assert.deepEqual(second.records.slice(0,18),versionTwo.records);
  assert.equal(second.character,5);
  assert.equal(second.lastLevel,16);
  assert.deepEqual(save.parse(JSON.stringify(second),2500),second);
});
test('bozuk kayıt açık bir hatayla reddedilir',()=>{
  assert.throws(()=>save.parse('{',18),SyntaxError);
  assert.throws(()=>save.parse(JSON.stringify({...save.create(18),lastLevel:18}),18),TypeError);
  assert.throws(()=>save.parse(JSON.stringify({...save.create(18),character:12}),18),TypeError);
  assert.throws(()=>save.parse(JSON.stringify({...save.create(18),version:2}),6),TypeError);
  assert.throws(()=>save.create(0),RangeError);
});
