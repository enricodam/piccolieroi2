// ============================================================
// PICCOLI EROI 2 - Motore modalita' STORIA (avventura a tappe)
// Scene narrate, scelte chiare, combattimenti semplificati.
// ============================================================
import { GAME, addLog, showToast, saveGame, bestStatPlayer, alivePlayers,
         isSolo, partyLabel } from './state.js';
import { ITEMS, STAT_NAMES } from './data.js';
import { mod, fmtMod, abilityCheck, longRest } from './rules.js';
import { createSpriteEl } from './sprites.js';
import { AUDIO } from './audio.js';
import { STORY } from './story.js';
import { cineAction, narrator } from './cinematic.js';
import { startCombat } from './ui-combat.js';
import { maybeLevelUp } from './ui-core.js';

const $ = sel => document.querySelector(sel);
const app = () => $('#app');
const R = () => window.render();

function curChapter(){ return STORY.chapters[GAME.chapter-1]; }
function curScenes(){
  const ch = curChapter();
  return GAME.story.branch ? ch.branches[GAME.story.branch] : ch.scenes;
}
function curScene(){ return curScenes()[GAME.story.node]; }
function totalTappe(){ return curChapter().scenes.length; }

// ------------------------------------------------------------
// INTRO CAPITOLO
// ------------------------------------------------------------
export function renderStoryChapter(){
  AUDIO.playMusic('dungeon');
  const ch = curChapter();
  app().innerHTML = `
    <div class="screen active" style="padding-top:30px">
      <div class="chapter-banner">
        <div class="ch-num">${ch.subtitle.toUpperCase()}</div>
        <div class="ch-title">${ch.title}</div>
        <p class="event-text">${ch.banner}</p>
      </div>
      <button class="btn green" onclick="window.uiStoryBegin()">Comincia il capitolo!</button>
    </div>`;
}
window.uiStoryBegin = () => {
  GAME.story.node = 0; GAME.story.branch = null;
  GAME.state = 'storyScene';
  saveGame(true);
  R();
};

// Schermata di ripresa (dopo aver caricato un salvataggio in Storia)
export function renderStoryMap(){
  const ch = curChapter();
  app().innerHTML = `
    <div class="screen active" style="padding-top:40px">
      <h2>${ch.title}</h2>
      <p style="font-size:9px;color:var(--muted)">Bentornato, piccolo eroe! Riprendi la tua avventura da dove l'avevi lasciata.</p>
      ${storyProgress()}
      <button class="btn green" onclick="GAME.state='storyScene';window.render()">Continua l'avventura</button>
    </div>`;
}

function storyProgress(){
  const total = totalTappe();
  const cur = GAME.story.branch ? total : Math.min(GAME.story.node+1, total);
  let dots = '';
  for(let i=0;i<total;i++){
    dots += `<span class="tut-dot ${i<cur?'active':''}" style="width:10px;height:10px"></span>`;
  }
  return `<div class="col" style="align-items:center;gap:6px;margin:8px 0">
    <div class="tut-dots">${dots}</div>
    <span style="font-size:8px;color:var(--muted)">Tappa ${cur} di ${total} &middot; ${curChapter().title}</span>
  </div>`;
}

