// ============================================================
// PICCOLI EROI 2 - Motore di regole (sistema d20 classico) semplificato
// Meccaniche fedeli: d20 + modificatore + competenza,
// vantaggio/svantaggio, tiri salvezza, slot incantesimo,
// condizioni, riposo breve/lungo, level up 1-5.
// Linguaggio kid-friendly nelle spiegazioni.
// ============================================================

// --- Dadi ---
export function d(n){ return Math.floor(Math.random()*n)+1; }

export function rollDice(num, faces, bonus=0){
  let total = bonus;
  const rolls = [];
  for(let i=0;i<num;i++){ const r = d(faces); rolls.push(r); total += r; }
  return { total, rolls, bonus, expr:`${num}d${faces}${bonus? (bonus>0?'+':'')+bonus : ''}` };
}

// Tiro d20 con vantaggio/svantaggio (regola 5e: tiri 2 dadi, prendi il migliore/peggiore)
// advState: 'normal' | 'adv' | 'dis'
export function rollD20(advState='normal'){
  const r1 = d(20);
  if(advState==='normal') return { result:r1, rolls:[r1], advState };
  const r2 = d(20);
  const result = advState==='adv' ? Math.max(r1,r2) : Math.min(r1,r2);
  return { result, rolls:[r1,r2], advState };
}

// Combina piu' fonti di vantaggio/svantaggio (5e: si annullano, non si sommano)
export function combineAdv(sources){
  const hasAdv = sources.some(s=>s==='adv');
  const hasDis = sources.some(s=>s==='dis');
  if(hasAdv && hasDis) return 'normal';
  if(hasAdv) return 'adv';
  if(hasDis) return 'dis';
  return 'normal';
}

// --- Modificatori e competenza ---
export function mod(score){ return Math.floor((score-10)/2); }
export function fmtMod(m){ return m>=0 ? `+${m}` : `${m}`; }

// Bonus di competenza: +2 ai livelli 1-4, +3 al livello 5+
export function profBonus(level){ return level>=5 ? 3 : 2; }

// --- Tabella esperienza (semplificata, livelli 1-5) ---
export const XP_TABLE = [0, 100, 250, 500, 900]; // XP totale per raggiungere il livello (indice = livello-1)
export const MAX_LEVEL = 5;

export function xpForNext(level){
  return level >= MAX_LEVEL ? Infinity : XP_TABLE[level];
}

// --- Prova di caratteristica ---
// actor: {stats, level, profSkills?}  options: {advState, profApplies, dc}
export function abilityCheck(actor, stat, dc, opts={}){
  const advState = opts.advState || 'normal';
  const roll = rollD20(advState);
  const m = mod(actor.stats[stat]);
  const pb = opts.profApplies ? profBonus(actor.level||1) : 0;
  const total = roll.result + m + pb;
  return {
    kind:'check', stat, dc, roll, modifier:m, prof:pb, total,
    success: total >= dc,
    crit: roll.result === 20,
    fumble: roll.result === 1,
  };
}

// --- Tiro salvezza ---
// actor.saveProfs: array di stat in cui e' competente (es. ['FOR','COS'])
export function savingThrow(actor, stat, dc, opts={}){
  const advState = opts.advState || 'normal';
  const roll = rollD20(advState);
  const m = mod(actor.stats[stat]);
  const pb = (actor.saveProfs||[]).includes(stat) ? profBonus(actor.level||1) : 0;
  const total = roll.result + m + pb;
  return {
    kind:'save', stat, dc, roll, modifier:m, prof:pb, total,
    success: total >= dc,
    crit: roll.result === 20,
    fumble: roll.result === 1,
  };
}

