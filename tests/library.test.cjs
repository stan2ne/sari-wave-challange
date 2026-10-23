const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../engine.js');
const save=require('../save.js');
const library=require('../library.js');

test('keşifte bütün 2482 parkura sayfalayarak ulaşılır',()=>{
  const levels=engine.levels('red');
  const records=save.create(levels.length).records;
  const visited=[];
  for(let page=0;page<311;page++){
    const result=library.browse(levels,records,{query:'',filter:'all',page,pageSize:8});
    visited.push(...result.levels.map(level=>level.id));
    assert.equal(result.total,2482);
  }
  assert.equal(new Set(visited).size,2482);
  assert.equal(visited[0],18);assert.equal(visited.at(-1),2499);
});
test('isim, Türkçe karakter ve numarayla arama ile zorluk filtreleri birlikte çalışır',()=>{
  const levels=engine.levels('yellow');
  const records=save.create(levels.length).records;
  const options={query:'#2500',filter:'all',page:0,pageSize:8};
  assert.equal(library.browse(levels,records,options).levels[0].id,2499);
  const name=levels[148].name;
  assert.ok(library.browse(levels,records,{...options,query:name}).levels.some(level=>level.id===148));
  assert.ok(library.browse(levels,records,{...options,query:'',filter:'beginner'}).levels.every(level=>level.tier<=5));
  const completed=records.map((record,index)=>index===18?{...record,best:100,energy:3}:record);
  assert.equal(library.browse(levels,completed,{...options,query:'',filter:'mastered'}).levels[0].id,18);
  assert.ok(!library.browse(levels,completed,{...options,query:'',filter:'unfinished'}).levels.some(level=>level.id===18));
});
test('boş sonuçta sayfalar geçerli kalır, Grief sonrası keşif başlar',()=>{
  const levels=engine.levels('red');
  const records=save.create(levels.length).records;
  const result=library.browse(levels,records,{query:'olmayan-parkur-xyz',filter:'all',page:99,pageSize:8});
  assert.deepEqual(result,{levels:[],page:0,pages:1,total:0});
  assert.equal(library.nextLevel(17),18);assert.equal(library.nextLevel(2499),18);
});
