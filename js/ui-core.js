// ============================================================
// PICCOLI EROI 2 - UI core: titolo, tutorial, creazione eroi,
// villaggio, dialoghi, negozio, schede, level up, epiloghi
// ============================================================
import { GAME, createPlayer, addLog, showToast, saveGame, loadGame, hasSave, deleteSave,
         resetGame, alivePlayers, checkLevelUps, layPoolMax, rageUsesMax, bardicUsesMax,
         hasFeature, speciesTraits, isSolo, partyWord, partyLabel, isStoria,
         exportSaveCode, importSaveCode, SETTINGS, setFontScale } from './state.js';
import { CLASSES, SPECIES, SPELLS, ITEMS, MONSTERS, STAT_NAMES } from './data.js';
import { mod, fmtMod, profBonus, levelUp, longRest, rollDice, XP_TABLE, MAX_LEVEL, maxSlots, d } from './rules.js';
import { createSpriteEl } from './sprites.js';
import { AUDIO } from './audio.js';
import { VILLAGE, SHOP_STOCK, MAYOR_DIALOGUES, CHAPTERS, PROLOGUE, CAMPAIGN_TITLE,
         TAVERN_GOSSIP, BOUNTIES } from './campaign.js';

const $ = sel => document.querySelector(sel);
const app = () => $('#app');
const R = () => window.render();

// ------------------------------------------------------------
// TITOLO
// ------------------------------------------------------------
export function renderTitle(){
  AUDIO.playMusic('title');
  app().innerHTML = `
    <div class="screen active" style="padding-top:24px">
      <h1>Piccoli Eroi 2</h1>
      <p class="subtitle">~ ${CAMPAIGN_TITLE} ~</p>
      <div id="titleSprite" style="margin:12px 0"></div>
      <p style="font-size:9px;color:var(--gold);text-align:center">Scegli come giocare:</p>
      <div class="grid-2" style="max-width:640px">
        <div class="village-card" onclick="window.uiChooseMode('storia')" style="border-color:var(--green)">
          <div class="vname" style="color:var(--green);font-size:11px">&#128214; Avventura Storia</div>
          <div class="vdesc" style="line-height:1.7">Per chi non ha mai giocato a un gioco di ruolo. Tutto raccontato e spiegato passo passo, scelte chiare, niente numeri complicati. Divertente e rilassato!</div>
        </div>
        <div class="village-card" onclick="window.uiChooseMode('classica')" style="border-color:var(--blue)">
          <div class="vname" style="color:var(--blue);font-size:11px">&#9876; Modalita' Classica</div>
          <div class="vdesc" style="line-height:1.7">Per chi conosce i giochi di ruolo. Regole vere (dado a 20 facce, caratteristiche, magie), esplorazione libera, scelta della difficolta'.</div>
        </div>
      </div>
      <div class="row" style="margin-top:10px;gap:8px">
        <button class="btn accent small" onclick="window.uiContinue()" ${hasSave()?'':'disabled'}>Continua</button>
        <button class="btn blue small" onclick="window.uiShowLoadCode()">Riprendi con un codice</button>
        <button class="btn small" onclick="window.uiSettings()">Impostazioni</button>
        <button class="btn small" onclick="window.uiInstall()">Installa come app</button>
      </div>
      <div class="footer">Creato con amore per piccoli avventurieri</div>
    </div>`;
  const spriteDiv = $('#titleSprite');
  if(spriteDiv){
    const row = document.createElement('div');
    row.className = 'row';
    ['guerriero','barbaro','maga','ladro','chierico','ranger','bardo','paladino'].forEach(c=>row.appendChild(createSpriteEl(c,3)));
    spriteDiv.appendChild(row);
  }
}

window.uiChooseMode = (mode) => {
  deleteSave(); resetGame();
  GAME.mode = mode;
  if(mode==='classica'){
    GAME.state = 'difficulty';
  } else {
    GAME.difficulty = 'facile';
    GAME.state = 'prologue'; GAME._proStep = 0;
  }
  R();
};

window.uiContinue = () => { if(loadGame()){ R(); } else { showToast('Nessuna partita salvata.'); } };

// --- Selezione difficolta' (solo Classica) ---
export function renderDifficulty(){
  app().innerHTML = `
    <div class="screen active" style="padding-top:40px">
      <h2>Scegli la Difficolta'</h2>
      <p style="font-size:8px;color:var(--muted)">Puoi sempre ricominciare con un'altra. Influisce su quanto sono duri i nemici.</p>
      <div class="col" style="gap:10px;margin-top:14px;width:100%;max-width:420px">
        <button class="btn green" onclick="window.uiSetDiff('facile')">Facile &middot; nemici piu' deboli</button>
        <button class="btn gold" onclick="window.uiSetDiff('normale')">Normale &middot; equilibrato</button>
        <button class="btn accent" onclick="window.uiSetDiff('difficile')">Difficile &middot; nemici tosti</button>
      </div>
      <button class="btn small" style="margin-top:14px" onclick="GAME.state='title';window.render()">Indietro</button>
    </div>`;
}
window.uiSetDiff = (diff) => { GAME.difficulty = diff; GAME.state='prologue'; GAME._proStep=0; R(); };

// --- Overlay: mostra codice partita ---
window.uiShowCode = () => {
  const code = exportSaveCode();
  const overlay = document.createElement('div');
  overlay.className = 'help-overlay';
  overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div class="help-panel">
      <h2>&#128190; Salva la partita</h2>
      <p style="font-size:8px;line-height:1.7;color:var(--text)">Il tuo salvataggio e' tutto dentro questo codice. Segui i 3 passi:</p>
      <div class="help-section" style="border-left-color:var(--green)">
        <p style="font-size:8px;line-height:1.9"><b>1.</b> Premi <b>"Copia il codice"</b> qui sotto.<br>
        <b>2.</b> Incollalo dove non lo perdi: una <b>nota sul telefono</b> o una <b>mail a te stesso</b>.<br>
        <b>3.</b> Per riprendere, apri il gioco, vai alla schermata iniziale, premi <b>"Riprendi con un codice"</b> e incolla. Funziona anche su un altro dispositivo!</p>
      </div>
      <textarea id="saveCodeBox" readonly style="width:100%;height:120px;margin:10px 0;font-size:8px;background:var(--bg);color:var(--green);border:2px solid var(--gold);word-break:break-all;resize:none">${code}</textarea>
      <div class="row">
        <button class="btn green" id="copyCodeBtn">Copia il codice</button>
        <button class="btn" onclick="this.closest('.help-overlay').remove()">Chiudi</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const box = overlay.querySelector('#saveCodeBox');
  const btn = overlay.querySelector('#copyCodeBtn');
  if(btn) btn.addEventListener('click', ()=>{
    box.select();
    try { navigator.clipboard.writeText(code); } catch(e){ try{ document.execCommand('copy'); }catch(_){} }
    btn.textContent = 'Copiato!';
  });
};

// --- Overlay: incolla codice per caricare ---
window.uiShowLoadCode = () => {
  const overlay = document.createElement('div');
  overlay.className = 'help-overlay';
  overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div class="help-panel">
      <h2>Riprendi con un Codice</h2>
      <p style="font-size:8px;line-height:1.7">Incolla qui il codice della tua partita per riprenderla esattamente da dove eri.</p>
      <textarea id="loadCodeBox" placeholder="Incolla il codice (inizia con PE2-...)" style="width:100%;height:120px;margin:10px 0;font-size:8px;background:var(--bg);color:var(--text);border:2px solid var(--gold);word-break:break-all;resize:none"></textarea>
      <div id="loadCodeMsg" style="font-size:8px;color:var(--accent);min-height:14px"></div>
      <div class="row">
        <button class="btn green" id="doLoadBtn">Riprendi la partita</button>
        <button class="btn" onclick="this.closest('.help-overlay').remove()">Annulla</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#doLoadBtn').addEventListener('click', ()=>{
    const val = overlay.querySelector('#loadCodeBox').value;
    const res = importSaveCode(val);
    if(res.ok){ overlay.remove(); AUDIO.sfx('levelup'); showToast('Partita ripresa!'); R(); }
    else { overlay.querySelector('#loadCodeMsg').textContent = res.error || 'Codice non valido.'; }
  });
};

