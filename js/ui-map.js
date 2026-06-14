// ============================================================
// PICCOLI EROI 2 - Mappa dungeon, esplorazione, eventi
// ============================================================
import { GAME, addLog, showToast, saveGame, bestStatPlayer, alivePlayers, isStoria } from './state.js';
import { MONSTERS, ITEMS, STAT_NAMES } from './data.js';
import { d, mod, fmtMod, abilityCheck, shortRestHeal, explainRoll } from './rules.js';
import { createSpriteEl, getSpriteImage } from './sprites.js';
import { AUDIO } from './audio.js';
import { CHAPTERS, FINALE } from './campaign.js';
import { startCombat } from './ui-combat.js';
import { cineAction, narrator } from './cinematic.js';

const $ = sel => document.querySelector(sel);
const app = () => $('#app');
const R = () => window.render();

export function currentChapter(){ return CHAPTERS[GAME.chapter-1]; }
export function currentFloorData(){ return currentChapter().floors[GAME.currentFloor]; }

// Tavolozze ambienti per il rendering mappa
const AMBIENCE = {
  forest:   { floor:'#4a5a3a', floorTex:'#3f4f33', wall:'#2a3a22', wallHi:'#3a4a30', name:'verde' },
  cave:     { floor:'#5a5a4a', floorTex:'#50504a', wall:'#3a3a2a', wallHi:'#4a4a38', name:'roccia' },
  graveyard:{ floor:'#4a4a55', floorTex:'#404050', wall:'#2f2f3f', wallHi:'#3f3f4f', name:'pietra' },
  crypt:    { floor:'#44405a', floorTex:'#3a3650', wall:'#2a2640', wallHi:'#363050', name:'cripta' },
  mountain: { floor:'#5a4a42', floorTex:'#504038', wall:'#3a2a24', wallHi:'#4a3a30', name:'cenere' },
  lair:     { floor:'#5a3a32', floorTex:'#503028', wall:'#3a1f1a', wallHi:'#4a2c24', name:'lava' },
};

// Pool incontri casuali per capitolo
const RANDOM_POOLS = {
  1: ['goblin','kobold','lupo'],
  2: ['scheletro','zombi','pipistrello_gigante'],
  3: ['kobold_dragonico','orco_mercenario'],
};

// ------------------------------------------------------------
// INTRO / OUTRO CAPITOLO
// ------------------------------------------------------------
export function renderChapterIntro(){
  AUDIO.playMusic('dungeon');
  const ch = currentChapter();
  app().innerHTML = `
    <div class="screen active" style="padding-top:36px">
      <div class="chapter-banner">
        <div class="ch-num">${ch.subtitle.toUpperCase()}</div>
        <div class="ch-title">${ch.title}</div>
        <p class="event-text">${ch.intro}</p>
      </div>
      <div class="quest-panel">
        <div class="quest-title">Obiettivi</div>
        ${ch.objectives.map(o=>`<div class="quest-obj">&#9679; ${o}</div>`).join('')}
      </div>
      <div class="row">
        <button class="btn green" onclick="window.uiEnterDungeon()">Partiamo!</button>
        <button class="btn" onclick="GAME.state='village';window.render()">Non ancora...</button>
      </div>
    </div>`;
}

window.uiEnterDungeon = () => {
  GAME.inDungeon = true;
  if(!GAME.flags[`ch${GAME.chapter}_started`]){
    GAME.flags[`ch${GAME.chapter}_started`] = true;
    GAME.currentFloor = 0;
  }
  // se si rientra, riparti dal piano corrente
  findStart();
  addLog(`${currentChapter().title}: che l'avventura abbia inizio!`, 'gold');
  GAME.state = 'map';
  saveGame(true);
  R();
};

export function renderChapterOutro(){
  const ch = currentChapter();
  const o = GAME._outro || { title: ch.outroTitle, text: ch.outro };
  AUDIO.sfx('victory');
  app().innerHTML = `
    <div class="screen active" style="padding-top:36px">
      <div class="chapter-banner">
        <div class="ch-title" style="color:var(--green)">${o.title}</div>
        <p class="event-text">${o.text}</p>
      </div>
      <button class="btn green" onclick="window.uiOutroDone()">Torna a Borgoverde</button>
    </div>`;
}

