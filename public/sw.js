// ShikshaGap Service Worker: App-Shell Only
// Version: v1.3-shell
const CACHE_NAME = 'shikshagap-shell-v1.3';
const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/offline.html',
  '/licenses',
  '/privacy',
  '/terms',
  '/cookies'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // SECURITY: Strictly ignore and never cache API calls or authenticated routes
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/app')) {
    return; // Pass through to network directly
  }

  // Non-GET requests should never be cached
  if (request.method !== 'GET') {
    return;
  }

  // Cache-first for static shell assets, network fallback with offline page
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).catch(() => {
        // If navigating to a document while offline, serve offline fallback
        if (request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});