// --- Overlay: come installare come app ---
window.uiInstall = () => {
  const overlay = document.createElement('div');
  overlay.className = 'help-overlay';
  overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div class="help-panel">
      <h2>Installa come app</h2>
      <p style="font-size:8px;line-height:1.7;color:var(--text)">Puoi aggiungere Piccoli Eroi alla schermata del tuo dispositivo: si aprira' a tutto schermo come una vera app, anche senza internet!</p>
      <div class="help-section">
        <div class="hl">&#63743; iPhone / iPad (Safari)</div>
        <p>Tocca il pulsante <b>Condividi</b> (il quadrato con la freccia in su), poi scorri e scegli <b>"Aggiungi a Home"</b>. Conferma con "Aggiungi".</p>
      </div>
      <div class="help-section">
        <div class="hl">&#129302; Android (Chrome)</div>
        <p>Tocca i <b>tre puntini</b> in alto a destra, poi <b>"Installa app"</b> (o "Aggiungi a schermata Home"). A volte compare da solo un banner "Installa".</p>
      </div>
      <div class="help-section">
        <div class="hl">&#128187; Computer (Windows / macOS / Ubuntu)</div>
        <p>Con <b>Chrome o Edge</b>: clicca l'icona <b>"Installa"</b> nella barra degli indirizzi (a destra, una piccola schermo con freccia), oppure menu tre puntini &rarr; "Installa Piccoli Eroi". Su Safari Mac: menu Archivio &rarr; "Aggiungi al Dock".</p>
      </div>
      <div class="help-section" style="border-left-color:var(--green)">
        <div class="hl" style="color:var(--green)">Aggiornamenti e refresh</div>
        <p>Non devi fare refresh manuali: finche' sei online, il gioco carica sempre l'ultima versione da solo. Se esce un aggiornamento mentre giochi, compare in basso un pulsante "Aggiorna". Offline, usi l'ultima versione scaricata.</p>
      </div>
      <div class="help-section" style="border-left-color:var(--gold)">
        <div class="hl" style="color:var(--gold)">Salvataggi (importante!)</div>
        <p>La partita si salva da sola sul dispositivo. Pero' un telefono puo' cancellare questi dati dopo un po' o se pulisci il browser. Per non perdere mai i progressi, ogni tanto apri il menu <b>?</b> e premi <b>"Mostra codice salvataggio"</b>, poi <b>Copia</b> il codice e tienilo da parte (in una nota o una mail). Con quel codice riprendi su qualsiasi dispositivo.</p>
        <button class="btn small green" style="margin-top:8px" onclick="this.closest('.help-overlay').remove();window.uiShowCode()">Mostra codice salvataggio</button>
      </div>
      <button class="btn" onclick="this.closest('.help-overlay').remove()" style="margin-top:10px;width:100%">Ho capito!</button>
    </div>`;
  document.body.appendChild(overlay);
};

// --- Overlay: impostazioni (dimensione font) ---
window.uiSettings = () => {
  const overlay = document.createElement('div');
  overlay.className = 'help-overlay';
  overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
  const render = () => `
    <div class="help-panel">
      <h2>Impostazioni</h2>
      <div class="help-section">
        <div class="hl">Dimensione del testo</div>
        <p>Rendi piu' grandi o piu' piccole le scritte delle scene e dei dialoghi.</p>
        <div class="row" style="margin-top:10px">
          <button class="btn" id="fontMinus">A -</button>
          <span style="font-size:12px;color:var(--gold);width:60px;text-align:center">${Math.round(SETTINGS.fontScale*100)}%</span>
          <button class="btn" id="fontPlus">A +</button>
        </div>
      </div>
      <button class="btn green" style="margin-top:10px;width:100%" onclick="this.closest('.help-overlay').remove()">Fatto</button>
    </div>`;
  overlay.innerHTML = render();
  document.body.appendChild(overlay);
  const wire = () => {
    overlay.querySelector('#fontMinus').onclick = ()=>{ setFontScale(SETTINGS.fontScale-0.1); overlay.innerHTML = render(); wire(); };
    overlay.querySelector('#fontPlus').onclick = ()=>{ setFontScale(SETTINGS.fontScale+0.1); overlay.innerHTML = render(); wire(); };
  };
  wire();
};

// ------------------------------------------------------------
// PROLOGO
// ------------------------------------------------------------
export function renderPrologue(){
  AUDIO.playMusic('title');
  const i = GAME._proStep || 0;
  app().innerHTML = `
    <div class="screen active" style="padding-top:50px">
      <div class="tut-step">
        <div class="tut-dots">${PROLOGUE.map((_,k)=>`<div class="tut-dot ${k===i?'active':''}"></div>`).join('')}</div>
        <div class="tut-text" style="font-size:10px;line-height:2.2">${PROLOGUE[i]}</div>
        <div class="row" style="margin-top:20px">
          ${i<PROLOGUE.length-1
            ? `<button class="btn green" onclick="GAME._proStep++;window.render()">Avanti</button>`
            : `<button class="btn green" onclick="window.uiAfterPrologue()">Continua</button>`}
          <button class="btn small" onclick="window.uiAfterPrologue()">Salta</button>
        </div>
      </div>
    </div>`;
}

// In Storia salta il tutorial tecnico (si impara giocando); in Classica lo mostra
window.uiAfterPrologue = () => {
  if(isStoria()){ GAME.state = 'storyHow'; GAME._howStep = 0; }
  else { GAME.state = 'tutorial'; GAME._tutStep = 0; }
  R();
};

// --- Mini-guida amichevole per la modalita' Storia (3 schermate) ---
const STORY_HOW = [
  { title:'Come si gioca', sprite:'guerriero',
    text:'Vivrai un\'avventura raccontata passo passo. Leggi cosa succede e tocca <span class="tut-green">Avanti</span> per proseguire. A volte dovrai <span class="tut-highlight">scegliere</span> cosa fare: ogni scelta cambia la storia!' },
  { title:'Il Dado Magico', sprite:'maga',
    text:'Quando l\'esito e\' incerto, lancerai un <span class="tut-highlight">dado</span>! Prima ti diro\' sempre cosa serve (per esempio "esce 8 o piu\' e colpisci!"), poi tocca il pulsante <span class="tut-green">LANCIA IL DADO</span> e... incrocia le dita!' },
  { title:'I Combattimenti', sprite:'goblin',
    text:'Quando incontri un mostro, scegli con tre semplici pulsanti: <span class="tut-red">Attacca</span>, <span class="tut-blue">Mossa Speciale</span> o <span class="tut-green">Pozione</span>. Niente paura: qui non si perde mai davvero, e se cadi ti rialzi subito. Divertiti!' },
];
export function renderStoryHow(){
  const idx = GAME._howStep || 0;
  const step = STORY_HOW[idx];
  app().innerHTML = `
    <div class="screen active">
      <div class="tut-step">
        <div class="tut-dots">${STORY_HOW.map((_,i)=>`<div class="tut-dot ${i===idx?'active':''}"></div>`).join('')}</div>
        <div id="howSprite" style="margin:12px 0"></div>
        <div class="tut-title">${step.title}</div>
        <div class="tut-text">${step.text}</div>
        <div class="row" style="margin-top:16px">
          ${idx>0 ? `<button class="btn small" onclick="GAME._howStep--;window.render()">Indietro</button>` : ''}
          ${idx<STORY_HOW.length-1
            ? `<button class="btn green" onclick="GAME._howStep++;window.render()">Avanti</button>`
            : `<button class="btn green" onclick="GAME.state='setup';window.render()">Crea il tuo eroe!</button>`}
        </div>
      </div>
    </div>`;
  const el=$('#howSprite'); if(el) el.appendChild(createSpriteEl(step.sprite,5));
}

// ------------------------------------------------------------
// TUTORIAL (regole del gioco di ruolo spiegate semplici)
// ------------------------------------------------------------
const TUTORIAL_STEPS = [
  { title:'Benvenuti, Piccoli Eroi!', sprite:'guerriero',
    text:'Questo gioco usa le vere regole dei grandi giochi di ruolo da tavolo, spiegate in modo semplice. Imparerai a tirare dadi, lanciare incantesimi e fare scelte da eroe!' },
  { title:'Il Dado a 20 Facce',
    text:'Quasi tutto si decide con un <span class="tut-highlight">d20</span>: tiri il dado e aggiungi i tuoi bonus. Se il totale raggiunge la difficolta\', ce l\'hai fatta!',
    example:'<b>Tiro = d20 + modificatore + competenza</b><br><br>Esempio: attacchi un goblin (Classe Armatura 13).<br>Esce <span class="tut-highlight">11</span>, +3 di Forza, +2 di competenza = <span class="tut-green">16</span>. Colpito!<br><br><span class="tut-highlight">20 naturale</span> = CRITICO: dadi di danno doppi!<br><span class="tut-red">1 naturale</span> = mancato di sicuro. Capita anche ai migliori.' },
  { title:'Vantaggio e Svantaggio',
    text:'La regola piu\' bella dei giochi di ruolo! In situazioni favorevoli hai <span class="tut-green">VANTAGGIO</span>: tiri DUE d20 e tieni il migliore. In situazioni difficili hai <span class="tut-red">SVANTAGGIO</span>: tieni il peggiore.',
    example:'<span class="tut-green">Vantaggio</span>: attacchi di sorpresa, nemico a terra, un amico ti aiuta...<br><span class="tut-red">Svantaggio</span>: sei avvelenato, spaventato, il nemico si difende...<br><br>Se hai entrambi, si annullano: tiro normale.' },
  { title:'Le 6 Caratteristiche',
    text:'Ogni eroe ha 6 caratteristiche. Il numero conta poco: conta il <span class="tut-highlight">MODIFICATORE</span> (tra parentesi), che aggiungi ai tiri.',
    example:'<span class="tut-red">Forza</span> - colpi potenti in mischia<br><span class="tut-green">Destrezza</span> - agilita\', archi, schivare<br><span class="tut-red">Costituzione</span> - resistenza e punti ferita<br><span class="tut-blue">Intelligenza</span> - magia arcana ed enigmi<br><span class="tut-highlight">Saggezza</span> - attenzione e cure<br><span class="tut-red">Carisma</span> - convincere e ispirare<br><br>Punteggio 16 = modificatore +3. Punteggio 8 = modificatore -1.' },
  { title:'Tiri Salvezza',
    text:'Quando qualcosa di brutto ti capita (veleno, soffio di fuoco, paura...), fai un <span class="tut-highlight">TIRO SALVEZZA</span> per resistere: d20 + modificatore della caratteristica richiesta.',
    example:'Il ragno ti morde: <b>tiro salvezza su Costituzione</b>, difficolta\' 11.<br>Esce 9, +2 di Costituzione = 11. Resisti al veleno!<br><br>Ogni classe e\' competente in 2 tiri salvezza e li\' aggiunge anche la competenza.' },
  { title:'Magia e Slot Incantesimo', sprite:'maga',
    text:'Gli incantatori hanno gli <span class="tut-blue">SLOT INCANTESIMO</span>: l\'energia per le magie potenti. Ogni incantesimo di livello 1 o 2 consuma uno slot. I <span class="tut-highlight">trucchetti</span> invece sono gratis, sempre!',
    example:'Maga livello 3: 4 slot di livello 1, 2 slot di livello 2.<br><br><span class="tut-highlight">Trucchetto</span> (gratis): Dardo di Fuoco, 1d10 danni<br><span class="tut-blue">Slot liv 1</span>: Dardo Incantato, colpisce SEMPRE<br><span class="tut-blue">Slot liv 2</span>: Raggio Rovente, 4d6 danni!<br><br>Gli slot tornano con il riposo lungo (alla locanda o dopo le vittorie importanti).' },
  { title:'Riposi', sprite:'fontana',
    text:'<span class="tut-green">Riposo breve</span> (nelle radure sicure dei dungeon): spendi <span class="tut-highlight">Dadi Vita</span> per recuperare PF. <span class="tut-blue">Riposo lungo</span> (alla locanda): recuperi TUTTO: PF, slot e meta\' dei Dadi Vita.',
    example:'Guerriero livello 3 ferito: ha 3 Dadi Vita (d10).<br>Riposo breve: spende 1 dado, recupera 1d10+2 PF.<br>I Dadi Vita finiti tornano (in parte) col riposo lungo: gestiteli bene!' },
  { title:'Il Combattimento', sprite:'goblin',
    text:'Si combatte a turni, in ordine di <span class="tut-highlight">INIZIATIVA</span> (d20 + Destrezza). Nel tuo turno scegli un\'azione, e molte classi hanno anche capacita\' bonus!',
    example:'<span class="tut-red">Attacca</span> - colpisci con la tua arma<br><span class="tut-blue">Magia</span> - trucchetti gratis o incantesimi con slot<br><span class="tut-green">Oggetto</span> - pozioni, bombe, pergamene<br><span class="tut-highlight">Difenditi</span> - chi ti attacca ha svantaggio<br><span class="tut-highlight">Aiuta</span> - dai vantaggio all\'attacco di un alleato<br><br>E se finisci a 0 PF? Svieni, ma niente paura: un alleato puo\' curarti per rimetterti in piedi!' },
  { title:'Pronti all\'Avventura!', sprite:'drago',
    text:'Esplorerete dungeon, parlerete con personaggi strani, risolverete enigmi e farete <span class="tut-highlight">SCELTE CHE CONTANO</span>. Ricordate: non tutti i problemi si risolvono con la spada... Premete <span class="tut-blue">?</span> in alto a destra se vi serve un ripasso. Ora create i vostri eroi!' },
];

export function renderTutorial(){
  const idx = GAME._tutStep || 0;
  const step = TUTORIAL_STEPS[idx];
  const total = TUTORIAL_STEPS.length;
  app().innerHTML = `
    <div class="screen active">
      <div class="tut-step">
        <div class="tut-dots">${TUTORIAL_STEPS.map((_,i)=>`<div class="tut-dot ${i===idx?'active':''}"></div>`).join('')}</div>
        ${step.sprite ? `<div id="tutSprite" style="margin:12px 0"></div>` : ''}
        <div class="tut-title">${step.title}</div>
        <div class="tut-text">${step.text}</div>
        ${step.example ? `<div class="tut-example">${step.example}</div>` : ''}
        <div class="row" style="margin-top:16px;gap:12px">
          ${idx>0 ? `<button class="btn small" onclick="GAME._tutStep--;window.render()">Indietro</button>` : ''}
          ${idx<total-1
            ? `<button class="btn green" onclick="GAME._tutStep++;window.render()">Avanti</button>`
            : `<button class="btn green" onclick="GAME.state='setup';window.render()">Creiamo gli Eroi!</button>`}
        </div>
        ${idx===0 ? `<button class="btn small accent" style="margin-top:10px" onclick="GAME.state='setup';window.render()">Salta il tutorial</button>` : ''}
      </div>
    </div>`;
  if(step.sprite){
    const el = $('#tutSprite');
    if(el) el.appendChild(createSpriteEl(step.sprite, 5));
  }
}

// ------------------------------------------------------------
// SETUP PARTY
// ------------------------------------------------------------
export function renderSetup(){
  app().innerHTML = `
    <div class="screen active">
      <h1>Gli Eroi</h1>
      <div class="panel" style="text-align:center">
        <h3>Quanti eroi partecipano?</h3>
        <p style="font-size:8px;color:var(--muted);margin:8px 0">Da 1 a 6 eroi. Ogni giocatore puo\' guidarne uno! Anche da solo te la caverai benissimo.</p>
        <div class="row" style="margin:12px 0">
          <button class="btn small" onclick="window.uiPlayerCount(-1)">-</button>
          <span id="playerCount" style="font-size:20px;color:var(--gold);width:60px;text-align:center">${GAME.numPlayers}</span>
          <button class="btn small" onclick="window.uiPlayerCount(1)">+</button>
        </div>
      </div>
      <button class="btn green" onclick="window.uiStartCharCreate()">Avanti</button>
    </div>`;
}
window.uiPlayerCount = d => {
  GAME.numPlayers = Math.max(1, Math.min(6, GAME.numPlayers+d));
  $('#playerCount').textContent = GAME.numPlayers;
};
window.uiStartCharCreate = () => {
  GAME.players = []; GAME.currentPlayerIdx = 0;
  GAME._cc = { step:'species' };
  GAME.state = 'charCreate'; R();
};

// ------------------------------------------------------------
// CREAZIONE PERSONAGGIO: specie -> classe -> nome
// ------------------------------------------------------------
export function renderCharCreate(){
  const cc = GAME._cc;
  const pIdx = GAME.currentPlayerIdx;
  let html = `<div class="screen active">
    <h2>Eroe ${pIdx+1} di ${GAME.numPlayers}</h2>`;

  if(cc.step==='species'){
    html += `<p style="font-size:8px;color:var(--muted)">Passo 1 di 3: scegli la SPECIE (da dove vieni?)</p><div class="grid-3">`;
    SPECIES.forEach((s,i)=>{
      html += `<div class="char-card" onclick="window.uiPickSpecies(${i})">
        <div id="specSprite${i}"></div>
        <div class="name">${s.name}</div>
        <div class="stats">${s.desc}</div>
      </div>`;
    });
    html += `</div>`;
  }
  else if(cc.step==='class'){
    const spec = SPECIES.find(s=>s.id===cc.speciesId);
    html += `<p style="font-size:8px;color:var(--muted)">Passo 2 di 3: scegli la CLASSE (cosa sai fare?) &middot; Specie: <span style="color:var(--gold)">${spec.name}</span></p><div class="grid-3">`;
    CLASSES.forEach((c,i)=>{
      const hp = c.hitDie + mod(c.stats.COS) + (spec.traits.hpPerLevel||0);
      const caster = c.casterType==='full' ? 'Incantatore' : (c.casterType==='half' ? 'Mezzo incantatore' : 'Combattente');
      html += `<div class="char-card" onclick="window.uiPickClass(${i})">
        <div id="classSprite${i}"></div>
        <div class="name" style="color:${c.color}">${c.name}</div>
        <div class="stats">${c.desc}</div>
        <div class="stats" style="margin-top:4px">PF: <span class="stat-val">${hp}</span> &middot; CA: <span class="stat-val">${c.acBase + (c.acUseDex?Math.min(mod(c.stats.DES),2):0)}</span> &middot; ${caster}</div>
        <div class="stats">${c.weapon.name} (1d${c.weapon.faces})</div>
      </div>`;
    });
    html += `</div>
      <button class="btn small" onclick="GAME._cc.step='species';window.render()">Indietro</button>`;
  }
  else if(cc.step==='name'){
    const spec = SPECIES.find(s=>s.id===cc.speciesId);
    const cls = CLASSES.find(c=>c.id===cc.classId);
    const st = cc.stats;
    html += `
      <p style="font-size:8px;color:var(--muted)">Passo 3 di 3: dai un nome al tuo eroe!</p>
      <div class="panel" style="max-width:460px">
        <div class="row" style="justify-content:flex-start">
          <div id="ccSprite"></div>
          <div class="col">
            <span style="color:${cls.color};font-size:11px">${cls.name} ${spec.name}</span>
            <span style="font-size:7px;color:var(--muted)">${spec.traitNames.join(' &middot; ')}</span>
          </div>
        </div>
        <div class="col" style="margin:10px 0">
          <label style="font-size:8px">Nome dell'eroe:</label>
          <input id="ccName" maxlength="18" placeholder="Es. ${suggestName(cc.classId)}" value="${cc.name||''}">
        </div>
        <p style="font-size:8px;color:var(--gold);margin:6px 0">Caratteristiche (punti extra: <span id="ccPts">${cc.ptsLeft}</span>)</p>
        <div class="grid-2" style="max-width:380px">
          ${Object.entries(st).map(([k,v])=>`
            <div class="row" style="justify-content:space-between">
              <span style="font-size:7px">${STAT_NAMES[k]}</span>
              <div class="row">
                <button class="btn small" onclick="window.uiAdjStat('${k}',-1)">-</button>
                <span id="ccStat_${k}" style="width:46px;text-align:center;color:var(--green)">${v} (${fmtMod(mod(v))})</span>
                <button class="btn small" onclick="window.uiAdjStat('${k}',1)">+</button>
              </div>
            </div>`).join('')}
        </div>
        <div class="row" style="margin-top:14px">
          <button class="btn green" onclick="window.uiConfirmChar()">Conferma Eroe</button>
          <button class="btn small" onclick="GAME._cc.step='class';window.render()">Indietro</button>
        </div>
      </div>`;
  }
  html += `</div>`;
  app().innerHTML = html;

  if(cc.step==='species') SPECIES.forEach((s,i)=>{ const el=$(`#specSprite${i}`); if(el) el.appendChild(createSpriteEl(s.sprite,3)); });
  if(cc.step==='class') CLASSES.forEach((c,i)=>{ const el=$(`#classSprite${i}`); if(el) el.appendChild(createSpriteEl(c.sprite,3)); });
  if(cc.step==='name'){ const el=$('#ccSprite'); if(el) el.appendChild(createSpriteEl(CLASSES.find(c=>c.id===cc.classId).sprite,4)); }
}