window.uiOutroDone = () => {
  GAME._outro = null;
  GAME.inDungeon = false;
  if(GAME.quest==='ch3_done_fight' || GAME.quest==='ch3_done_peace'){
    GAME.state = 'village';
  } else {
    GAME.state = 'village';
  }
  saveGame(true);
  R();
};

// ------------------------------------------------------------
// MAPPA
// ------------------------------------------------------------
function findStart(){
  const fl = currentFloorData();
  for(let y=0;y<fl.map.length;y++){
    const x = fl.map[y].indexOf('S');
    if(x>=0){ GAME.partyPos = {x,y}; markVisited(x,y); return; }
  }
  GAME.partyPos = {x:1,y:1};
}

function visitKey(x,y){ return `${GAME.chapter}_${GAME.currentFloor}_${x}_${y}`; }
function doneKey(letter){ return `${GAME.chapter}_${GAME.currentFloor}_${letter}`; }

function markVisited(x,y){
  GAME.visited[visitKey(x,y)] = true;
  const fl = currentFloorData();
  [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],[-1,1],[1,-1]].forEach(([dx,dy])=>{
    const nx=x+dx, ny=y+dy;
    if(ny>=0 && ny<fl.map.length && nx>=0 && nx<fl.map[ny].length){
      GAME.visited[visitKey(nx,ny)] = true;
    }
  });
}
function isVisited(x,y){ return GAME.visited[visitKey(x,y)]; }

function getTile(x,y){
  const fl = currentFloorData();
  if(y<0 || y>=fl.map.length || x<0 || x>=fl.map[y].length) return '1';
  return fl.map[y][x];
}
function isWalkable(x,y){
  const t = getTile(x,y);
  return t!=='1' && t!=='0';
}
function isEventTile(t){ return /^[a-z]$/.test(t) || t==='B'; }

export function moveParty(dx,dy){
  if(GAME.state!=='map') return;
  const nx = GAME.partyPos.x+dx, ny = GAME.partyPos.y+dy;
  if(!isWalkable(nx,ny)) return;
  const t = getTile(nx,ny);
  AUDIO.sfx(t==='3' ? 'door' : 'step');
  GAME.partyPos = {x:nx,y:ny};
  markVisited(nx,ny);

  if(isEventTile(t) && !GAME.eventsDone[doneKey(t)]){
    const evt = currentFloorData().events[t];
    if(evt){ triggerEvent(t, evt); return; }
  }

  if(t==='X'){
    const ch = currentChapter();
    if(GAME.currentFloor < ch.floors.length-1){
      AUDIO.sfx('door');
      GAME.currentFloor++;
      findStart();
      addLog(`Avanzate verso: ${currentFloorData().name}`, 'info');
      showToast(currentFloorData().name);
      saveGame(true);
    }
  }

  // Incontro casuale (solo su pavimento semplice, max 4 per piano)
  const reKey = `re_${GAME.chapter}_${GAME.currentFloor}`;
  if(t==='2' && Math.random() < 0.05 && (GAME.flags[reKey]||0) < 4){
    GAME.flags[reKey] = (GAME.flags[reKey]||0) + 1;
    const pool = RANDOM_POOLS[GAME.chapter];
    const mId = pool[Math.floor(Math.random()*pool.length)];
    AUDIO.sfx('encounter');
    GAME._pendingEvent = { letter:null, evt:{ type:'combat', monsters:[mId],
      text:`Un ${MONSTERS[mId].name} vi tende un agguato!`, reward:{gold:d(6)} } };
    GAME.state = 'event'; R();
    return;
  }
  R();
}

function triggerEvent(letter, evt){
  GAME._pendingEvent = { letter, evt };
  switch(evt.type){
    case 'combat': case 'boss':
      AUDIO.sfx('encounter'); GAME.state='event'; break;
    case 'treasure':
      AUDIO.sfx('chest'); GAME.state='event'; break;
    case 'dialogue':
      GAME.eventsDone[doneKey(letter)] = true;
      GAME._dialogue = { speaker:evt.speaker, sprite:evt.sprite, text:evt.text, choices:evt.choices };
      GAME._dialogueBack = 'map';
      GAME.state = 'dialogue';
      break;
    case 'puzzle':
      AUDIO.sfx('door'); GAME._puzzle = { attempts:0, hintIdx:-1 }; GAME.state='puzzle'; break;
    case 'rest':
      AUDIO.sfx('rest'); GAME.state='restSpot'; break;
  }
  R();
}

