// ============================================================
// PICCOLI EROI 2 - Motore audio chiptune (Web Audio API)
// ============================================================

const SOUND_KEY = 'piccoli_eroi_2_sound';

export const AUDIO = {
  ctx: null,
  enabled: true,
  masterGain: null,
  musicGain: null,
  sfxGain: null,
  currentMusic: null,
  musicTimer: null,
  getScreenMusic: null, // callback impostato da main.js: ritorna il nome traccia per lo stato corrente

  init(){
    if(this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.22;
      this.musicGain.connect(this.masterGain);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.masterGain);
    } catch(e){ this.enabled = false; }
  },

  // Preferenza audio persistente: il mute sopravvive alla chiusura dell'app.
  // Chiamare al boot (main.js), prima del primo render.
  loadPrefs(){
    try { if(localStorage.getItem(SOUND_KEY)==='off') this.enabled = false; } catch(e){}
    this.updateToggleBtn();
  },
  savePrefs(){
    try { localStorage.setItem(SOUND_KEY, this.enabled ? 'on' : 'off'); } catch(e){}
  },
  updateToggleBtn(){
    const btn = document.getElementById('soundToggle');
    if(btn){
      btn.classList.toggle('muted', !this.enabled);
      btn.innerHTML = this.enabled ? '&#9835;' : '&#9836;';
    }
  },

  // Sblocco al primo gesto utente (policy autoplay iOS/Chrome):
  // il contesto creato prima del gesto nasce 'suspended' e la musica
  // schedulata in quel periodo si accumula a currentTime congelato.
  // Qui: resume + riavvio pulito della traccia della schermata corrente.
  unlock(){
    this.init();
    if(!this.ctx || !this.enabled) return;
    if(this.ctx.state !== 'suspended') return;
    this.ctx.resume().then(() => {
      const track = this.getScreenMusic ? this.getScreenMusic() : null;
      this.stopMusic();
      if(track) this.playMusic(track);
    }).catch(()=>{});
  },

  toggle(){
    this.enabled = !this.enabled;
    this.savePrefs();
    this.updateToggleBtn();
    if(!this.enabled){
      this.stopMusic();
    } else {
      this.init();
      if(this.ctx && this.ctx.state==='suspended') this.ctx.resume();
      this.currentMusic = null;
      if(this.getScreenMusic){
        const track = this.getScreenMusic();
        if(track) this.playMusic(track);
      }
    }
  },

  playNote(freq, duration, type='square', gainNode=null, startTime=null, vol=1){
    if(!this.enabled || !this.ctx) return;
    const t = startTime || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol*0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+duration);
    osc.connect(g);
    g.connect(gainNode || this.sfxGain);
    osc.start(t);
    osc.stop(t+duration);
  },

  noise(dur=0.15, vol=0.25){
    if(!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const n = this.ctx.createBufferSource();
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate*dur, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/(d.length*0.15));
    n.buffer = buf;
    const g = this.ctx.createGain(); g.gain.value = vol;
    n.connect(g); g.connect(this.sfxGain); n.start(t);
  },

  sfx(name){
    if(!this.enabled) return;
    this.init();
    if(!this.ctx) return;
    if(this.ctx.state==='suspended') this.ctx.resume();
    const t = this.ctx.currentTime;
    const SFX = {
      attack_hit: ()=>{ this.playNote(200,0.08,'square'); this.playNote(300,0.06,'square',null,t+0.05); this.playNote(150,0.1,'sawtooth',null,t+0.02); },
      attack_miss: ()=>{
        const osc=this.ctx.createOscillator(); const g=this.ctx.createGain();
        osc.type='sawtooth';
        osc.frequency.setValueAtTime(400,t);
        osc.frequency.exponentialRampToValueAtTime(100,t+0.15);
        g.gain.setValueAtTime(0.15,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.15);
        osc.connect(g); g.connect(this.sfxGain); osc.start(t); osc.stop(t+0.15);
      },
      critical: ()=>{ [523,659,784,1047].forEach((f,i)=>this.playNote(f,0.15,'square',null,t+i*0.07,1.2)); this.noise(0.1,0.2); },
      spell: ()=>{
        [262,330,392,523,659].forEach((f,i)=>this.playNote(f,0.2,'sine',null,t+i*0.06,0.8));
        const osc=this.ctx.createOscillator(); const g=this.ctx.createGain();
        osc.type='sine';
        osc.frequency.setValueAtTime(800,t);
        osc.frequency.exponentialRampToValueAtTime(2000,t+0.3);
        g.gain.setValueAtTime(0.08,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.4);
        osc.connect(g); g.connect(this.sfxGain); osc.start(t); osc.stop(t+0.4);
      },
      heal: ()=>{ [392,494,587,784].forEach((f,i)=>this.playNote(f,0.25,'sine',null,t+i*0.1,0.7)); },
      damage: ()=>{ this.noise(0.15,0.25); this.playNote(80,0.12,'sawtooth'); },
      breath: ()=>{
        this.noise(0.5,0.3);
        const osc=this.ctx.createOscillator(); const g=this.ctx.createGain();
        osc.type='sawtooth';
        osc.frequency.setValueAtTime(150,t);
        osc.frequency.exponentialRampToValueAtTime(60,t+0.5);
        g.gain.setValueAtTime(0.2,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.5);
        osc.connect(g); g.connect(this.sfxGain); osc.start(t); osc.stop(t+0.5);
      },
      dice: ()=>{ for(let i=0;i<6;i++){ this.playNote(800+Math.random()*600,0.03,'square',null,t+i*0.03,0.5); } },
      chest: ()=>{ [262,330,392,523].forEach((f,i)=>this.playNote(f,0.18,'square',null,t+i*0.12,0.8)); },
      buy: ()=>{ this.playNote(880,0.08,'square'); this.playNote(1109,0.08,'square',null,t+0.08); this.playNote(1319,0.12,'square',null,t+0.16); },
      levelup: ()=>{ [523,587,659,784,880,1047].forEach((f,i)=>{ this.playNote(f,0.2,'square',null,t+i*0.1,1); this.playNote(f*1.5,0.2,'sine',null,t+i*0.1,0.5); }); },
      victory: ()=>{
        const melody=[523,523,523,698,880,784,698,880,1047];
        const durs=[0.15,0.15,0.15,0.3,0.15,0.15,0.3,0.15,0.4];
        let time=t;
        melody.forEach((f,i)=>{ this.playNote(f,durs[i]+0.1,'square',null,time,1); this.playNote(f/2,durs[i]+0.1,'triangle',null,time,0.5); time+=durs[i]; });
      },
      defeat: ()=>{ [392,349,330,294,262,247].forEach((f,i)=>this.playNote(f,0.3,'triangle',null,t+i*0.2,0.8)); },
      step: ()=>{ this.playNote(100+Math.random()*50,0.04,'square',null,null,0.3); },
      door: ()=>{
        const osc=this.ctx.createOscillator(); const g=this.ctx.createGain();
        osc.type='sawtooth';
        osc.frequency.setValueAtTime(120,t);
        osc.frequency.linearRampToValueAtTime(80,t+0.2);
        g.gain.setValueAtTime(0.12,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.25);
        osc.connect(g); g.connect(this.sfxGain); osc.start(t); osc.stop(t+0.25);
      },
      puzzle: ()=>{
        const notes=[523,659,784,1047,784,1047,1319];
        const durs=[0.1,0.1,0.1,0.2,0.1,0.1,0.3];
        let time=t;
        notes.forEach((f,i)=>{ this.playNote(f,durs[i]+0.05,'square',null,time,0.9); time+=durs[i]; });
      },
      rest: ()=>{ [262,330,392,330,262].forEach((f,i)=>this.playNote(f,0.35,'sine',null,t+i*0.25,0.5)); },
      encounter: ()=>{ this.playNote(200,0.1,'square'); this.playNote(250,0.1,'square',null,t+0.1); this.playNote(150,0.2,'sawtooth',null,t+0.2); },
      start_game: ()=>{ [262,330,392,523,659,784,1047].forEach((f,i)=>{ this.playNote(f,0.15,'square',null,t+i*0.08,0.9); this.playNote(f*0.5,0.15,'triangle',null,t+i*0.08,0.4); }); },
      coin: ()=>{ this.playNote(988,0.06,'square'); this.playNote(1319,0.15,'square',null,t+0.06); },
    };
    if(SFX[name]) SFX[name]();
  },

  stopMusic(){
    if(this.musicTimer){ clearInterval(this.musicTimer); this.musicTimer = null; }
    this.currentMusic = null;
  },

  playMusic(trackName){
    if(!this.enabled) return;
    this.init();
    if(!this.ctx) return;
    if(this.ctx.state==='suspended') this.ctx.resume();
    if(this.currentMusic === trackName) return;
    this.stopMusic();
    this.currentMusic = trackName;

    const tracks = {
      title: {
        bpm:100, wave:'square', bassWave:'triangle',
        notes:[[262,0.4],[330,0.4],[392,0.4],[523,0.8],[494,0.4],[440,0.4],[392,0.4],[349,0.8],
               [330,0.4],[392,0.4],[440,0.4],[523,0.8],[494,0.4],[523,0.4],[587,0.4],[523,0.8]],
        bass:[[131,0.8],[131,0.8],[175,0.8],[175,0.8],[165,0.8],[165,0.8],[131,0.8],[131,0.8]],
      },
      village: {
        bpm:95, wave:'square', bassWave:'triangle',
        notes:[[392,0.3],[440,0.3],[494,0.6],[440,0.3],[392,0.3],[330,0.6],
               [349,0.3],[392,0.3],[440,0.6],[392,0.3],[349,0.3],[330,0.6],
               [294,0.3],[330,0.3],[392,0.6],[440,0.3],[494,0.3],[523,0.6],[494,0.6],[392,0.6]],
        bass:[[196,0.6],[165,0.6],[175,0.6],[165,0.6],[147,0.6],[196,0.6],[131,0.6],[196,0.6]],
      },
      dungeon: {
        bpm:75, wave:'triangle', bassWave:'sine',
        notes:[[220,0.5],[247,0.3],[262,0.5],[247,0.3],[220,0.5],[196,0.3],[175,0.5],[0,0.3],
               [262,0.5],[247,0.3],[220,0.5],[196,0.3],[175,0.5],[165,0.3],[175,0.5],[0,0.3]],
        bass:[[110,0.8],[0,0.4],[110,0.4],[87,0.8],[0,0.4],[87,0.4],[98,0.8],[0,0.4],[110,0.4],[87,0.8],[0,0.8]],
      },
      combat: {
        bpm:150, wave:'square', bassWave:'sawtooth',
        notes:[[294,0.2],[349,0.2],[440,0.2],[349,0.2],[294,0.2],[262,0.2],[294,0.4],
               [392,0.2],[349,0.2],[330,0.2],[294,0.2],[262,0.2],[294,0.2],[262,0.4],
               [294,0.2],[349,0.2],[440,0.2],[523,0.2],[440,0.2],[349,0.2],[294,0.4],
               [262,0.2],[294,0.2],[349,0.2],[294,0.2],[262,0.2],[247,0.2],[220,0.4]],
        bass:[[147,0.4],[147,0.2],[147,0.2],[175,0.4],[175,0.2],[175,0.2],
              [131,0.4],[131,0.2],[131,0.2],[110,0.4],[110,0.2],[110,0.2]],
      },
      boss: {
        bpm:140, wave:'square', bassWave:'sawtooth',
        notes:[[330,0.2],[349,0.2],[330,0.2],[294,0.2],[330,0.3],[440,0.3],[392,0.4],
               [349,0.2],[330,0.2],[294,0.2],[262,0.2],[294,0.3],[349,0.3],[330,0.4],
               [440,0.2],[466,0.2],[523,0.2],[466,0.2],[440,0.3],[349,0.3],[330,0.4],
               [294,0.2],[330,0.2],[349,0.2],[392,0.2],[440,0.4],[330,0.4]],
        bass:[[165,0.4],[165,0.2],[175,0.2],[131,0.4],[131,0.2],[147,0.2],
              [110,0.4],[110,0.2],[131,0.2],[147,0.4],[165,0.4]],
      },
      shop: {
        bpm:90, wave:'square', bassWave:'triangle',
        notes:[[349,0.3],[440,0.3],[523,0.6],[494,0.3],[440,0.3],[392,0.6],
               [349,0.3],[392,0.3],[440,0.3],[392,0.3],[349,0.6],[0,0.6]],
        bass:[[175,0.6],[175,0.6],[196,0.6],[196,0.6],[175,0.6],[131,0.6]],
      },
      finale: {
        bpm:60, wave:'sine', bassWave:'triangle',
        notes:[[392,0.5],[494,0.5],[587,1.0],[523,0.5],[494,0.5],[440,1.0],
               [392,0.5],[440,0.5],[494,1.0],[523,0.5],[587,0.5],[659,1.5],[0,0.5]],
        bass:[[196,1.0],[165,1.0],[147,1.0],[196,1.0],[131,1.5],[0,0.5]],
      },
    };

    const track = tracks[trackName];
    if(!track) return;

    let noteIdx = 0, bassIdx = 0;
    const beatLen = 60/track.bpm;
    const playBeat = ()=>{
      if(!this.enabled || this.currentMusic!==trackName) return;
      const [freq,dur] = track.notes[noteIdx % track.notes.length];
      if(freq>0) this.playNote(freq, dur*beatLen*0.9, track.wave, this.musicGain, null, 0.6);
      noteIdx++;
      if(track.bass.length>0){
        const [bf,bd] = track.bass[bassIdx % track.bass.length];
        if(bf>0) this.playNote(bf, bd*beatLen*0.9, track.bassWave, this.musicGain, null, 0.5);
        bassIdx++;
      }
    };
    const avgDur = track.notes.reduce((s,n)=>s+n[1],0)/track.notes.length;
    playBeat();
    this.musicTimer = setInterval(playBeat, avgDur*beatLen*1000);
  },
};