function suggestName(classId){
  const names = {
    guerriero:'Brando', barbaro:'Ruggine', ladro:'Ombra', maga:'Stella',
    chierico:'Lumen', ranger:'Falco', bardo:'Melodia', paladino:'Aurora',
  };
  return names[classId] || 'Eroe';
}

window.uiPickSpecies = i => { GAME._cc.speciesId = SPECIES[i].id; GAME._cc.step='class'; R(); };
window.uiPickClass = i => {
  const cc = GAME._cc;
  cc.classId = CLASSES[i].id;
  cc.stats = {...CLASSES[i].stats};
  cc.ptsLeft = 2;
  cc.step = 'name';
  R();
};
window.uiAdjStat = (stat, d) => {
  const cc = GAME._cc;
  const base = CLASSES.find(c=>c.id===cc.classId).stats;
  const nv = cc.stats[stat]+d;
  if(d>0 && (cc.ptsLeft<=0 || nv>17)) return;
  if(d<0 && nv < base[stat]) return; // non si scende sotto la base di classe
  cc.stats[stat] = nv;
  cc.ptsLeft -= d;
  $(`#ccStat_${stat}`).textContent = `${nv} (${fmtMod(mod(nv))})`;
  $('#ccPts').textContent = cc.ptsLeft;
};
window.uiConfirmChar = () => {
  const cc = GAME._cc;
  const name = ($('#ccName').value||'').trim() || suggestName(cc.classId);
  GAME.players.push(createPlayer(cc.speciesId, cc.classId, name, cc.stats));
  GAME.currentPlayerIdx++;
  if(GAME.currentPlayerIdx >= GAME.numPlayers){
    AUDIO.sfx('start_game');
    if(isStoria()){
      addLog(isSolo() ? `${GAME.players[0].name} e' pronto per l'avventura!` : 'Gli eroi sono pronti per l\'avventura!', 'info');
      GAME.chapter = 1; GAME.story = { node:0, branch:null, done:{} };
      GAME.state = 'storyChapter';
    } else {
      addLog(isSolo() ? `${GAME.players[0].name} e' pronto! Benvenuto a Borgoverde.` : 'La squadra e\' pronta! Benvenuti a Borgoverde.', 'info');
      GAME.state = 'village';
    }
    saveGame(true);
  } else {
    GAME._cc = { step:'species' };
  }
  R();
};

