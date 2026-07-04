// ============================================================
// PICCOLI EROI 2 - Stato di gioco, creazione eroi, salvataggi
// ============================================================
import { mod, maxSlots, MAX_LEVEL, XP_TABLE } from './rules.js';
import { CLASSES, SPECIES, SPELLS, ITEMS } from './data.js';
import { migrateStory } from './story.js';

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

// --- Sanificazione input (nomi e testi che finiscono in innerHTML) ---
// Rimuove i caratteri utilizzabili per iniettare HTML/attributi.
// Vale sia per l'input diretto sia per i dati importati da un codice partita.
export function sanitizeName(s){
  const clean = String(s == null ? '' : s)
    .replace(/[<>&"`=\\\/]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20);
  return clean || 'Eroe';
}

// --- Creazione eroe ---
export function createPlayer(speciesId, classId, name, customStats=null){
  name = sanitizeName(name);
  const cls = CLASSES.find(c=>c.id===classId);
  const spec = SPECIES.find(s=>s.id===speciesId);
  const stats = customStats ? {...customStats} : {...cls.stats};
  const conMod = mod(stats.COS);
  const dexMod = mod(stats.DES);
  const hpBonusSpecies = spec.traits.hpPerLevel || 0;
  // Floor a 8 PF: una maga con 7 PF va KO al primo scontro,
  // frustrante per il target (bambini). Il minimo garantisce 2-3 colpi incassati
  const maxHp = Math.max(8, cls.hitDie + conMod + hpBonusSpecies);
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
// v4: story.node e' un id di scena (stringa), non piu' un indice.
// I save v2/v3 (node numerico) vengono migrati in restoreSnapshot.
function snapshot(){
  return {
    v: 4,
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

// Helpers di validazione per il restore
function numOr(v, def, min=-999999, max=999999){
  const n = Number(v);
  if(!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.round(n)));
}
function objOr(v){ return (v && typeof v==='object' && !Array.isArray(v)) ? v : {}; }

// Valida e ripulisce un player proveniente da un salvataggio.
// I campi di presentazione (nome classe/specie, colore, sprite, arma base)
// vengono ri-derivati dai dati canonici: cio' che finisce in innerHTML
// non deve mai arrivare grezzo da un JSON esterno.
function sanitizePlayer(p){
  if(!p || typeof p!=='object') return null;
  const cls = CLASSES.find(c=>c.id===p.classId);
  const spec = SPECIES.find(s=>s.id===p.speciesId);
  if(!cls || !spec) return null;

  p.name = sanitizeName(p.name);
  p.className = cls.name; p.speciesName = spec.name;
  p.color = cls.color; p.sprite = cls.sprite;
  p.casterType = cls.casterType;
  p.atkStat = cls.atkStat;
  p.spellStat = cls.spellStat || cls.atkStat;
  p.saveProfs = [...cls.saveProfs];
  p.hitDie = cls.hitDie;

  p.level = numOr(p.level, 1, 1, MAX_LEVEL);
  p.xp = numOr(p.xp, 0, 0, 999999);
  p.maxHp = numOr(p.maxHp, cls.hitDie, 1, 999);
  p.hp = numOr(p.hp, p.maxHp, 0, p.maxHp);
  p.baseAC = numOr(p.baseAC, cls.acBase, 5, 30);
  p.ac = numOr(p.ac, p.baseAC, 5, 30);
  p.hitDiceLeft = numOr(p.hitDiceLeft, 1, 0, MAX_LEVEL);
  p.atkBonusExtra = numOr(p.atkBonusExtra, 0, 0, 5);
  p.alive = p.hp > 0;

  const baseStats = objOr(p.stats);
  p.stats = {};
  for(const k of Object.keys(cls.stats)) p.stats[k] = numOr(baseStats[k], cls.stats[k], 1, 24);

  if(p.weapon && typeof p.weapon==='object'){
    p.weapon = {...p.weapon, name: sanitizeName(p.weapon.name || cls.weapon.name)};
  } else {
    p.weapon = {...cls.weapon};
  }

  p.cantrips = (Array.isArray(p.cantrips)?p.cantrips:[]).filter(id=>SPELLS[id]);
  p.spells = (Array.isArray(p.spells)?p.spells:[]).filter(id=>SPELLS[id]);
  p.equipment = (Array.isArray(p.equipment)?p.equipment:[]).filter(id=>ITEMS[id]);
  p.slots = objOr(p.slots);
  p.conditions = {};
  p.usedAbilities = objOr(p.usedAbilities);
  return p;
}

// Restore con whitelist esplicita: solo le chiavi dello snapshot,
// ognuna validata, con default sano se assente o malformata.
// Ritorna false se il salvataggio non contiene eroi validi.
function restoreSnapshot(data){
  const players = (Array.isArray(data.players)?data.players:[]).map(sanitizePlayer).filter(Boolean);
  if(players.length===0) return false;

  GAME.mode = data.mode==='storia' ? 'storia' : 'classica';
  GAME.difficulty = DIFFICULTY[data.difficulty] ? data.difficulty : 'normale';
  GAME.players = players;
  GAME.numPlayers = players.length;
  GAME.currentPlayerIdx = 0;
  GAME.gold = numOr(data.gold, 0, 0, 999999);
  GAME.inventory = (Array.isArray(data.inventory)?data.inventory:[]).filter(id=>ITEMS[id]);
  GAME.chapter = numOr(data.chapter, 1, 1, 3);
  GAME.quest = typeof data.quest==='string' ? data.quest : 'ch1_start';
  GAME.inDungeon = !!data.inDungeon;
  GAME.currentFloor = numOr(data.currentFloor, 0, 0, 20);
  const pos = objOr(data.partyPos);
  GAME.partyPos = { x: numOr(pos.x, 0, 0, 99), y: numOr(pos.y, 0, 0, 99) };
  GAME.visited = objOr(data.visited);
  GAME.eventsDone = objOr(data.eventsDone);
  // Progresso Storia: migra i save vecchi (node numerico) al nuovo
  // formato per id di scena, e valida gli id dei save nuovi
  GAME.story = migrateStory(objOr(data.story), GAME.chapter);
  GAME.flags = objOr(data.flags);
  GAME.statsTracker = Object.assign({fights:0,crits:0,goldEarned:0}, objOr(data.statsTracker));
  GAME.ending = typeof data.ending==='string' ? data.ending : null;
  GAME.log = [];
  GAME.combat = null;
  if(GAME.mode==='storia'){
    GAME.state = 'storyMap';
  } else {
    GAME.state = GAME.inDungeon ? 'map' : 'village';
  }
  return true;
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
    if(!data || !data.v || data.v < 2) return false;
    return restoreSnapshot(data);
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
    if(!data || !data.v || data.v < 2) return { ok:false, error:'Codice di una versione troppo vecchia.' };
    if(!data.players || !Array.isArray(data.players)) return { ok:false, error:'Codice senza eroi.' };
    if(!restoreSnapshot(data)) return { ok:false, error:'Codice senza eroi validi.' };
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
