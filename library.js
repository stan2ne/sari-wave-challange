// @ts-check
/** @typedef {'all'|'beginner'|'expert'|'extreme'|'unfinished'|'mastered'} LibraryFilter */
/** @typedef {{query:string,filter:LibraryFilter,page:number,pageSize:number}} BrowseOptions */
/** @typedef {{levels:Level[],page:number,pages:number,total:number}} BrowseResult */
const WaveLibrary=(()=>{
  /** @param {string} text @returns {string} */
  function normalized(text){return text.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').trim();}
  /** @param {Level} level @param {ProgressRecord} record @param {LibraryFilter} filter @returns {boolean} */
  function matchesFilter(level,record,filter){
    switch(filter){
      case 'all':return true;
      case 'beginner':return level.tier<=5;
      case 'expert':return level.tier>=6&&level.tier<=11;
      case 'extreme':return level.tier>=12;
      case 'unfinished':return record.best<100;
      case 'mastered':return record.best===100&&record.energy===3;
      default:throw new RangeError('Bilinmeyen parkur filtresi: '+filter);
    }
  }
  /** @param {Level[]} levels @param {ProgressRecord[]} records @param {BrowseOptions} options @returns {BrowseResult} */
  function browse(levels,records,options){
    if(!Number.isInteger(options.page)||options.page<0||!Number.isInteger(options.pageSize)||options.pageSize<1)throw new RangeError('Sayfa ve sayfa boyutu geçerli pozitif tamsayılar olmalı.');
    const query=normalized(options.query).replace(/^#/, '');
    const found=levels.filter(level=>level.kind==='expedition'&&matchesFilter(level,records[level.id],options.filter)&&(!query||normalized(level.name+' '+level.district+' '+level.difficulty).includes(query)||String(level.id+1)===query));
    const pages=Math.max(1,Math.ceil(found.length/options.pageSize));
    const page=Math.min(options.page,pages-1);
    return {levels:found.slice(page*options.pageSize,(page+1)*options.pageSize),page,pages,total:found.length};
  }
  /** @param {number} selected @returns {number} */
  function nextLevel(selected){
    if(!Number.isInteger(selected)||selected<0||selected>=2500)throw new RangeError('Sonraki parkur için bölüm kimliği geçersiz: '+selected);
    return selected===2499?18:selected+1;
  }
  return {browse,nextLevel};
})();
if(typeof module!=='undefined')module.exports=WaveLibrary;