// ------------------------------------------------------------
// VILLAGGIO HUB
// ------------------------------------------------------------
export function renderVillage(){
  AUDIO.playMusic('village');
  const ch = CHAPTERS[GAME.chapter-1];
  let partyHtml = GAME.players.map((p,i)=>`
    <div class="combatant" onclick="GAME._sheetIdx=${i};GAME._sheetBack='village';GAME.state='sheet';window.render()" style="cursor:pointer">
      <div id="vilSprite${i}" style="flex-shrink:0"></div>
      <span class="cname" style="color:${p.color}">${p.name} <span style="color:var(--muted);font-size:7px">Liv ${p.level}</span></span>
      <div class="bars" style="min-width:110px">
        <div class="bar-wrap"><div class="bar-fill" style="width:${(p.hp/p.maxHp)*100}%;background:var(--hp)"></div>
        <span class="bar-text">PF ${p.hp}/${p.maxHp}</span></div>
      </div>
    </div>`).join('');

  app().innerHTML = `
    <div class="screen active">
      <h1>Borgoverde</h1>
      <p style="font-size:8px;color:var(--muted);text-align:center;max-width:600px">${VILLAGE.desc}</p>
      <div class="row" style="width:100%;max-width:720px;justify-content:space-between">
        <span style="font-size:9px;color:var(--gold)">Oro: ${GAME.gold}</span>
        <span style="font-size:8px;color:var(--blue)">${ch.subtitle}: ${ch.title}</span>
        <button class="btn small accent" onclick="window.uiSaveGame()">Salva</button>
      </div>
      <div class="grid-3">
        ${VILLAGE.locations.map((loc,i)=>`
          <div class="village-card" onclick="window.uiVillage('${loc.id}')">
            <div id="vloc${i}"></div>
            <div class="vname">${loc.name}</div>
            <div class="vdesc">${loc.desc}</div>
          </div>`).join('')}
      </div>
      <h3 style="margin-top:6px">${isSolo()?'Il Tuo Eroe':'La Squadra'} (tocca per la scheda)</h3>
      <div style="width:100%;max-width:720px">${partyHtml}</div>
      <button class="btn small blue" onclick="GAME._invBack='village';GAME.state='inventory';window.render()">Zaino</button>
    </div>`;
  VILLAGE.locations.forEach((loc,i)=>{ const el=$(`#vloc${i}`); if(el) el.appendChild(createSpriteEl(loc.sprite,3)); });
  GAME.players.forEach((p,i)=>{ const el=$(`#vilSprite${i}`); if(el) el.appendChild(createSpriteEl(p.sprite,2)); });
}

window.uiSaveGame = () => saveGame();

window.uiVillage = (locId) => {
  switch(locId){
    case 'piazza': openMayorDialogue(); break;
    case 'emporio': GAME.state='shop'; R(); break;
    case 'locanda': GAME._tavView='menu'; GAME.state='tavern'; R(); break;
    case 'tempio': doTemple(); break;
    case 'porta': tryAdventure(); break;
  }
};

function openMayorDialogue(){
  const d = MAYOR_DIALOGUES[GAME.quest];
  if(!d){
    GAME._dialogue = { speaker:'Sindaco Tobia', sprite:'sindaco',
      text:'"Piccoli eroi! Come procede la missione? La valle conta su di voi!"',
      choices:[{label:'"Ci stiamo lavorando!"', effect:'close'}] };
  } else {
    GAME._dialogue = d;
  }
  GAME._dialogueBack = 'village';
  GAME.state = 'dialogue';
  R();
}

