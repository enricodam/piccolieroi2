// ============================================================
// PICCOLI EROI 2 - Combattimento a turni (sistema d20 classico)
// Iniziativa, azioni + azioni bonus, vantaggio/svantaggio,
// tiri salvezza, condizioni, capacita' di classe e specie
// ============================================================
import { GAME, addLog, showToast, saveGame, alivePlayers, partyDown,
         hasFeature, speciesTraits, layPoolMax, rageUsesMax, bardicUsesMax, diffMods, isStoria } from './state.js';
import { MONSTERS, ITEMS, SPELLS, STAT_NAMES } from './data.js';
import { d, mod, fmtMod, profBonus, rollD20, combineAdv, damageRoll, rollDice,
         rollInitiative, maxSlots, CONDITIONS, explainRoll } from './rules.js';
import { createSpriteEl } from './sprites.js';
import { AUDIO } from './audio.js';
import { FINALE } from './campaign.js';
import { maybeLevelUp } from './ui-core.js';
import { resolvePeace } from './ui-map.js';
import { storyOnCombatWin, storyOnCombatLose } from './ui-story.js';
import { cineAction, cineQuick, narrator } from './cinematic.js';

// Numeri fluttuanti sul combattente colpito (mostrati al prossimo render)
function pushFloat(side, idx, amount, type){
  if(!GAME.combat) return;
  (GAME.combat._floats = GAME.combat._floats || []).push({side, idx, amount, type});
}

const $ = sel => document.querySelector(sel);
const app = () => $('#app');
const R = () => window.render();

const RANGED_CLASSES = ['ranger'];   // attacchi a distanza (niente scottatura da fireBody)

// ------------------------------------------------------------
// AVVIO COMBATTIMENTO
// ------------------------------------------------------------
export function startCombat(monsterIds, opts={}){
  const dm = diffMods();
  const enemies = monsterIds.map((id,i)=>{
    const m = MONSTERS[id];
    const hp = Math.max(1, Math.round(m.hp * dm.hp));
    return {
      key:id, idx:i, name: monsterIds.filter(x=>x===id).length>1 ? `${m.name} ${i+1}` : m.name,
      sprite:m.sprite, hp, maxHp:hp, ac:m.ac, atkMod:m.atkMod + dm.atk, dmg:m.dmg,
      atkName:m.atkName, xp:m.xp, gold:m.gold||0, stats:m.stats,
      traits:m.traits||{}, undead:!!m.undead, boss:!!m.boss,
      conditions:{}, breathReady:true, fortitudeUsed:false, seenBy:{},
    };
  });

  const order = [];
  GAME.players.forEach((p,i)=>{ if(p.hp>0) order.push({side:'p', i, init:rollInitiative(p)}); });
  enemies.forEach((e,i)=>order.push({side:'e', i, init:rollInitiative(e)}));
  order.sort((a,b)=>b.init-a.init);

  GAME.combat = {
    enemies, order, ptr:-1, round:1, opts,
    bonusUsed:false, surgeReady:false, picking:null,
    finaleOffered:false, lastNote:'',
    surprise: GAME._mimicSurprise || null,
  };
  GAME._mimicSurprise = null;
  GAME.statsTracker.fights++;
  GAME.state = 'combat';
  AUDIO.playMusic(opts.isBoss ? 'boss' : 'combat');
  addLog('--- COMBATTIMENTO! Si tira l\'iniziativa (d20 + Destrezza) ---','info');

  // Aura di paura dei boss/fantasmi (inizio scontro)
  enemies.forEach(e=>{
    if(e.traits.fearAura){
      alivePlayers().forEach(p=>{
        const adv = fearSaveAdv(p);
        const roll = rollD20(adv);
        const total = roll.result + mod(p.stats.SAG) + (p.saveProfs.includes('SAG')?profBonus(p.level):0);
        if(total < e.traits.fearAura.dc && roll.result!==20){
          p.conditions.frightened = {rounds:2};
          addLog(`${p.name} e' SPAVENTATO da ${e.name}! (tiro salvezza Saggezza: ${total}, serviva ${e.traits.fearAura.dc})`,'dmg');
        } else {
          addLog(`${p.name} resiste alla paura! (${total} contro ${e.traits.fearAura.dc})`,'info');
        }
      });
    }
  });

  nextTurn();
}

function fearSaveAdv(p){
  const tr = speciesTraits(p);
  const sources = [];
  if(tr.advVsFear) sources.push('adv');
  if((tr.advSaves||[]).includes('SAG')) sources.push('adv');
  return combineAdv(sources);
}

// ------------------------------------------------------------
// GESTIONE TURNI
// ------------------------------------------------------------
function currentActor(){
  const c = GAME.combat;
  const o = c.order[c.ptr];
  if(!o) return null;
  return o.side==='p' ? {side:'p', ref:GAME.players[o.i], i:o.i} : {side:'e', ref:c.enemies[o.i], i:o.i};
}

function nextTurn(){
  const c = GAME.combat;
  if(!c || checkEnd()) return;
  let guard = 0;
  do {
    c.ptr++;
    if(c.ptr >= c.order.length){ c.ptr = 0; c.round++; }
    guard++;
    if(guard > 50) return;
  } while(skipActor());

  const a = currentActor();
  // Le condizioni dell'attore scadono all'inizio del SUO turno
  tickActorConditions(a.ref);

  if(a.side==='p'){
    c.bonusUsed = false; c.surgeReady = false; c.picking = null;
    a.ref._uncannyUsed = false;
    R();
  } else {
    // ricarica soffio
    if(a.ref.traits.breath && !a.ref.breathReady && d(6)>=5){
      a.ref.breathReady = true;
      addLog(`${a.ref.name} riprende fiato: il soffio e' di nuovo pronto!`,'dmg');
    }
    R();
    setTimeout(()=>enemyAct(a), 900);
  }
}

function skipActor(){
  const a = currentActor();
  if(!a) return false;
  if(a.side==='p') return a.ref.hp<=0;
  return a.ref.hp<=0;
}

function tickActorConditions(ref){
  if(!ref.conditions) return;
  for(const [id,cond] of Object.entries(ref.conditions)){
    if(id==='down') continue;
    if(typeof cond.rounds==='number'){
      cond.rounds--;
      if(cond.rounds<=0) delete ref.conditions[id];
    }
  }
}

function checkEnd(){
  const c = GAME.combat;
  if(!c) return true;
  if(c.enemies.every(e=>e.hp<=0)){ victory(); return true; }
  if(partyDown()){ defeat(); return true; }
  return false;
}

// ------------------------------------------------------------
// VITTORIA / SCONFITTA
// ------------------------------------------------------------
function victory(){
  const c = GAME.combat;
  const xpSum = c.enemies.reduce((s,e)=>s+e.xp,0);
  const goldSum = c.enemies.reduce((s,e)=>s+e.gold,0) + (c.opts.rewardGold||0);
  GAME.players.forEach(p=>{ p.xp += xpSum; });
  GAME.gold += goldSum;
  GAME.statsTracker.goldEarned += goldSum;
  GAME.players.forEach(p=>{
    if(p.hp<=0){ p.hp = 1; }
    delete p.conditions.down;
    delete p.conditions.dodge;
    delete p.conditions.rage;
    delete p.conditions.hidden;
    delete p.conditions.helped;
    delete p.conditions.reckless;
  });
  AUDIO.sfx('victory');
  AUDIO.stopMusic();
  addLog(`VITTORIA! +${xpSum} XP a testa${goldSum?`, +${goldSum} oro`:''}!`,'gold');
  if(c.opts.victoryText) addLog(c.opts.victoryText,'gold');

  GAME.players.forEach(p=>{ p._ringUsed = false; });

  // Modalita' Storia: l'esito lo gestisce ui-story
  if(c.opts.story){
    GAME.combat = null;
    saveGame(true);
    storyOnCombatWin();
    return;
  }

  // Marca evento completato
  if(c.opts.eventLetter){
    GAME.eventsDone[`${GAME.chapter}_${GAME.currentFloor}_${c.opts.eventLetter}`] = true;
  }

  let nextState = 'map';
  // Taglia della taverna: torna al villaggio
  if(GAME._bountyId){
    GAME.flags.bountiesDone = GAME.flags.bountiesDone || {};
    GAME.flags.bountiesDone[GAME._bountyId] = true;
    GAME._bountyId = null;
    nextState = 'village';
  }
  else if(c.opts.isBoss){
    if(c.opts.finale){
      GAME.ending = 'fight';
      GAME.quest = 'ch3_done_fight';
      GAME._outro = { title: FINALE.victoryFight.title, text: FINALE.victoryFight.text };
      nextState = 'chapterOutro';
    } else if(GAME.chapter===1){
      GAME.quest = 'ch1_done';
      nextState = 'chapterOutro';
    } else if(GAME.chapter===2){
      GAME.quest = 'ch2_done';
      GAME.inventory.push('gemma_drago');
      nextState = 'chapterOutro';
    }
  }
  GAME.combat = null;
  saveGame(true);
  maybeLevelUp(nextState);
}

