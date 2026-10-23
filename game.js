// @ts-check
/** @typedef {ProgressSave} SaveData */
/** @typedef {WaveCharacter & {path:string}} Character */
(() => {
  /** @template {HTMLElement} T @param {string} id @returns {T} */
  function element(id) {
    const result = document.getElementById(id);
    if (!result) throw new Error(`Arayüz öğesi bulunamadı: ${id}`);
    return /** @type {T} */ (result);
  }
  const theme = document.body.dataset.theme === 'red' ? 'red' : 'yellow';
  const red = theme === 'red';
  const accent = red ? '#ff415a' : '#ffe334';
  const muted = red ? '#80505d' : '#81763f';
  const canvas = /** @type {HTMLCanvasElement} */ (element('game'));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D desteklenmiyor. Güncel bir tarayıcı kullan.');
  const ctx = context;
  const levels = WaveEngine.levels(theme);
  const storageKey = `wave-challange-${theme}-v1`;
  const silhouettes = [
    'M -15 -12 L 17 0 L -15 12 L -8 0 Z',
    'M -17 -10 L 1 -5 L 16 0 L 1 5 L -17 10 L -8 0 Z',
    'M 0 -16 L 5 -5 L 17 0 L 5 5 L 0 16 L -5 5 L -17 0 L -5 -5 Z',
    'M -15 0 L -4 -13 L 15 0 L -4 13 Z M -4 -6 L 4 0 L -4 6 Z',
    'M -17 -14 L 0 -6 L 15 0 L 0 6 L -17 14 L -10 0 Z',
    'M -12 -15 L 5 -7 L -1 -2 L 16 4 L -9 15 L -3 4 L -17 -2 L -4 -7 Z',
    'M -17 -15 L 2 -8 L 17 0 L 2 8 L -17 15 L -8 4 L -1 0 L -8 -4 Z',
    'M -18 0 L -10 -15 L 1 -8 L 18 0 L 1 8 L -10 15 Z M -9 0 L -4 -5 L 6 0 L -4 5 Z',
    'M -16 -16 L -4 -6 L 4 -16 L 9 -5 L 18 0 L 9 5 L 4 16 L -4 6 L -16 16 L -10 0 Z',
    'M -18 -11 L -3 -8 L 2 -17 L 6 -7 L 19 0 L 6 7 L 2 17 L -3 8 L -18 11 L -9 0 Z',
    'M -18 -16 L -2 -9 L 13 -15 L 8 -5 L 19 0 L 8 5 L 13 15 L -2 9 L -18 16 L -10 0 Z M -4 0 L 1 -3 L 6 0 L 1 3 Z',
    'M -19 -17 L -4 -10 L 4 -18 L 8 -7 L 20 0 L 8 7 L 4 18 L -4 10 L -19 17 L -12 4 L -5 0 L -12 -4 Z M -4 -5 L 5 0 L -4 5 Z'
  ];
  /** @type {Character[]} */
  const characters = WaveProgression.characters(theme).map(character=>({...character,path:silhouettes[character.shape]}));
  const paths = characters.map(character => new Path2D(character.path));
  /** @returns {SaveData} */
  function readSave(){return WaveSave.parse(localStorage.getItem(storageKey),levels.length);}
  let save = readSave();
  if(!WaveProgression.isUnlocked(characters[save.character],save.records))save={...save,character:0};
  let selected = 0;
  let chapter=0;
  /** @type {'campaign'|'expedition'} */
  let library='campaign';
  let libraryPage=0;
  let toastUntil=0;
  let launchPending=false;
  let launchToken=0;
  let practiceStart=0;
  let run = WaveEngine.initial(1);
  let hazards = WaveEngine.obstacles(levels[0]);
  let energy = WaveEngine.energies(levels[0]);
  let practice = false;
  let pressed = false;
  /** @type {string[]} */
  let heldKeys=[];
  /** @type {number[]} */
  let heldPointers=[];
  let sound = true;
  /** @type {WaveMusic | null} */
  let music = null;
  let effectTime = 0;
  let lastTime = 0;
  let accumulator = 0;
  let sceneTime = 0;
  let lastHud = -1;
  const overlay = element('overlay');
  const play = element('play');
  const pauseButton = /** @type {HTMLButtonElement} */ (element('pause'));
  const dialog = /** @type {HTMLDialogElement} */ (element('help-dialog'));
  const settingsDialog=/** @type {HTMLDialogElement} */ (element('settings-dialog'));
  const practiceSlider=/** @type {HTMLInputElement} */ (element('practice-start'));
  const volumeSlider=/** @type {HTMLInputElement} */ (element('volume'));
  volumeSlider.value=String(Math.round(save.volume*100));
  element('volume-value').textContent=volumeSlider.value+'%';
  element('reduce-flashes').setAttribute('aria-checked',String(save.reducedFlashes));
  document.body.dataset.reducedFlashes=String(save.reducedFlashes);
  const characterDialog = /** @type {HTMLDialogElement} */ (element('character-dialog'));
  const levelSelect = /** @type {HTMLSelectElement} */ (element('level-select'));
  const levelSearch=/** @type {HTMLInputElement} */ (element('level-search'));
  const tierFilter=/** @type {HTMLSelectElement} */ (element('tier-filter'));
  /** @param {number} number @returns {string} */
  function two(number) { return String(number).padStart(2,'0'); }
  /** @returns {void} */
  function persist() { localStorage.setItem(storageKey,JSON.stringify(save)); }
  /** @returns {BrowseResult} */
  function browseLibrary(){return WaveLibrary.browse(levels,save.records,{query:levelSearch.value,filter:/** @type {LibraryFilter} */ (tierFilter.value),page:libraryPage,pageSize:8});}
  /** @param {Level} level @returns {string} */
  function levelCard(level){
    const record=save.records[level.id];
    const track=trackInfo(theme,level.id);
    const mastered=record.best===100&&record.energy===3;
    return `<button class="level ${selected===level.id?'selected':''} ${mastered?'mastered':''}" data-level="${level.id}" aria-pressed="${selected===level.id}" aria-label="${level.id+1}. ${level.name}, ${level.difficulty}, rekor yüzde ${Math.floor(record.best)}"><span class="level-number ${level.id>=999?'long-number':''}">${two(level.id+1)}</span><div><h3>${level.name}</h3><div class="level-meta"><span class="dots">${mastered?'✦':record.best===100?'✓':'◆'}</span><span>${level.difficulty}</span><span>${Math.round(WaveEngine.duration(level))} SN</span></div><span class="track-caption">♫ ${track.title} · ${track.bpm}</span></div><span class="level-score">${Math.floor(record.best)}%<small>${'◆'.repeat(record.energy)}${'◇'.repeat(3-record.energy)}</small></span><span class="level-bar"><i style="width:${record.best}%"></i></span></button>`;
  }
  /** @returns {void} */
  function renderLevels(){
    const campaign=library==='campaign';
    const chapters=[...new Set(levels.slice(0,18).map(level=>level.chapter))];
    element('chapters').hidden=!campaign;
    element('chapters').innerHTML=chapters.map((name,index)=>`<button data-chapter="${index}" aria-pressed="${chapter===index}" class="${chapter===index?'selected':''}">${two(index+1)} ${name}</button>`).join('');
    element('library-tools').hidden=campaign;
    element('pagination').hidden=campaign;
    document.querySelectorAll('[data-library]').forEach(button=>{
      const active=button instanceof HTMLElement&&button.dataset.library===library;
      button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));
    });
    const result=browseLibrary();
    libraryPage=result.page;
    const shown=campaign?levels.slice(chapter*6,chapter*6+6):result.levels;
    element('levels').innerHTML=shown.length?shown.map(levelCard).join(''):'<p class="empty-library">Bu aramada parkur yok. Adı, numarayı veya filtreyi değiştir.</p>';
    element('page-label').textContent=`${result.page+1} / ${result.pages}`;
    /** @type {HTMLButtonElement} */ (element('page-prev')).disabled=result.page===0;
    /** @type {HTMLButtonElement} */ (element('page-next')).disabled=result.page>=result.pages-1;
    element('library-summary').textContent=campaign?'18 ANA PARKUR':result.total.toLocaleString('tr')+' PARKUR';
    element('library-footnote').innerHTML=campaign?'18 ana parkur. Tek bir zirve.<br><strong>GRIEF seni bekliyor.</strong>':'2.482 farklı keşif rotası.<br><strong>Bir sonraki zaferini bul.</strong>';
    const quick=campaign?levels.slice(0,18):[...shown.filter(level=>level.id!==selected),levels[selected]];
    levelSelect.innerHTML=quick.map(level=>`<option value="${level.id}">${two(level.id+1)} / ${level.name}</option>`).join('');
    levelSelect.value=String(selected);
    if(levelSelect.selectedIndex<0){
      const option=document.createElement('option');option.value=String(selected);option.textContent=two(selected+1)+' / '+levels[selected].name;levelSelect.append(option);levelSelect.value=String(selected);
    }
    const career=WaveProgression.career(save.records);
    element('total-completed').innerHTML=`${two(career.completed)}<span>/2.500</span>`;
    element('career-stats').textContent=career.energy.toLocaleString('tr')+' ENERJİ · '+career.mastery.toLocaleString('tr')+' USTALIK';
    element('career-rank').textContent='SEVİYE '+career.level;
    element('career-xp').textContent=career.levelXp+' / '+career.nextLevelXp+' XP';
    element('career-fill').style.width=career.levelXp/career.nextLevelXp*100+'%';
    element('career-unlocks').textContent=characters.filter(character=>WaveProgression.isUnlocked(character,save.records)).length+' / 12';
    element('record-caption').textContent='REKOR %'+Math.floor(save.records[selected].best);
    renderMissions();
  }
  /** @param {WaveCharacter} character @returns {string} */
  function requirementLabel(character){
    const requirement=character.requirement;
    if(requirement.type==='free')return 'İlk uçuşun için hazır';
    if(requirement.type==='grief')return levels[17].name+' bölümünü bitir';
    if(requirement.type==='completions')return requirement.target+' farklı bölüm bitir';
    if(requirement.type==='energy')return requirement.target+' enerji topla';
    return requirement.target+' bölümü 3 enerjiyle bitir';
  }
  /** @param {WaveCharacter} character @returns {number} */
  function requirementProgress(character){
    const career=WaveProgression.career(save.records);
    switch(character.requirement.type){
      case 'free':return 1;
      case 'grief':return save.records[17].best===100?1:0;
      case 'completions':return career.completed;
      case 'energy':return career.energy;
      case 'mastery':return career.mastery;
    }
  }
  /** @returns {void} */
  function renderMissions(){
    const locked=characters.filter(character=>!WaveProgression.isUnlocked(character,save.records));
    const next=locked.slice(0,3);
    element('mission-list').innerHTML=next.length?next.map(character=>{
      const current=requirementProgress(character);
      const target=character.requirement.target;
      return `<div class="mission-row"><span>◇</span><div><strong>${character.name} karakterini kazan</strong><p>${requirementLabel(character)}</p><div class="mission-progress"><i style="width:${Math.min(100,current/target*100)}%"></i></div></div><small>${Math.min(current,target)} / ${target}</small></div>`;
    }).join(''):'<div class="mission-row"><span>✦</span><div><strong>Koleksiyon tamamlandı.</strong><p>Şimdi her parkurda üç enerjili bir iz bırak.</p></div></div>';
  }
  /** @returns {void} */
  function renderCharacters(){
    element('characters').innerHTML=characters.map((character,index)=>{
      const unlocked=WaveProgression.isUnlocked(character,save.records);
      return `<button class="character ${save.character===index?'selected':''} ${unlocked?'':'locked'}" data-character="${index}" aria-label="${character.name}${unlocked?'':', kilitli: '+requirementLabel(character)}" title="${unlocked?character.name:requirementLabel(character)}" aria-disabled="${!unlocked}" aria-pressed="${save.character===index}"><svg viewBox="-22 -22 44 44" aria-hidden="true"><path d="${character.path}" fill="${unlocked?accent:muted}" fill-rule="evenodd"/></svg>${unlocked?'':'<span class="character-lock">⌑</span>'}</button>`;
    }).join('');
    element('character-name').textContent=characters[save.character].name;
    element('character-open').innerHTML=`${characters[save.character].name} <span>◇</span>`;
    element('character-cards').innerHTML=characters.map((character,index)=>{
      const unlocked=WaveProgression.isUnlocked(character,save.records);
      return `<button class="character-card ${save.character===index?'selected':''} ${unlocked?'':'locked'}" data-pick-character="${index}" aria-label="${character.name}${unlocked?' karakterini seç':', kilitli: '+requirementLabel(character)}" aria-disabled="${!unlocked}" aria-pressed="${save.character===index}"><span class="rarity">${character.rarity}</span><svg viewBox="-25 -25 50 50" aria-hidden="true"><path d="${character.path}" fill="${accent}" fill-rule="evenodd"/></svg><strong>${character.name}</strong><small class="lock-reason">${unlocked?(save.character===index?'SEÇİLİ':'KAZANILDI · SEÇ'):requirementLabel(character)}</small></button>`;
    }).join('');
  }
  /** @param {string} title @param {string} copy @returns {void} */
  function notifyReward(title,copy){
    element('reward-title').textContent=title;element('reward-copy').textContent=copy;
    element('reward-toast').hidden=false;toastUntil=performance.now()+6000;
  }
  /** @returns {void} */
  function releaseControls() { heldKeys=[];heldPointers=[];pressed=false; }
  /** @returns {Promise<void>} */
  async function unlockMusic() {
    if(!music) music = new WaveMusic(theme);
    music.loadLevel(selected);
    await music.unlock();
    music.setVolume(sound?save.volume:0);
    element('music-label').textContent = music.title + ' / ' + music.bpm + ' BPM';
  }
  /** @param {number} frequency @param {number} duration @param {number} volume @returns {void} */
  function tone(frequency,duration,volume) { if(sound && music) music.effect(frequency,duration,volume); }
  /** @returns {void} */
  function openCharacters() {
    pause();
    renderCharacters();
    characterDialog.showModal();
  }
  /** @param {number} index @returns {void} */
  function chooseCharacter(index) {
    if(!Number.isInteger(index)||!characters[index]) throw new RangeError(`Karakter bulunamadı: ${index}`);
    pause();
    if(!WaveProgression.isUnlocked(characters[index],save.records)){
      notifyReward(characters[index].name+' · KİLİTLİ',requirementLabel(characters[index]));return;
    }
    save={...save,character:index};persist();renderCharacters();
  }
  /** @param {string} kicker @param {string} title @param {string} copy @param {string} action @returns {void} */
  function showOverlay(kicker,title,copy,action) {
    element('overlay-kicker').textContent = kicker;
    element('overlay-title').innerHTML = title;
    element('overlay-copy').textContent = copy;
    play.innerHTML = `${action} <span>↗</span>`;
    overlay.hidden = false;
  }
  /** @returns {void} */
  function cancelLaunch(){launchToken+=1;launchPending=false;}
  /** @param {number} index @returns {void} */
  function selectLevel(index) {
    if (!levels[index]) throw new RangeError(`Bölüm bulunamadı: ${index}`);
    cancelLaunch();
    selected = index;
    library=levels[index].kind;
    chapter=index<18?Math.floor(index/6):chapter;
    if(library==='expedition'){
      const result=browseLibrary();
      if(!result.levels.some(level=>level.id===index)){
        levelSearch.value='';tierFilter.value='all';libraryPage=Math.floor((index-18)/8);
      }
    }
    save={...save,lastLevel:index};persist();
    run = WaveEngine.initial(1);
    hazards = WaveEngine.obstacles(levels[index]);
    energy = WaveEngine.energies(levels[index]);
    releaseControls();
    lastHud = -1;
    element('hud').hidden = true;
    element('progress-bar').style.width = '0%';
    if(music){music.loadLevel(index);music.start(0);element('music-label').textContent=music.title+' / '+music.bpm+' BPM';}
    element('arena-caption').textContent = `${two(index + 1)} — ${levels[index].name.toLocaleUpperCase('tr')}`;
    element('difficulty-label').textContent = levels[index].difficulty;
    element('key-hint').textContent = 'SPACE VEYA DOKUN';
    element('sector-label').textContent=levels[index].district;
    element('result-stats').hidden=true;
    pauseButton.disabled = true;
    showOverlay(practice ? 'ANTRENMAN · %'+practiceStart : levels[index].chapter+' / '+levels[index].difficulty,levels[index].name,trackInfo(theme,index).title+' · '+trackInfo(theme,index).genre+' · '+Math.round(WaveEngine.duration(levels[index]))+' saniye','BAŞLA');
    renderLevels();
  }
  /** @returns {Promise<void>} */
  async function start() {
    if(launchPending)return;
    if (run.phase === 'paused') { resume(); return; }
    if (run.phase === 'won'&&!practice) selectLevel(WaveLibrary.nextLevel(selected));
    const token=++launchToken;
    launchPending=true;
    try{await unlockMusic();}finally{if(token===launchToken)launchPending=false;}
    if(token!==launchToken||dialog.open||characterDialog.open||settingsDialog.open||document.hidden)return;
    const attempt = run.phase === 'dead' ? run.attempt + 1 : run.attempt;
    const startX=practice?levels[selected].length*practiceStart/100:0;
    run = {...WaveEngine.initial(attempt),phase:'playing',x:startX,y:WaveEngine.corridor(levels[selected],startX).center,time:WaveEngine.timeAt(levels[selected],startX),checkpoint:startX};
    accumulator = 0;
    if(music) music.start(run.time);
    lastHud = -1;
    overlay.hidden = true;
    element('result-stats').hidden=true;
    element('level-panel').classList.remove('choose-level');
    element('hud').hidden = false;
    element('practice-badge').hidden = !practice;
    pauseButton.disabled = false;
    pauseButton.textContent = 'Ⅱ';
    canvas.focus({preventScroll:true});
    tone(440,.12,.06);
  }
  /** @returns {void} */
  function pause() {
    cancelLaunch();
    if (run.phase !== 'playing') return;
    run = {...run,phase:'paused'};
    releaseControls();
    if(music) music.stop();
    pauseButton.textContent = '▷';
    element('result-stats').hidden=true;
    showOverlay('BİR NEFES AL','Akış seni<br>bekliyor.','Hazır olduğunda kaldığın yerden devam et.','DEVAM ET');
    element('key-hint').textContent = 'P VEYA SPACE';
  }
  /** @returns {void} */
  function resume() {
    run = {...run,phase:'playing'};
    if(music) music.start(run.time);
    releaseControls();
    accumulator = 0;
    overlay.hidden = true;
    pauseButton.textContent = 'Ⅱ';
    canvas.focus({preventScroll:true});
  }
  /** @returns {void} */
  function restart() {
    cancelLaunch();
    releaseControls();
    run = {...WaveEngine.initial(run.attempt),phase:'dead'};
    void start();
  }
  /** @returns {void} */
  function finish() {
    releaseControls();
    effectTime=sceneTime;
    pauseButton.disabled = true;
    const progress = Math.min(100,run.x / levels[selected].length * 100);
    const before=save.records;
    if (!practice) {
      save = {...save, records:save.records.map((record,index) => index === selected ? {...record,best:Math.max(record.best,progress),energy:Math.max(record.energy,run.collected.length),attempts:record.attempts+1,wins:record.wins+(run.phase==='won'?1:0),bestTime:run.phase==='won'?Math.min(record.bestTime===null?Infinity:record.bestTime,run.time):record.bestTime} : record)};
      persist();
      renderLevels();
      renderCharacters();
    }
    const reward=WaveProgression.reward(before,save.records,characters);
    if(reward.unlocked.length)notifyReward('YENİ KARAKTER KAZANDIN',reward.unlocked.map(index=>characters[index].name).join(' · ')+' · Koleksiyonundan seçebilirsin.');
    element('result-stats').hidden=false;
    element('result-stats').innerHTML=`<div><strong>${practice?'—':'+'+reward.xp}</strong><small>${practice?'ANTRENMAN':'XP'}</small></div><div><strong>${run.collected.length} / 3</strong><small>ENERJİ</small></div><div><strong>${Math.floor(save.records[selected].best)}%</strong><small>EN İYİ</small></div>`;
    if (run.phase === 'won') {
      tone(880,.5,.09);
      showOverlay(practice?'ANTRENMAN TAMAMLANDI':selected===17?'GRIEF FETHEDİLDİ':run.collected.length===3?'KUSURSUZ ZAFER':'BÖLÜM TAMAMLANDI',red?'Karanlığı<br>geride bıraktın.':'Işık seninle.<br>Kusursuz geçiş.',`${two(run.attempt)} deneme · ${run.time.toFixed(1)} saniye · ${practice?'Alıştırmaya devam et.':reward.unlocked.length?'Yeni karakter hangarında.':'Bir iz daha bıraktın.'}`,practice?'TEKRAR OYNA':selected===17||selected===2499?'KEŞFE ÇIK':'SONRAKİ BÖLÜM');
    } else {
      tone(95,.25,.15);
      showOverlay(`DENEME ${two(run.attempt)} · %${Math.floor(progress)}`,red ? 'Düştün.<br>Yeniden doğ.' : 'Az kaldı.<br>Bir daha dene.',`En iyi: %${Math.floor(save.records[selected].best)} · Enerji: ${run.collected.length}/3`,'TEKRAR DENE');
    }
    element('key-hint').textContent = 'SPACE VEYA DOKUN';
  }
  /** @param {number} x @param {number} y @param {number} radius @param {number} angle @returns {void} */
  function drawSaw(x,y,radius,angle) {
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    ctx.beginPath();
    for (let index=0;index<24;index++) {
      const a = index / 24 * Math.PI * 2;
      const r = index % 2 === 0 ? radius : radius * .63;
      if (index === 0) ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r); else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
    }
    ctx.closePath();ctx.fillStyle=red ? '#542131':'#404a24';ctx.fill();ctx.strokeStyle=accent;ctx.lineWidth=1.5;ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fillStyle=accent;ctx.fill();ctx.restore();
  }
  /** @param {number} viewX @param {number} time @returns {void} */
  function background(viewX,time){
    const level=levels[selected];
    const vista=level.seed%6;
    const sky=ctx.createLinearGradient(0,0,1200,540);
    sky.addColorStop(0,red?'#210c19':'#202214');sky.addColorStop(.55,red?'#100a16':'#101c1b');sky.addColorStop(1,red?'#300f1d':'#272714');
    ctx.fillStyle=sky;ctx.fillRect(0,0,1200,540);
    const horizon=ctx.createRadialGradient(885,210,4,885,210,390);
    horizon.addColorStop(0,red?'#ff324c20':'#ffe15423');horizon.addColorStop(1,'#00000000');ctx.fillStyle=horizon;ctx.fillRect(0,0,1200,540);
    const starOffset=level.seed%211;
    for(let index=0;index<64;index++){
      const depth=1+index%3;
      const x=((index*137.71+starOffset-viewX*.018*depth)%1240+1240)%1240;
      const y=22+(index*73.17+starOffset)%450;
      ctx.globalAlpha=.12+depth*.09+(save.reducedFlashes?0:Math.sin(time*.4+index)*.07);
      ctx.fillStyle=index%9===0?'#fff3df':accent;
      ctx.fillRect(x,y,index%9===0?2:1,index%9===0?2:1);
    }
    ctx.globalAlpha=1;
    const orbX=900-(viewX*.014)%260;
    const orbY=190+vista*9;
    const radius=62+vista*9;
    ctx.save();ctx.translate(orbX,orbY);ctx.rotate(red?-.36:.2);
    ctx.strokeStyle=accent;ctx.fillStyle=red?'#ff425108':'#ffe65d0b';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.28;ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,radius-9,0,Math.PI*2);ctx.globalAlpha=.10;ctx.stroke();
    for(let index=0;index<3;index++){
      ctx.beginPath();ctx.ellipse(0,0,radius+25+index*19,(radius+25+index*19)*(.35+vista*.03),index*.6+time*.018,0,Math.PI*2);ctx.globalAlpha=.16-index*.03;ctx.stroke();
    }
    if(red){
      ctx.fillStyle='#100a16';ctx.globalAlpha=.86;ctx.beginPath();ctx.arc(22,-11,radius*.89,0,Math.PI*2);ctx.fill();
      for(let index=0;index<9;index++){
        const angle=index/9*Math.PI*2+time*.018;
        ctx.globalAlpha=.19;ctx.beginPath();ctx.moveTo(Math.cos(angle)*(radius+10),Math.sin(angle)*(radius+10));ctx.lineTo(Math.cos(angle)*(radius+19+index%3*8),Math.sin(angle)*(radius+19+index%3*8));ctx.stroke();
      }
    }else{
      ctx.globalAlpha=.24;
      for(let index=0;index<24;index++){
        const angle=index/24*Math.PI*2+time*.012;
        ctx.beginPath();ctx.moveTo(Math.cos(angle)*(radius+7),Math.sin(angle)*(radius+7));ctx.lineTo(Math.cos(angle)*(radius+12+index%3*4),Math.sin(angle)*(radius+12+index%3*4));ctx.stroke();
      }
    }
    ctx.restore();
    for(let layer=0;layer<2;layer++){
      const drift=viewX*(.024+layer*.023);
      ctx.fillStyle=red?(layer?'#2d1120':'#1d1020'):(layer?'#293020':'#162624');
      ctx.globalAlpha=layer?.45:.6;
      ctx.beginPath();ctx.moveTo(0,540);
      for(let index=-1;index<14;index++){
        const x=index*110-(drift%110);
        const height=90+((index+22)*73+level.seed*(layer+1))%140;
        if(vista%2===0){ctx.lineTo(x,540-height*.65);ctx.lineTo(x+50,540-height);ctx.lineTo(x+110,540-height*.6);}
        else{ctx.lineTo(x,540-height);ctx.lineTo(x+38,540-height);ctx.lineTo(x+38,540-height-25);ctx.lineTo(x+68,540-height-25);ctx.lineTo(x+68,540-height);ctx.lineTo(x+110,540-height);}
      }
      ctx.lineTo(1200,540);ctx.closePath();ctx.fill();
    }
    ctx.globalAlpha=.09;ctx.strokeStyle=accent;ctx.lineWidth=1;ctx.beginPath();
    const scroll=(viewX*.12)%90;
    for(let x=-scroll;x<=1200;x+=90){ctx.moveTo(x,0);ctx.lineTo(x,540);}
    for(let y=0;y<=540;y+=90){ctx.moveTo(0,y);ctx.lineTo(1200,y);}
    ctx.stroke();ctx.globalAlpha=1;
    if(run.phase==='playing'&&!save.reducedFlashes){
      const bpm=music?music.bpm:140;
      const pulse=Math.pow(1-(run.time*bpm/60)%1,4);
      ctx.fillStyle=accent;ctx.globalAlpha=pulse*.035;ctx.fillRect(0,0,1200,540);ctx.globalAlpha=1;
    }
  }
  /** @param {number} viewX @returns {void} */
  function drawWalls(viewX) {
    const level=levels[selected];
    const stride=level.tier>=12?2:5;
    for(const edge of ['top','bottom']) {
      const isTop=edge === 'top';
      ctx.beginPath();ctx.moveTo(-20,isTop ? 0:540);
      for(let x=-20;x<=1220;x+=stride) {
        const bounds=WaveEngine.corridor(level,viewX+x-180);
        ctx.lineTo(x,isTop ? bounds.top:bounds.bottom);
      }
      ctx.lineTo(1220,isTop ? 0:540);ctx.closePath();
      ctx.fillStyle=red ? '#290d19':'#252e1c';ctx.fill();
      ctx.save();ctx.clip();ctx.strokeStyle=red ? '#471b2b':'#3b4426';ctx.lineWidth=1;
      for(let x=-((viewX*.6)%35)-540;x<1750;x+=35) {ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+540,540);ctx.stroke();}
      ctx.restore();
      ctx.beginPath();
      for(let x=-20;x<=1220;x+=stride) {
        const bounds=WaveEngine.corridor(level,viewX+x-180);
        const y=isTop ? bounds.top:bounds.bottom;
        if(x===-20) ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.shadowColor=accent;ctx.shadowBlur=8;ctx.stroke();ctx.shadowBlur=0;
    }
  }
  /** @param {number} time @returns {void} */
  function draw(time) {
    const active=run.phase !== 'ready';
    const viewX=active ? run.x : time*35;
    background(viewX,time);
    drawWalls(viewX);
    const recordX=levels[selected].length*save.records[selected].best/100-viewX+180;
    if(active&&save.records[selected].best>0&&save.records[selected].best<100&&recordX>180&&recordX<1200){
      ctx.save();ctx.setLineDash([3,9]);ctx.strokeStyle='#d3eefb';ctx.globalAlpha=.3;ctx.beginPath();ctx.moveTo(recordX,55);ctx.lineTo(recordX,490);ctx.stroke();ctx.setLineDash([]);ctx.font='600 10px Arial';ctx.fillStyle='#d3eefb';ctx.fillText('REKOR',recordX+9,80);ctx.restore();
    }
    for(const obstacle of hazards) {
      const x=obstacle.x-viewX+180;
      if(x>-50&&x<1250) drawSaw(x,obstacle.y,obstacle.radius,time*(red ? -1.5:1.2));
    }
    for(const portal of WaveEngine.portals(levels[selected])){
      const x=portal.x-viewX+180;
      if(x<-40||x>1240)continue;
      const cy=WaveEngine.corridor(levels[selected],portal.x).center;
      ctx.save();ctx.strokeStyle=portal.color;ctx.shadowColor=portal.color;ctx.shadowBlur=15;ctx.lineWidth=3;
      ctx.beginPath();ctx.ellipse(x,cy,15,75,0,0,Math.PI*2);ctx.stroke();
      ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,cy,23,84,0,0,Math.PI*2);ctx.stroke();
      ctx.shadowBlur=0;ctx.fillStyle=portal.color;ctx.textAlign='center';ctx.font='bold 10px Arial';ctx.fillText(portal.label,x,cy-99);ctx.restore();
    }
    for(const item of energy) {
      if(run.collected.includes(item.index)) continue;
      const x=item.x-viewX+180;
      if(x<-30||x>1230) continue;
      ctx.save();ctx.translate(x,item.y);ctx.rotate(time*1.4);ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.shadowColor=accent;ctx.shadowBlur=15;
      ctx.strokeRect(-10,-10,20,20);ctx.fillStyle=accent;ctx.fillRect(-4,-4,8,8);ctx.restore();
    }
    const endX=levels[selected].length-viewX+180;
    if(endX<1250){
      ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.shadowColor=accent;ctx.shadowBlur=20;
      ctx.beginPath();ctx.ellipse(endX,WaveEngine.corridor(levels[selected],levels[selected].length).center,18,80,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
    }
    const y=active ? run.y:270+Math.sin(time*1.4)*42;
    ctx.save();ctx.strokeStyle=accent;ctx.lineWidth=7;ctx.lineJoin='round';ctx.shadowColor=accent;ctx.shadowBlur=12;
    ctx.beginPath();
    if(active && run.trail.length>1) run.trail.forEach((point,index) => {if(index===0)ctx.moveTo(point.x-viewX+180,point.y);else ctx.lineTo(point.x-viewX+180,point.y);});
    else {ctx.moveTo(0,300);ctx.lineTo(50,235);ctx.lineTo(112,315);ctx.lineTo(180,y);}
    ctx.globalAlpha=.16;ctx.stroke();ctx.globalAlpha=1;ctx.lineWidth=2.8;ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle=red?'#ffb4c1':'#fff3b6';ctx.lineWidth=.8;ctx.stroke();ctx.restore();
    if(run.phase === 'dead') {
      for(let i=0;i<12;i++){
        const a=i/12*Math.PI*2+time*.3;
        const age=Math.min(1,sceneTime-effectTime);ctx.fillStyle=accent;ctx.globalAlpha=(1-age)*.8;ctx.fillRect(180+Math.cos(a)*(20+age*150),y+Math.sin(a)*(20+age*150),4,4);
      }
      ctx.globalAlpha=1;
    } else {
      const mode=WaveEngine.modeAt(levels[selected],run.x);
      ctx.save();ctx.translate(180,y);ctx.rotate(active ? (pressed!==mode.inverted?-1:1)*Math.atan(mode.mini?2:1):Math.sin(time*1.4)*.5);
      if(mode.mini)ctx.scale(.6,.6);
      ctx.shadowColor=accent;ctx.shadowBlur=20;
      const body=ctx.createLinearGradient(-20,-15,20,15);body.addColorStop(0,red?'#9c2446':'#b79822');body.addColorStop(.55,accent);body.addColorStop(1,'#fff4dc');
      ctx.fillStyle=body;ctx.fill(paths[save.character],'evenodd');ctx.strokeStyle='#fff6d0';ctx.lineWidth=1;ctx.stroke(paths[save.character]);ctx.restore();
    }
    if(run.flash>0&&!save.reducedFlashes){ctx.globalAlpha=run.flash*.6;ctx.fillStyle=accent;ctx.fillRect(0,0,1200,540);ctx.globalAlpha=1;}
    if(run.phase==='won'){
      for(let i=0;i<45;i++){
        ctx.globalAlpha=.65;ctx.fillStyle=i%3===0 ? '#fff':accent;
        ctx.fillRect((i*71+time*20)%1200,(i*43+time*45)%540,3,7);
      }
      ctx.globalAlpha=1;
    }
  }
  /** @param {number} timestamp @returns {void} */
  function frame(timestamp) {
    const dt=Math.min((timestamp-lastTime)/1000,.05);
    lastTime=timestamp;
    if(run.phase!=='paused') sceneTime+=dt;
    if(run.phase==='playing') {
      accumulator+=dt;
      while(accumulator>=1/240 && run.phase==='playing') {
        const previousCoins=run.collected.length;
        run=WaveEngine.step(run,levels[selected],pressed,1/240,practice,hazards,energy);
        accumulator-=1/240;
        if(run.collected.length>previousCoins) tone(1000,.16,.07);
      }
      const mode=WaveEngine.modeAt(levels[selected],run.x);
      element('mode-badge').textContent=[mode.mini?'MİNİ':'WAVE',mode.inverted?'TERS':'NORMAL',mode.speed+'×'].join(' · ');
      const progress=Math.floor(run.x/levels[selected].length*100);
      if(progress!==lastHud){
        lastHud=progress;element('progress').textContent=`${progress}%`;element('progress-bar').style.width=`${progress}%`;
      }
      element('attempt').textContent=`DENEME ${two(run.attempt)}  ·  ${'◆'.repeat(run.collected.length)}${'◇'.repeat(3-run.collected.length)}`;
      if(run.phase==='dead'||run.phase==='won') finish();
    }
    draw(sceneTime);
    if(toastUntil&&timestamp>toastUntil){element('reward-toast').hidden=true;toastUntil=0;}
    requestAnimationFrame(frame);
  }
  play.addEventListener('click',()=>{releaseControls();void start();});
  pauseButton.addEventListener('click',() => run.phase==='paused' ? resume():pause());
  element('restart').addEventListener('click',restart);
  element('levels').addEventListener('click',event => {
    if(!(event.target instanceof Element)) return;
    const button=event.target.closest('[data-level]');
    if(button instanceof HTMLElement) selectLevel(Number(button.dataset.level));
  });
  element('chapters').addEventListener('click',event=>{
    if(!(event.target instanceof Element))return;
    const button=event.target.closest('[data-chapter]');
    if(button instanceof HTMLElement){pause();chapter=Number(button.dataset.chapter);renderLevels();}
  });
  document.querySelectorAll('[data-library]').forEach(button=>button.addEventListener('click',()=>{
    if(!(button instanceof HTMLElement))return;
    const next=button.dataset.library;
    if(next!=='campaign'&&next!=='expedition')throw new TypeError('Kütüphane türü geçersiz: '+next);
    pause();library=next;renderLevels();
  }));
  levelSearch.addEventListener('focus',pause);
  tierFilter.addEventListener('focus',pause);
  levelSearch.addEventListener('input',()=>{libraryPage=0;renderLevels();});
  tierFilter.addEventListener('change',()=>{libraryPage=0;renderLevels();});
  element('page-prev').addEventListener('click',()=>{libraryPage=Math.max(0,libraryPage-1);renderLevels();});
  element('page-next').addEventListener('click',()=>{libraryPage+=1;renderLevels();});
  practiceSlider.addEventListener('input',()=>{
    practiceStart=Number(practiceSlider.value);element('practice-position').textContent='%'+practiceStart;
    if(practice)selectLevel(selected);
  });
  element('settings-open').addEventListener('click',()=>{pause();settingsDialog.showModal();});
  element('settings-close').addEventListener('click',()=>settingsDialog.close());
  volumeSlider.addEventListener('input',()=>{
    save={...save,volume:Number(volumeSlider.value)/100};persist();element('volume-value').textContent=volumeSlider.value+'%';
    if(music)music.setVolume(sound?save.volume:0);
  });
  element('reduce-flashes').addEventListener('click',()=>{
    save={...save,reducedFlashes:!save.reducedFlashes};persist();element('reduce-flashes').setAttribute('aria-checked',String(save.reducedFlashes));
    document.body.dataset.reducedFlashes=String(save.reducedFlashes);
  });
  element('characters').addEventListener('click',event => {
    if(!(event.target instanceof Element)) return;
    const button=event.target.closest('[data-character]');
    if(button instanceof HTMLElement) chooseCharacter(Number(button.dataset.character));
  });
  element('practice').addEventListener('click',() => {
    practice=!practice;
    element('practice').setAttribute('aria-checked',String(practice));
    selectLevel(selected);
  });
  element('sound').addEventListener('click',async () => {
    sound=!sound;await unlockMusic();
    if(run.phase!=='playing'&&run.phase!=='paused') music.start(0);
    element('sound').innerHTML=`MÜZİK ${sound ? 'AÇIK':'KAPALI'} <span>${sound ? '♫':'◌'}</span>`;
    element('sound').setAttribute('aria-label',sound ? 'Müziği kapat':'Müziği aç');
    element('sound').title=sound ? 'Müziği kapat':'Müziği aç';
  });
  element('character-open').addEventListener('click',openCharacters);
  element('overlay-character').addEventListener('click',openCharacters);
  element('character-cards').addEventListener('click',event=>{
    if(!(event.target instanceof Element))return;
    const button=event.target.closest('[data-pick-character]');
    if(button instanceof HTMLElement)chooseCharacter(Number(button.dataset.pickCharacter));
  });
  element('character-confirm').addEventListener('click',()=>characterDialog.close());
  element('character-close').addEventListener('click',()=>characterDialog.close());
  levelSelect.addEventListener('change',()=>selectLevel(Number(levelSelect.value)));
  element('overlay-levels').addEventListener('click',()=>{
    pause();element('level-panel').classList.add('choose-level');
    element('level-panel').scrollIntoView({behavior:'smooth',block:'center'});
    const first=element('levels').querySelector('button');if(first)first.focus({preventScroll:true});
  });
  element('fullscreen').addEventListener('click',async () => {
    if(document.fullscreenElement) await document.exitFullscreen();
    else await element('arena').requestFullscreen();
  });
  element('help').addEventListener('click',() => {pause();dialog.showModal();});
  dialog.querySelectorAll('.close-dialog,.close-help').forEach(button => button.addEventListener('click',()=>dialog.close()));
  canvas.addEventListener('pointerdown',event => {
    event.preventDefault();
    if(run.phase!=='playing'||event.button!==0) return;
    canvas.setPointerCapture(event.pointerId);heldPointers=[...heldPointers,event.pointerId];pressed=true;
  });
  window.addEventListener('pointerup',event => {heldPointers=heldPointers.filter(id=>id!==event.pointerId);pressed=heldKeys.length>0||heldPointers.length>0;});
  canvas.addEventListener('pointercancel',() => {releaseControls();pause();});
  canvas.addEventListener('contextmenu',event=>event.preventDefault());
  window.addEventListener('keyup',event=>{heldKeys=heldKeys.filter(key=>key!==event.code);pressed=heldKeys.length>0||heldPointers.length>0;});
  window.addEventListener('keydown',event=>{
    if(dialog.open||characterDialog.open||settingsDialog.open) return;
    if(event.target instanceof HTMLInputElement||event.target instanceof HTMLSelectElement)return;
    if(event.code==='Space'||event.code==='ArrowUp'){
      if(event.target instanceof HTMLButtonElement && run.phase!=='playing' && event.code==='Space') return;
      event.preventDefault();
      if(event.repeat) return;
      if(run.phase!=='playing') void start();
      heldKeys=[...heldKeys,event.code];pressed=true;
    }
    if((event.code==='KeyP'||event.code==='Escape')&&!event.repeat){
      event.preventDefault();if(run.phase==='paused')resume();else pause();
    }
    if(event.code==='KeyR'&&!event.repeat){event.preventDefault();restart();}
    if(event.code==='KeyC'&&!event.repeat){event.preventDefault();openCharacters();}
  });
  window.addEventListener('blur',() => {releaseControls();pause();});
  document.addEventListener('visibilitychange',() => {if(document.hidden)pause();});
  renderCharacters();selectLevel(save.lastLevel);requestAnimationFrame(frame);
})();