function doInnRest(){
  if(GAME.gold < 10){ showToast('Servono 10 monete d\'oro!'); return; }
  GAME.gold -= 10;
  GAME.players.forEach(p => longRest(p));
  AUDIO.sfx('rest');
  addLog('Riposo lungo alla locanda: PF, slot magici e abilita\' recuperati!', 'heal');
  showToast(isSolo() ? 'Zzz... Sei riposato e al massimo!' : 'Zzz... La squadra e\' riposata e al massimo!');
  saveGame(true);
  GAME._tavMsg = isSolo() ? 'Dormi come un ghiro. Al risveglio sei al massimo: PF e magie!' : 'La squadra dorme come ghiri. Al risveglio tutti al massimo: PF e magie!';
  R();
}

// ------------------------------------------------------------
// TAVERNA: riposo, gioco del dado, taglie, pettegolezzi
// ------------------------------------------------------------
export function renderTavern(){
  AUDIO.playMusic('shop');
  const view = GAME._tavView || 'menu';
  let body = '';

  if(view==='menu'){
    body = `
      ${GAME._tavMsg ? `<div class="panel dark" style="text-align:center"><p style="font-size:9px;color:var(--green)">${GAME._tavMsg}</p></div>` : ''}
      <div class="grid-2">
        <div class="village-card" onclick="window.uiTavRest()">
          <div class="vname">Riposo Lungo (10 oro)</div>
          <div class="vdesc">Recupera TUTTI i Punti Ferita, gli slot magici e le abilita\'. Il recupero completo!</div>
        </div>
        <div class="village-card" onclick="window.uiTavView('dice')">
          <div class="vname">Gioco dei Dadi</div>
          <div class="vdesc">Sfida l\'oste a chi fa il punteggio piu\' alto con due dadi. Scommetti oro e raddoppia... o perdi!</div>
        </div>
        <div class="village-card" onclick="window.uiTavView('bounty')">
          <div class="vname">Bacheca delle Taglie</div>
          <div class="vdesc">Missioni opzionali: combattimenti extra per guadagnare oro ed esperienza.</div>
        </div>
        <div class="village-card" onclick="window.uiTavView('gossip')">
          <div class="vname">Ascolta i Pettegolezzi</div>
          <div class="vdesc">Chiacchiere, storie e indizi preziosi dagli avventori della taverna.</div>
        </div>
      </div>
      <button class="btn" onclick="GAME._tavMsg=null;GAME.state='village';window.render()">Esci dalla taverna</button>`;
  }
  else if(view==='dice'){
    const g = GAME._diceGame;
    body = `
      <div class="panel dark" style="text-align:center;max-width:480px">
        <h3>Il Gioco dei Dadi</h3>
        <p style="font-size:8px;color:var(--muted);line-height:1.7">Tu e l\'oste tirate 2 dadi a testa. Punteggio piu\' alto vince! Se vinci RADDOPPI la posta, se perdi la lasci sul tavolo. Pareggio: riprendi la posta.</p>
        ${g ? `
          <div class="row" style="justify-content:space-around;margin:14px 0">
            <div class="col" style="align-items:center">
              <span style="font-size:8px;color:${g.win===true?'var(--green)':'var(--text)'}">Tu</span>
              <span style="font-size:24px;color:var(--gold)">${g.you[0]}+${g.you[1]}</span>
              <span style="font-size:18px;color:${g.win===true?'var(--green)':'var(--text)'}">= ${g.youTot}</span>
            </div>
            <div style="font-size:14px;color:var(--accent);align-self:center">VS</div>
            <div class="col" style="align-items:center">
              <span style="font-size:8px;color:${g.win===false?'var(--accent)':'var(--text)'}">Oste</span>
              <span style="font-size:24px;color:var(--gold)">${g.npc[0]}+${g.npc[1]}</span>
              <span style="font-size:18px;color:${g.win===false?'var(--accent)':'var(--text)'}">= ${g.npcTot}</span>
            </div>
          </div>
          <p style="font-size:11px;color:${g.win===true?'var(--green)':(g.win===false?'var(--accent)':'var(--gold)')}">${g.msg}</p>
        ` : `<p style="font-size:9px;color:var(--gold);margin:10px 0">Quanto scommetti?</p>`}
        <div class="row" style="margin-top:10px">
          <button class="btn small green" onclick="window.uiDiceBet(5)" ${GAME.gold<5?'disabled':''}>Punta 5</button>
          <button class="btn small green" onclick="window.uiDiceBet(10)" ${GAME.gold<10?'disabled':''}>Punta 10</button>
          <button class="btn small green" onclick="window.uiDiceBet(20)" ${GAME.gold<20?'disabled':''}>Punta 20</button>
        </div>
        <p style="font-size:8px;color:var(--gold);margin-top:8px">Oro: ${GAME.gold}</p>
      </div>
      <button class="btn" onclick="GAME._diceGame=null;window.uiTavView('menu')">Torna al bancone</button>`;
  }
  else if(view==='bounty'){
    const list = (BOUNTIES[GAME.chapter]||[]);
    GAME.flags.bountiesDone = GAME.flags.bountiesDone || {};
    body = `
      <div class="panel dark" style="text-align:center;max-width:560px">
        <h3>Bacheca delle Taglie</h3>
        <p style="font-size:8px;color:var(--muted)">Incarichi opzionali affissi al muro. Combatti quando vuoi, l\'oro e l\'esperienza fanno sempre comodo!</p>
      </div>
      ${list.map(b=>{
        const done = GAME.flags.bountiesDone[b.id];
        return `<div class="village-card ${done?'done':''}" style="max-width:560px;text-align:left" ${done?'':`onclick="window.uiBounty('${b.id}')"`}>
          <div class="vname">${done?'&#10003; ':''}${b.name} ${done?'(completata)':`&middot; ${b.gold} oro`}</div>
          <div class="vdesc">${b.desc} ${done?'':`Nemici: ${b.monsters.map(m=>m).length}.`}</div>
        </div>`;
      }).join('')}
      <button class="btn" onclick="window.uiTavView('menu')">Torna al bancone</button>`;
  }
  else if(view==='gossip'){
    const pool = TAVERN_GOSSIP[GAME.chapter]||[];
    const g = GAME._gossip || pool[0] || {who:'Oste', text:'"Bevi qualcosa?"'};
    body = `
      <div class="dialogue-box" style="max-width:520px">
        <div class="dialogue-name">${g.who}</div>
        <div class="dialogue-text">${g.text}</div>
      </div>
      <div class="row">
        <button class="btn green" onclick="window.uiGossip()">Ascolta un altro</button>
        <button class="btn" onclick="window.uiTavView('menu')">Torna al bancone</button>
      </div>`;
  }

  app().innerHTML = `
    <div class="screen active">
      <div id="tavSprite"></div>
      <h2>Locanda della Ghianda</h2>
      <span style="font-size:9px;color:var(--gold)">Oro: ${GAME.gold}</span>
      ${body}
    </div>`;
  const el=$('#tavSprite'); if(el) el.appendChild(createSpriteEl('locanda',4));
}

window.uiTavView = (v) => { GAME._tavView=v; GAME._tavMsg=null; if(v==='gossip') window.uiGossip(true); else R(); };
window.uiTavRest = () => { doInnRest(); };

window.uiDiceBet = (bet) => {
  if(GAME.gold < bet){ showToast('Non hai abbastanza oro!'); return; }
  AUDIO.sfx('dice');
  const you = [d(6), d(6)];
  const npc = [d(6), d(6)];
  const youTot = you[0]+you[1], npcTot = npc[0]+npc[1];
  let win = null, msg = '', delta = 0;
  if(youTot > npcTot){ win = true; delta = bet; msg = `Hai vinto ${bet} oro! "Maledizione, che fortuna!" borbotta l'oste.`; AUDIO.sfx('coin'); }
  else if(youTot < npcTot){ win = false; delta = -bet; msg = `Hai perso ${bet} oro... "Sara' per la prossima!" ride l'oste.`; AUDIO.sfx('damage'); }
  else { win = null; delta = 0; msg = 'Pareggio! Riprendi la tua posta.'; }
  GAME.gold += delta;
  if(delta>0) GAME.statsTracker.goldEarned += delta;
  GAME._diceGame = { you, npc, youTot, npcTot, win, msg };
  saveGame(true);
  R();
};

window.uiBounty = (bid) => {
  const list = BOUNTIES[GAME.chapter]||[];
  const b = list.find(x=>x.id===bid);
  if(!b) return;
  GAME._pendingEvent = { letter:null, evt:{ type:'combat', monsters:b.monsters,
    text:`Taglia: ${b.name}. ${b.desc}`, reward:{gold:b.gold} } };
  GAME._bountyId = bid;
  GAME.state = 'event';
  R();
};