// Pannello missione
function questPanel(){
  const ch = currentChapter();
  const fl = currentFloorData();
  const letters = Object.keys(fl.events||{});
  const done = letters.filter(l=>GAME.eventsDone[doneKey(l)]).length;
  return `<div class="quest-panel">
    <div class="quest-title">${ch.subtitle}: ${ch.title}</div>
    ${ch.objectives.map(o=>`<div class="quest-obj">&#9679; ${o}</div>`).join('')}
    <div class="quest-hint">&#10148; ${fl.name}: ${done}/${letters.length} luoghi scoperti. I "?" nascondono eventi, il "!" e\' un boss!</div>
  </div>`;
}

export function renderMap(){
  const fl = currentFloorData();
  const isLastFloor = GAME.currentFloor === currentChapter().floors.length-1;
  AUDIO.playMusic('dungeon');
  const cols = Math.max(...fl.map.map(r=>r.length));
  const tileSize = Math.min(40, Math.floor((window.innerWidth-24)/cols));

  const partyHtml = GAME.players.map((p,i)=>`
    <div class="combatant" onclick="GAME._sheetIdx=${i};GAME._sheetBack='map';GAME.state='sheet';window.render()" style="cursor:pointer">
      <div id="mapPl${i}" style="flex-shrink:0"></div>
      <span class="cname" style="color:${p.color}">${p.name} <span style="font-size:6px;color:var(--muted)">Liv ${p.level}</span></span>
      <div class="bars" style="min-width:110px">
        <div class="bar-wrap"><div class="bar-fill" style="width:${(p.hp/p.maxHp)*100}%;background:var(--hp)"></div>
        <span class="bar-text">PF ${p.hp}/${p.maxHp}</span></div>
        ${p.casterType!=='none' ? `<div style="font-size:6px;color:var(--mp);margin-top:2px">Slot: ${p.slots[0]} (liv1) ${p.slots[1]>0?`/ ${p.slots[1]} (liv2)`:''}</div>` : ''}
      </div>
    </div>`).join('');

  app().innerHTML = `
    <div class="screen active">
      <div class="row" style="width:100%;justify-content:space-between;max-width:720px">
        <h3>${fl.name}</h3>
        <div class="row">
          <span style="font-size:8px;color:var(--gold)">Oro: ${GAME.gold}</span>
          <button class="btn small blue" onclick="GAME._invBack='map';GAME.state='inventory';window.render()">Zaino</button>
          <button class="btn small accent" onclick="window.uiSaveGame()">Salva</button>
          <button class="btn small" onclick="window.uiLeaveDungeon()">Villaggio</button>
        </div>
      </div>
      <div class="map-container">
        <canvas id="mapCanvas" width="${cols*tileSize}" height="${fl.map.length*tileSize}"></canvas>
      </div>
      <div class="map-controls">
        <div class="dpad">
          <button class="dpad-btn dpad-up" onclick="window.uiMove(0,-1)" aria-label="Su">&#9650;</button>
          <button class="dpad-btn dpad-left" onclick="window.uiMove(-1,0)" aria-label="Sinistra">&#9664;</button>
          <div class="dpad-center"></div>
          <button class="dpad-btn dpad-right" onclick="window.uiMove(1,0)" aria-label="Destra">&#9654;</button>
          <button class="dpad-btn dpad-down" onclick="window.uiMove(0,1)" aria-label="Giu">&#9660;</button>
        </div>
        <p style="margin-top:6px;font-size:7px">Frecce o WASD da tastiera &middot; "?" = evento &middot; "!" = boss ${isLastFloor?'':'&middot; scale = piano successivo'}</p>
      </div>
      ${questPanel()}
      <div style="width:100%;max-width:720px">${partyHtml}</div>
      <div class="log" id="gameLog">${GAME.log.slice(-8).map(l=>`<div class="log-entry ${l.cls}">${l.text}</div>`).join('')}</div>
    </div>`;

  const canvas = $('#mapCanvas');
  if(canvas) drawDungeonMap(canvas, fl, tileSize);
  GAME.players.forEach((p,i)=>{ const el=$(`#mapPl${i}`); if(el) el.appendChild(createSpriteEl(p.sprite,2)); });
  const log = $('#gameLog'); if(log) log.scrollTop = log.scrollHeight;
}

