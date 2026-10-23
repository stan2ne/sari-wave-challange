// @ts-check
/** @typedef {'yellow'|'red'} MusicTheme */
/** @typedef {{title:string,bpm:number,genre:string,root:number,melody:number[],chords:number[],voice:number}} TrackInfo */
/** @typedef {{left:Float32Array,right:Float32Array,bpm:number,title:string}} Soundtrack */
/** @typedef {{start:number,duration:number,frequency:number,gain:number}} ToneEvent */
/** @typedef {{start:number,gain:number}} DrumEvent */
/** @typedef {{lead:ToneEvent[],bass:ToneEvent[],pad:ToneEvent[],arp:ToneEvent[],kick:DrumEvent[],snare:DrumEvent[],hat:DrumEvent[],crash:DrumEvent[]}} Arrangement */

/** @type {readonly string[]} */
const RED_TRACK_TITLES=['REDLINE','DARK CURRENT','WICKED SIGNAL','ASHFALL','HELL ENGINE','LAST SCREAM','BLACK VEIN','SILENT EDGE','INVERSION','SHATTER','BURN VECTOR','CRIMSON CROWN','DEEP SCAR','VOID RITUAL','CINDERSTORM','BLOOD ECLIPSE','TERMINAL BREATH','GRIEF PROTOCOL'];
/** @type {readonly string[]} */
const YELLOW_TRACK_TITLES=['DAYBREAK','GOLDEN HOUR','SOLAR WIND','NEON DUNES','STARFIRE','LIGHTSPEED','YELLOW TEMPEST','PHOTON RUN','ECLIPSE','QUANTUM LEAP','PLASMA TIDE','STARBREAKER','CORONA','DECAY ORBIT','ZERO POINT','LAST PHOTON','SOLAR APOCALYPSE','YELLOW SINGULARITY'];
/** @type {readonly (readonly number[])[]} */
const TRACK_MOTIFS=[
  [0,4,7,11,7,4,2,7,9,7,4,2,0,4,12,7],[0,7,5,2,9,7,2,5,0,2,5,9,7,5,2,0],
  [0,3,7,10,12,10,7,3,5,7,10,14,12,7,5,3],[7,0,4,0,11,7,4,2,9,4,0,4,7,11,14,7],
  [0,0,7,3,0,10,7,5,12,7,3,7,10,5,3,0],[12,7,0,4,7,12,16,14,12,9,7,4,2,7,11,14],
  [0,2,6,9,6,2,11,9,6,2,0,6,14,11,9,6],[0,7,12,7,3,10,15,10,5,12,17,12,7,14,19,14],
  [0,1,7,8,12,8,7,1,3,8,10,15,12,10,8,7],[0,5,9,12,16,12,9,5,2,7,11,14,17,14,11,7],
  [0,3,6,10,6,3,12,10,7,6,3,1,0,6,10,13],[0,7,10,12,19,12,10,7,5,12,15,17,22,17,15,12],
  [12,11,7,3,0,3,7,11,10,7,5,2,0,2,5,7],[0,6,7,13,12,7,6,0,3,9,10,16,15,10,9,3],
  [0,2,3,7,10,14,15,19,17,15,14,10,7,3,2,0],[0,12,7,19,3,15,10,22,5,17,12,24,7,19,14,26],
  [0,1,6,7,12,13,18,19,17,13,12,7,6,1,0,7],[0,7,1,8,3,10,6,13,12,19,13,20,15,22,18,25]
];
/** @type {readonly (readonly number[])[]} */
const CHORD_PROGRESSIONS=[[0,5,9,7],[0,7,3,5],[0,3,8,7],[0,9,5,7],[0,1,5,3],[0,7,10,5],[0,5,3,7],[0,8,3,10]];
/** @type {readonly string[]} */
const TRACK_GENRES=['PULSE HOUSE','BREAKBEAT','TRANCE','SYNTHWAVE','DRUM & BASS','INDUSTRIAL'];
/** @type {readonly number[]} */
const RED_TRACK_TEMPOS=[124,132,142,118,152,160,136,172,145,168,150,178,156,176,162,180,184,190];
/** @type {readonly number[]} */
const YELLOW_TRACK_TEMPOS=[118,126,138,122,148,156,132,168,142,164,146,172,152,170,158,176,180,186];