// ------------------------------------------------------------
// SCENA
// ------------------------------------------------------------
export function renderStoryScene(){
  const sc = curScene();
  if(!sc){ chapterComplete(); return; }
  AUDIO.playMusic(sc.type==='boss' ? 'boss' : 'dungeon');

  let html = `<div class="screen active"><div class="event-scene">`;
  html += storyProgress();
  if(sc.sprite) html += `<div id="scScene" style="margin:10px 0"></div>`;
  if(sc.who) html += `<div class="dialogue-name" style="text-align:center">${sc.who}</div>`;
  html += `<div class="event-text">${(sc.text||'').replace(/\n/g,'<br>')}</div>`;

  if(sc.type==='narra' || sc.type==='dono' || sc.type==='riposo'){
    if(sc.type==='dono' && sc.items) html += `<p style="font-size:9px;color:var(--gold)">Ricevi: ${sc.items.map(id=>ITEMS[id].name).join(', ')}!</p>`;
    if(sc.type==='dono' && sc.gold) html += `<p style="font-size:9px;color:var(--gold)">+${sc.gold} monete d'oro!</p>`;
    if(sc.type==='riposo') html += `<p style="font-size:9px;color:var(--green)">Punti Ferita e magie ricaricati!</p>`;
    html += `<button class="btn green" onclick="window.uiStoryNext()">Avanti &#9654;</button>`;
  }
  else if(sc.type==='scelta'){
    if(GAME._storyReply){
      html += `<div class="dialogue-box" style="margin:10px auto"><div class="dialogue-text">${GAME._storyReply}</div></div>`;
      html += `<button class="btn green" onclick="window.uiStoryNext()">Avanti &#9654;</button>`;
    } else {
      html += `<div style="width:100%;max-width:540px;margin-top:8px">`;
      sc.choices.forEach((c,i)=>{ html += `<button class="choice-btn" onclick="window.uiStoryChoice(${i})">${c.label}</button>`; });
      html += `</div>`;
    }
  }
  else if(sc.type==='prova'){
    const best = bestStatPlayer(sc.stat);
    html += `<p style="font-size:8px;color:var(--blue)">Ci prova ${best.name}!</p>
      <button class="btn gold" onclick="window.uiStoryProva()">&#127922; Prova!</button>`;
  }
  else if(sc.type==='combat' || sc.type==='boss'){
    html += `<button class="btn accent" onclick="window.uiStoryFight()">${sc.type==='boss'?'Affronta il nemico!':'Combatti!'}</button>`;
  }

  html += `</div></div>`;
  app().innerHTML = html;
  if(sc.sprite){ const el=$('#scScene'); if(el) el.appendChild(createSpriteEl(sc.sprite, sc.type==='boss'?7:6)); }
}

window.uiStoryNext = () => { GAME._storyReply = null; storyAdvance(); };

window.uiStoryChoice = (i) => {
  const sc = curScene();
  const c = sc.choices[i];
  if(c.goto){ storyGoto(c.goto); return; }
  if(c.items){ c.items.forEach(id=>GAME.inventory.push(id)); AUDIO.sfx('chest'); }
  if(c.gold){ GAME.gold += c.gold; GAME.statsTracker.goldEarned += c.gold; AUDIO.sfx('coin'); }
  if(c.reply){ GAME._storyReply = c.reply; R(); }
  else storyAdvance();
};

window.uiStoryProva = () => {
  const sc = curScene();
  const best = bestStatPlayer(sc.stat);
  const res = abilityCheck(best, sc.stat, sc.dc);
  const outcome = res.success ? sc.success : sc.fail;
  const need = Math.max(2, Math.min(20, sc.dc - (res.total - res.roll.result)));
  cineAction({
    actor:{sprite:best.sprite, name:best.name, color:best.color},
    target:null,
    intro: `${best.name} ci prova... ${narrator('checkIntro', best.name)}`,
    stakes: `Esce <b style="color:var(--gold)">${need} o piu'</b> e ${best.name} ci riesce!`,
    dice:{result:res.roll.result, rolls:res.roll.rolls, advState:res.roll.advState||'normal'},
    breakdown: null, compare: null,
    outcome: res.success ? 'success' : 'fail',
    outcomeText: res.success ? 'RIUSCITO!' : 'OPS!',
    result: outcome.text,
    sfxRoll:'dice', sfxOutcome: res.success ? 'chest' : 'damage',
  }, ()=>{
    if(outcome.items){ outcome.items.forEach(id=>GAME.inventory.push(id)); }
    if(outcome.gold){ GAME.gold += outcome.gold; GAME.statsTracker.goldEarned += outcome.gold; }
    if(outcome.dmg){ best.hp = Math.max(1, best.hp - outcome.dmg); }
    // Esiti speciali del finale (ramo pace)
    if(outcome.special==='peace'){ GAME.ending='peace'; GAME.state='storyEpilogue'; saveGame(true); R(); return; }
    if(outcome.special==='peace_retry'){ storyGoto('peace_fight'); return; }
    storyAdvance();
  });
};

