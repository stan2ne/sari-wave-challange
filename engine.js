// @ts-check
/** @typedef {{id:number,name:string,kind:'campaign'|'expedition',tier:number,seed:number,district:string,difficulty:string,rank:number,speed:number,length:number,half:number,amplitude:number,frequency:number,spacing:number,mirror:number,chapter:string,slope:number,pattern:number[],sectionModes:WaveMode[],sectionAmplitudes:number[],sectionSlopes:number[],portalPattern:number}} Level */
/** @typedef {{x:number,y:number,radius:number}} Obstacle */
/** @typedef {{x:number,y:number,index:number}} Energy */
/** @typedef {{x:number,y:number}} Point */
/** @typedef {'ready'|'playing'|'paused'|'dead'|'won'} Phase */
/** @typedef {{phase:Phase,x:number,y:number,time:number,attempt:number,checkpoint:number,collected:number[],trail:Point[],flash:number}} Run */
/** @typedef {{speed:number,mini:boolean,inverted:boolean}} WaveMode */
/** @typedef {{x:number,label:string,color:string,mode:WaveMode}} Portal */
const WaveEngine = (() => {
  /** @param {number} value @param {number} minimum @param {number} maximum @returns {number} */
  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
  /** @param {number} seed @param {number} stream @returns {number} */
  function random(seed,stream) {
    const mixed=Math.imul(seed+Math.imul(stream+1,0x9e3779b9),0x85ebca6b);
    const shifted=Math.imul(mixed^(mixed>>>16),0xc2b2ae35);
    return ((shifted^(shifted>>>13))>>>0)/4294967296;
  }
  /** @param {Level} level @returns {Level} */
  function withSections(level) {
    const gates=portals(level);
    return {...level,sectionModes:Array.from({length:6},(_,section)=>{
      const previous=gates.filter(portal=>portal.x<=level.length*(section+.5)/6).at(-1);
      return previous?{...previous.mode}:{speed:1,mini:false,inverted:false};
    })};
  }
  /** @param {'yellow'|'red'} theme @returns {Level[]} */
  function levels(theme) {
    const names=theme==='yellow'
      ? ['İlk Işık','Altın Vadi','Güneş Rüzgârı','Neon Çölü','Süpernova','Işık Hızı','Sarı Fırtına','Foton Tüneli','Güneş Tutulması','Kuantum Atlama','Plazma Denizi','Yıldız Kıran','Korona','Çöküş Yörüngesi','Mutlak Sıfır','Son Foton','Sarı Kıyamet','Sarı Grief']
      : ['Kızıl Uyanış','Kanlı Vadi','Karanlık Nabız','Lav Koridoru','Cehennem Ritmi','Son Çığlık','Kara Damar','Keskin Sessizlik','Ters Ayin','Parçalanma','Ateş Hattı','Kızıl Taht','Derin Yara','Hiçlik Kapısı','Kül Fırtınası','Kan Tutulması','Son Nefes','Kan Grief'];
    const chapters=theme==='yellow'?['ŞAFAK','YÖRÜNGE','ÇÖKÜŞ']:['UYANIŞ','KIRILMA','UÇURUM'];
    const widths=[148,140,132,124,116,108,100,92,84,76,68,60,52,46,38,30,24,18];
    const difficulties=['ISINMA','KOLAY','KOLAY +','ORTA','ORTA +','ZOR','ZOR +','UZMAN','UZMAN +','USTA','USTA +','DEMON','DEMON +','EKSTREM','EKSTREM +','KABUS','KABUS +','GRIEF'];
    const patterns=[[0,0,1,0,0,1],[0,1,0,1,0,1],[0,0,1,1,0,1],[1,0,1,0,1,0],[0,1,1,0,1,1],[1,1,0,1,0,1],[1,0,2,1,0,2],[0,2,1,2,1,0],[2,1,0,2,1,2],[1,2,1,2,0,1],[2,0,2,1,2,1],[2,1,2,1,2,2],[1,2,2,1,2,2],[2,2,1,2,2,1],[2,1,2,2,1,2],[2,2,2,1,2,2],[2,2,1,2,2,2],[2,2,2,2,2,2]];
    /** @type {Level[]} */
    const campaign=names.map((name,index)=>({id:index,name,kind:'campaign',tier:index,seed:index+1,district:chapters[Math.floor(index/6)],chapter:chapters[Math.floor(index/6)],difficulty:difficulties[index],rank:index+1,
      speed:300+index*12,length:(index===17?150:30+index*4)*(300+index*12),half:widths[index],
      amplitude:46+Math.min(index,12)*6,frequency:.0014+index*.00013,spacing:720-Math.min(index,12)*30,
      mirror:theme==='red'?-1:1,slope:Math.min(.93,.28+index*.043),pattern:patterns[index],portalPattern:index%6,sectionModes:[],
      sectionAmplitudes:Array.from({length:6},()=>46+Math.min(index,12)*6),sectionSlopes:Array.from({length:6},()=>Math.min(.93,.28+index*.043))}));
    const districts=theme==='yellow'?['Kehribar Kıyısı','Prizma Bahçesi','Altın Atlas','Foton Geçidi','Güneş Arşivi','Neon Vaha','Işık Labirenti','Yıldız Mahzeni','Plazma Yörüngesi','Sonsuz Şafak']:['Kül Limanı','Kızıl Mahzen','Obsidyen Hat','Karanlık Bahçe','Ateş Arşivi','Kan Deltası','Gece Labirenti','Demir Tapınak','Boşluk Yörüngesi','Sonsuz Tutulma'];
    const prefixes=theme==='yellow'?['Parıltı','Kristal','Göktaşı','Kıvılcım','Aurora','Spektrum','Işın','Kuvars']:['Yankı','Köz','Diken','Gölge','Kıyam','Pençe','Ayin','Yarık'];
    const suffixes=['Geçişi','Dalgası','Akışı','Sarmalı','Nabzı','Yolu','Kırılması','Sekansı'];
    /** @type {Level[]} */
    const expeditions=Array.from({length:2482},(_,index)=>{
      const id=index+18;
      const seed=(theme==='red'?0x4b414e:0x53415249)+index;
      const tier=Math.min(16,Math.floor(index/146));
      const district=districts[Math.floor(random(seed,0)*districts.length)];
      const amplitude=32+tier*4+random(seed,1)*10;
      const slope=.24+tier*.035+random(seed,2)*.04;
      const speed=288+tier*11+random(seed,3)*10;
      return {id,name:prefixes[Math.floor(random(seed,4)*prefixes.length)]+' '+suffixes[Math.floor(random(seed,5)*suffixes.length)]+' '+String(index+1).padStart(4,'0'),
        kind:'expedition',tier,seed,district,chapter:district,difficulty:difficulties[tier],rank:tier+1,
        speed,length:(24+tier*2+random(seed,6)*16)*speed,half:Math.max(34,148-tier*7+random(seed,7)*8),
        amplitude,frequency:.0014+tier*.00013,spacing:560+random(seed,8)*200,mirror:theme==='red'?-1:1,slope,
        pattern:Array.from({length:6},(_,section)=>Math.floor(random(seed,section+10)*3)),portalPattern:Math.floor(random(seed,9)*6),sectionModes:[],
        sectionAmplitudes:Array.from({length:6},(_,section)=>amplitude*(.82+random(seed,section+20)*.28)),
        sectionSlopes:Array.from({length:6},(_,section)=>Math.min(.88,slope*(.86+random(seed,section+30)*.2)))};
    });
    return [...campaign,...expeditions].map(withSections);
  }
  /** @param {Level} level @returns {Portal[]} */
  function portals(level) {
    const boost=Math.floor(level.tier/6)*.1;
    /** @type {{section:number,label:string,color:string,mode:WaveMode}[][]} */
    const layouts=[[],
      [{section:2,label:'HIZ ×'+(1.25+boost).toFixed(2),color:'#55e7ff',mode:{speed:1.25+boost,mini:false,inverted:false}},{section:5,label:'NORMAL HIZ',color:'#78ffa5',mode:{speed:1,mini:false,inverted:false}}],
      [{section:2,label:'MİNİ WAVE',color:'#e88cff',mode:{speed:1,mini:true,inverted:false}},{section:4,label:'NORMAL WAVE',color:'#78ffa5',mode:{speed:1,mini:false,inverted:false}}],
      [{section:2,label:'TERS YERÇEKİMİ',color:'#67aaff',mode:{speed:1,mini:false,inverted:true}},{section:4,label:'NORMAL YERÇEKİMİ',color:'#ffe176',mode:{speed:1,mini:false,inverted:false}}],
      [{section:1,label:'HIZ ×'+(1.4+boost).toFixed(1),color:'#55e7ff',mode:{speed:1.4+boost,mini:false,inverted:false}},{section:3,label:'MİNİ WAVE',color:'#e88cff',mode:{speed:1.4+boost,mini:true,inverted:false}},{section:5,label:'NORMAL WAVE',color:'#78ffa5',mode:{speed:1,mini:false,inverted:false}}],
      [{section:1,label:'TERS YERÇEKİMİ',color:'#67aaff',mode:{speed:1,mini:false,inverted:true}},{section:2,label:'MİNİ WAVE',color:'#e88cff',mode:{speed:1,mini:true,inverted:true}},{section:3,label:'HIZ ×'+(1.6+boost).toFixed(1),color:'#55e7ff',mode:{speed:1.6+boost,mini:true,inverted:true}},{section:4,label:'NORMAL WAVE',color:'#78ffa5',mode:{speed:1.25+boost,mini:false,inverted:false}},{section:5,label:'FİNAL',color:'#ffffff',mode:{speed:1,mini:false,inverted:false}}]
    ];
    return layouts[level.portalPattern].map(portal=>({x:portal.section/6*level.length,label:portal.label,color:portal.color,mode:portal.mode}));
  }
  /** @param {Level} level @param {number} x @returns {WaveMode} */
  function modeAt(level,x) {
    return level.sectionModes[sectionAt(level,x)];
  }
  /** @param {Level} level @param {number} x @returns {number} */
  function sectionAt(level,x) {
    const section=clamp(Math.floor(x/level.length*6),0,5);
    if(section>0&&x<section/6*level.length)return section-1;
    if(section<5&&x>=(section+1)/6*level.length)return section+1;
    return section;
  }
  /** @param {Level} level @returns {number} */
  function duration(level) {
    const points=[0,...portals(level).map(portal=>portal.x),level.length];
    return points.slice(1).reduce((seconds,x,index)=>seconds+(x-points[index])/(level.speed*modeAt(level,points[index]).speed),0);
  }
  /** @param {Level} level @param {number} x @returns {number} */
  function timeAt(level,x) {
    const distance=clamp(x,0,level.length);
    const points=[0,...portals(level).filter(portal=>portal.x<distance).map(portal=>portal.x),distance];
    return points.slice(1).reduce((seconds,point,index)=>seconds+(point-points[index])/(level.speed*modeAt(level,points[index]).speed),0);
  }
  /** @param {Level} level @param {number} x @returns {{top:number,bottom:number,center:number}} */
  function corridor(level,x) {
    const world=clamp(x,0,level.length);
    const section=sectionAt(level,world);
    const start=section===0?600:section/6*level.length;
    const end=(section+1)/6*level.length;
    const position=clamp((world-start)/(end-start),0,1);
    const mode=level.sectionModes?.[section];
    if(!mode)throw new TypeError('Parkurun bölüm hareketleri tanımlı değil: '+level.name);
    const slope=Math.min(mode.mini?1.78:.93,level.sectionSlopes[section]*(mode.mini?1.9:1));
    const style=level.pattern[section];
    const divisor=style===0?Math.PI*2:4;
    const amplitude=level.sectionAmplitudes[section];
    const cycles=Math.max(1,Math.floor((end-start)*slope/(divisor*amplitude)));
    const phase=position*cycles*Math.PI*2;
    const shape=style===0?Math.sin(phase):2/Math.PI*Math.asin(Math.sin(phase));
    const direction=style===1?-1:1;
    const center=270+level.mirror*direction*amplitude*shape;
    const targetHalf=level.half*(1+.07*Math.sin(world*.0012+level.id));
    const half=148+(targetHalf-148)*clamp((world-600)/240,0,1);
    const teeth=Math.abs(((world+9000)%140)-70)/70*Math.min(10,level.half*.10);
    return {top:center-half+teeth,bottom:center+half-teeth,center};
  }
  /** @param {Level} level @returns {Obstacle[]} */
  function obstacles(level) {
    const count=level.tier>=12?0:Math.floor((level.length-1400)/level.spacing);
    return Array.from({length:count},(_,index)=>{
      const x=1200+index*level.spacing;
      const side=(index%2===0?-1:1)*level.mirror;
      const radius=Math.max(3,Math.min(26,level.half*.15));
      return {x,y:corridor(level,x).center+side*(level.half*.90+radius),radius};
    }).filter(obstacle=>{
      const checkpoint=Math.round(obstacle.x/(level.length/5))*level.length/5;
      return Math.abs(obstacle.x-checkpoint)>110 && portals(level).every(portal=>Math.abs(portal.x-obstacle.x)>160);
    });
  }
  /** @param {Level} level @returns {Energy[]} */
  function energies(level) {
    return [.24,.51,.82].map((fraction,index)=>{const x=level.length*fraction;return {x,y:corridor(level,x).center,index};});
  }
  /** @param {number} attempt @returns {Run} */
  function initial(attempt) { return {phase:'ready',x:0,y:270,time:0,attempt,checkpoint:0,collected:[],trail:[],flash:0}; }
  /** @param {Run} run @param {Level} level @param {Obstacle[]} hazards @returns {boolean} */
  function collision(run,level,hazards) {
    const bounds=corridor(level,run.x);
    const radius=modeAt(level,run.x).mini?4:7;
    if(run.y-radius<bounds.top||run.y+radius>bounds.bottom)return true;
    return hazards.some(obstacle=>Math.hypot(run.x-obstacle.x,run.y-obstacle.y)<obstacle.radius+radius);
  }
  /** @param {Run} run @param {Level} level @param {boolean} pressed @param {number} dt @param {boolean} practice @param {Obstacle[]} hazards @param {Energy[]} energy @returns {Run} */
  function step(run,level,pressed,dt,practice,hazards,energy) {
    if(run.phase!=='playing')return run;
    const mode=modeAt(level,run.x);
    const x=Math.min(level.length,run.x+level.speed*mode.speed*dt);
    const direction=pressed!==mode.inverted?-1:1;
    const y=run.y+direction*(x-run.x)*(mode.mini?2:1);
    const found=energy.filter(item=>!run.collected.includes(item.index)&&Math.hypot(x-item.x,y-item.y)<25).map(item=>item.index);
    const checkpoint=practice?Math.max(run.checkpoint,Math.min(9,Math.floor(x/level.length*10))*level.length/10):0;
    const trail=[...run.trail.filter(point=>point.x>x-800),{x,y}];
    const next={...run,x,y,checkpoint,trail,time:run.time+dt,collected:[...run.collected,...found],flash:found.length>0?.16:Math.max(0,run.flash-dt)};
    if(collision(next,level,hazards)){
      if(practice)return {...next,x:checkpoint,y:corridor(level,checkpoint).center,trail:[],attempt:run.attempt+1,flash:.4};
      return {...next,phase:'dead'};
    }
    return x>=level.length?{...next,phase:'won'}:next;
  }
  return {clamp,levels,portals,modeAt,duration,timeAt,corridor,obstacles,energies,initial,collision,step};
})();
if(typeof module!=='undefined')module.exports=WaveEngine;