window.uiMove = (dx,dy) => moveParty(dx,dy);
window.uiLeaveDungeon = () => {
  GAME.inDungeon = false;
  GAME.state = 'village';
  addLog('Tornate a Borgoverde a riprendere fiato.', 'info');
  saveGame(true);
  R();
};

function drawDungeonMap(canvas, fl, ts){
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const amb = AMBIENCE[fl.ambience] || AMBIENCE.cave;

  for(let y=0;y<fl.map.length;y++){
    for(let x=0;x<fl.map[y].length;x++){
      const t = fl.map[y][x];
      const tx = x*ts, ty = y*ts;
      if(!isVisited(x,y)){ ctx.fillStyle='#08081a'; ctx.fillRect(tx,ty,ts,ts); continue; }

      if(t!=='1' && t!=='0'){
        ctx.fillStyle = amb.floor; ctx.fillRect(tx,ty,ts,ts);
        ctx.fillStyle = amb.floorTex;
        const sx=(x*7+y*3)%5, sy=(y*7+x*3)%5;
        ctx.fillRect(tx+sx, ty+sy, ts/3, ts/3);
        ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.strokeRect(tx,ty,ts,ts);
      }
      if(t==='1'){
        ctx.fillStyle = amb.wall; ctx.fillRect(tx,ty,ts,ts);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(tx, ty+Math.floor(ts/3), ts, 1);
        ctx.fillRect(tx, ty+Math.floor(ts*2/3), ts, 1);
        const off = (y%2===0) ? 0 : Math.floor(ts/2);
        ctx.fillRect(tx+off, ty, 1, Math.floor(ts/3));
        ctx.fillRect(tx+off+Math.floor(ts/2), ty+Math.floor(ts/3), 1, Math.floor(ts/3));
        ctx.fillStyle = amb.wallHi; ctx.fillRect(tx,ty,ts,1);
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(tx,ty+ts-1,ts,1);
      }
      if(t==='0'){ ctx.fillStyle='#08081a'; ctx.fillRect(tx,ty,ts,ts); }
      if(t==='3'){
        ctx.fillStyle = 'rgba(245,197,66,0.18)'; ctx.fillRect(tx,ty,ts,ts);
        ctx.fillStyle = '#d4a44a';
        ctx.fillRect(tx,ty,2,2); ctx.fillRect(tx+ts-2,ty,2,2);
        ctx.fillRect(tx,ty+ts-2,2,2); ctx.fillRect(tx+ts-2,ty+ts-2,2,2);
      }
      if(t==='S'){ ctx.fillStyle='rgba(78,204,163,0.2)'; ctx.fillRect(tx+2,ty+2,ts-4,ts-4); }
      if(/^[a-z]$/.test(t)){
        const done = GAME.eventsDone[doneKey(t)];
        if(!done){
          ctx.fillStyle='rgba(245,197,66,0.15)'; ctx.fillRect(tx+2,ty+2,ts-4,ts-4);
          ctx.fillStyle='#f5c542';
          ctx.font=`bold ${Math.floor(ts*0.55)}px serif`;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText('?', tx+ts/2, ty+ts/2);
        } else {
          ctx.fillStyle='rgba(100,100,100,0.15)'; ctx.fillRect(tx+2,ty+2,ts-4,ts-4);
        }
      }
      if(t==='B' && !GAME.eventsDone[doneKey('B')]){
        ctx.fillStyle='rgba(233,69,96,0.2)'; ctx.fillRect(tx+1,ty+1,ts-2,ts-2);
        ctx.fillStyle='#e94560';
        ctx.font=`bold ${Math.floor(ts*0.6)}px serif`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('!', tx+ts/2, ty+ts/2);
        ctx.strokeStyle='#e94560'; ctx.lineWidth=2;
        ctx.strokeRect(tx+1,ty+1,ts-2,ts-2); ctx.lineWidth=1;
      }
      if(t==='X'){
        ctx.fillStyle='rgba(126,200,227,0.2)'; ctx.fillRect(tx+2,ty+2,ts-4,ts-4);
        for(let s=0;s<4;s++){
          ctx.fillStyle=`rgba(126,200,227,${0.3+s*0.15})`;
          ctx.fillRect(tx+4+s*2, ty+3+s*Math.floor((ts-6)/4), ts-8-s*4, Math.floor((ts-6)/4)-1);
        }
      }
    }
  }
  // Party
  const {x:px, y:py} = GAME.partyPos;
  const leader = GAME.players[0];
  if(leader){
    const img = getSpriteImage(leader.sprite, ts);
    if(img) ctx.drawImage(img, px*ts+Math.floor((ts-img.width)/2), py*ts+Math.floor((ts-img.height)/2));
    ctx.strokeStyle='#4ecca3'; ctx.lineWidth=2;
    ctx.strokeRect(px*ts+1, py*ts+1, ts-2, ts-2); ctx.lineWidth=1;
  }
}