/** @param {number} midi @returns {number} */
function noteFrequency(midi) { return 440*Math.pow(2,(midi-69)/12); }
/** @param {number} value @returns {number} */
function musicHash(value) {
  const mixed=Math.imul(value^(value>>>16),0x45d9f3b);
  const next=Math.imul(mixed^(mixed>>>16),0x45d9f3b);
  return (next^(next>>>16))>>>0;
}
/** @param {MusicTheme} theme @param {number} levelId @returns {TrackInfo} */
function trackInfo(theme,levelId) {
  if(theme!=='red'&&theme!=='yellow')throw new TypeError(`Müzik teması tanınmıyor: ${theme}`);
  if(!Number.isInteger(levelId)||levelId<0||levelId>=2500)throw new RangeError(`Müzik bulunamadı: ${theme}, bölüm ${levelId}`);
  const dark=theme==='red';
  const seed=musicHash(levelId+1+(dark?7489:13451));
  const voice=levelId<18?levelId%6:seed%6;
  const prefixes=dark?['OBSIDIAN','CRIMSON','VOID','EMBER','NIGHT','IRON','HOLLOW','RAVEN','SCARLET','ASH','ONYX','PHANTOM']:['SOLAR','GOLDEN','PHOTON','AURORA','PLASMA','AMBER','STELLAR','NEON','ION','LUMEN','CORONA','PRISM'];
  const endings=['REACTOR','CASCADE','PULSE','HORIZON','CIRCUIT','TIDE','RESONANCE','VOYAGER','AFTERGLOW','VECTOR','ORBIT','FREQUENCY'];
  const title=levelId<18?(dark?RED_TRACK_TITLES:YELLOW_TRACK_TITLES)[levelId]:`${prefixes[seed%prefixes.length]} ${endings[(seed>>>7)%endings.length]} · ${String(levelId+1).padStart(4,'0')}`;
  const scales=dark?[[0,2,3,5,7,8,10],[0,1,3,5,7,8,10],[0,2,3,6,7,9,10]]:[[0,2,4,5,7,9,11],[0,2,4,7,9],[0,2,4,6,7,9,11]];
  const scale=scales[(seed>>>11)%scales.length];
  const melody=levelId<18?TRACK_MOTIFS[levelId].map((note,index)=>note+(dark&&index%4===1?-1:0)):Array.from({length:16},(_,step)=>{
    const phrase=musicHash(seed+Math.floor(step/4)*769);
    const degree=(phrase%scale.length+(step%4)*((seed>>>17)%3+1)+(musicHash(seed+step*31)%3))%(scale.length*2);
    return scale[degree%scale.length]+Math.floor(degree/scale.length)*12;
  });
  const tempoBases=[118,128,136,110,166,146];
  return {title,bpm:levelId<18?(dark?RED_TRACK_TEMPOS:YELLOW_TRACK_TEMPOS)[levelId]:tempoBases[voice]+(seed>>>20)%19+(dark?4:0),
    genre:TRACK_GENRES[voice],root:(dark?42:48)+(levelId<18?(levelId*5)%12:(seed>>>5)%12),melody,
    chords:[...CHORD_PROGRESSIONS[levelId<18?(levelId+(dark?2:0))%6:(seed>>>14)%CHORD_PROGRESSIONS.length]],voice};
}

