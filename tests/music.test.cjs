const test=require('node:test');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {composeSoundtrack,noteFrequency,trackInfo}=require('../music.js');

/** @param {Float32Array} samples @returns {{rms:number,peak:number}} */
function signalStats(samples){
  let sum=0;
  let peak=0;
  for(const value of samples){
    assert.ok(Number.isFinite(value));
    sum+=value*value;
    peak=Math.max(peak,Math.abs(value));
  }
  return {rms:Math.sqrt(sum/samples.length),peak};
}
/** @param {Float32Array} samples @returns {string} */
function fingerprint(samples){return createHash('sha256').update(Buffer.from(samples.buffer)).digest('hex');}

test('iki temada 2500 müzik kimliği, başlığı ve armonik düzeni ayrıdır',()=>{
  const titles=new Set();
  const arrangements=new Set();
  for(const theme of ['red','yellow']){
    const genres=new Set();
    const tempos=new Set();
    for(let id=0;id<2500;id++){
      const info=trackInfo(theme,id);
      titles.add(info.title);genres.add(info.genre);tempos.add(info.bpm);
      arrangements.add(JSON.stringify([info.bpm,info.root,info.chords,info.melody,info.voice]));
      assert.ok(Number.isInteger(info.bpm)&&info.bpm>=110&&info.bpm<=190);
      assert.ok(info.melody.length===16&&info.melody.every(Number.isFinite));
      assert.ok(info.chords.length===4&&info.chords.every(Number.isFinite));
      assert.deepEqual(info,trackInfo(theme,id));
    }
    assert.equal(genres.size,6);
    assert.ok(tempos.size>50);
  }
  assert.equal(titles.size,5000);
  assert.equal(arrangements.size,5000);
  assert.equal(trackInfo('red',0).title,'REDLINE');
  assert.equal(trackInfo('red',17).title,'GRIEF PROTOCOL');
  assert.equal(trackInfo('yellow',0).title,'DAYBREAK');
  assert.equal(trackInfo('yellow',17).title,'YELLOW SINGULARITY');
});

test('ana kampanya ve keşif müzikleri sonlu, duyulur ve birbirinden farklı stereo ses üretir',()=>{
  const fingerprints=new Set();
  const selections=[...Array.from({length:18},(_,id)=>id),18,19,40,99,127,499,999,1499,1999,2499];
  for(const theme of ['red','yellow']){
    for(const id of selections){
      const info=trackInfo(theme,id);
      const track=composeSoundtrack(theme,id,4000);
      const stats=signalStats(track.left);
      assert.equal(track.title,info.title);
      assert.equal(track.bpm,info.bpm);
      assert.equal(track.left.length,track.right.length);
      assert.ok(track.left.length>4000*20&&track.left.length<4000*36);
      assert.ok(stats.rms>.045&&stats.rms<.22,`${theme}/${id}: rms ${stats.rms}`);
      assert.ok(stats.peak>.2&&stats.peak<1,`${theme}/${id}: peak ${stats.peak}`);
      assert.ok(track.right.every(Number.isFinite));
      assert.notDeepEqual(track.left,track.right);
      assert.equal(Math.abs(track.left[0]),0);
      assert.equal(Math.abs(track.left[track.left.length-1]),0);
      fingerprints.add(fingerprint(track.left));
    }
  }
  assert.equal(fingerprints.size,selections.length*2);
});

test('aynı bölüm yeniden yüklendiğinde aynı müzik üretilir',()=>{
  const first=composeSoundtrack('red',2047,8000);
  const second=composeSoundtrack('red',2047,8000);
  assert.equal(fingerprint(first.left),fingerprint(second.left));
  assert.equal(fingerprint(first.right),fingerprint(second.right));
  assert.notEqual(fingerprint(first.left),fingerprint(composeSoundtrack('red',2048,8000).left));
  assert.notEqual(fingerprint(first.left),fingerprint(composeSoundtrack('yellow',2047,8000).left));
});

test('yerel 48 kHz ses, aranjmanın sakin ve yoğun bölümlerini korur',()=>{
  const track=composeSoundtrack('yellow',18,48000);
  const quarter=Math.floor(track.left.length/4);
  const verse=signalStats(track.left.subarray(quarter,quarter*2));
  const breakdown=signalStats(track.left.subarray(quarter*2,quarter*3));
  assert.ok(verse.rms>breakdown.rms*1.15);
  assert.ok(signalStats(track.left).peak<1);
  assert.equal(noteFrequency(69),440);
});

test('geçersiz müzik, tema ve örnekleme hızı açıkça reddedilir',()=>{
  for(const id of [-1,2500,.5,NaN,Infinity])assert.throws(()=>trackInfo('red',id),RangeError);
  assert.throws(()=>trackInfo('blue',0),TypeError);
  for(const rate of [0,999,48000.5,192001,NaN])assert.throws(()=>composeSoundtrack('red',0,rate),RangeError);
});
