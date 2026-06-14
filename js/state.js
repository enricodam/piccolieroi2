// ============================================================
// PICCOLI EROI 2 - Stato di gioco, creazione eroi, salvataggi
// ============================================================
import { mod, maxSlots, MAX_LEVEL, XP_TABLE } from './rules.js';
import { CLASSES, SPECIES } from './data.js';

export const SAVE_KEY = 'piccoli_eroi_2_save';

export const GAME = {
  state: 'title',
  mode: 'classica',     // 'storia' (neofiti, guidata) | 'classica' (tecnica)
  difficulty: 'normale',// 'facile' | 'normale' | 'difficile' (storia = sempre facile)
  numPlayers: 1,
  currentPlayerIdx: 0,
  players: [],
  gold: 30,
  inventory: [],        // array di item id (consumabili e quest)
  chapter: 1,           // capitolo corrente (1-3)
  quest: 'ch1_start',
  inDungeon: false,
  currentFloor: 0,
  partyPos: {x:0,y:0},
  visited: {},
  eventsDone: {},
  story: { node: 0, branch: null, done: {} }, // progresso modalita' Storia
  log: [],
  combat: null,         // stato combattimento (non salvato)
  flags: {},
  statsTracker: { fights:0, crits:0, goldEarned:0 },
  ending: null,
};

// Moltiplicatori di difficolta' applicati ai nemici (PF e attacco)
export const DIFFICULTY = {
  facile:    { hp:0.7, atk:-2, label:'Facile' },
  normale:   { hp:1.0, atk:0,  label:'Normale' },
  difficile: { hp:1.3, atk:1,  label:'Difficile' },
};
export function diffMods(){
  if(GAME.mode==='storia') return DIFFICULTY.facile;
  return DIFFICULTY[GAME.difficulty] || DIFFICULTY.normale;
}
export function isStoria(){ return GAME.mode==='storia'; }

// --- Impostazioni globali (font), persistite a parte ---
const SETTINGS_KEY = 'piccoli_eroi_2_settings';
export const SETTINGS = { fontScale: 1 };
export function loadSettings(){
  try { const r = localStorage.getItem(SETTINGS_KEY); if(r){ Object.assign(SETTINGS, JSON.parse(r)); } } catch(e){}
  applyFontScale();
}
export function saveSettings(){
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SETTINGS)); } catch(e){}
}
export function applyFontScale(){
  if(typeof document==='undefined' || !document.documentElement) return;
  document.documentElement.style.setProperty('--font-scale', SETTINGS.fontScale);
}
export function setFontScale(v){
  SETTINGS.fontScale = Math.max(0.85, Math.min(1.6, v));
  applyFontScale(); saveSettings();
}

// --- Creazione eroe ---
export function createPlayer(speciesId, classId, name, customStats=null){
  const cls = CLASSES.find(c=>c.id===classId);
  const spec = SPECIES.find(s=>s.id===speciesId);
  const stats = customStats ? {...customStats} : {...cls.stats};
  const conMod = mod(stats.COS);
  const dexMod = mod(stats.DES);
  const hpBonusSpecies = spec.traits.hpPerLevel || 0;
  const maxHp = cls.hitDie + conMod + hpBonusSpecies;
  const ac = cls.acBase + (cls.acUseDex ? Math.min(dexMod, 2) : 0);

  return {
    name,
    speciesId, speciesName: spec.name,
    classId, className: cls.name,
    color: cls.color, sprite: cls.sprite,
    level: 1, xp: 0,
    stats,
    maxHp, hp: maxHp,
    baseAC: ac, ac,
    hitDie: cls.hitDie, hitDiceLeft: 1,
    casterType: cls.casterType,
    atkStat: cls.atkStat,
    spellStat: cls.spellStat || cls.atkStat,
    saveProfs: [...cls.saveProfs],
    weapon: {...cls.weapon},
    cantrips: [...(cls.cantrips||[])],
    spells: [...((cls.spellsByLevel||{})[1] || [])],
    slots: maxSlots(cls.casterType, 1),
    conditions: {},
    usedAbilities: {},      // contatori per riposo: second_wind, action_surge, rage, bardic, channel, breath, heroic, layPool
    equipment: [],          // item id equipaggiati
    atkBonusExtra: 0,       // da oggetti magici
    alive: true,
  };
}

// Pool Imposizione delle Mani del paladino
export function layPoolMax(player){ return player.classId==='paladino' ? player.level*5 : 0; }

// Usi della Furia del barbaro per riposo lungo
export function rageUsesMax(player){ return player.classId==='barbaro' ? (player.level>=3?3:2) : 0; }

// Usi Ispirazione Bardica
export function bardicUsesMax(player){
  return player.classId==='bardo' ? Math.max(1, mod(player.stats.CAR)) : 0;
}

export function hasFeature(player, featId){
  const cls = CLASSES.find(c=>c.id===player.classId);
  return (cls.features||[]).some(f=>f.id===featId && f.level<=player.level);
}

export function speciesTraits(player){
  const spec = SPECIES.find(s=>s.id===player.speciesId);
  return spec ? spec.traits : {};
}

// --- Log ---
export function addLog(text, cls=''){
  GAME.log.push({text, cls});
  if(GAME.log.length>120) GAME.log.shift();
}