// ------------------------------------------------------------
// SCHERMATA EVENTO (combat pre-screen, tesori)
// ------------------------------------------------------------
export function renderEvent(){
  const {letter, evt} = GAME._pendingEvent;
  let html = `<div class="screen active"><div class="event-scene">`;
  if(evt.monsters) html += `<div class="row" id="evtSprites" style="margin:12px 0"></div>`;
  if(evt.type==='treasure') html += `<div id="evtChest" style="margin:12px 0"></div>`;
  html += `<div class="event-text">${evt.text.replace(/\n/g,'<br>')}</div>`;

  if(evt.type==='combat' || evt.type==='boss'){
    if(evt.finale){
      // Scelta finale davanti a Vermilius
      const best = bestStatPlayer('CAR');
      html += FINALE.preChoices.map((c,i)=>{
        const tag = c.check ? ` <span class="check-tag">[${best.name}: prova di ${STAT_NAMES[c.check.stat]}, difficolta\' ${c.check.dc}]</span>` : '';
        return `<button class="choice-btn" onclick="window.uiFinaleChoice('${c.id}')">${c.label}${tag}</button>`;
      }).join('');
    } else {
      html += `<button class="btn accent" onclick="window.uiFight()">Combatti!</button>`;
    }
  } else if(evt.type==='treasure'){
    const best = bestStatPlayer(evt.check.stat);
    html += `<p style="font-size:8px;color:var(--blue)">Prova di ${evt.check.label} (${STAT_NAMES[evt.check.stat]}), difficolta\' ${evt.check.dc}. Ci prova ${best.name} (${fmtMod(mod(best.stats[evt.check.stat]))}).</p>
      <div class="row">
        <button class="btn green" onclick="window.uiTreasure()">Tenta!</button>
        <button class="btn" onclick="window.uiSkipEvent()">Lascia stare</button>
      </div>`;
  }
  html += `</div></div>`;
  app().innerHTML = html;

  if(evt.monsters){
    const el = $('#evtSprites');
    if(el) evt.monsters.forEach(mId=>{
      const m = MONSTERS[mId];
      if(m) el.appendChild(createSpriteEl(m.sprite, 5));
    });
  }
  if(evt.type==='treasure'){ const el=$('#evtChest'); if(el) el.appendChild(createSpriteEl('chest',5)); }
}

window.uiFight = () => {
  const {letter, evt} = GAME._pendingEvent;
  startCombat(evt.monsters, {
    isBoss: evt.type==='boss',
    eventLetter: letter,
    rewardGold: (evt.reward && evt.reward.gold) || 0,
    victoryText: evt.victoryText,
  });
};

window.uiSkipEvent = () => { GAME.state='map'; R(); };