/** Bölümün kimliğinden tekrar üretilebilen on altı ölçülük aranje kurar. @param {TrackInfo} track @param {MusicTheme} theme @param {number} levelId @returns {Arrangement} */
function arrangeTrack(track,theme,levelId) {
  const beat=60/track.bpm;
  const seed=musicHash(levelId+(theme==='red'?9211:2713));
  const kickPatterns=[[0,4,8,12],[0,6,10],[0,4,8,12],[0,8],[0,7,10],[0,3,8,11]];
  /** @type {Arrangement} */
  const events={lead:[],bass:[],pad:[],arp:[],kick:[],snare:[],hat:[],crash:[]};
  for(let bar=0;bar<16;bar++){
    const start=bar*4*beat;
    const section=Math.floor(bar/4);
    const energy=[.7,1,.58,1][section];
    const root=track.root+track.chords[Math.floor(bar/2)%4];
    const third=theme==='red'?3:4;
    for(const offset of [0,third,7])events.pad.push({start,duration:beat*4,frequency:noteFrequency(root+12+offset),gain:.022*energy});
    if(bar%4===0)events.crash.push({start,gain:section===2?.03:.07});
    for(let step=0;step<16;step++){
      const instant=start+step*beat/4;
      if(kickPatterns[track.voice].includes(step)&&!(section===2&&bar%4===0&&step>0))events.kick.push({start:instant,gain:section===2?.65:.93});
      if(step===4||step===12)events.snare.push({start:instant,gain:section===2?.52:.82});
      if(step%2===0||(section!==2&&musicHash(seed+bar*37+step)%4===0))events.hat.push({start:instant,gain:(step%4===2?.14:.09)*energy});
      if(bar%4===3&&step>=14)events.snare.push({start:instant,gain:.3+(step-14)*.12});
      if(step%2===0){
        const noteStep=(bar*8+step/2+(section===3?4:0))%16;
        const gate=step%8===6?.78:.44;
        const omit=section===2&&step%4===2;
        if(!omit)events.lead.push({start:instant,duration:beat*gate,frequency:noteFrequency(root+12+track.melody[noteStep]),gain:.095*energy});
        if(!(section===2&&bar%4===0&&step>8))events.bass.push({start:instant,duration:beat*.45,frequency:noteFrequency(root-12+(step===12?7:0)),gain:.19*energy});
      }
      if(section!==0&&section!==2&&step%2===(seed%2)){
        const arpOffsets=[0,third,7,12];
        events.arp.push({start:instant,duration:beat*.29,frequency:noteFrequency(root+24+arpOffsets[(step+bar)%4]),gain:.036});
      }
    }
  }
  return events;
}