export function showToast(msg){
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 2200);
}

// Raccoglie lo stato salvabile (senza log e combattimento)
function snapshot(){
  return {
    v: 3,
    mode: GAME.mode, difficulty: GAME.difficulty,
    numPlayers: GAME.numPlayers, players: GAME.players,
    gold: GAME.gold, inventory: GAME.inventory,
    chapter: GAME.chapter, quest: GAME.quest,
    inDungeon: GAME.inDungeon, currentFloor: GAME.currentFloor,
    partyPos: GAME.partyPos, visited: GAME.visited, eventsDone: GAME.eventsDone,
    story: GAME.story,
    flags: GAME.flags, statsTracker: GAME.statsTracker, ending: GAME.ending,
  };
}

function restoreSnapshot(data){
  Object.assign(GAME, data);
  GAME.combat = null;
  if(!GAME.story) GAME.story = { node:0, branch:null, done:{} };
  if(GAME.mode==='storia'){
    GAME.state = 'storyMap';
  } else {
    GAME.state = GAME.inDungeon ? 'map' : 'village';
  }
}

// --- Salvataggio automatico (localStorage) ---
export function saveGame(silent=false){
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot()));
    if(!silent) showToast('Partita salvata!');
  } catch(e){ if(!silent) showToast('Errore nel salvataggio!'); }
}

export function loadGame(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return false;
    const data = JSON.parse(raw);
    if(data.v < 2) return false;
    restoreSnapshot(data);
    return true;
  } catch(e){ return false; }
}

export function hasSave(){ return !!localStorage.getItem(SAVE_KEY); }
export function deleteSave(){ localStorage.removeItem(SAVE_KEY); }

// --- Codice partita (export/import completo, copia-incolla) ---
// Base64 unicode-safe con prefisso e checksum semplice
function b64encode(str){
  const bytes = unescape(encodeURIComponent(str));
  return (typeof btoa!=='undefined') ? btoa(bytes) : Buffer.from(bytes, 'binary').toString('base64');
}
function b64decode(b){
  const bytes = (typeof atob!=='undefined') ? atob(b) : Buffer.from(b, 'base64').toString('binary');
  return decodeURIComponent(escape(bytes));
}
function checksum(str){
  let h = 0; for(let i=0;i<str.length;i++){ h = (h*31 + str.charCodeAt(i)) >>> 0; }
  return h.toString(36).slice(0,4).toUpperCase();
}
export function exportSaveCode(){
  const json = JSON.stringify(snapshot());
  const body = b64encode(json);
  return `PE2-${checksum(json)}-${body}`;
}
export function importSaveCode(code){
  try {
    const trimmed = (code||'').trim().replace(/\s+/g,'');
    const m = trimmed.match(/^PE2-([A-Z0-9]{4})-(.+)$/);
    if(!m) return { ok:false, error:'Codice non valido (deve iniziare con PE2-).' };
    const json = b64decode(m[2]);
    if(checksum(json) !== m[1]) return { ok:false, error:'Codice danneggiato o incompleto.' };
    const data = JSON.parse(json);
    if(!data.players || !Array.isArray(data.players)) return { ok:false, error:'Codice senza eroi.' };
    restoreSnapshot(data);
    GAME.log = [];
    saveGame(true);
    return { ok:true };
  } catch(e){ return { ok:false, error:'Impossibile leggere il codice.' }; }
}

export function resetGame(){
  Object.assign(GAME, {
    state:'title', mode:'classica', difficulty:'normale',
    numPlayers:1, currentPlayerIdx:0, players:[],
    gold:30, inventory:[], chapter:1, quest:'ch1_start',
    inDungeon:false, currentFloor:0, partyPos:{x:0,y:0},
    visited:{}, eventsDone:{}, story:{node:0,branch:null,done:{}},
    log:[], combat:null, flags:{},
    statsTracker:{fights:0,crits:0,goldEarned:0}, ending:null,
  });
}

// --- Helpers di stato ---
export function alivePlayers(){ return GAME.players.filter(p=>p.alive && p.hp>0); }
export function partyDown(){ return GAME.players.every(p=>!p.alive || p.hp<=0); }

export function bestStatPlayer(stat){
  const alive = alivePlayers();
  if(alive.length===0) return GAME.players[0];
  return alive.reduce((a,b)=> a.stats[stat]>=b.stats[stat] ? a : b);
}

export function checkLevelUps(){
  // Ritorna lista di player che devono salire di livello
  return GAME.players.filter(p => p.level < MAX_LEVEL && p.xp >= XP_TABLE[p.level]);
}

// --- Singolare/plurale: "squadra" con piu' eroi, "eroe" da solo ---
export function isSolo(){ return GAME.players.length <= 1; }
// parola per il gruppo: "squadra" / "eroe" (o nome se solo)
export function partyWord(cap=false){
  const w = isSolo() ? 'eroe' : 'squadra';
  return cap ? w.charAt(0).toUpperCase()+w.slice(1) : w;
}
// "la squadra" / il nome dell'eroe singolo
export function partyLabel(){
  return isSolo() ? (GAME.players[0] ? GAME.players[0].name : 'eroe') : 'la squadra';
}