window.uiGossip = (silent) => {
  const pool = TAVERN_GOSSIP[GAME.chapter]||[];
  if(pool.length){
    const prev = GAME._gossip;
    let next = pool[Math.floor(Math.random()*pool.length)];
    if(pool.length>1){ let guard=0; while(next===prev && guard++<10) next = pool[Math.floor(Math.random()*pool.length)]; }
    GAME._gossip = next;
  }
  GAME._tavView = 'gossip';
  if(!silent) AUDIO.sfx('buy');
  R();
};

function doTemple(){
  GAME.players.forEach(p => { p.hp = p.maxHp; p.alive = true; p.conditions = {}; });
  AUDIO.sfx('heal');
  showToast('La sacerdotessa Mirta vi cura: PF al massimo!');
  addLog(`Il Tempio della Luce cura le ferite di ${partyLabel()} (gli slot magici tornano solo col riposo lungo alla locanda).`, 'heal');
  R();
}

function tryAdventure(){
  if((GAME.flags.acceptedChapter||0) < GAME.chapter){
    showToast('Prima passa dalla Piazza: il sindaco ha bisogno di parlarvi!');
    return;
  }
  GAME.state = 'chapterIntro';
  R();
}

// ------------------------------------------------------------
// DIALOGHI GENERICI
// ------------------------------------------------------------
export function renderDialogue(){
  const d = GAME._dialogue;
  app().innerHTML = `
    <div class="screen active" style="padding-top:30px">
      ${d.sprite ? `<div id="dlgSprite"></div>` : ''}
      <div class="dialogue-box">
        <div class="dialogue-name">${d.speaker||''}</div>
        <div class="dialogue-text">${(d.text||'').replace(/\n/g,'<br>')}</div>
      </div>
      <div style="width:100%;max-width:620px">
        ${(d.choices||[]).map((c,i)=>`<button class="choice-btn" onclick="window.uiDialogueChoice(${i})">${c.label}</button>`).join('')}
      </div>
    </div>`;
  if(d.sprite){ const el=$('#dlgSprite'); if(el) el.appendChild(createSpriteEl(d.sprite,5)); }
}

window.uiDialogueChoice = (i) => {
  const d = GAME._dialogue;
  const c = d.choices[i];
  if(c.next){ GAME._dialogue = {...c.next, speaker:c.next.speaker||d.speaker, sprite:c.next.sprite||d.sprite}; R(); return; }
  const eff = c.effect;
  if(eff === 'accept'){ acceptQuest(); return; }
  if(eff === 'end'){ GAME.state='epilogue'; R(); return; }
  if(eff === 'close' || !eff){ GAME.state = GAME._dialogueBack || 'village'; R(); return; }
  // Effetti oggetto: {type:'lore'|'funny'|'gift', text, items, gold}
  if(typeof eff === 'object'){
    if(eff.items){ eff.items.forEach(id=>GAME.inventory.push(id)); AUDIO.sfx('chest'); }
    if(eff.gold){ GAME.gold += eff.gold; AUDIO.sfx('coin'); }
    if(eff.text){
      GAME._dialogue = { speaker:d.speaker, sprite:d.sprite, text:eff.text,
        choices:[{label:'Continua', effect:'dlg_done'}] };
      R(); return;
    }
  }
  if(eff === 'dlg_done' || true){
    finishDialogue();
  }
};

function finishDialogue(){
  const back = GAME._dialogueBack || 'village';
  GAME.state = back;
  R();
}

function acceptQuest(){
  // Avanzamento trama dal dialogo del sindaco
  if(GAME.quest==='ch1_start'){
    GAME.flags.acceptedChapter = 1;
  } else if(GAME.quest==='ch1_done'){
    GAME.chapter = 2; GAME.quest = 'ch2_start'; GAME.flags.acceptedChapter = 2;
    GAME.inventory.push('chiave_cripta');
    showToast('Ottenuta: Chiave della Cripta!');
  } else if(GAME.quest==='ch2_done'){
    GAME.chapter = 3; GAME.quest = 'ch3_start'; GAME.flags.acceptedChapter = 3;
  } else if(GAME.quest==='ch2_start' || GAME.quest==='ch3_start'){
    GAME.flags.acceptedChapter = GAME.chapter;
  }
  saveGame(true);
  GAME.state = 'village'; R();
}

// ------------------------------------------------------------
// NEGOZIO
// ------------------------------------------------------------
export function renderShop(){
  AUDIO.playMusic('shop');
  const stock = SHOP_STOCK[GAME.chapter] || SHOP_STOCK[1];
  app().innerHTML = `
    <div class="screen active">
      <div id="shopSprite"></div>
      <h2>Emporio di Baruk</h2>
      <p style="font-size:8px;color:var(--muted)">"Benvenuti! Oro vostro, meraviglie mie. Affare fatto?"</p>
      <span style="font-size:10px;color:var(--gold)">Oro: ${GAME.gold}</span>
      <div class="grid-2">
        ${stock.map(id=>{
          const it = ITEMS[id];
          return `<div class="char-card" style="cursor:default">
            <div class="name" style="font-size:9px">${it.name}</div>
            <div class="stats">${it.desc}</div>
            <div class="row" style="margin-top:8px">
              <span style="color:var(--gold);font-size:9px">${it.price} oro</span>
              <button class="btn small green" onclick="window.uiBuy('${id}')" ${GAME.gold<it.price?'disabled':''}>Compra</button>
            </div>
          </div>`;
        }).join('')}
      </div>
      <button class="btn" onclick="GAME.state='village';window.render()">Torna in piazza</button>
    </div>`;
  const el=$('#shopSprite'); if(el) el.appendChild(createSpriteEl('mercante',4));
}

window.uiBuy = (id) => {
  const it = ITEMS[id];
  if(GAME.gold < it.price) return;
  GAME.gold -= it.price;
  AUDIO.sfx('buy');
  if(it.type==='consumable' || it.type==='quest'){
    GAME.inventory.push(id);
    showToast(`Comprato: ${it.name}!`);
    R();
  } else {
    // Equipaggiamento: scegli a chi darlo
    GAME._equipItem = id;
    GAME._equipBack = 'shop';
    GAME.state = 'equipPick';
    R();
  }
};

export function renderEquipPick(){
  const it = ITEMS[GAME._equipItem];
  app().innerHTML = `
    <div class="screen active">
      <h2>${it.name}</h2>
      <p style="font-size:9px;color:var(--muted)">${it.desc}</p>
      <h3>Chi lo equipaggia?</h3>
      <div class="grid-3">
        ${GAME.players.map((p,i)=>`
          <div class="char-card" onclick="window.uiEquipTo(${i})">
            <div id="eqSprite${i}"></div>
            <div class="name" style="color:${p.color}">${p.name}</div>
            <div class="stats">${p.className} liv ${p.level}</div>
            <div class="stats">${p.equipment.map(e=>ITEMS[e].name).join('<br>')||'Nessun oggetto'}</div>
          </div>`).join('')}
      </div>
    </div>`;
  GAME.players.forEach((p,i)=>{ const el=$(`#eqSprite${i}`); if(el) el.appendChild(createSpriteEl(p.sprite,3)); });
}

window.uiEquipTo = (i) => {
  const p = GAME.players[i];
  const it = ITEMS[GAME._equipItem];
  p.equipment.push(GAME._equipItem);
  if(it.effect==='atk_bonus'){ p.atkBonusExtra += it.value; }
  if(it.effect==='ac_bonus'){ p.ac += it.value; p.baseAC += it.value; }
  if(it.effect==='hp_bonus'){ p.maxHp += it.value; p.hp += it.value; }
  if(it.effect==='lucky_ring'){ /* flag letto in combattimento */ }
  showToast(`${p.name} equipaggia ${it.name}!`);
  AUDIO.sfx('levelup');
  GAME.state = GAME._equipBack || 'shop';
  GAME._equipItem = null;
  R();
};