// --- Tiro per colpire ---
// attacker: {stats, level, atkStat, conditions}
// defender: {ac, conditions}
export function attackRoll(attacker, defender, opts={}){
  const sources = [];
  if(opts.advState) sources.push(opts.advState);
  // Condizioni che modificano il tiro (set semplificato)
  const aCond = attacker.conditions||{};
  const dCond = defender.conditions||{};
  if(aCond.poisoned) sources.push('dis');      // avvelenato: svantaggio agli attacchi
  if(aCond.frightened) sources.push('dis');    // spaventato: svantaggio
  if(aCond.prone) sources.push('dis');         // prono: svantaggio ad attaccare
  if(dCond.dodge) sources.push('dis');         // il difensore schiva: svantaggio per chi attacca
  if(dCond.prone) sources.push('adv');         // attaccare un bersaglio prono (in mischia): vantaggio
  if(aCond.hidden) sources.push('adv');        // attacco furtivo dal nascondiglio
  if(opts.helpedBy) sources.push('adv');       // azione Aiuto di un alleato

  const advState = combineAdv(sources);
  const roll = rollD20(advState);
  const m = mod(attacker.stats[attacker.atkStat||'FOR']);
  const pb = profBonus(attacker.level||1);
  const atkBonusExtra = attacker.atkBonusExtra||0;
  const total = roll.result + m + pb + atkBonusExtra;
  const effAC = (defender.ac||10) + (defender.acBonusTemp||0);
  const crit = roll.result === 20;
  const fumble = roll.result === 1;
  const hit = !fumble && (crit || total >= effAC);
  return {
    kind:'attack', roll, modifier:m, prof:pb, extra:atkBonusExtra, total,
    targetAC: effAC, hit, crit, fumble, advState, advSources:sources,
  };
}

// --- Danno ---
// In caso di critico 5e: raddoppia i DADI di danno (non i bonus)
export function damageRoll(numDice, faces, bonus, crit=false){
  const dice = crit ? numDice*2 : numDice;
  const r = rollDice(dice, faces, bonus);
  r.total = Math.max(1, r.total);
  r.crit = crit;
  return r;
}

// --- Condizioni (set kid-friendly) ---
export const CONDITIONS = {
  poisoned:  { name:'Avvelenato', icon:'P', cls:'poison',
    desc:'Ti senti malissimo: svantaggio agli attacchi (tiri 2 dadi e prendi il peggiore).' },
  frightened:{ name:'Spaventato', icon:'!', cls:'frightened',
    desc:'Hai tanta paura: svantaggio agli attacchi finche\' non passa.' },
  prone:     { name:'A terra', icon:'_', cls:'prone',
    desc:'Sei caduto! Svantaggio ad attaccare, e i nemici vicini ti colpiscono piu\' facilmente. Rialzarsi costa il movimento.' },
  dodge:     { name:'In guardia', icon:'D', cls:'dodge',
    desc:'Ti difendi con attenzione: chi ti attacca ha svantaggio.' },
  rage:      { name:'Furia', icon:'R', cls:'rage',
    desc:'Sei furioso! Danni extra in mischia e incassi meglio i colpi.' },
  blessed:   { name:'Benedetto', icon:'+', cls:'bless',
    desc:'Una magia ti aiuta: +1d4 ai tuoi tiri per colpire.' },
  shielded:  { name:'Scudo magico', icon:'S', cls:'shield',
    desc:'Uno scudo di energia: +2 alla Classe Armatura.' },
  down:      { name:'Svenuto', icon:'X', cls:'down',
    desc:'Sei a 0 punti ferita e svieni. Un alleato puo\' rialzarti, o ti riprendi a fine combattimento con 1 PF.' },
};

// Applica/rimuove condizioni con durata in round
export function applyCondition(target, condId, rounds=3){
  if(!target.conditions) target.conditions = {};
  target.conditions[condId] = { rounds };
}
export function removeCondition(target, condId){
  if(target.conditions) delete target.conditions[condId];
}
export function tickConditions(target){
  const expired = [];
  if(!target.conditions) return expired;
  for(const [id, c] of Object.entries(target.conditions)){
    if(id==='down') continue; // gestita a parte
    if(typeof c.rounds === 'number'){
      c.rounds--;
      if(c.rounds<=0){ delete target.conditions[id]; expired.push(id); }
    }
  }
  return expired;
}

// --- Iniziativa (5e: d20 + mod DES) ---
export function rollInitiative(combatant){
  const r = d(20);
  return r + mod(combatant.stats.DES);
}

