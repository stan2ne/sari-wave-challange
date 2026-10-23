// @ts-check
/** @typedef {{best:number,energy:number,attempts:number,wins:number,bestTime:number|null}} ProgressRecord */
/** @typedef {{version:3,character:number,lastLevel:number,volume:number,reducedFlashes:boolean,records:ProgressRecord[]}} ProgressSave */
const WaveSave=(()=>{
  /** @returns {ProgressRecord} */
  function emptyRecord(){return {best:0,energy:0,attempts:0,wins:0,bestTime:null};}
  /** @param {number} count @returns {ProgressSave} */
  function create(count){
    if(!Number.isInteger(count)||count<1)throw new RangeError('Kayıt bölüm sayısı pozitif bir tam sayı olmalı: '+count);
    return {version:3,character:0,lastLevel:0,volume:.55,reducedFlashes:false,records:Array.from({length:count},emptyRecord)};
  }
  /** @param {number} value @returns {boolean} */
  function validBest(value){return Number.isFinite(value)&&value>=0&&value<=100;}
  /** @param {string|null} stored @param {number} count @returns {ProgressSave} */
  function parse(stored,count){
    if(stored===null)return create(count);
    const value=JSON.parse(stored);
    if(!value||!Number.isInteger(value.character)||value.character<0||value.character>=(value.version===3?12:6)||!Array.isArray(value.records))throw new TypeError('Kayıt karakteri veya bölüm listesi geçersiz.');
    if(value.version===1){
      if(value.records.length!==6||count<6||value.records.some(record=>!record||!validBest(record.best)||!Number.isInteger(record.energy)||record.energy<0||record.energy>3))throw new TypeError('Eski sürümün kayıt değerleri geçersiz veya hedef bölüm sayısı yetersiz.');
      return {...create(count),character:value.character,records:Array.from({length:count},(_,index)=>{
        const record=value.records[index];
        return record?{...emptyRecord(),best:record.best,energy:record.energy,wins:record.best===100?1:0}:emptyRecord();
      })};
    }
    const sourceCount=value.version===2?18:count;
    if((value.version!==2&&value.version!==3)||value.records.length!==sourceCount||count<sourceCount||!Number.isInteger(value.lastLevel)||value.lastLevel<0||value.lastLevel>=sourceCount||!Number.isFinite(value.volume)||value.volume<0||value.volume>1||typeof value.reducedFlashes!=='boolean')throw new TypeError('Kayıt sürümü, ayarları veya bölüm sayısı geçersiz.');
    if(value.records.some(record=>!record||!validBest(record.best)||!Number.isInteger(record.energy)||record.energy<0||record.energy>3||!Number.isInteger(record.attempts)||record.attempts<0||!Number.isInteger(record.wins)||record.wins<0||(record.bestTime!==null&&(!Number.isFinite(record.bestTime)||record.bestTime<=0))))throw new TypeError('Bölüm rekoru veya deneme sayısı geçersiz.');
    return {...create(count),character:value.character,lastLevel:value.lastLevel,volume:value.volume,reducedFlashes:value.reducedFlashes,
      records:Array.from({length:count},(_,index)=>index<sourceCount?{...value.records[index]}:emptyRecord())};
  }
  return {create,parse};
})();
if(typeof module!=='undefined')module.exports=WaveSave;