window.uiTreasure = () => {
  const {letter, evt} = GAME._pendingEvent;
  const best = bestStatPlayer(evt.check.stat);
  const res = abilityCheck(best, evt.check.stat, evt.check.dc);
  const outcome = res.success ? evt.success : evt.fail;
  const need = Math.max(2, Math.min(20, evt.check.dc - (res.total - res.roll.result)));
  // Overlay del dado per la prova di caratteristica
  cineAction({
    actor:{sprite:best.sprite, name:best.name, color:best.color},
    target:null,
    intro: `${best.name} tenta una prova di ${evt.check.label}... ${narrator('checkIntro', best.name)}`,
    stakes: `Esce <b style="color:var(--gold)">${need} o piu'</b> e ${best.name} ci riesce!`,
    dice:{result:res.roll.result, rolls:res.roll.rolls, advState:res.roll.advState||'normal'},
    breakdown: isStoria() ? null : `${res.roll.result} ${fmtMod(res.modifier)} ${STAT_NAMES[evt.check.stat]}${res.prof?` +${res.prof} comp`:''} = ${res.total}`,
    compare: isStoria() ? null : `difficolta' ${evt.check.dc}`,
    outcome: res.success ? 'success' : 'fail',
    outcomeText: res.success ? 'RIUSCITO!' : 'FALLITO!',
    result: outcome.text,
    sfxRoll:'dice',
    sfxOutcome: res.success ? 'chest' : 'damage',
  }, ()=> applyTreasure(letter, evt, res, outcome));
};

function applyTreasure(letter, evt, res, outcome){
  const best = bestStatPlayer(evt.check.stat);
  let text = `<span style="color:var(--blue)">${best.name}: ${explainRoll(res,{stat:STAT_NAMES[evt.check.stat]})}</span><br><br>${outcome.text}`;

  // Caso speciale: il tesoro e' un MIMIC (o nasconde un combattimento)
  if(outcome.monsters){
    GAME.eventsDone[doneKey2(letter)] = true;
    GAME._pendingEvent = { letter:null, evt:{ type:'combat', monsters:outcome.monsters, text,
      reward:{gold:(outcome.gold||0)} } };
    GAME._mimicSurprise = res.success ? 'players' : 'enemies';
    GAME.state = 'event'; R();
    return;
  }

  if(res.success){
    if(outcome.items) outcome.items.forEach(id=>GAME.inventory.push(id));
    if(outcome.gold){ GAME.gold += outcome.gold; GAME.statsTracker.goldEarned += outcome.gold; }
    GAME.eventsDone[doneKey2(letter)] = true;
    addLog(`${best.name} riesce nella prova di ${evt.check.label}!`, 'gold');
  } else {
    if(outcome.dmg){ best.hp = Math.max(1, best.hp - outcome.dmg); }
    GAME.eventsDone[doneKey2(letter)] = true;
    addLog(`${best.name} fallisce la prova di ${evt.check.label}...`, 'dmg');
  }

  GAME._resultScreen = {
    text,
    items: res.success ? (outcome.items||[]) : [],
    gold: res.success ? (outcome.gold||0) : 0,
    back: 'map',
  };
  GAME.state = 'eventResult'; R();
}

function doneKey2(letter){ return letter ? `${GAME.chapter}_${GAME.currentFloor}_${letter}` : `_none_${Math.random()}`; }

