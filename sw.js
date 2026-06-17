// FuelNear Service Worker v2
// Use the GitHub Pages base path if deployed there
const CACHE = 'fuelnear-v2';

// Determine base path dynamically
const BASE = self.location.pathname.replace(/\/sw\.js$/, '') || '';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll([BASE + '/', BASE + '/index.html']))
      .catch(() => {}) // Don't fail install if caching fails
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always network-first for external APIs and data
  const isExternal = url.hostname !== self.location.hostname;
  if (isExternal) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .catch(() => new Response('{"success":false,"error":"offline"}', {
          headers: { 'Content-Type': 'application/json' }
        }))
    );
    return;
  }

  // Cache-first for app shell (same origin)
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }))
  );
});
