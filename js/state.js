// ============================================================
// PICCOLI EROI 2 - Stato di gioco, creazione eroi, salvataggi
// ============================================================
import { mod, maxSlots, MAX_LEVEL, XP_TABLE } from './rules.js';
import { CLASSES, SPECIES } from './data.js';

export const SAVE_KEY = 'piccoli_eroi_2_save';

export const GAME = {
  state: 'title',       // title, prologue, tutorial, setup, charCreate, village, dialogue,
                        // chapterIntro, chapterOutro, map, event, combat, puzzle, restSpot,
                        // shop, sheet, inventory, levelup, victory, defeat, epilogue
  numPlayers: 1,
  currentPlayerIdx: 0,
  players: [],
  gold: 30,
  inventory: [],        // array di item id (consumabili e quest)
  chapter: 1,           // capitolo corrente (1-3)
  quest: 'ch1_start',   // ch1_start, ch1_done, ch2_start, ch2_done, ch3_start, ch3_done_fight, ch3_done_peace
  inDungeon: false,
  currentFloor: 0,
  partyPos: {x:0,y:0},
  visited: {},          // "ch_floor_x_y" -> true
  eventsDone: {},       // "ch_floor_key" -> true
  log: [],
  combat: null,         // stato combattimento (non salvato)
  flags: {},            // flag narrativi (lore scoperte, ending, ...)
  statsTracker: { fights:0, crits:0, goldEarned:0 },
  ending: null,         // 'fight' | 'peace'
};

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

// --- Salvataggio ---
export function saveGame(silent=false){
  try {
    const data = JSON.stringify({
      v: 2,
      numPlayers: GAME.numPlayers, players: GAME.players,
      gold: GAME.gold, inventory: GAME.inventory,
      chapter: GAME.chapter, quest: GAME.quest,
      inDungeon: GAME.inDungeon, currentFloor: GAME.currentFloor,
      partyPos: GAME.partyPos, visited: GAME.visited, eventsDone: GAME.eventsDone,
      flags: GAME.flags, statsTracker: GAME.statsTracker, ending: GAME.ending,
      log: GAME.log.slice(-25),
    });
    localStorage.setItem(SAVE_KEY, data);
    if(!silent) showToast('Partita salvata!');
  } catch(e){ if(!silent) showToast('Errore nel salvataggio!'); }
}

export function loadGame(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return false;
    const data = JSON.parse(raw);
    if(data.v !== 2) return false;
    Object.assign(GAME, data);
    GAME.combat = null;
    GAME.state = GAME.inDungeon ? 'map' : 'village';
    return true;
  } catch(e){ return false; }
}

export function hasSave(){ return !!localStorage.getItem(SAVE_KEY); }
export function deleteSave(){ localStorage.removeItem(SAVE_KEY); }

export function resetGame(){
  Object.assign(GAME, {
    state:'title', numPlayers:1, currentPlayerIdx:0, players:[],
    gold:30, inventory:[], chapter:1, quest:'ch1_start',
    inDungeon:false, currentFloor:0, partyPos:{x:0,y:0},
    visited:{}, eventsDone:{}, log:[], combat:null, flags:{},
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
