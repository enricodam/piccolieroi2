// ============================================================
// PICCOLI EROI 2 - Overlay d'azione cinematografico
// Mostra in grande: sprite, dado d20 che rotola, risultato,
// scomposizione del tiro e testo del narratore. Poi richiama onDone.
// Progettato per funzionare anche in ambiente headless (test):
// con setTimeout sincrono la sequenza collassa e onDone parte subito.
// ============================================================
import { createSpriteEl } from './sprites.js';
import { AUDIO } from './audio.js';

let busy = false;
let autoMode = false; // in test/headless: lancia e conclude da solo
export function setCineAuto(v){ autoMode = v; }

// Frasi del narratore per dare colore all'azione
const NARR = {
  attackIntro: [
    '{a} scatta in avanti contro {t}!',
    '{a} prende la mira su {t}...',
    '{a} carica {t} con un grido!',
    '{a} affronta {t} a testa alta!',
  ],
  crit: ['COLPO PERFETTO! Un colpo da maestro!', 'CRITICO! {t} non se l\'aspettava!', 'Che colpo! {t} barcolla!'],
  hit: ['Il colpo va a segno!', 'Centrato in pieno!', 'Bersaglio colpito!', 'Un bel colpo su {t}!'],
  miss: ['{t} schiva all\'ultimo istante!', 'Mancato di un soffio!', '{t} para il colpo!', 'L\'attacco va a vuoto!'],
  spellIntro: [
    '{a} intona le parole magiche...',
    '{a} incanala il potere arcano!',
    'L\'aria crepita attorno a {a}...',
  ],
  saveIntro: [
    'Pericolo! {a} cerca di resistere...',
    '{a} stringe i denti contro l\'effetto!',
  ],
  checkIntro: [
    '{a} si concentra sull\'impresa...',
    '{a} ci prova con tutte le forze!',
  ],
  success: ['Riuscito!', 'Ce l\'ha fatta!', 'Perfetto!'],
  fail: ['Non ce l\'ha fatta...', 'Fallito!', 'Andata male!'],
};

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function fill(s, a, t){ return (s||'').replace(/\{a\}/g, a||'').replace(/\{t\}/g, t||''); }

export function narrator(kind, actorName, targetName){
  return fill(pick(NARR[kind]||['']), actorName, targetName);
}