/** Örnek başına pahalı sinüs hesaplamadan kullanılacak yumuşatılmış dalga tablosu. @param {number} voice @param {number} brightness @returns {Float32Array} */
function createWaveTable(voice,brightness) {
  const table=new Float32Array(2048);
  const harmonics=[1,.25+voice*.025,.12*brightness,.07*brightness,.025*brightness];
  const total=harmonics.reduce((sum,value)=>sum+value,0);
  for(let index=0;index<table.length;index++){
    const phase=2*Math.PI*index/table.length;
    table[index]=harmonics.reduce((sum,value,harmonic)=>sum+Math.sin(phase*(harmonic+1))*value,0)/total;
  }
  return table;
}
/** @param {ToneEvent[]} events @param {Float32Array} table @param {number} sampleRate @param {number} length @param {number} decay @param {number} attackSeconds @returns {Float32Array} */
function renderTones(events,table,sampleRate,length,decay,attackSeconds) {
  const output=new Float32Array(length);
  const attack=Math.max(1,Math.floor(sampleRate*attackSeconds));
  const decayStep=Math.exp(-decay/sampleRate);
  for(const event of events){
    const start=Math.floor(event.start*sampleRate);
    const count=Math.min(Math.floor(event.duration*sampleRate),length-start);
    const release=Math.max(1,Math.min(Math.floor(sampleRate*.035),Math.floor(count*.25)));
    const increment=event.frequency*table.length/sampleRate;
    let phase=0;
    let amplitude=event.gain;
    for(let index=0;index<count;index++){
      const integer=phase|0;
      const fraction=phase-integer;
      const position=integer&2047;
      const wave=table[position]+(table[(position+1)&2047]-table[position])*fraction;
      const envelope=Math.min(1,index/attack)*Math.min(1,(count-index)/release);
      output[start+index]+=wave*amplitude*envelope;
      phase+=increment;
      amplitude*=decayStep;
    }
  }
  return output;
}
/** @param {number} sampleRate @param {number} seed @returns {{kick:Float32Array,snare:Float32Array,hat:Float32Array,crash:Float32Array}} */
function createDrums(sampleRate,seed) {
  const kick=new Float32Array(Math.ceil(sampleRate*.42));
  const snare=new Float32Array(Math.ceil(sampleRate*.2));
  const hat=new Float32Array(Math.ceil(sampleRate*.075));
  const crash=new Float32Array(Math.ceil(sampleRate*.55));
  let noiseSeed=seed;
  let previous=0;
  for(let index=0;index<crash.length;index++){
    const time=index/sampleRate;
    noiseSeed=(Math.imul(noiseSeed,1664525)+1013904223)>>>0;
    const noise=noiseSeed/2147483648-1;
    const high=(noise-previous)*.5;
    previous=noise;
    if(index<kick.length)kick[index]=(Math.sin(2*Math.PI*(48*time+3.3*(1-Math.exp(-time*37))))*.59+high*Math.exp(-time*280)*.11)*Math.exp(-time*15);
    if(index<snare.length)snare[index]=(high*.52+Math.sin(2*Math.PI*185*time)*.19)*Math.exp(-time*24)*Math.min(1,time*1300);
    if(index<hat.length)hat[index]=high*Math.exp(-time*68)*Math.min(1,time*3000);
    crash[index]=high*Math.exp(-time*8)*Math.min(1,time*900);
  }
  return {kick,snare,hat,crash};
}
/** @param {DrumEvent[]} events @param {Float32Array} sample @param {number} sampleRate @param {number} length @returns {Float32Array} */
function renderDrums(events,sample,sampleRate,length) {
  const output=new Float32Array(length);
  for(const event of events){
    const start=Math.floor(event.start*sampleRate);
    const count=Math.min(sample.length,length-start);
    for(let index=0;index<count;index++)output[start+index]+=sample[index]*event.gain;
  }
  return output;
}
/** @param {MusicTheme} theme @param {number} levelId @param {number} sampleRate @returns {Soundtrack} */
function composeSoundtrack(theme,levelId,sampleRate) {
  if(!Number.isInteger(sampleRate)||sampleRate<1000||sampleRate>192000)throw new RangeError(`Örnekleme hızı 1000–192000 arasında bir tam sayı olmalı: ${sampleRate}`);
  const track=trackInfo(theme,levelId);
  const beat=60/track.bpm;
  const length=Math.ceil(64*beat*sampleRate);
  const events=arrangeTrack(track,theme,levelId);
  const seed=musicHash(levelId+1+(theme==='red'?3091:6577));
  const samples=createDrums(sampleRate,seed);
  const lead=renderTones(events.lead,createWaveTable(track.voice,theme==='red'?1.2:.75),sampleRate,length,5+track.voice*.55,.004);
  const bass=renderTones(events.bass,createWaveTable(track.voice,.35),sampleRate,length,4,.003);
  const pad=renderTones(events.pad,createWaveTable(0,.1),sampleRate,length,.45,.07);
  const arp=renderTones(events.arp,createWaveTable((track.voice+3)%6,.6),sampleRate,length,9,.002);
  const kick=renderDrums(events.kick,samples.kick,sampleRate,length);
  const snare=renderDrums(events.snare,samples.snare,sampleRate,length);
  const hat=renderDrums(events.hat,samples.hat,sampleRate,length);
  const crash=renderDrums(events.crash,samples.crash,sampleRate,length);
  const left=new Float32Array(length);
  const right=new Float32Array(length);
  const delay=Math.floor(beat*.75*sampleRate);
  const shortDelay=Math.floor(sampleRate*.013);
  const fade=Math.floor(sampleRate*.006);
  for(let index=0;index<length;index++){
    const echoIndex=index>=delay?index-delay:length+index-delay;
    const wideIndex=index>=shortDelay?index-shortDelay:length+index-shortDelay;
    const body=kick[index]+snare[index]+bass[index]+pad[index]+crash[index];
    const sidechain=1-Math.min(.5,Math.abs(kick[index])*1.8);
    const melody=(lead[index]+arp[index])*sidechain;
    const echo=(lead[echoIndex]+arp[echoIndex])*.18;
    const gain=Math.min(1,index/fade,(length-1-index)/fade);
    const leftMix=(body+melody+echo+hat[index]*.82+arp[wideIndex]*.25)*1.1;
    const rightMix=(body+melody*.94+echo*.8+hat[wideIndex]*.75+lead[wideIndex]*.12)*1.1;
    left[index]=leftMix/(1+Math.abs(leftMix)*.45)*gain;
    right[index]=rightMix/(1+Math.abs(rightMix)*.45)*gain;
  }
  return {left,right,bpm:track.bpm,title:track.title};
}