// --- Slot incantesimo (semplificati: livelli 1 e 2) ---
// Tabella per livello del personaggio: [slot liv 1, slot liv 2]
export const SLOT_TABLE = {
  full:  { 1:[2,0], 2:[3,0], 3:[4,2], 4:[4,3], 5:[4,3] },   // incantatori completi (maga, chierico, bardo)
  half:  { 1:[0,0], 2:[2,0], 3:[3,0], 4:[3,0], 5:[4,2] },   // mezzi incantatori (ranger, paladino)
  none:  { 1:[0,0], 2:[0,0], 3:[0,0], 4:[0,0], 5:[0,0] },
};

export function maxSlots(casterType, level){
  const t = SLOT_TABLE[casterType||'none'];
  return t ? [...t[Math.min(level, MAX_LEVEL)]] : [0,0];
}

// --- Riposi ---
// Riposo breve: spendi Dadi Vita per recuperare PF (1 dado vita = 1dX + mod COS)
export function shortRestHeal(player){
  if(player.hitDiceLeft<=0 || player.hp>=player.maxHp) return null;
  player.hitDiceLeft--;
  const r = rollDice(1, player.hitDie, Math.max(0, mod(player.stats.COS)));
  const healed = Math.min(r.total, player.maxHp - player.hp);
  player.hp += healed;
  return { healed, roll:r, diceLeft:player.hitDiceLeft };
}

// Riposo lungo: PF al massimo, slot ricaricati, meta' dei dadi vita recuperati, condizioni rimosse
export function longRest(player){
  player.hp = player.maxHp;
  player.slots = maxSlots(player.casterType, player.level);
  player.hitDiceLeft = Math.min(player.level, player.hitDiceLeft + Math.max(1, Math.floor(player.level/2)));
  player.conditions = {};
  player.usedAbilities = {};
  player.alive = true;
}

// --- Level up ---
// Ritorna descrizione dei benefici. Il chiamante gestisce le scelte (ASI al lvl 4).
export function levelUp(player, classData){
  player.level++;
  const conMod = mod(player.stats.COS);
  // PF: media fissa del dado vita (regola 5e standard) + mod COS
  const hpGain = Math.max(1, Math.floor(player.hitDie/2)+1 + conMod);
  player.maxHp += hpGain;
  player.hp = player.maxHp;
  player.hitDiceLeft = player.level;
  player.slots = maxSlots(player.casterType, player.level);
  const unlocked = (classData.features||[]).filter(f=>f.level===player.level);
  const newSpells = (classData.spellsByLevel||{})[player.level] || [];
  player.spells = [...new Set([...(player.spells||[]), ...newSpells])];
  return {
    hpGain, unlocked, newSpells,
    asi: player.level===4,                       // Aumento caratteristica al livello 4
    newProf: profBonus(player.level) > profBonus(player.level-1),
  };
}

// --- Spiegazioni kid-friendly dei tiri ---
export function explainRoll(res, labels={}){
  const statName = labels.stat || res.stat || '';
  let s = '';
  if(res.roll.rolls.length===2){
    const which = res.advState==='adv'||res.roll.advState==='adv' ? 'il migliore' : 'il peggiore';
    s += `Due dadi (${res.roll.rolls.join(' e ')}), prendi ${which}: ${res.roll.result}. `;
  } else {
    s += `Dado: ${res.roll.result}. `;
  }
  const parts = [];
  if(res.modifier) parts.push(`${fmtMod(res.modifier)} ${statName}`);
  if(res.prof) parts.push(`+${res.prof} competenza`);
  if(res.extra) parts.push(`${fmtMod(res.extra)} extra`);
  if(parts.length) s += `Bonus: ${parts.join(', ')}. Totale: ${res.total}. `;
  if(res.kind==='attack'){
    s += `Serviva ${res.targetAC} (Classe Armatura). `;
    s += res.crit ? 'CRITICO! Danni con dadi doppi!' : (res.fumble ? 'Un 1... mancato di sicuro!' : (res.hit ? 'Colpito!' : 'Mancato!'));
  } else {
    s += `Serviva ${res.dc}. ${res.success ? 'Riuscito!' : 'Fallito!'}`;
  }
  return s;
}