export function renderEventResult(){
  const r = GAME._resultScreen;
  app().innerHTML = `
    <div class="screen active" style="padding-top:30px">
      <div class="event-scene">
        <div class="event-text">${r.text}</div>
        ${r.items.length ? `<p style="font-size:9px;color:var(--gold)">Ottenuti: ${r.items.map(id=>ITEMS[id].name).join(', ')}</p>` : ''}
        ${r.gold ? `<p style="font-size:9px;color:var(--gold)">+${r.gold} monete d'oro!</p>` : ''}
        <button class="btn green" onclick="GAME.state=GAME._resultScreen.back||'map';window.render()">Continua</button>
      </div>
    </div>`;
}

// ------------------------------------------------------------
// FINALE: scelte davanti a Vermilius
// ------------------------------------------------------------
window.uiFinaleChoice = (choiceId) => {
  const {letter, evt} = GAME._pendingEvent;
  if(choiceId==='fight'){
    startCombat(evt.monsters, { isBoss:true, finale:true, eventLetter:letter, victoryText:evt.victoryText });
    return;
  }
  if(choiceId==='gem'){
    const best = bestStatPlayer('CAR');
    AUDIO.sfx('dice');
    const res = abilityCheck(best, 'CAR', FINALE.preChoices.find(c=>c.id==='gem').check.dc);
    addLog(`${best.name}: ${explainRoll(res,{stat:'Carisma'})}`, res.success?'gold':'dmg');
    if(res.success){
      resolvePeace(letter);
    } else {
      GAME._resultScreen = { text:`<span style="color:var(--blue)">${best.name}: ${explainRoll(res,{stat:'Carisma'})}</span><br><br>${FINALE.gemFail.text}`, items:[], gold:0, back:'finaleFightStart' };
      GAME._finaleFailed = true;
      GAME.state = 'eventResult'; R();
    }
  }
};

export function resolvePeace(letter){
  // Finale di pace: niente combattimento, XP pieni per la saggezza dimostrata
  const dragoXp = MONSTERS.drago_rosso.xp;
  GAME.players.forEach(p=>{ p.xp += dragoXp; });
  GAME.eventsDone[doneKey2(letter||'B')] = true;
  GAME.ending = 'peace';
  GAME.quest = 'ch3_done_peace';
  GAME._outro = { title: FINALE.victoryPeace.title, text: FINALE.gemSuccess.text + '<br><br>' + FINALE.victoryPeace.text };
  AUDIO.sfx('victory');
  saveGame(true);
  // level up check, poi outro
  import('./ui-core.js').then(m => m.maybeLevelUp('chapterOutro'));
}

// Avvio combattimento finale dopo fallimento della gemma
export function startFinaleFight(){
  const fl = currentFloorData();
  const evt = fl.events['B'];
  startCombat(evt.monsters, { isBoss:true, finale:true, finaleFailed:true, eventLetter:'B', victoryText:evt.victoryText });
}

// ------------------------------------------------------------
// PUZZLE (enigmi)
// ------------------------------------------------------------
export function renderPuzzle(){
  const {letter, evt} = GAME._pendingEvent;
  const pz = GAME._puzzle;
  app().innerHTML = `
    <div class="screen active" style="padding-top:30px">
      <div class="event-scene">
        <h2 style="color:var(--blue)">Enigma!</h2>
        <div class="event-text">${evt.text.replace(/\n/g,'<br>')}</div>
        ${pz.hintIdx>=0 ? `<p style="font-size:8px;color:var(--gold)">Indizio: ${evt.hints[Math.min(pz.hintIdx, evt.hints.length-1)]}</p>` : ''}
        <div class="row" style="margin:10px 0">
          <input id="pzAnswer" placeholder="La risposta..." maxlength="30" onkeydown="if(event.key==='Enter')window.uiPuzzleTry()">
          <button class="btn green" onclick="window.uiPuzzleTry()">Rispondi</button>
        </div>
        <div class="row">
          ${evt.hints && pz.hintIdx < evt.hints.length-1 ? `<button class="btn small blue" onclick="GAME._puzzle.hintIdx++;window.render()">Chiedi un indizio</button>` : ''}
          ${pz.attempts>=2 ? `<button class="btn small purple" onclick="window.uiPuzzleForce()">Prova di Intelligenza (difficolta\' 13)</button>` : ''}
          <button class="btn small" onclick="GAME.state='map';window.render()">Torna indietro (riprova dopo)</button>
        </div>
      </div>
    </div>`;
  setTimeout(()=>{ const i=$('#pzAnswer'); if(i) i.focus(); }, 50);
}

window.uiPuzzleTry = () => {
  const {letter, evt} = GAME._pendingEvent;
  const ans = ($('#pzAnswer').value||'').trim().toLowerCase();
  if(!ans) return;
  const ok = (evt.accepted||[evt.answer]).some(a => ans === a.toLowerCase());
  if(ok){ puzzleSolved(letter, evt); }
  else {
    GAME._puzzle.attempts++;
    if(GAME._puzzle.hintIdx < 0) GAME._puzzle.hintIdx = 0;
    AUDIO.sfx('attack_miss');
    showToast('Mmm... non e\' questa. Riprova!');
    R();
  }
};

window.uiPuzzleForce = () => {
  const {letter, evt} = GAME._pendingEvent;
  const best = bestStatPlayer('INT');
  AUDIO.sfx('dice');
  const res = abilityCheck(best, 'INT', 13);
  addLog(`${best.name} ragiona sull'enigma: ${explainRoll(res,{stat:'Intelligenza'})}`, res.success?'gold':'dmg');
  if(res.success){ puzzleSolved(letter, evt, `${best.name} risolve l'enigma con un lampo di genio! (La risposta era: "${evt.answer}")`); }
  else { showToast(`${best.name} si gratta la testa... niente. Riprovate!`); R(); }
};