function defeat(){
  AUDIO.sfx('defeat');
  AUDIO.stopMusic();
  const wasStory = GAME.combat && GAME.combat.opts.story;
  GAME.combat = null;
  GAME._bountyId = null;
  if(wasStory){
    storyOnCombatLose();
    return;
  }
  GAME.state = 'defeat';
  R();
}

// ------------------------------------------------------------
// TIRI con tratti speciali (halfling, umano, anello)
// ------------------------------------------------------------
function playerD20(p, advState){
  const c = GAME.combat;
  let roll = rollD20(advState);
  const tr = speciesTraits(p);
  // Halfling fortunato: ritira gli 1
  if(tr.lucky && roll.rolls.includes(1)){
    const re = rollD20(advState);
    addLog(`${p.name} (Halfling Fortunato) ritira un 1!`,'info');
    roll = re;
  }
  // 1 naturale: Ispirazione Eroica dell'umano (auto, 1 per riposo lungo)
  if(roll.result===1 && tr.heroicInspiration && !p.usedAbilities.heroic){
    p.usedAbilities.heroic = 1;
    addLog(`${p.name} usa l'Ispirazione Eroica e ritira il dado!`,'gold');
    roll = rollD20(advState);
  }
  // Anello della Fortuna: 1 volta per combattimento
  if(roll.result===1 && p.equipment.includes('anello_fortuna') && !p._ringUsed){
    p._ringUsed = true;
    addLog(`L'Anello della Fortuna di ${p.name} brilla: ritira il dado!`,'gold');
    roll = rollD20(advState);
  }
  return roll;
}

// ------------------------------------------------------------
// ATTACCO DEL GIOCATORE
// ------------------------------------------------------------
function playerAttackSources(p, enemy){
  const s = [];
  if(p.conditions.poisoned) s.push('dis');
  if(p.conditions.frightened) s.push('dis');
  if(p.conditions.prone) s.push('dis');
  if(p.conditions.hidden) s.push('adv');
  if(p.conditions.helped) s.push('adv');
  if(p.conditions.reckless) s.push('adv');
  if(enemy.conditions.prone) s.push('adv');
  if(enemy.conditions.dodge) s.push('dis');
  // Ranger: Nemico Prescelto (primo attacco contro ogni nemico nuovo)
  if(p.classId==='ranger' && !enemy.seenBy[p.name]) s.push('adv');
  // Sorpresa (mimic scoperto in tempo)
  if(GAME.combat.surprise==='players' && GAME.combat.round===1) s.push('adv');
  if(GAME.combat.surprise==='enemies' && GAME.combat.round===1) s.push('dis');
  return s;
}

// Calcola l'esito di un attacco SENZA applicarlo (per mostrarlo nell'overlay)
function computeAttack(p, enemy, smite){
  const sources = playerAttackSources(p, enemy);
  const advState = combineAdv(sources);
  const roll = playerD20(p, advState);
  enemy.seenBy[p.name] = true;

  const atkMod = mod(p.stats[p.atkStat]);
  const pb = profBonus(p.level);
  let total = roll.result + atkMod + pb + (p.atkBonusExtra||0);
  const parts = [`${fmtMod(atkMod)} ${STAT_NAMES[p.atkStat]}`, `+${pb} comp`];
  if(p.atkBonusExtra) parts.push(`+${p.atkBonusExtra} arma`);
  let blessBonus = 0;
  if(p.conditions.blessed){ blessBonus = d(4); total += blessBonus; parts.push(`+${blessBonus} bened.`); }
  let inspBonus = 0;
  if(p.conditions.inspired){ inspBonus = d(6); total += inspBonus; delete p.conditions.inspired; parts.push(`+${inspBonus} ispir.`); }

  const crit = roll.result===20;
  const fumble = roll.result===1;
  const hit = !fumble && (crit || total >= enemy.ac);
  const breakdown = `${roll.result} ${parts.join(' ')} = ${total}`;

  delete p.conditions.hidden;
  delete p.conditions.helped;

  let dmgTotal = 0;
  const details = [];
  if(hit){
    const dmgRes = damageRoll(p.weapon.num, p.weapon.faces, atkMod + (p.atkBonusExtra||0), crit);
    dmgTotal = dmgRes.total;
    details.push(`${dmgRes.expr}${crit?' x2 dadi':''}: ${dmgRes.total}`);
    if(p.conditions.rage){ dmgTotal += 2; details.push('+2 furia'); }
    if(p.conditions.huntersMark){ const hm = rollDice(crit?2:1,6,0); dmgTotal += hm.total; details.push(`+${hm.total} marchio`); }
    if(hasFeature(p,'sneak_attack') && advState==='adv'){
      const dice = p.level>=5 ? 3 : (p.level>=3 ? 2 : 1);
      const sa = rollDice(crit?dice*2:dice, 6, 0);
      dmgTotal += sa.total;
      details.push(`+${sa.total} furtivo (${dice}d6)`);
    }
    if(smite && p.slots[0]>0){
      p.slots[0]--;
      const sm = rollDice(crit?4:2, 8, 0);
      dmgTotal += sm.total;
      details.push(`+${sm.total} Punizione (2d8)`);
    }
  }
  return { p, enemy, roll, advState, total, crit, fumble, hit, dmgTotal, details, breakdown };
}

// Applica l'esito calcolato (danni, log, scottature)
function applyAttack(res){
  const { p, enemy, crit, hit, dmgTotal, details, roll, total } = res;
  let logTxt = `${p.name} attacca ${enemy.name} con ${p.weapon.name}: ${res.breakdown} contro CA ${enemy.ac}.`;
  if(!hit){ addLog(logTxt + ' MANCATO!','dmg'); return; }
  if(crit) GAME.statsTracker.crits++;
  const ei = GAME.combat.enemies.indexOf(enemy);
  applyDamageToEnemy(enemy, dmgTotal);
  pushFloat('e', ei, dmgTotal, crit?'crit':'dmg');
  addLog(logTxt + ` COLPITO! Danni: ${details.join(', ')} = ${dmgTotal}.`, crit?'gold':'heal');
  if(enemy.traits.fireBody && enemy.hp>0 && !RANGED_CLASSES.includes(p.classId)){
    let burn = d(4);
    if(speciesTraits(p).fireResist) burn = Math.floor(burn/2);
    damagePlayer(p, burn, `${p.name} si scotta toccando ${enemy.name}: ${burn} danni da fuoco!`);
  }
}

// Soglia sul dado per colpire (con i bonus di questo tiro)
function neededDie(total, rollResult, target){
  return Math.max(2, Math.min(20, target - (total - rollResult)));
}