window.uiStoryFight = () => {
  const sc = curScene();
  GAME._storyFinale = sc.finale || null;
  GAME._storyVictoryText = sc.victoryText || '';
  startCombat(sc.monsters, {
    story:true, isBoss: sc.type==='boss',
    finale: sc.finale || null,
    victoryText: sc.victoryText,
    rewardGold: sc.gold || 0,
  });
};

function storyAdvance(){
  GAME.story.node++;
  GAME._storyReply = null;
  const sc = curScene();
  if(!sc){
    // fine sequenza
    if(GAME.story.branch){
      // un ramo finito senza finale esplicito: vai all'epilogo col finale corrente
      GAME.state='storyEpilogue'; R(); return;
    }
    chapterComplete(); return;
  }
  // applica effetti immediati di dono/riposo quando si ARRIVA su di essi
  GAME.state = 'storyScene';
  applyImmediate(sc);
  saveGame(true);
  R();
}

function applyImmediate(sc){
  if(sc.type==='dono'){
    if(sc.items) sc.items.forEach(id=>GAME.inventory.push(id));
    if(sc.gold){ GAME.gold += sc.gold; GAME.statsTracker.goldEarned += sc.gold; }
    AUDIO.sfx('chest');
  } else if(sc.type==='riposo'){
    GAME.players.forEach(p=>longRest(p));
    AUDIO.sfx('rest');
  }
}

function storyGoto(key){
  GAME.story.branch = key;
  GAME.story.node = 0;
  GAME._storyReply = null;
  GAME.state = 'storyScene';
  applyImmediate(curScene());
  saveGame(true);
  R();
}

function chapterComplete(){
  if(GAME.chapter >= 3){
    GAME.state = 'storyEpilogue'; R(); return;
  }
  GAME.state = 'storyCamp'; R();
}

// ------------------------------------------------------------
// ESITO COMBATTIMENTO (chiamato da ui-combat per la Storia)
// ------------------------------------------------------------
export function renderStoryResolve(){
  if(GAME._storyOutcome === 'lose'){
    AUDIO.playMusic('dungeon');
    app().innerHTML = `
      <div class="screen active" style="padding-top:40px">
        <div class="event-scene">
          <h2 style="color:var(--accent)">${isSolo()?'Sei stato messo K.O.!':'Siete stati messi K.O.!'}</h2>
          <div class="event-text">Niente paura, nella modalita' Storia non si perde mai davvero! Riprendi fiato, ${isSolo()?'ti rialzi':'vi rialzate'} pieni di energie e riprovi la sfida. Stavolta ce la farai!</div>
          <button class="btn green" onclick="window.uiStoryRetry()">Riprova la tappa!</button>
        </div>
      </div>`;
    return;
  }
  // Vittoria
  AUDIO.playMusic('dungeon');
  app().innerHTML = `
    <div class="screen active" style="padding-top:40px">
      <div class="event-scene">
        <h2 style="color:var(--green)">VITTORIA!</h2>
        <div class="event-text">${(GAME._storyVictoryText||'Hai vinto!').replace(/\n/g,'<br>')}</div>
        <button class="btn green" onclick="window.uiStoryAfterWin()">Avanti &#9654;</button>
      </div>
    </div>`;
}

window.uiStoryRetry = () => {
  GAME.players.forEach(p=>{ p.hp = p.maxHp; p.alive = true; p.conditions = {}; });
  GAME._storyOutcome = null;
  GAME.state = 'storyScene';
  R();
};