function puzzleSolved(letter, evt, extraText){
  AUDIO.sfx('puzzle');
  const rw = evt.reward;
  if(rw.items) rw.items.forEach(id=>GAME.inventory.push(id));
  if(rw.gold){ GAME.gold += rw.gold; GAME.statsTracker.goldEarned += rw.gold; }
  GAME.eventsDone[doneKey2(letter)] = true;
  addLog('Enigma risolto!', 'gold');
  GAME._resultScreen = {
    text: (extraText? extraText+'<br><br>' : '') + rw.text,
    items: rw.items||[], gold: rw.gold||0, back:'map',
  };
  GAME.state = 'eventResult'; R();
}

// ------------------------------------------------------------
// RIPOSO BREVE (radure sicure)
// ------------------------------------------------------------
export function renderRestSpot(){
  const {letter, evt} = GAME._pendingEvent;
  app().innerHTML = `
    <div class="screen active" style="padding-top:24px">
      <div id="restSprite"></div>
      <h2 style="color:var(--green)">Riposo Breve</h2>
      <div class="event-text">${evt.text}</div>
      <p style="font-size:8px;color:var(--blue)">Ogni eroe puo\' spendere Dadi Vita per recuperare PF (1 dado vita + il modificatore di Costituzione). I Dadi Vita tornano col riposo lungo.</p>
      <div style="width:100%;max-width:720px">
        ${GAME.players.map((p,i)=>`
          <div class="combatant">
            <span class="cname" style="color:${p.color}">${p.name}</span>
            <div class="bars" style="min-width:110px">
              <div class="bar-wrap"><div class="bar-fill" style="width:${(p.hp/p.maxHp)*100}%;background:var(--hp)"></div>
              <span class="bar-text">PF ${p.hp}/${p.maxHp}</span></div>
            </div>
            <span style="font-size:7px;color:var(--muted)">Dadi Vita: ${p.hitDiceLeft}/${p.level}</span>
            <button class="btn small green" onclick="window.uiSpendHitDie(${i})" ${p.hitDiceLeft<=0||p.hp>=p.maxHp?'disabled':''}>1d${p.hitDie}+${Math.max(0,mod(p.stats.COS))}</button>
          </div>`).join('')}
      </div>
      <button class="btn" onclick="window.uiRestDone()">Riprendiamo il cammino</button>
    </div>`;
  const el=$('#restSprite'); if(el) el.appendChild(createSpriteEl('fontana',4));
}

window.uiSpendHitDie = (i) => {
  const p = GAME.players[i];
  const result = shortRestHeal(p);
  if(result){
    AUDIO.sfx('heal');
    // Canzone di Riposo del bardo: +1d6 extra
    let extra = 0;
    const bard = GAME.players.find(b=>b.classId==='bardo' && b.level>=2 && b.hp>0);
    if(bard && p.hp < p.maxHp){
      extra = d(6);
      p.hp = Math.min(p.maxHp, p.hp+extra);
    }
    showToast(`${p.name} recupera ${result.healed}${extra?`+${extra} (musica del bardo)`:''} PF!`);
    addLog(`${p.name} spende un Dado Vita: +${result.healed}${extra?`+${extra}`:''} PF.`, 'heal');
  }
  R();
};

window.uiRestDone = () => {
  const {letter} = GAME._pendingEvent;
  // il riposo resta riutilizzabile? No: una volta per partita
  GAME.eventsDone[doneKey2(letter)] = true;
  GAME.state='map';
  saveGame(true);
  R();
};