// ------------------------------------------------------------
// SCHEDA PERSONAGGIO
// ------------------------------------------------------------
export function renderSheet(){
  const p = GAME.players[GAME._sheetIdx||0];
  const cls = CLASSES.find(c=>c.id===p.classId);
  const spec = SPECIES.find(s=>s.id===p.speciesId);
  const pb = profBonus(p.level);
  const feats = (cls.features||[]).filter(f=>f.level<=p.level);
  const slotsHtml = p.casterType!=='none' ? `
    <div class="sheet-row">
      <span class="tag">Slot liv 1: ${pips(p.slots[0], maxSlots(p.casterType,p.level)[0])}</span>
      <span class="tag">Slot liv 2: ${pips(p.slots[1], maxSlots(p.casterType,p.level)[1])}</span>
    </div>` : '';
  const spellList = [...p.cantrips.map(id=>({id,free:true})), ...p.spells.map(id=>({id,free:false}))];

  app().innerHTML = `
    <div class="screen active">
      <div class="sheet">
        <div class="sheet-header">
          <div id="shSprite"></div>
          <div class="col">
            <span style="color:${p.color};font-size:12px">${p.name}</span>
            <span style="font-size:8px;color:var(--muted)">${cls.name} ${spec.name} &middot; Livello ${p.level}</span>
            <span style="font-size:7px;color:var(--blue)">XP: ${p.xp}${p.level<MAX_LEVEL ? ` / ${XP_TABLE[p.level]}` : ' (MAX)'}</span>
          </div>
          <div class="col" style="margin-left:auto;text-align:right">
            <span style="font-size:9px;color:var(--hp)">PF: ${p.hp}/${p.maxHp}</span>
            <span style="font-size:9px;color:var(--blue)">CA: ${p.ac}</span>
            <span style="font-size:8px;color:var(--gold)">Competenza: +${pb}</span>
          </div>
        </div>
        <div class="sheet-stats">
          ${Object.entries(p.stats).map(([k,v])=>`
            <div class="stat-box ${p.saveProfs.includes(k)?'':''}">
              <div class="sname">${STAT_NAMES[k]}${p.saveProfs.includes(k)?' *':''}</div>
              <div class="sval">${v}</div>
              <div class="smod">${fmtMod(mod(v))}</div>
            </div>`).join('')}
        </div>
        <p style="font-size:6px;color:var(--muted)">* = competente nei tiri salvezza di questa caratteristica (+${pb})</p>
        <div class="sheet-row" style="margin-top:8px">
          <span class="tag">Arma: ${p.weapon.name} (1d${p.weapon.faces}${p.atkBonusExtra?` ${fmtMod(p.atkBonusExtra)}`:''})</span>
          <span class="tag">Dadi Vita: ${p.hitDiceLeft}/${p.level} (d${p.hitDie})</span>
          ${p.classId==='paladino' ? `<span class="tag">Imposizione Mani: ${layPoolMax(p)-(p.usedAbilities.layUsed||0)}/${layPoolMax(p)} PF</span>` : ''}
        </div>
        ${slotsHtml}
        <h3 style="margin-top:10px">Capacita\' di ${spec.name}</h3>
        <p style="font-size:8px;line-height:1.8;color:var(--text)">${spec.traitNames.join('<br>')}</p>
        <h3 style="margin-top:10px">Capacita\' di classe</h3>
        ${feats.map(f=>`<p style="font-size:8px;line-height:1.7"><span style="color:var(--gold)">${f.name}</span>: ${f.desc}</p>`).join('')}
        ${spellList.length ? `<h3 style="margin-top:10px">Magie</h3>
          ${spellList.map(({id,free})=>{
            const sp = SPELLS[id];
            return `<p style="font-size:8px;line-height:1.7"><span style="color:var(--purple)">${sp.name}</span> ${free?'<span style="color:var(--green)">(trucchetto, gratis)</span>':`(slot liv ${sp.level})`}: ${sp.desc}</p>`;
          }).join('')}` : ''}
        ${p.equipment.length ? `<h3 style="margin-top:10px">Equipaggiamento magico</h3>
          ${p.equipment.map(id=>`<p style="font-size:8px">${ITEMS[id].name}: ${ITEMS[id].desc}</p>`).join('')}` : ''}
      </div>
      <button class="btn" onclick="GAME.state=GAME._sheetBack||'village';window.render()">Indietro</button>
    </div>`;
  const el=$('#shSprite'); if(el) el.appendChild(createSpriteEl(p.sprite,4));
}

function pips(cur, max){
  let s = '<span class="slot-pips">';
  for(let i=0;i<max;i++) s += `<span class="slot-pip ${i<cur?'full':''}"></span>`;
  return s+'</span>';
}

// ------------------------------------------------------------
// ZAINO (fuori combattimento)
// ------------------------------------------------------------
export function renderInventory(){
  const counts = {};
  GAME.inventory.forEach(id => counts[id] = (counts[id]||0)+1);
  const entries = Object.entries(counts);
  app().innerHTML = `
    <div class="screen active">
      <h2>${isSolo()?'Il Tuo Zaino':'Zaino della Squadra'}</h2>
      <span style="font-size:9px;color:var(--gold)">Oro: ${GAME.gold}</span>
      ${entries.length===0 ? '<p style="font-size:9px;color:var(--muted)">Lo zaino e\' vuoto!</p>' : `
      <div class="grid-2">
        ${entries.map(([id,n])=>{
          const it = ITEMS[id];
          const usable = it.type==='consumable' && (it.effect==='heal'||it.effect==='cure_poison'||it.effect==='restore_slot');
          return `<div class="char-card" style="cursor:default">
            <div class="name" style="font-size:9px">${it.name} ${n>1?`x${n}`:''}</div>
            <div class="stats">${it.desc}</div>
            ${usable ? `<button class="btn small green" style="margin-top:6px" onclick="window.uiUseItem('${id}')">Usa</button>` : ''}
          </div>`;
        }).join('')}
      </div>`}
      <button class="btn" onclick="GAME.state=GAME._invBack||'village';window.render()">Indietro</button>
    </div>`;
}

window.uiUseItem = (id) => {
  GAME._useItemId = id;
  GAME.state = 'usePick'; R();
};

export function renderUsePick(){
  const it = ITEMS[GAME._useItemId];
  app().innerHTML = `
    <div class="screen active">
      <h2>${it.name}</h2>
      <h3>Su quale eroe?</h3>
      <div class="grid-3">
        ${GAME.players.map((p,i)=>`
          <div class="char-card" onclick="window.uiUseOn(${i})">
            <div class="name" style="color:${p.color}">${p.name}</div>
            <div class="stats">PF ${p.hp}/${p.maxHp}${p.casterType!=='none'?`<br>Slot: ${p.slots[0]}/${p.slots[1]}`:''}</div>
          </div>`).join('')}
      </div>
      <button class="btn" onclick="GAME.state='inventory';window.render()">Annulla</button>
    </div>`;
}

window.uiUseOn = (i) => {
  const p = GAME.players[i];
  const id = GAME._useItemId;
  const it = ITEMS[id];
  const idx = GAME.inventory.indexOf(id);
  if(idx===-1) return;
  if(it.effect==='heal'){
    const r = rollDice(it.dice.num, it.dice.faces, it.dice.bonus||0);
    const healed = Math.min(r.total, p.maxHp-p.hp);
    p.hp += healed; p.alive = true;
    AUDIO.sfx('heal');
    showToast(`${p.name} recupera ${healed} PF! (${r.expr}: ${r.total})`);
  } else if(it.effect==='cure_poison'){
    delete p.conditions.poisoned;
    AUDIO.sfx('heal');
    showToast(`${p.name} non e\' piu\' avvelenato!`);
  } else if(it.effect==='restore_slot'){
    if(p.casterType==='none'){ showToast(`${p.name} non usa magie!`); return; }
    const lv = it.slotLevel;
    const mx = maxSlots(p.casterType, p.level);
    if(p.slots[lv-1] >= mx[lv-1]){ showToast('Slot gia\' al massimo!'); return; }
    p.slots[lv-1]++;
    AUDIO.sfx('spell');
    showToast(`${p.name} recupera uno slot di livello ${lv}!`);
  }
  GAME.inventory.splice(idx,1);
  GAME.state = 'inventory'; R();
};

// ------------------------------------------------------------
// LEVEL UP
// ------------------------------------------------------------
export function maybeLevelUp(nextState){
  const pending = checkLevelUps();
  if(pending.length === 0){ GAME.state = nextState; R(); return; }
  GAME._lvlQueue = pending.map(p=>GAME.players.indexOf(p));
  GAME._lvlNext = nextState;
  processLevelQueue();
}

function processLevelQueue(){
  if(!GAME._lvlQueue || GAME._lvlQueue.length===0){
    // ricontrolla (XP potrebbe bastare per 2 livelli)
    const pending = checkLevelUps();
    if(pending.length){ GAME._lvlQueue = pending.map(p=>GAME.players.indexOf(p)); }
    else { GAME.state = GAME._lvlNext || 'map'; R(); return; }
  }
  const idx = GAME._lvlQueue.shift();
  const p = GAME.players[idx];
  const cls = CLASSES.find(c=>c.id===p.classId);
  const result = levelUp(p, cls);
  GAME._lvlResult = { idx, ...result };
  AUDIO.sfx('levelup');
  GAME.state = 'levelup';
  R();
}