/** Ses aygıtına ve müzik oynatımına bağlanır; yalnızca açık bölümün sesini bellekte tutar. */
class WaveMusic {
  /** @type {AudioContext} */ context;
  /** @type {AudioBuffer|null} */ buffer=null;
  /** @type {GainNode} */ master;
  /** @type {AudioBufferSourceNode|null} */ source=null;
  /** @type {number} */ bpm=0;
  /** @type {string} */ title='';
  /** @type {MusicTheme} */ theme;
  /** @type {number} */ levelId=-1;
  /** @param {MusicTheme} theme */
  constructor(theme) {
    this.context=new AudioContext({latencyHint:'interactive'});
    this.theme=theme;
    this.master=this.context.createGain();this.master.gain.value=.55;
    const compressor=this.context.createDynamicsCompressor();
    compressor.threshold.value=-12;compressor.ratio.value=5;
    this.master.connect(compressor);compressor.connect(this.context.destination);
  }
  /** @param {number} levelId @returns {void} */
  loadLevel(levelId) {
    if(levelId===this.levelId)return;
    this.stop();
    const track=composeSoundtrack(this.theme,levelId,this.context.sampleRate);
    this.bpm=track.bpm;this.title=track.title;
    this.buffer=this.context.createBuffer(2,track.left.length,this.context.sampleRate);
    this.buffer.copyToChannel(track.left,0);this.buffer.copyToChannel(track.right,1);
    this.levelId=levelId;
  }
  /** @param {number} volume @returns {void} */
  setVolume(volume) {
    if(!Number.isFinite(volume)||volume<0||volume>1)throw new RangeError(`Ses düzeyi 0–1 arasında olmalı: ${volume}`);
    this.master.gain.setTargetAtTime(volume,this.context.currentTime,.03);
  }
  /** @returns {Promise<void>} */
  async unlock() { await this.context.resume(); }
  /** @param {number} seconds @returns {void} */
  start(seconds) {
    if(!this.buffer)throw new Error('Müzik başlamadan önce bölüm parçasını yükle.');
    if(!Number.isFinite(seconds)||seconds<0)throw new RangeError(`Müzik başlangıcı negatif olmayan saniye olmalı: ${seconds}`);
    this.stop();
    const source=this.context.createBufferSource();
    source.buffer=this.buffer;source.loop=true;source.connect(this.master);
    source.start(0,seconds%this.buffer.duration);this.source=source;
  }
  /** @returns {void} */
  stop() { if(this.source){this.source.stop();this.source.disconnect();this.source=null;} }
  /** @param {number} frequency @param {number} duration @param {number} volume @returns {void} */
  effect(frequency,duration,volume) {
    const oscillator=this.context.createOscillator();
    const gain=this.context.createGain();
    oscillator.type='triangle';oscillator.frequency.setValueAtTime(frequency,this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency*.5,this.context.currentTime+duration);
    gain.gain.setValueAtTime(volume,this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,this.context.currentTime+duration);
    oscillator.connect(gain);gain.connect(this.master);oscillator.start();oscillator.stop(this.context.currentTime+duration);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  }
}
if(typeof module!=='undefined')module.exports={composeSoundtrack,noteFrequency,trackInfo};
