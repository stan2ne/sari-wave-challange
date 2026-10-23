// @ts-check
/** @typedef {{best:number,energy:number,attempts:number,wins:number,bestTime:number|null}} CareerRecord */
/** @typedef {{type:'free'|'completions'|'energy'|'mastery'|'grief',target:number}} UnlockRequirement */
/** @typedef {{id:number,name:string,rarity:'BAŞLANGIÇ'|'NADİR'|'DESTANSI'|'EFSANEVİ'|'MİTİK',description:string,requirement:UnlockRequirement,shape:number}} WaveCharacter */
/** @typedef {{completed:number,energy:number,mastery:number,xp:number,level:number,nextLevelXp:number,levelXp:number}} Career */
const WaveProgression=(()=>{
  /** @param {'red'|'yellow'} theme @returns {WaveCharacter[]} */
  function characters(theme){
    const names=theme==='red'?['KIVILCIM','KIZIL OK','KANAT','KARA DİKEN','YARASA','KOR','HAYALET','AKREP','KAN TAHTI','İBLİS','KIYAMET','GRIEF EFENDİSİ']:['FOTON','ALTIN OK','ŞAFAK','PRİZMA','GÜNEŞ KANADI','KORONA','AURORA','YILDIZ','ALTIN TAHT','SÜPERNOVA','SONSUZ IŞIK','GRIEF GÜNEŞİ'];
    /** @type {UnlockRequirement[]} */
    const requirements=[{type:'free',target:0},{type:'completions',target:1},{type:'energy',target:12},{type:'mastery',target:1},
      {type:'completions',target:5},{type:'energy',target:90},{type:'mastery',target:10},{type:'completions',target:20},
      {type:'energy',target:300},{type:'mastery',target:50},{type:'completions',target:100},{type:'grief',target:1}];
    /** @type {WaveCharacter['rarity'][]} */
    const rarities=['BAŞLANGIÇ','NADİR','NADİR','NADİR','DESTANSI','DESTANSI','DESTANSI','EFSANEVİ','EFSANEVİ','EFSANEVİ','MİTİK','MİTİK'];
    const descriptions=theme==='red'?['Karanlığın içindeki ilk kıvılcım.','İlk zaferin kızıl izi.','Enerjiden dövülmüş iki kanat.','Kusursuz geçişin keskin imzası.','Geceyi yaran beş zafer.','Damarlarında biriken saf enerji.','On kusursuz parkurun ruhu.','Yirmi zaferin zırhı.','Üç yüz kristalin hükümdarı.','Elli kusursuz geçişin mührü.','Yüz zaferle gelen son biçim.','Kan Grief’i aşanlara özel son arma.']:['Işığın içindeki ilk foton.','İlk zaferin altın izi.','Enerjiden doğan yeni şafak.','Kusursuz geçişin kristal imzası.','Beş zaferden doğan güneş kanadı.','Damarlarında biriken saf ışık.','On kusursuz parkurun ışığı.','Yirmi zaferin yıldız zırhı.','Üç yüz kristalin hükümdarı.','Elli kusursuz geçişin patlaması.','Yüz zaferle gelen sonsuz biçim.','Sarı Grief’i aşanlara özel son arma.'];
    return names.map((name,id)=>({id,name,rarity:rarities[id],description:descriptions[id],requirement:{...requirements[id]},shape:id}));
  }
  /** @param {CareerRecord[]} records @returns {Career} */
  function career(records){
    const completed=records.filter(record=>record.best===100).length;
    const energy=records.reduce((total,record)=>total+record.energy,0);
    const mastery=records.filter(record=>record.best===100&&record.energy===3).length;
    const xp=records.reduce((total,record)=>total+Math.floor(record.best),0)+completed*200+energy*50+mastery*150;
    const earnedLevels=Math.floor((Math.sqrt(5625+100*xp)-75)/50);
    return {completed,energy,mastery,xp,level:earnedLevels+1,levelXp:xp-(25*earnedLevels*earnedLevels+75*earnedLevels),nextLevelXp:100+50*earnedLevels};
  }
  /** @param {WaveCharacter} character @param {CareerRecord[]} records @returns {boolean} */
  function isUnlocked(character,records){
    const requirement=character.requirement;
    if(requirement.type==='free')return true;
    if(requirement.type==='grief')return records.length>17&&records[17].best===100;
    const progress=career(records);
    if(requirement.type==='completions')return progress.completed>=requirement.target;
    if(requirement.type==='energy')return progress.energy>=requirement.target;
    return progress.mastery>=requirement.target;
  }
  /** @param {CareerRecord[]} beforeRecords @param {CareerRecord[]} afterRecords @param {WaveCharacter[]} catalog @returns {{xp:number,unlocked:number[]}} */
  function reward(beforeRecords,afterRecords,catalog){
    return {xp:Math.max(0,career(afterRecords).xp-career(beforeRecords).xp),unlocked:catalog.filter(character=>!isUnlocked(character,beforeRecords)&&isUnlocked(character,afterRecords)).map(character=>character.id)};
  }
  return {characters,career,isUnlocked,reward};
})();
if(typeof module!=='undefined')module.exports=WaveProgression;