// Esegue un attacco con overlay cinematografico, poi richiama "after"
function performAttack(p, enemy, smite, after){
  const res = computeAttack(p, enemy, smite);
  const outcome = res.fumble ? 'miss' : (res.crit ? 'crit' : (res.hit ? 'hit' : 'miss'));
  const outcomeText = res.crit ? 'CRITICO!' : (res.hit ? 'COLPITO!' : 'MANCATO!');
  const resultText = res.hit
    ? `${narrator(res.crit?'crit':'hit', p.name, enemy.name)} ${res.dmgTotal} danni!`
    : narrator('miss', p.name, enemy.name);
  const need = neededDie(res.total, res.roll.result, enemy.ac);
  cineAction({
    actor:{sprite:p.sprite, name:p.name, color:p.color},
    target:{sprite:enemy.sprite, name:enemy.name},
    intro: narrator('attackIntro', p.name, enemy.name),
    stakes: `Esce <b style="color:var(--gold)">${need} o piu'</b> e ${p.name} colpisce ${enemy.name}! ${need<=10?'Ci vuole poco!':'Serve un buon tiro!'}`,
    dice:{result:res.roll.result, rolls:res.roll.rolls, advState:res.advState},
    breakdown: isStoria() ? null : res.breakdown,
    compare: isStoria() ? null : `CA ${enemy.ac}`,
    outcome, outcomeText, result: resultText,
    sfxRoll:'dice',
    sfxOutcome: res.crit ? 'critical' : (res.hit ? 'attack_hit' : 'attack_miss'),
  }, ()=>{ applyAttack(res); if(after) after(); });
}

function applyDamageToEnemy(enemy, dmg){
  enemy.hp -= dmg;
  GAME.combat._shakeE = GAME.combat.enemies.indexOf(enemy);
  if(enemy.hp<=0){
    // Tenacia del non morto (zombi)
    if(enemy.traits.undeadFortitude && !enemy.fortitudeUsed && d(2)===1){
      enemy.fortitudeUsed = true;
      enemy.hp = 1;
      addLog(`${enemy.name} barcolla... ma SI RIALZA con 1 PF! (Tenacia del non morto)`,'dmg');
      return;
    }
    enemy.hp = 0;
    addLog(`${enemy.name} e' sconfitto!`,'gold');
  }
}

function damagePlayer(p, dmg, logText){
  if(p.conditions.rage){ dmg = Math.floor(dmg/2); logText += ' (dimezzato dalla Furia!)'; }
  if(hasFeature(p,'uncanny_dodge') && !p._uncannyUsed){
    p._uncannyUsed = true;
    dmg = Math.floor(dmg/2);
    logText += ' (Schivata Prodigiosa: dimezzato!)';
  }
  p.hp -= dmg;
  AUDIO.sfx('damage');
  const pi = GAME.players.indexOf(p);
  pushFloat('p', pi, dmg, 'dmg');
  GAME.combat._shakeP = pi;
  if(p.hp<=0){
    p.hp = 0;
    p.conditions = {down:{rounds:999}};
    addLog(logText,'dmg');
    addLog(`${p.name} cade a terra svenuto! Un alleato puo' curarlo o rialzarlo con AIUTA.`,'dmg');
  } else {
    addLog(logText,'dmg');
  }
}

// ------------------------------------------------------------
// TURNO DEI NEMICI
// ------------------------------------------------------------
function enemyAct(a){
  const c = GAME.combat;
  if(!c) return;
  const e = a.ref;
  if(e.hp<=0){ nextTurn(); return; }

  // Offerta di pace a meta' scontro finale
  if(c.opts.finale && c.opts.finaleFailed && !c.finaleOffered){
    const drago = c.enemies.find(x=>x.key==='drago_rosso');
    if(drago && drago.hp <= drago.maxHp/2){
      c.finaleOffered = true;
      GAME.state = 'finaleOffer';
      R();
      return;
    }
  }

  const targets = alivePlayers();
  if(targets.length===0){ checkEnd(); return; }

  // Soffio di fuoco (drago e cuccioli)
  if(e.traits.breath && e.breathReady && targets.length>0 && d(2)===1){
    e.breathReady = false;
    AUDIO.sfx('breath');
    cineQuick(`&#128293; ${e.name.toUpperCase()}<br>SOFFIO DI FUOCO! &#128293;`, '');
    const br = e.traits.breath;
    addLog(`${e.name} usa il SOFFIO DI FUOCO! Tiro salvezza su ${STAT_NAMES[br.save]} (difficolta' ${br.dc}) per tutti!`,'dmg');
    targets.forEach(p=>{
      const tr = speciesTraits(p);
      const sources = [];
      if((tr.advSaves||[]).includes(br.save)) sources.push('adv');
      const roll = playerD20(p, combineAdv(sources));
      const pb = p.saveProfs.includes(br.save) ? profBonus(p.level) : 0;
      const total = roll.result + mod(p.stats[br.save]) + pb;
      const dmgR = rollDice(br.dmg.num, br.dmg.faces, 0);
      let dmg = total>=br.dc ? Math.floor(dmgR.total/2) : dmgR.total;
      if(tr.fireResist) dmg = Math.floor(dmg/2);
      damagePlayer(p, dmg, `${p.name}: salvezza ${total} contro ${br.dc} (${total>=br.dc?'riuscita, danni dimezzati':'fallita'}). ${dmg} danni da fuoco!`);
    });
    setTimeout(()=>{ if(!checkEnd()) nextTurn(); }, 400);
    return;
  }

  const attacks = e.traits.multiattack || 1;
  for(let k=0;k<attacks;k++){
    const alive = alivePlayers();
    if(alive.length===0) break;
    const target = alive[Math.floor(Math.random()*alive.length)];
    enemyAttackOnce(e, target);
  }
  setTimeout(()=>{ if(!checkEnd()) nextTurn(); }, 400);
}

function enemyAttackOnce(e, p){
  const c = GAME.combat;
  const sources = [];
  if(e.conditions.frightened) sources.push('dis');
  if(e.conditions.poisoned) sources.push('dis');
  if(e.conditions.prone) sources.push('dis');
  if(p.conditions.dodge) sources.push('dis');
  if(p.conditions.prone) sources.push('adv');
  if(p.conditions.reckless) sources.push('adv');   // attacco spericolato del barbaro
  if(e.traits.packTactics && c.enemies.some(o=>o!==e && o.hp>0)) sources.push('adv');

  const advState = combineAdv(sources);
  const roll = rollD20(advState);
  const total = roll.result + e.atkMod;
  const effAC = p.ac + (p.conditions.shielded ? 2 : 0);
  const crit = roll.result===20;
  const fumble = roll.result===1;
  const hit = !fumble && (crit || total>=effAC);

  let logTxt = `${e.name} attacca ${p.name} (${e.atkName}): `;
  logTxt += roll.rolls.length===2 ? `[${roll.rolls.join(',')}] -> ${roll.result}` : `${roll.result}`;
  logTxt += ` +${e.atkMod} = ${total} contro CA ${effAC}.`;

  if(!hit){
    AUDIO.sfx('attack_miss');
    addLog(logTxt+' Mancato!','info');
    return;
  }
  const dmgR = damageRoll(e.dmg.num, e.dmg.faces, e.dmg.bonus||0, crit);
  damagePlayer(p, dmgR.total, logTxt+` COLPITO${crit?' CRITICO':''}! ${dmgR.expr}${crit?' x2 dadi':''}: ${dmgR.total} danni.`);

  // Veleno del ragno
  if(e.traits.poisonOnHit && p.hp>0){
    const po = e.traits.poisonOnHit;
    const tr = speciesTraits(p);
    const s2 = [];
    if(tr.advVsPoison) s2.push('adv');
    const sroll = playerD20(p, combineAdv(s2));
    const pb = p.saveProfs.includes('COS') ? profBonus(p.level) : 0;
    const stot = sroll.result + mod(p.stats.COS) + pb;
    if(stot < po.dc){
      p.conditions.poisoned = {rounds:po.rounds};
      addLog(`${p.name} e' AVVELENATO! (salvezza Costituzione ${stot}, serviva ${po.dc})`,'dmg');
    } else {
      addLog(`${p.name} resiste al veleno! (${stot} contro ${po.dc})`,'info');
    }
  }
}

