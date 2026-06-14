// ============================================================
// PICCOLI EROI 2 - Bootstrap e router delle schermate
// ============================================================
import { GAME } from './state.js';
import { AUDIO } from './audio.js';
import { renderTitle, renderPrologue, renderTutorial, renderSetup, renderCharCreate,
         renderVillage, renderDialogue, renderShop, renderEquipPick, renderSheet,
         renderInventory, renderUsePick, renderLevelUp, renderDefeat, renderEpilogue,
         renderTavern, renderDifficulty, renderStoryHow, toggleHelp } from './ui-core.js';
import { renderChapterIntro, renderChapterOutro, renderMap, renderEvent,
         renderEventResult, renderPuzzle, renderRestSpot, moveParty,
         startFinaleFight } from './ui-map.js';
import { renderCombat, renderFinaleOffer } from './ui-combat.js';
import { renderStoryChapter, renderStoryMap, renderStoryScene, renderStoryCamp,
         renderStoryEpilogue, renderStoryResolve } from './ui-story.js';
import { SETTINGS, loadSettings } from './state.js';

// GAME accessibile dagli onclick inline
window.GAME = GAME;

function render(){
  switch(GAME.state){
    case 'title':        renderTitle(); break;
    case 'difficulty':   renderDifficulty(); break;
    case 'prologue':     renderPrologue(); break;
    case 'storyHow':     renderStoryHow(); break;
    case 'storyChapter': renderStoryChapter(); break;
    case 'storyMap':     renderStoryMap(); break;
    case 'storyScene':   renderStoryScene(); break;
    case 'storyCamp':    renderStoryCamp(); break;
    case 'storyResolve': renderStoryResolve(); break;
    case 'storyEpilogue':renderStoryEpilogue(); break;
    case 'tutorial':     renderTutorial(); break;
    case 'setup':        renderSetup(); break;
    case 'charCreate':   renderCharCreate(); break;
    case 'village':      renderVillage(); break;
    case 'tavern':       renderTavern(); break;
    case 'dialogue':     renderDialogue(); break;
    case 'shop':         renderShop(); break;
    case 'equipPick':    renderEquipPick(); break;
    case 'sheet':        renderSheet(); break;
    case 'inventory':    renderInventory(); break;
    case 'usePick':      renderUsePick(); break;
    case 'levelup':      renderLevelUp(); break;
    case 'chapterIntro': renderChapterIntro(); break;
    case 'chapterOutro': renderChapterOutro(); break;
    case 'map':          renderMap(); break;
    case 'event':        renderEvent(); break;
    case 'eventResult':  renderEventResult(); break;
    case 'puzzle':       renderPuzzle(); break;
    case 'restSpot':     renderRestSpot(); break;
    case 'combat':       renderCombat(); break;
    case 'finaleOffer':  renderFinaleOffer(); break;
    case 'finaleFightStart': startFinaleFight(); break;
    case 'defeat':       renderDefeat(); break;
    case 'epilogue':     renderEpilogue(); break;
    default:             renderTitle();
  }
}
window.render = render;

// Musica per schermata (usata quando si riattiva l'audio)
AUDIO.getScreenMusic = () => {
  switch(GAME.state){
    case 'title': case 'prologue': case 'tutorial': case 'difficulty': return 'title';
    case 'village': case 'dialogue': case 'storyCamp': return 'village';
    case 'shop': return 'shop';
    case 'map': case 'chapterIntro': case 'storyChapter': case 'storyMap': case 'storyScene': return 'dungeon';
    case 'combat': return GAME.combat && GAME.combat.opts.isBoss ? 'boss' : 'combat';
    case 'epilogue': case 'storyEpilogue': return 'finale';
    default: return null;
  }
};

// Tastiera: WASD / frecce per la mappa
document.addEventListener('keydown', e => {
  if(GAME.state!=='map') return;
  const k = e.key.toLowerCase();
  if(k==='arrowup'||k==='w'){ e.preventDefault(); moveParty(0,-1); }
  else if(k==='arrowdown'||k==='s'){ e.preventDefault(); moveParty(0,1); }
  else if(k==='arrowleft'||k==='a'){ e.preventDefault(); moveParty(-1,0); }
  else if(k==='arrowright'||k==='d'){ e.preventDefault(); moveParty(1,0); }
});

// Audio: init al primo click + bottoni fissi
document.addEventListener('click', function initAudio(){
  AUDIO.init();
}, {once:true});

document.getElementById('helpBtn').addEventListener('click', toggleHelp);
document.getElementById('soundToggle').addEventListener('click', ()=>AUDIO.toggle());
document.getElementById('saveBtn').addEventListener('click', ()=>window.uiShowCode());

// --- Service worker (offline + aggiornamenti automatici) ---
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if(!nw) return;
        nw.addEventListener('statechange', () => {
          if(nw.state === 'installed' && navigator.serviceWorker.controller){
            showUpdateBanner(reg);
          }
        });
      });
    }).catch(()=>{});
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if(refreshing) return; refreshing = true; window.location.reload();
    });
  });
}
function showUpdateBanner(reg){
  if(document.querySelector('.update-banner')) return;
  const b = document.createElement('div');
  b.className = 'update-banner';
  b.innerHTML = `&#10024; Nuova versione disponibile! <button class="btn small green" style="margin-left:8px">Aggiorna</button>`;
  document.body.appendChild(b);
  b.querySelector('button').addEventListener('click', () => {
    if(reg.waiting) reg.waiting.postMessage('skipWaiting');
    b.remove();
  });
}

// Carica impostazioni (font) e avvia
loadSettings();
render();