export function renderLevelUp(){
  const r = GAME._lvlResult;
  const p = GAME.players[r.idx];
  app().innerHTML = `
    <div class="screen active" style="padding-top:30px">
      <div class="levelup-box">
        <div id="luSprite"></div>
        <h2 style="color:var(--gold)">LIVELLO SUPERIORE!</h2>
        <div class="lvl-big">${p.name} &rarr; Liv ${p.level}</div>
        <p style="font-size:9px;line-height:2">
          +${r.hpGain} Punti Ferita massimi!<br>
          ${r.newProf ? 'Bonus di competenza aumentato a +3!<br>' : ''}
          ${r.unlocked.map(f=>`<span style="color:var(--gold)">${f.name}</span>: ${f.desc}`).join('<br>')}
          ${r.newSpells.length ? `<br>Nuove magie: <span style="color:var(--purple)">${r.newSpells.map(id=>SPELLS[id].name).join(', ')}</span>` : ''}
        </p>
        ${r.asi ? `
          <h3>Scegli: quale caratteristica migliorare? (+2)</h3>
          <div class="row" style="margin-top:8px">
            ${Object.keys(p.stats).map(k=>`<button class="btn small" onclick="window.uiAsi('${k}')">${STAT_NAMES[k]} ${p.stats[k]}&rarr;${Math.min(20,p.stats[k]+2)}</button>`).join('')}
          </div>` : `
          <button class="btn green" style="margin-top:10px" onclick="window.uiLevelDone()">Fantastico!</button>`}
      </div>
    </div>`;
  const el=$('#luSprite'); if(el) el.appendChild(createSpriteEl(p.sprite,4));
}

window.uiAsi = (stat) => {
  const p = GAME.players[GAME._lvlResult.idx];
  const oldMod = mod(p.stats[stat]);
  p.stats[stat] = Math.min(20, p.stats[stat]+2);
  const newMod = mod(p.stats[stat]);
  // Ricalcoli derivati
  if(stat==='COS' && newMod>oldMod){
    p.maxHp += p.level * (newMod-oldMod);
    p.hp += p.level * (newMod-oldMod);
  }
  if(stat==='DES' && newMod>oldMod){
    const cls = CLASSES.find(c=>c.id===p.classId);
    if(cls.acUseDex && mod(p.stats.DES)<=2){ p.ac += (newMod-oldMod); p.baseAC += (newMod-oldMod); }
  }
  showToast(`${STAT_NAMES[stat]} aumentata!`);
  window.uiLevelDone();
};

window.uiLevelDone = () => { processLevelQueue(); };

// ------------------------------------------------------------
// SCONFITTA / EPILOGO
// ------------------------------------------------------------
export function renderDefeat(){
  AUDIO.stopMusic();
  app().innerHTML = `
    <div class="screen active" style="padding-top:50px">
      <h2 style="color:var(--accent)">${isSolo()?'Sei caduto...':'La squadra e\' caduta...'}</h2>
      <p class="event-text">Ma i Piccoli Eroi non muoiono mai! ${isSolo()?'Ti risvegli':'Vi risvegliate'} al Tempio di Borgoverde, dove la sacerdotessa Mirta ${isSolo()?'ti ha':'vi ha'} riportato in salvo. ${isSolo()?'Hai':'Avete'} perso meta\' dell\'oro per le cure... ma l\'avventura continua!</p>
      <button class="btn green" onclick="window.uiDefeatContinue()">Rialzarsi e riprovare</button>
    </div>`;
}

window.uiDefeatContinue = () => {
  GAME.gold = Math.floor(GAME.gold/2);
  GAME.players.forEach(p=>{ p.hp = p.maxHp; p.alive = true; p.conditions = {}; });
  GAME.inDungeon = false;
  GAME.combat = null;
  GAME.state = 'village';
  saveGame(true);
  R();
};

export function renderEpilogue(){
  AUDIO.playMusic('finale');
  const s = GAME.statsTracker;
  const peace = GAME.ending === 'peace';
  app().innerHTML = `
    <div class="screen active" style="padding-top:40px">
      <h1>${peace ? 'Un Nuovo Guardiano' : 'La Valle e\' Salva!'}</h1>
      <div id="epSprite" style="margin:10px 0"></div>
      <div class="panel" style="text-align:center">
        <p class="event-text">${peace
          ? 'La Festa del Raccolto quest\'anno ha un ospite speciale: un\'ombra rossa che vola alta sopra Borgoverde, vegliando sulla valle. E quando l\'uovo si schiudera\', i Piccoli Eroi saranno li\'. La profezia era vera, fino all\'ultima riga: "E il fuoco diventera\' il loro amico."'
          : 'La campana suona a festa: la valle e\' libera! I Piccoli Eroi hanno compiuto la profezia. E se un giorno, da oltre le montagne, tornasse un\'ombra rossa... beh, sapranno cosa fare.'}</p>
      </div>
      <div class="quest-panel">
        <div class="quest-title">Cronaca dell\'impresa</div>
        <div class="quest-obj">Eroi: ${GAME.players.map(p=>`${p.name} (${p.className} liv ${p.level})`).join(', ')}</div>
        <div class="quest-obj">Battaglie vinte: ${s.fights} &middot; Colpi critici: ${s.crits}</div>
        <div class="quest-obj">Oro raccolto in totale: ${s.goldEarned}</div>
        <div class="quest-obj" style="color:var(--gold)">Finale: ${peace ? 'LA VIA DELLA PACE (finale segreto!)' : 'LA VIA DEL CORAGGIO'}</div>
      </div>
      <p style="font-size:8px;color:var(--muted)">${peace ? '' : 'Lo sapevi? C\'e\' un altro finale... La Gemma del Drago nasconde un segreto.'}</p>
      <button class="btn" onclick="window.uiBackToTitle()">Torna al titolo</button>
    </div>`;
  const el=$('#epSprite'); if(el) el.appendChild(createSpriteEl(peace?'egg':'drago',6));
}

window.uiBackToTitle = () => { GAME.state='title'; R(); };

// ------------------------------------------------------------
// AIUTO (overlay)
// ------------------------------------------------------------
export function toggleHelp(){
  const existing = document.querySelector('.help-overlay');
  if(existing){ existing.remove(); return; }
  const overlay = document.createElement('div');
  overlay.className = 'help-overlay';
  overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div class="help-panel">
      <h2>Regole in breve</h2>
      <div class="help-section">
        <div class="hl">Il tiro base</div>
        <p>d20 + modificatore caratteristica + competenza (se sei bravo in quella cosa). Raggiungi la difficolta\' = successo. 20 naturale = critico (dadi di danno doppi), 1 naturale = fallimento automatico.</p>
      </div>
      <div class="help-section">
        <div class="hl">Vantaggio / Svantaggio</div>
        <p>Vantaggio: tiri 2d20 e tieni il MIGLIORE (nemico a terra, attacco di sorpresa, aiuto di un alleato...). Svantaggio: tieni il PEGGIORE (avvelenato, spaventato, nemico in guardia...). Se hai entrambi si annullano.</p>
      </div>
      <div class="help-section">
        <div class="hl">Tiri salvezza</div>
        <p>Per resistere a veleni, paura e magie: d20 + modificatore. Ogni classe e\' competente in 2 caratteristiche (segnate con * nella scheda).</p>
      </div>
      <div class="help-section">
        <div class="hl">Slot incantesimo</div>
        <p>Le magie di livello 1-2 consumano slot; i trucchetti sono gratis. Gli slot tornano col riposo lungo (locanda). Le pergamene di Baruk possono ricaricarli al volo.</p>
      </div>
      <div class="help-section">
        <div class="hl">Riposi</div>
        <p>Breve (radure sicure nei dungeon): spendi Dadi Vita, recuperi PF. Lungo (locanda, 10 oro): tutto al massimo, slot inclusi.</p>
      </div>
      <div class="help-section">
        <div class="hl">0 Punti Ferita?</div>
        <p>L\'eroe sviene ma non muore: un alleato puo\' curarlo per rialzarlo. Se TUTTA la squadra sviene, vi risvegliate al tempio (perdendo meta\' oro).</p>
      </div>
      <div class="help-section" style="border-left-color:var(--accent)">
        <div class="hl" style="color:var(--accent)">Come si vince</div>
        <p>3 capitoli: i Goblin del Bosco, le Cripte Antiche, la Montagna di Fuoco. Parla col sindaco in piazza per ricevere le missioni. Esplora, potenzia la squadra e affronta i boss. E ricorda: a volte parlare funziona meglio che combattere...</p>
      </div>
      <div class="help-section" style="border-left-color:var(--green)">
        <div class="hl" style="color:var(--green)">Salvataggio</div>
        <p>La partita si salva da sola. Per sicurezza puoi ottenere un CODICE da copiare e conservare: ti permette di riprendere su questo o un altro dispositivo.</p>
        <div class="row" style="margin-top:8px">
          <button class="btn small green" onclick="this.closest('.help-overlay').remove();window.uiShowCode()">Mostra codice salvataggio</button>
          <button class="btn small" onclick="this.closest('.help-overlay').remove();window.uiSettings()">Dimensione testo</button>
        </div>
      </div>
      <button class="btn" onclick="this.closest('.help-overlay').remove()" style="margin-top:12px;width:100%">Ho capito!</button>
    </div>`;
  document.body.appendChild(overlay);
}