// ------------------------------------------------------------
// AZIONI DEL GIOCATORE (window handlers)
// ------------------------------------------------------------
window.cbAttack = (smite=false) => {
  GAME.combat.picking = {type:'attack', smite};
  R();
};

window.cbPickEnemy = (ei) => {
  const c = GAME.combat;
  const enemy = c.enemies[ei];
  if(!enemy || enemy.hp<=0 || !c.picking) return;
  const a = currentActor();
  const p = a.ref;
  const pick = c.picking;
  c.picking = null;

  if(pick.type==='attack'){
    performAttack(p, enemy, pick.smite, ()=>{
      // Attacco Extra al livello 5
      if(hasFeature(p,'extra_attack')){
        const t2 = enemy.hp>0 ? enemy : c.enemies.find(e=>e.hp>0);
        if(t2){ addLog(`${p.name} attacca ancora (Attacco Extra)!`,'info'); performAttack(p, t2, false, ()=>endAction()); return; }
      }
      endAction();
    });
  }
  else if(pick.type==='spell'){
    castSpellOn(p, pick.spellId, enemy, null);
  }
  else if(pick.type==='item'){
    useCombatItemOn(p, pick.itemId, enemy, null);
  }
};

window.cbPickAlly = (pi) => {
  const c = GAME.combat;
  const ally = GAME.players[pi];
  if(!ally || !c.picking) return;
  const a = currentActor();
  const p = a.ref;
  const pick = c.picking;
  c.picking = null;

  if(pick.type==='help'){
    if(ally.hp<=0){
      ally.hp = 1; ally.conditions = {};
      AUDIO.sfx('heal');
      addLog(`${p.name} rialza ${ally.name}: torna in piedi con 1 PF!`,'heal');
    } else {
      ally.conditions.helped = {rounds:2};
      addLog(`${p.name} aiuta ${ally.name}: il suo prossimo attacco avra' VANTAGGIO!`,'info');
    }
    endAction();
  }
  else if(pick.type==='spell'){ castSpellOn(p, pick.spellId, null, ally); }
  else if(pick.type==='item'){ useCombatItemOn(p, pick.itemId, null, ally); }
  else if(pick.type==='bardic'){
    ally.conditions.inspired = {rounds:3};
    p.usedAbilities.bardic = (p.usedAbilities.bardic||0)+1;
    AUDIO.sfx('spell');
    addLog(`${p.name} ispira ${ally.name} con la sua musica: +1d6 al prossimo attacco!`,'magic');
    GAME.combat.bonusUsed = true;
    R();
  }
  else if(pick.type==='lay'){
    const pool = layPoolMax(p) - (p.usedAbilities.layUsed||0);
    const amount = Math.min(5, pool, ally.maxHp-ally.hp || 5);
    if(ally.hp<=0){ ally.conditions={}; }
    ally.hp = Math.min(ally.maxHp, ally.hp+Math.max(amount,1));
    p.usedAbilities.layUsed = (p.usedAbilities.layUsed||0)+Math.max(amount,1);
    AUDIO.sfx('heal');
    addLog(`${p.name} impone le mani su ${ally.name}: +${Math.max(amount,1)} PF! (riserva: ${layPoolMax(p)-(p.usedAbilities.layUsed||0)})`,'heal');
    endAction();
  }
};

window.cbDodge = () => {
  const p = currentActor().ref;
  p.conditions.dodge = {rounds:1};
  addLog(`${p.name} si mette IN GUARDIA: chi lo attacca avra' svantaggio!`,'info');
  endAction();
};

window.cbHelp = () => { GAME.combat.picking = {type:'help'}; R(); };

window.cbPass = () => { addLog(`${currentActor().ref.name} aspetta e osserva.`,'info'); endAction(); };

window.cbCancel = () => { GAME.combat.picking = null; GAME.combat.submenu = null; R(); };

window.cbMenu = (which) => { GAME.combat.submenu = which; R(); };

// --- Magie ---
window.cbCast = (spellId) => {
  const p = currentActor().ref;
  const sp = SPELLS[spellId];
  GAME.combat.submenu = null;
  if(sp.target==='enemy'){ GAME.combat.picking = {type:'spell', spellId}; R(); return; }
  if(sp.target==='ally'){ GAME.combat.picking = {type:'spell', spellId}; R(); return; }
  castSpellOn(p, spellId, null, null); // self / party / all_enemies
};

function spendSlot(p, sp){
  if(sp.level===0) return true;
  if(p.slots[sp.level-1]>0){ p.slots[sp.level-1]--; return true; }
  return false;
}

function castSpellOn(p, spellId, enemy, ally){
  const sp = SPELLS[spellId];
  if(!spendSlot(p, sp)){ showToast('Slot esauriti per questo livello!'); R(); return; }
  const sMod = mod(p.stats[p.spellStat]);
  const pb = profBonus(p.level);

  // Incantesimo d'attacco: overlay con dado
  if(sp.type==='attack' && enemy){
    const sources = playerAttackSources(p, enemy);
    const advState = combineAdv(sources);
    const roll = playerD20(p, advState);
    const total = roll.result + sMod + pb;
    const crit = roll.result===20;
    const hit = roll.result!==1 && (crit || total>=enemy.ac);
    const need = neededDie(total, roll.result, enemy.ac);
    cineAction({
      actor:{sprite:p.sprite, name:p.name, color:p.color},
      target:{sprite:enemy.sprite, name:enemy.name},
      intro: narrator('spellIntro', p.name, enemy.name),
      stakes: `Esce <b style="color:var(--gold)">${need} o piu'</b> e ${sp.name} colpisce ${enemy.name}!`,
      dice:{result:roll.result, rolls:roll.rolls, advState},
      breakdown: isStoria() ? null : `${roll.result} ${fmtMod(sMod)} magia +${pb} comp = ${total}`,
      compare: isStoria() ? null : `CA ${enemy.ac}`,
      outcome: crit?'crit':(hit?'hit':'miss'),
      outcomeText: hit ? `${sp.name.toUpperCase()}${crit?' CRITICO!':'!'}` : 'MANCATO!',
      result: hit ? '' : narrator('miss', p.name, enemy.name),
      sfxRoll:'spell',
      sfxOutcome: hit ? (crit?'critical':'spell') : 'attack_miss',
    }, ()=>{ applySpellAttack(p, sp, spellId, enemy, roll, crit, hit); endAction(); });
    return;
  }

  // Altre magie: overlay "incantesimo lanciato" (senza dado), poi effetto
  cineAction({
    actor:{sprite:p.sprite, name:p.name, color:p.color},
    target: enemy ? {sprite:enemy.sprite, name:enemy.name} : null,
    intro: narrator('spellIntro', p.name, enemy?enemy.name:''),
    dice: null,
    outcome:'cast', outcomeText: sp.name.toUpperCase(),
    result: sp.desc,
    sfxOutcome:'spell',
  }, ()=>{ resolveSpellEffect(p, spellId, enemy, ally); endAction(); });
}