// cfg:
//  actor:{sprite,name,color}, target:{sprite,name}|null
//  intro: testo narratore iniziale
//  stakes: "Esce 8 o piu' e colpisci!" (dichiarazione della posta, mostrata prima del lancio)|null
//  dice:{result,rolls,advState}|null   (null = nessun dado, es. "colpisce sempre")
//  breakdown: stringa scomposizione ("12 +3 Forza +2 comp = 17")|null  (nascosto in modalita' Storia)
//  compare: "CA 13" / "Difficolta' 12" | null
//  outcome: 'crit'|'hit'|'miss'|'success'|'fail'|'cast'|'heal'
//  outcomeText: parola grande
//  result: testo conseguenza (danni/effetto/cura)
//  sfxRoll, sfxOutcome: nomi effetti audio
export function cineAction(cfg, onDone){
  if(busy){ if(onDone) onDone(); return; }
  busy = true;
  let finished = false, rolled = false, reveal = 0;
  const finish = () => { if(finished) return; finished = true; busy = false; overlay.remove(); if(onDone) onDone(); };

  const overlay = document.createElement('div');
  overlay.className = 'cine-overlay';

  const advNote = cfg.dice && cfg.dice.rolls && cfg.dice.rolls.length===2
    ? `<div class="cine-adv ${cfg.dice.advState==='adv'?'adv':'dis'}">${cfg.dice.advState==='adv'?'VANTAGGIO':'SVANTAGGIO'}: tiri [${cfg.dice.rolls.join(' e ')}], tieni ${cfg.dice.advState==='adv'?'il migliore':'il peggiore'}</div>`
    : '';
  const outcomeClass = { crit:'crit', hit:'hit', miss:'miss', success:'success', fail:'fail', cast:'cast', heal:'success' }[cfg.outcome] || 'hit';

  overlay.innerHTML = `
    <div class="cine-stage">
      <div class="cine-narrator">${cfg.intro||''}</div>
      <div class="cine-fighters">
        <div class="cine-fighter">
          <div id="cineActor" class="cine-sprite-big"></div>
          <div class="cine-fname" style="color:${(cfg.actor&&cfg.actor.color)||'var(--gold)'}">${cfg.actor?cfg.actor.name:''}</div>
        </div>
        ${cfg.target ? `<div class="cine-vs">&#9876;</div>
        <div class="cine-fighter">
          <div id="cineTarget" class="cine-sprite-big cine-target"></div>
          <div class="cine-fname" style="color:var(--accent)">${cfg.target.name}</div>
        </div>` : ''}
      </div>
      ${cfg.stakes ? `<div id="cineStakes" class="cine-stakes">${cfg.stakes}</div>` : ''}
      ${cfg.dice ? `<div class="cine-dice-zone">
        <div id="cineDie" class="cine-die clickable">?</div>
        ${advNote}
        <button id="cineRoll" class="btn gold cine-roll-btn">&#127922; LANCIA IL DADO!</button>
      </div>` : `<div class="cine-auto" id="cineAuto">&#10022; ${cfg.autoLabel||'AUTOMATICO'} &#10022;</div>`}
      <div id="cineBreak" class="cine-breakdown" style="visibility:hidden">${cfg.breakdown||''}${cfg.compare?` &rarr; serviva ${cfg.compare}`:''}</div>
      <div id="cineOutcome" class="cine-outcome ${outcomeClass}" style="visibility:hidden">${cfg.outcomeText||''}</div>
      <div id="cineResult" class="cine-result" style="visibility:hidden">${cfg.result||''}</div>
      <button id="cineGo" class="btn green cine-continue" style="visibility:hidden">Continua &#9654;</button>
    </div>`;
  document.body.appendChild(overlay);

  const aEl = overlay.querySelector('#cineActor');
  if(aEl && cfg.actor) aEl.appendChild(createSpriteEl(cfg.actor.sprite, 9));
  if(cfg.target){ const tEl = overlay.querySelector('#cineTarget'); if(tEl) tEl.appendChild(createSpriteEl(cfg.target.sprite, 9)); }

  const die = overlay.querySelector('#cineDie');
  const rollBtn = overlay.querySelector('#cineRoll');
  const breakEl = overlay.querySelector('#cineBreak');
  const outEl = overlay.querySelector('#cineOutcome');
  const resEl = overlay.querySelector('#cineResult');
  const goBtn = overlay.querySelector('#cineGo');
  const stakesEl = overlay.querySelector('#cineStakes');

  const stopDice = () => {
    if(die){ die.classList.remove('rolling'); die.textContent = cfg.dice.result; die.classList.add(cfg.dice.advState==='adv'?'advantage':(cfg.dice.advState==='dis'?'disadvantage':'')); }
  };
  const showBreak = () => { reveal = 2; if(breakEl && cfg.breakdown) breakEl.style.visibility='visible'; };
  const showOutcome = () => {
    reveal = 3;
    if(outEl){ outEl.style.visibility='visible'; outEl.classList.add('pop'); }
    if(cfg.sfxOutcome) AUDIO.sfx(cfg.sfxOutcome);
  };
  const showResult = () => { if(resEl) resEl.style.visibility='visible'; if(goBtn) goBtn.style.visibility='visible'; };

  // Lancio del dado (su click o automatico nei test)
  const doRoll = () => {
    if(rolled) return; rolled = true;
    if(rollBtn) rollBtn.remove();
    if(stakesEl) stakesEl.style.opacity = '0.5';
    if(die){ die.classList.remove('clickable'); die.classList.add('rolling'); }
    if(cfg.sfxRoll) AUDIO.sfx(cfg.sfxRoll);
    setTimeout(stopDice, 700);
    setTimeout(showBreak, 1000);
    setTimeout(showOutcome, 1450);
    setTimeout(showResult, 2000);
    if(autoMode) setTimeout(finish, 2400);
  };

  if(rollBtn) rollBtn.addEventListener('click', doRoll);
  if(die) die.addEventListener('click', ()=>{ if(!rolled) doRoll(); });
  if(goBtn) goBtn.addEventListener('click', finish);
  overlay.addEventListener('click', e => {
    if(e.target===goBtn || e.target===rollBtn || e.target===die) return;
    if(reveal>=3) finish();
  });

  if(cfg.dice){
    if(autoMode) doRoll();            // test: lancia subito
  } else {
    // Nessun dado: rivela in sequenza
    setTimeout(showBreak, 250);
    setTimeout(showOutcome, 650);
    setTimeout(showResult, 1150);
    if(autoMode) setTimeout(finish, 1400);
  }
}

// Versione rapida per colpi nemici: banner che lampeggia, niente dado
export function cineQuick(text, cls, onDone){
  const el = document.createElement('div');
  el.className = `cine-quick ${cls||''}`;
  el.innerHTML = text;
  document.body.appendChild(el);
  setTimeout(()=>{ el.remove(); if(onDone) onDone(); }, 850);
}
