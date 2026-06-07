const CACHE_NAME = 'guio-pro-policial-v2';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './sw.js'
];

// Instal·lació: cacheja el shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activació: esborra caches vells
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache first, fallback a xarxa
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req).then(res => {
        // Només cacheja el que és del mateix origen
        if (res.status === 200 && new URL(req.url).origin === location.origin) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        }
        return res;
      });
    }).catch(() => {
      // Si peto i és navegació, torna index per PWA
      if (req.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