// Applica i danni di un incantesimo d'attacco gia' tirato
function applySpellAttack(p, sp, spellId, enemy, roll, crit, hit){
  const sMod = mod(p.stats[p.spellStat]);
  const pb = profBonus(p.level);
  const total = roll.result + sMod + pb;
  const cantripScale = (sp.level===0 && p.level>=5) ? 2 : 1;
  const vsUndeadBonus = (hasFeature(p,'turn_undead_lite') && enemy.undead) ? pb : 0;
  if(hit){
    const dr = damageRoll(sp.dmg.num*cantripScale, sp.dmg.faces, 0, crit);
    let dmg = dr.total + vsUndeadBonus + (spellId==='colonna_di_luce' && enemy.undead ? dr.total : 0);
    const ei = GAME.combat.enemies.indexOf(enemy);
    applyDamageToEnemy(enemy, dmg);
    pushFloat('e', ei, dmg, crit?'crit':'dmg');
    if(crit) GAME.statsTracker.crits++;
    addLog(`${p.name} lancia ${sp.name} su ${enemy.name}: ${total} contro CA ${enemy.ac}. COLPITO${crit?' CRITICO':''}! ${dmg} danni (${sp.dmgType}).`,'magic');
  } else {
    addLog(`${p.name} lancia ${sp.name} su ${enemy.name}: ${total} contro CA ${enemy.ac}. Mancato!`,'dmg');
  }
  delete p.conditions.hidden; delete p.conditions.helped;
}

// Applica gli effetti di magie save/auto/heal/buff (senza endAction)
function resolveSpellEffect(p, spellId, enemy, ally){
  const c = GAME.combat;
  const sp = SPELLS[spellId];
  const sMod = mod(p.stats[p.spellStat]);
  const pb = profBonus(p.level);
  const dc = 8 + pb + sMod;
  const cantripScale = (sp.level===0 && p.level>=5) ? 2 : 1;
  const vsUndeadBonus = (hasFeature(p,'turn_undead_lite') && enemy && enemy.undead) ? pb : 0;

  if(sp.type==='save'){
    const targets = sp.target==='all_enemies' ? c.enemies.filter(e=>e.hp>0) : [enemy];
    targets.forEach(t=>{
      if(!t) return;
      const roll = d(20);
      const total = roll + mod(t.stats[sp.save]);
      const saved = total >= dc;
      let logTxt = `${t.name}: tiro salvezza ${STAT_NAMES[sp.save]} ${total} contro ${dc} -> ${saved?'riuscito':'fallito'}.`;
      if(sp.dmg && !sp.noDamage){
        const dr = rollDice(sp.dmg.num*cantripScale, sp.dmg.faces, 0);
        let dmg = dr.total + vsUndeadBonus + (spellId==='colonna_di_luce' && t.undead ? dr.total : 0);
        if(saved) dmg = sp.halfOnSave ? Math.floor(dmg/2) : 0;
        if(dmg>0){ const ti = c.enemies.indexOf(t); applyDamageToEnemy(t, dmg); pushFloat('e', ti, dmg, 'dmg'); logTxt += ` ${dmg} danni!`; }
        else logTxt += ' Nessun danno.';
      }
      if(sp.onHit && !saved){
        t.conditions[sp.onHit.condition] = {rounds:sp.onHit.rounds};
        logTxt += ` E' ${CONDITIONS[sp.onHit.condition].name.toUpperCase()}!`;
      }
      addLog(`${p.name} lancia ${sp.name}. ${logTxt}`,'magic');
    });
    return;
  }

  if(sp.type==='auto' && enemy){
    const dr = rollDice(sp.dmg.num, sp.dmg.faces, sp.dmg.bonus||0);
    const dmg = dr.total + vsUndeadBonus;
    const ei = c.enemies.indexOf(enemy);
    applyDamageToEnemy(enemy, dmg);
    pushFloat('e', ei, dmg, 'dmg');
    addLog(`${p.name} lancia ${sp.name}: i dardi colpiscono SEMPRE! ${dmg} danni a ${enemy.name}.`,'magic');
    return;
  }

  if(sp.type==='heal'){
    const targets = sp.target==='party' ? GAME.players.filter(x=>x.alive!==false) : [ally||p];
    targets.forEach(t=>{
      const hr = rollDice(sp.heal.num, sp.heal.faces, (sp.heal.bonus||0) + (sp.heal.addMod ? sMod : 0));
      if(t.hp<=0){ t.conditions = {}; }
      const healed = Math.min(hr.total, t.maxHp-t.hp);
      t.hp += healed;
      pushFloat('p', GAME.players.indexOf(t), healed, 'heal');
      addLog(`${p.name} lancia ${sp.name} su ${t.name}: +${healed} PF!`,'heal');
    });
    AUDIO.sfx('heal');
    return;
  }

  if(sp.type==='buff'){
    const cond = sp.buff.condition;
    const targets = sp.target==='party' ? alivePlayers() : (sp.target==='self' ? [p] : [ally||p]);
    targets.forEach(t=>{ t.conditions[cond] = {rounds:sp.buff.rounds}; });
    const condName = CONDITIONS[cond] ? CONDITIONS[cond].name : sp.name;
    addLog(`${p.name} lancia ${sp.name}: ${targets.map(t=>t.name).join(', ')} -> ${condName} per ${sp.buff.rounds} round!`,'magic');
    return;
  }
}

// --- Oggetti in combattimento ---
window.cbItem = (itemId) => {
  const c = GAME.combat;
  const it = ITEMS[itemId];
  c.submenu = null;
  if(it.effect==='heal' || it.effect==='cure_poison' || it.effect==='restore_slot'){
    c.picking = {type:'item', itemId}; R(); return;
  }
  if(it.effect==='damage_undead'){
    c.picking = {type:'item', itemId}; R(); return;
  }
  useCombatItemOn(currentActor().ref, itemId, null, null); // bomba: tutti i nemici
};

function useCombatItemOn(p, itemId, enemy, ally){
  const c = GAME.combat;
  const it = ITEMS[itemId];
  const idx = GAME.inventory.indexOf(itemId);
  if(idx===-1){ R(); return; }

  if(it.effect==='heal'){
    const t = ally||p;
    const hr = rollDice(it.dice.num, it.dice.faces, it.dice.bonus||0);
    if(t.hp<=0) t.conditions = {};
    const healed = Math.min(hr.total, t.maxHp-t.hp);
    t.hp += healed;
    AUDIO.sfx('heal');
    addLog(`${p.name} usa ${it.name} su ${t.name}: +${healed} PF!`,'heal');
  }
  else if(it.effect==='cure_poison'){
    const t = ally||p;
    delete t.conditions.poisoned;
    AUDIO.sfx('heal');
    addLog(`${p.name} usa ${it.name}: ${t.name} non e' piu' avvelenato!`,'heal');
  }
  else if(it.effect==='restore_slot'){
    const t = ally||p;
    if(t.casterType==='none'){ showToast(`${t.name} non usa magie!`); R(); return; }
    const mx = maxSlots(t.casterType, t.level);
    const lv = it.slotLevel;
    if(t.slots[lv-1]<mx[lv-1]){ t.slots[lv-1]++; AUDIO.sfx('spell'); addLog(`${t.name} recupera uno slot di livello ${lv}!`,'magic'); }
    else { showToast('Slot gia\' pieni!'); R(); return; }
  }
  else if(it.effect==='damage_all'){
    AUDIO.sfx('breath');
    c.enemies.filter(e=>e.hp>0).forEach(e=>{
      const dr = rollDice(it.dice.num, it.dice.faces, 0);
      applyDamageToEnemy(e, dr.total);
      addLog(`La bomba esplode su ${e.name}: ${dr.total} danni da fuoco!`,'dmg');
    });
  }
  else if(it.effect==='damage_undead' && enemy){
    if(!enemy.undead){ showToast('Funziona solo sui non morti!'); R(); return; }
    const dr = rollDice(it.dice.num, it.dice.faces, 0);
    applyDamageToEnemy(enemy, dr.total);
    AUDIO.sfx('spell');
    addLog(`L'acqua benedetta brucia ${enemy.name}: ${dr.total} danni radiosi!`,'magic');
  }
  GAME.inventory.splice(idx,1);
  endAction();
}

