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
//  dice:{result,rolls,advState}|null   (null = nessun dado, es. "colpisce sempre")
//  breakdown: stringa scomposizione ("12 +3 Forza +2 comp = 17")|null
//  compare: "CA 13" / "Difficolta' 12" | null
//  outcome: 'crit'|'hit'|'miss'|'success'|'fail'|'cast'|'heal'
//  outcomeText: parola grande
//  result: testo conseguenza (danni/effetto/cura)
//  sfxRoll, sfxOutcome: nomi effetti audio
export function cineAction(cfg, onDone){
  if(busy){ if(onDone) onDone(); return; }
  busy = true;
  let finished = false;
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
      ${cfg.dice ? `<div class="cine-dice-zone">
        <div id="cineDie" class="cine-die rolling">?</div>
        ${advNote}
      </div>` : `<div class="cine-auto" id="cineAuto">&#10022; AUTOMATICO &#10022;</div>`}
      <div id="cineBreak" class="cine-breakdown" style="visibility:hidden">${cfg.breakdown||''}${cfg.compare?` &rarr; serviva ${cfg.compare}`:''}</div>
      <div id="cineOutcome" class="cine-outcome ${outcomeClass}" style="visibility:hidden">${cfg.outcomeText||''}</div>
      <div id="cineResult" class="cine-result" style="visibility:hidden">${cfg.result||''}</div>
      <button id="cineGo" class="btn green cine-continue" style="visibility:hidden">Continua &#9654;</button>
    </div>`;
  document.body.appendChild(overlay);

  // Sprite grandi
  const aEl = overlay.querySelector('#cineActor');
  if(aEl && cfg.actor) aEl.appendChild(createSpriteEl(cfg.actor.sprite, 9));
  if(cfg.target){
    const tEl = overlay.querySelector('#cineTarget');
    if(tEl) tEl.appendChild(createSpriteEl(cfg.target.sprite, 9));
  }

  if(cfg.sfxRoll) AUDIO.sfx(cfg.sfxRoll);

  const die = overlay.querySelector('#cineDie');
  const breakEl = overlay.querySelector('#cineBreak');
  const outEl = overlay.querySelector('#cineOutcome');
  const resEl = overlay.querySelector('#cineResult');
  const goBtn = overlay.querySelector('#cineGo');

  // tap per saltare alla fine
  overlay.addEventListener('click', e => { if(e.target===goBtn) return; if(reveal>=3) finish(); });
  if(goBtn) goBtn.addEventListener('click', finish);

  let reveal = 0;
  const stopDice = () => {
    reveal = 1;
    if(die){ die.classList.remove('rolling'); die.textContent = cfg.dice.result; die.classList.add(cfg.dice.advState==='adv'?'advantage':(cfg.dice.advState==='dis'?'disadvantage':'')); }
  };
  const showBreak = () => { reveal = 2; if(breakEl) breakEl.style.visibility='visible'; };
  const showOutcome = () => {
    reveal = 3;
    if(outEl){ outEl.style.visibility='visible'; outEl.classList.add('pop'); }
    if(cfg.sfxOutcome) AUDIO.sfx(cfg.sfxOutcome);
  };
  const showResult = () => {
    if(resEl){ resEl.style.visibility='visible'; }
    if(goBtn){ goBtn.style.visibility='visible'; }
  };

  if(cfg.dice){
    setTimeout(stopDice, 750);
    setTimeout(showBreak, 1050);
    setTimeout(showOutcome, 1500);
    setTimeout(showResult, 2050);
    setTimeout(finish, 4200);
  } else {
    setTimeout(showBreak, 250);
    setTimeout(showOutcome, 650);
    setTimeout(showResult, 1150);
    setTimeout(finish, 3200);
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
