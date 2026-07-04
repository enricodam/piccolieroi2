// ============================================================
// PICCOLI EROI 2 - Service worker
// Strategia "network-first": online prende SEMPRE l'ultima versione
// (quindi niente refresh manuali), offline usa la copia in cache.
// ============================================================
const VERSION = 'v3';
const CACHE = 'piccoli-eroi-' + VERSION;

const ASSETS = [
  './', './index.html', './css/style.css', './manifest.webmanifest', './favicon.png',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png',
  './icons/icon-512-maskable.png', './icons/icon-32.png',
  './js/main.js', './js/state.js', './js/rules.js', './js/data.js', './js/campaign.js',
  './js/story.js', './js/sprites.js', './js/audio.js', './js/cinematic.js',
  './js/ui-core.js', './js/ui-map.js', './js/ui-combat.js', './js/ui-story.js',
];

self.addEventListener('install', e => {
  // Niente catch: se un asset manca l'install DEVE fallire, cosi' resta
  // attivo il SW precedente (aggiornamento atomico) invece di un precache
  // silenziosamente incompleto che rompe l'offline.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // font esterni ecc: lascia al browser
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      // Solo risposte valide in cache: un 404/500 cachato verrebbe
      // servito offline per sempre al posto della copia buona
      if (fresh.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const idx = await caches.match('./index.html');
        if (idx) return idx;
      }
      throw err;
    }
  })());
});