// --- Capacita' di classe e specie ---
window.cbAbility = (abId) => {
  const c = GAME.combat;
  const p = currentActor().ref;
  c.submenu = null;

  switch(abId){
    case 'second_wind': {
      const hr = rollDice(1,10,p.level);
      const healed = Math.min(hr.total, p.maxHp-p.hp);
      p.hp += healed;
      p.usedAbilities.second_wind = 1;
      AUDIO.sfx('heal');
      addLog(`${p.name} usa Secondo Vento: +${healed} PF! (azione bonus)`,'heal');
      c.bonusUsed = true;
      R(); break;
    }
    case 'action_surge': {
      p.usedAbilities.action_surge = 1;
      c.surgeReady = true;
      addLog(`${p.name} usa Azione Impetuosa: potra' agire DUE volte questo turno!`,'gold');
      R(); break;
    }
    case 'rage': {
      p.usedAbilities.rage = (p.usedAbilities.rage||0)+1;
      p.conditions.rage = {rounds:4};
      AUDIO.sfx('encounter');
      addLog(`${p.name} entra in FURIA! +2 danni in mischia, danni subiti dimezzati. (azione bonus)`,'dmg');
      c.bonusUsed = true;
      R(); break;
    }
    case 'reckless': {
      p.conditions.reckless = {rounds:1};
      addLog(`${p.name} attacca SPERICOLATO: vantaggio ai suoi attacchi, ma anche i nemici avranno vantaggio!`,'info');
      R(); break;
    }
    case 'hide': {
      p.conditions.hidden = {rounds:2};
      p.usedAbilities; c.bonusUsed = true;
      addLog(`${p.name} si nasconde nelle ombre: il prossimo attacco avra' VANTAGGIO! (azione bonus)`,'info');
      R(); break;
    }
    case 'bardic': {
      c.picking = {type:'bardic'};
      R(); break;
    }
    case 'channel': {
      p.usedAbilities.channel = 1;
      GAME.players.forEach(t=>{
        if(t.hp>0){
          const hr = rollDice(1,8,0);
          t.hp = Math.min(t.maxHp, t.hp+hr.total);
        }
      });
      AUDIO.sfx('heal');
      addLog(`${p.name} incanala la Divinita': tutta la squadra recupera 1d8 PF!`,'heal');
      endAction(); break;
    }
    case 'lay': {
      c.picking = {type:'lay'};
      R(); break;
    }
    case 'breath': {
      p.usedAbilities.breath = 1;
      AUDIO.sfx('breath');
      const dc = 8 + profBonus(p.level) + mod(p.stats.COS);
      const dice = p.level>=5 ? 3 : 2;
      c.enemies.filter(e=>e.hp>0).forEach(e=>{
        const roll = d(20) + mod(e.stats.DES);
        const dr = rollDice(dice,6,0);
        const dmg = roll>=dc ? Math.floor(dr.total/2) : dr.total;
        applyDamageToEnemy(e, dmg);
        addLog(`${p.name} soffia fuoco su ${e.name}: salvezza ${roll} contro ${dc}, ${dmg} danni!`,'dmg');
      });
      endAction(); break;
    }
  }
};

function endAction(){
  const c = GAME.combat;
  if(!c) return;
  if(checkEnd()) return;
  if(c.surgeReady){
    c.surgeReady = false;
    addLog('Azione Impetuosa: agisci di nuovo!','gold');
    R();
    return;
  }
  nextTurn();
}

// ------------------------------------------------------------
// RENDER COMBATTIMENTO
// ------------------------------------------------------------
export function renderCombat(){
  const c = GAME.combat;
  if(!c){ return; }
  const a = currentActor();
  const isPlayerTurn = a && a.side==='p';
  const p = isPlayerTurn ? a.ref : null;

  const initChips = c.order.map((o,i)=>{
    const ref = o.side==='p' ? GAME.players[o.i] : c.enemies[o.i];
    const dead = ref.hp<=0;
    return `<span class="init-chip ${i===c.ptr?'current':''} ${o.side==='e'?'enemy':''} ${dead?'done':''}">${ref.name} (${o.init})</span>`;
  }).join('');

  const enemiesHtml = c.enemies.map((e,i)=>{
    const clickable = c.picking && (c.picking.type==='attack'||c.picking.type==='spell'||c.picking.type==='item') && e.hp>0;
    const shake = c._shakeE===i ? 'shaking hit-flash' : '';
    return `<div id="cbErow${i}" class="combatant ${shake} ${a&&a.side==='e'&&a.i===i?'active':''}" ${clickable?`onclick="window.cbPickEnemy(${i})" style="cursor:pointer;border-color:var(--accent)"`:''}>
      <div id="cbE${i}" class="${e.hp<=0?'defeated-sprite':''}" style="flex-shrink:0;position:relative">${e.hp<=0?'<span class="death-x">X</span>':''}</div>
      <span class="cname" style="color:var(--accent)">${e.name}</span>
      <div class="bars">
        <div class="bar-wrap"><div class="bar-fill" style="width:${(e.hp/e.maxHp)*100}%;background:var(--hp)"></div>
        <span class="bar-text">PF ${e.hp}/${e.maxHp}${isStoria()?'':` &middot; CA ${e.ac}`}</span></div>
        <div>${condBadges(e)}</div>
      </div>
    </div>`;
  }).join('');

  const playersHtml = GAME.players.map((pl,i)=>{
    const clickable = c.picking && (c.picking.type==='help'||c.picking.type==='bardic'||c.picking.type==='lay'||(c.picking.type==='spell')||(c.picking.type==='item'));
    const mxSlots = maxSlots(pl.casterType, pl.level);
    const shake = c._shakeP===i ? 'shaking hit-flash' : '';
    return `<div id="cbProw${i}" class="combatant ${shake} ${a&&a.side==='p'&&a.i===i?'active':''}" ${clickable?`onclick="window.cbPickAlly(${i})" style="cursor:pointer;border-color:var(--green)"`:''}>
      <div id="cbP${i}" class="${pl.hp<=0?'defeated-sprite':''}" style="flex-shrink:0;position:relative">${pl.hp<=0?'<span class="death-x">X</span>':''}</div>
      <span class="cname" style="color:${pl.color}">${pl.name}</span>
      <div class="bars">
        <div class="bar-wrap"><div class="bar-fill" style="width:${(pl.hp/pl.maxHp)*100}%;background:var(--hp)"></div>
        <span class="bar-text">PF ${pl.hp}/${pl.maxHp}${isStoria()?'':` &middot; CA ${pl.ac+(pl.conditions.shielded?2:0)}`}</span></div>
        ${(!isStoria() && pl.casterType!=='none') ? `<div style="font-size:6px;color:var(--mp)">Slot: ${pl.slots[0]}/${mxSlots[0]} (liv1)${mxSlots[1]>0?` ${pl.slots[1]}/${mxSlots[1]} (liv2)`:''}</div>` : ''}
        ${(isStoria() && pl.casterType!=='none') ? `<div style="font-size:6px;color:var(--mp)">Magie rimaste: ${pl.slots[0]+pl.slots[1]}</div>` : ''}
        <div>${condBadges(pl)}</div>
      </div>
    </div>`;
  }).join('');

  let actionHtml = '';
  if(isPlayerTurn){
    if(c.picking){
      const what = {attack:'Scegli il bersaglio dell\'attacco!', spell:'Scegli il bersaglio della magia!',
        item:'Scegli il bersaglio!', help:'Chi vuoi aiutare (o rialzare)?', bardic:'Chi vuoi ispirare?', lay:'Chi vuoi curare?'}[c.picking.type];
      actionHtml = `<p style="font-size:9px;color:var(--gold);text-align:center">${what}</p>
        <div class="row"><button class="btn small" onclick="window.cbCancel()">Annulla</button></div>`;
    } else if(c.submenu==='spells'){
      actionHtml = spellMenu(p);
    } else if(c.submenu==='items'){
      actionHtml = itemMenu();
    } else if(c.submenu==='abilities'){
      actionHtml = abilityMenu(p);
    } else if(isStoria()){
      actionHtml = storiaMenu(p);
    } else {
      actionHtml = mainMenu(p);
    }
  } else {
    actionHtml = `<p style="font-size:10px;color:var(--accent);text-align:center;animation:pulse 1s infinite">Turno di ${a?a.ref.name:'...'}...</p>`;
  }

  app().innerHTML = `
    <div class="screen active">
      <div class="combat-area">
        <h2>${c.opts.isBoss ? 'BOSS!' : 'Combattimento'} <span style="font-size:8px;color:var(--muted)">Round ${c.round}</span></h2>
        ${isStoria() ? '' : `<div class="initiative-bar">${initChips}</div>`}
        <h3 style="margin:8px 0 2px">Nemici</h3>
        ${enemiesHtml}
        <h3 style="margin:8px 0 2px">Eroi</h3>
        ${playersHtml}
        <div class="panel dark" style="margin-top:8px;max-width:100%">
          ${actionHtml}
        </div>
        <div class="log" id="cbLog" style="margin-top:8px">${GAME.log.slice(-7).map(l=>`<div class="log-entry ${l.cls}">${l.text}</div>`).join('')}</div>
      </div>
    </div>`;

  c.enemies.forEach((e,i)=>{ const el=$(`#cbE${i}`); if(el) el.prepend(createSpriteEl(e.sprite, e.boss?5:4)); });
  GAME.players.forEach((pl,i)=>{ const el=$(`#cbP${i}`); if(el) el.prepend(createSpriteEl(pl.sprite, 3)); });
  const log = $('#cbLog'); if(log) log.scrollTop = log.scrollHeight;

  // Numeri fluttuanti sui combattenti colpiti/curati
  if(c._floats && c._floats.length){
    c._floats.forEach(f=>{
      const row = $(`#cb${f.side==='e'?'Erow':'Prow'}${f.idx}`);
      if(!row) return;
      const span = document.createElement('div');
      span.className = `float-dmg ${f.type==='heal'?'heal':''} ${f.type==='crit'?'crit':''}`;
      span.textContent = f.type==='heal' ? `+${f.amount}` : `-${f.amount}`;
      row.appendChild(span);
      setTimeout(()=>span.remove(), 1000);
    });
    c._floats = [];
  }
  // Reset shake dopo un attimo
  if(c._shakeE!=null || c._shakeP!=null){
    setTimeout(()=>{ if(GAME.combat){ GAME.combat._shakeE=null; GAME.combat._shakeP=null; } }, 450);
  }
}