window.uiStoryAfterWin = () => {
  const finale = GAME._storyFinale;
  GAME._storyOutcome = null; GAME._storyFinale = null;
  if(finale==='fight'){ GAME.ending='fight'; GAME.state='storyEpilogue'; saveGame(true); R(); return; }
  if(finale==='peace'){ GAME.ending='peace'; GAME.state='storyEpilogue'; saveGame(true); R(); return; }
  storyAdvance();
};

// Chiamate dinamicamente da ui-combat
export function storyOnCombatWin(){
  GAME._storyOutcome = 'win';
  maybeLevelUp('storyResolve');
}
export function storyOnCombatLose(){
  GAME._storyOutcome = 'lose';
  GAME.state = 'storyResolve';
  R();
}

// ------------------------------------------------------------
// ACCAMPAMENTO TRA CAPITOLI
// ------------------------------------------------------------
export function renderStoryCamp(){
  AUDIO.playMusic('village');
  // cura completa all'arrivo
  if(!GAME._campHealed){ GAME.players.forEach(p=>longRest(p)); GAME._campHealed = true; }
  const nextCh = STORY.chapters[GAME.chapter]; // prossimo
  app().innerHTML = `
    <div class="screen active" style="padding-top:24px">
      <div id="campSprite"></div>
      <h2>Accampamento</h2>
      <p class="event-text">Hai completato "${curChapter().title}"! Ti accampi sotto le stelle, mangi qualcosa di caldo e recuperi tutte le forze. ${nextCh?`Domani ti aspetta: <span style="color:var(--gold)">${nextCh.title}</span>.`:''}</p>
      <div class="quest-panel" style="max-width:600px">
        <div class="quest-title">I tuoi eroi</div>
        ${GAME.players.map(p=>`<div class="quest-obj">${p.name} &middot; Livello ${p.level} &middot; PF ${p.hp}/${p.maxHp}</div>`).join('')}
        <div class="quest-obj" style="color:var(--gold)">Oro: ${GAME.gold} &middot; Pozioni: ${GAME.inventory.filter(i=>ITEMS[i]&&ITEMS[i].effect==='heal').length}</div>
      </div>
      <div class="row">
        <button class="btn green small" onclick="window.uiCampBuy()" ${GAME.gold<20?'disabled':''}>Compra una pozione (20 oro)</button>
      </div>
      <button class="btn" onclick="window.uiCampNext()">Avanti, al prossimo capitolo! &#9654;</button>
    </div>`;
  const el=$('#campSprite'); if(el) el.appendChild(createSpriteEl('locanda',4));
}

window.uiCampBuy = () => {
  if(GAME.gold<20){ showToast('Non hai abbastanza oro!'); return; }
  GAME.gold -= 20; GAME.inventory.push('pozione_cura');
  AUDIO.sfx('buy'); showToast('Pozione comprata!');
  R();
};
window.uiCampNext = () => {
  GAME.chapter++;
  GAME._campHealed = false;
  GAME.story = { node:0, branch:null, done:{} };
  GAME.state = 'storyChapter';
  saveGame(true);
  R();
};

// ------------------------------------------------------------
// EPILOGO
// ------------------------------------------------------------
export function renderStoryEpilogue(){
  AUDIO.playMusic('finale');
  const ch3 = STORY.chapters[2];
  const peace = GAME.ending === 'peace';
  const text = ch3.endings[peace ? 'peace' : 'fight'];
  app().innerHTML = `
    <div class="screen active" style="padding-top:30px">
      <h1>${peace ? 'Un Nuovo Amico' : 'La Valle e\' Salva!'}</h1>
      <div id="epSprite" style="margin:10px 0"></div>
      <div class="panel" style="text-align:center">
        <p class="event-text">${text}</p>
      </div>
      <p style="font-size:9px;color:var(--gold)">FINE &middot; Hai completato l'avventura, piccolo eroe!</p>
      <div class="row">
        <button class="btn" onclick="window.uiBackToTitle()">Torna all'inizio</button>
      </div>
    </div>`;
  const el=$('#epSprite'); if(el) el.appendChild(createSpriteEl(peace?'egg':'drago',7));
}