function condBadges(ref){
  if(!ref.conditions) return '';
  return Object.keys(ref.conditions).map(id=>{
    const cd = CONDITIONS[id];
    if(!cd) {
      if(id==='huntersMark') return `<span class="cond-badge bless" title="Marchio del Cacciatore">M</span>`;
      if(id==='inspired') return `<span class="cond-badge bless" title="Ispirato">d6</span>`;
      if(id==='helped') return `<span class="cond-badge dodge" title="Aiutato: vantaggio">A</span>`;
      if(id==='hidden') return `<span class="cond-badge dodge" title="Nascosto">N</span>`;
      if(id==='reckless') return `<span class="cond-badge rage" title="Spericolato">!</span>`;
      return '';
    }
    return `<span class="cond-badge ${cd.cls}" title="${cd.name}: ${cd.desc}">${cd.name}</span>`;
  }).join('');
}

// --- MENU SEMPLIFICATO MODALITA' STORIA (3 bottoni, niente gergo) ---
function storiaMenu(p){
  const hasPotion = GAME.inventory.some(id=>ITEMS[id] && ITEMS[id].effect==='heal');
  const isCaster = p.casterType!=='none' && (p.slots[0]+p.slots[1]>0 || p.cantrips.some(id=>SPELLS[id] && ['attack','save'].includes(SPELLS[id].type)));
  return `
    <p style="font-size:10px;color:var(--gold);text-align:center">Tocca a ${p.name}! Cosa fai?</p>
    <div class="col" style="gap:8px;margin-top:6px;align-items:center">
      <button class="btn accent" style="max-width:340px" onclick="window.cbStoriaAttack()">&#9876; Attacca il nemico</button>
      <button class="btn purple" style="max-width:340px" onclick="window.cbStoriaSpecial()">&#10024; ${isCaster?'Lancia una Magia':'Mossa Speciale'}</button>
      <button class="btn green" style="max-width:340px" onclick="window.cbStoriaPotion()" ${hasPotion?'':'disabled'}>&#127870; Bevi una Pozione</button>
    </div>`;
}

function firstAliveEnemy(){ return GAME.combat.enemies.find(e=>e.hp>0); }
function lowestAlly(){
  const alive = alivePlayers();
  if(alive.length===0) return GAME.players.find(p=>p.hp>0) || GAME.players[0];
  return alive.reduce((a,b)=> (a.hp/a.maxHp) <= (b.hp/b.maxHp) ? a : b);
}

window.cbStoriaAttack = () => {
  const p = currentActor().ref;
  const enemy = firstAliveEnemy();
  if(!enemy){ endAction(); return; }
  performAttack(p, enemy, false, ()=>{
    if(hasFeature(p,'extra_attack')){
      const t2 = enemy.hp>0 ? enemy : firstAliveEnemy();
      if(t2){ addLog(`${p.name} attacca ancora!`,'info'); performAttack(p, t2, false, ()=>endAction()); return; }
    }
    endAction();
  });
};

window.cbStoriaSpecial = () => {
  const p = currentActor().ref;
  const enemy = firstAliveEnemy();
  // 1) Cura un alleato in pericolo se puo'
  const low = lowestAlly();
  const healSpell = p.spells.find(id=>SPELLS[id].type==='heal' && p.slots[SPELLS[id].level-1]>0);
  if(healSpell && low && low.hp < low.maxHp*0.45){
    castSpellOn(p, healSpell, null, low); return;
  }
  // 2) Magia d'attacco se disponibile
  const dmgSlot = p.spells.find(id=>['attack','auto','save'].includes(SPELLS[id].type) && p.slots[SPELLS[id].level-1]>0);
  const dmgCantrip = p.cantrips.find(id=>SPELLS[id] && ['attack','save'].includes(SPELLS[id].type));
  const spellId = dmgSlot || dmgCantrip;
  if(spellId && enemy){ castSpellOn(p, spellId, enemy, null); return; }
  // 3) Guerriero/altri: colpo eroico con vantaggio
  if(enemy){
    p.conditions.hidden = {rounds:1}; // garantisce vantaggio a questo colpo
    addLog(`${p.name} si prepara a un colpo eroico!`,'info');
    performAttack(p, enemy, false, ()=>endAction());
  } else { endAction(); }
};

window.cbStoriaPotion = () => {
  const p = currentActor().ref;
  const potId = GAME.inventory.find(id=>ITEMS[id] && ITEMS[id].effect==='heal');
  if(!potId){ showToast('Nessuna pozione!'); return; }
  // Prima gli alleati svenuti (0 PF): la pozione li rialza.
  // lowestAlly() guarda solo i vivi, quindi da solo non li trovava mai.
  const down = GAME.players.find(pl => pl.hp <= 0);
  const target = down || lowestAlly();
  useCombatItemOn(p, potId, null, target);
};

function mainMenu(p){
  const canSmite = hasFeature(p,'divine_smite') && p.slots[0]>0;
  const hasSpells = (p.cantrips.length + p.spells.length) > 0;
  const hasItems = GAME.inventory.some(id=>ITEMS[id].type==='consumable');
  return `
    <p style="font-size:9px;color:var(--gold);text-align:center">Tocca a ${p.name}! Cosa fai?</p>
    <div class="row" style="margin-top:6px">
      <button class="btn small accent" onclick="window.cbAttack(false)">Attacca</button>
      ${canSmite ? `<button class="btn small purple" onclick="window.cbAttack(true)">Attacca + Punizione (slot 1)</button>` : ''}
      ${hasSpells ? `<button class="btn small blue" onclick="window.cbMenu('spells')">Magia</button>` : ''}
      ${hasItems ? `<button class="btn small green" onclick="window.cbMenu('items')">Oggetto</button>` : ''}
      <button class="btn small purple" onclick="window.cbMenu('abilities')">Capacita'</button>
      <button class="btn small" onclick="window.cbDodge()">Difenditi</button>
      <button class="btn small" onclick="window.cbHelp()">Aiuta</button>
      <button class="btn small" onclick="window.cbPass()">Passa</button>
    </div>`;
}

function spellMenu(p){
  const list = [];
  p.cantrips.forEach(id=>{
    const sp = SPELLS[id];
    if(sp.type==='special') return;
    list.push(`<button class="choice-btn" onclick="window.cbCast('${id}')"><span style="color:var(--green)">[gratis]</span> ${sp.name}: ${sp.desc}</button>`);
  });
  p.spells.forEach(id=>{
    const sp = SPELLS[id];
    if(sp.type==='special') return;
    const ok = p.slots[sp.level-1]>0;
    list.push(`<button class="choice-btn" ${ok?`onclick="window.cbCast('${id}')"`:'disabled style="opacity:0.4"'}><span style="color:var(--mp)">[slot liv ${sp.level}: ${p.slots[sp.level-1]}]</span> ${sp.name}: ${sp.desc}</button>`);
  });
  return `<p style="font-size:9px;color:var(--blue);text-align:center">Quale magia?</p>
    ${list.join('')}
    <div class="row"><button class="btn small" onclick="window.cbCancel()">Indietro</button></div>`;
}

function itemMenu(){
  const counts = {};
  GAME.inventory.forEach(id=>{ if(ITEMS[id].type==='consumable') counts[id]=(counts[id]||0)+1; });
  return `<p style="font-size:9px;color:var(--green);text-align:center">Quale oggetto?</p>
    ${Object.entries(counts).map(([id,n])=>{
      const it = ITEMS[id];
      return `<button class="choice-btn" onclick="window.cbItem('${id}')">${it.name} ${n>1?`x${n}`:''}: ${it.desc}</button>`;
    }).join('')}
    <div class="row"><button class="btn small" onclick="window.cbCancel()">Indietro</button></div>`;
}

function abilityMenu(p){
  const c = GAME.combat;
  const tr = speciesTraits(p);
  const list = [];
  if(hasFeature(p,'second_wind') && !p.usedAbilities.second_wind && !c.bonusUsed)
    list.push(`<button class="choice-btn" onclick="window.cbAbility('second_wind')">Secondo Vento (bonus): recupera 1d10+${p.level} PF. 1 per riposo.</button>`);
  if(hasFeature(p,'action_surge') && !p.usedAbilities.action_surge && !c.surgeReady)
    list.push(`<button class="choice-btn" onclick="window.cbAbility('action_surge')">Azione Impetuosa: agisci 2 volte questo turno! 1 per riposo.</button>`);
  if(hasFeature(p,'rage') && (p.usedAbilities.rage||0) < rageUsesMax(p) && !p.conditions.rage && !c.bonusUsed)
    list.push(`<button class="choice-btn" onclick="window.cbAbility('rage')">Furia (bonus): +2 danni, danni subiti dimezzati, 4 round. Usi: ${rageUsesMax(p)-(p.usedAbilities.rage||0)}.</button>`);
  if(hasFeature(p,'reckless') && !p.conditions.reckless)
    list.push(`<button class="choice-btn" onclick="window.cbAbility('reckless')">Attacco Spericolato: vantaggio ai tuoi attacchi, ma i nemici hanno vantaggio su di te.</button>`);
  if(hasFeature(p,'cunning_action') && !p.conditions.hidden && !c.bonusUsed)
    list.push(`<button class="choice-btn" onclick="window.cbAbility('hide')">Azione Scaltra (bonus): nasconditi, il prossimo attacco ha vantaggio.</button>`);
  if(hasFeature(p,'bardic_inspiration') && (p.usedAbilities.bardic||0) < bardicUsesMax(p) && !c.bonusUsed)
    list.push(`<button class="choice-btn" onclick="window.cbAbility('bardic')">Ispirazione Bardica (bonus): un alleato aggiunge 1d6 al prossimo attacco. Usi: ${bardicUsesMax(p)-(p.usedAbilities.bardic||0)}.</button>`);
  if(hasFeature(p,'channel_divinity') && !p.usedAbilities.channel)
    list.push(`<button class="choice-btn" onclick="window.cbAbility('channel')">Incanalare Divinita': tutta la squadra recupera 1d8 PF. 1 per riposo.</button>`);
  if(hasFeature(p,'lay_on_hands') && (layPoolMax(p)-(p.usedAbilities.layUsed||0))>0)
    list.push(`<button class="choice-btn" onclick="window.cbAbility('lay')">Imposizione delle Mani: cura 5 PF a un alleato. Riserva: ${layPoolMax(p)-(p.usedAbilities.layUsed||0)} PF.</button>`);
  if(tr.breathWeapon && !p.usedAbilities.breath)
    list.push(`<button class="choice-btn" onclick="window.cbAbility('breath')">Soffio di Fuoco (specie): ${p.level>=5?3:2}d6 danni a TUTTI i nemici (salvezza dimezza). 1 per riposo lungo.</button>`);

  if(list.length===0) list.push('<p style="font-size:8px;color:var(--muted);text-align:center">Nessuna capacita\' disponibile ora (gia\' usate o serve un riposo).</p>');
  return `<p style="font-size:9px;color:var(--purple);text-align:center">Capacita' speciali</p>
    ${list.join('')}
    <div class="row"><button class="btn small" onclick="window.cbCancel()">Indietro</button></div>`;
}

// ------------------------------------------------------------
// OFFERTA DI PACE A META' SCONTRO FINALE
// ------------------------------------------------------------
export function renderFinaleOffer(){
  app().innerHTML = `
    <div class="screen active" style="padding-top:40px">
      <div id="foSprite"></div>
      <div class="dialogue-box">
        <div class="dialogue-name">Vermilius vacilla...</div>
        <div class="dialogue-text">${FINALE.midFightOffer.text}</div>
      </div>
      <div style="width:100%;max-width:620px">
        ${FINALE.midFightOffer.choices.map(c=>{
          const tag = c.check ? ` <span class="check-tag">[prova di Carisma, difficolta' ${c.check.dc}]</span>` : '';
          return `<button class="choice-btn" onclick="window.cbFinaleMid('${c.id}')">${c.label}${tag}</button>`;
        }).join('')}
      </div>
    </div>`;
  const el=$('#foSprite'); if(el) el.appendChild(createSpriteEl('drago',5));
}

window.cbFinaleMid = (choiceId) => {
  if(choiceId==='fight_on'){
    addLog('La battaglia continua!','dmg');
    GAME.state = 'combat';
    R();
    setTimeout(()=>{ const a = currentActor(); if(a && a.side==='e') enemyAct(a); }, 600);
    return;
  }
  // gem_again
  const best = GAME.players.filter(p=>p.hp>0).reduce((a,b)=>a.stats.CAR>=b.stats.CAR?a:b, GAME.players[0]);
  AUDIO.sfx('dice');
  const roll = rollD20('normal');
  const total = roll.result + mod(best.stats.CAR) + profBonus(best.level);
  const dc = FINALE.midFightOffer.choices.find(x=>x.id==='gem_again').check.dc;
  addLog(`${best.name} mostra di nuovo la Gemma: ${roll.result} ${fmtMod(mod(best.stats.CAR))} +${profBonus(best.level)} = ${total} contro ${dc}.`, total>=dc?'gold':'dmg');
  if(total>=dc){
    GAME.combat = null;
    resolvePeace('B');
  } else {
    addLog('Vermilius ruggisce, ancora diffidente. La battaglia continua!','dmg');
    GAME.state='combat';
    R();
    setTimeout(()=>{ const a = currentActor(); if(a && a.side==='e') enemyAct(a); }, 600);
  }
};
