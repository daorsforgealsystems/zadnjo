// Basic service worker for offline support and caching strategies
const CACHE_NAME = 'zadnjo-static-v1';
const OFFLINE_URL = '/offline.html';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.ico',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/hero-logistics.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return Promise.resolve();
        })
      )
    )
  );
  self.clients.claim();
});

// Simple network-first for API and navigation, cache-first for other static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass non-GET
  if (request.method !== 'GET') return;

  // API requests: network-first with fallback to cache
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/logi-core')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For navigation or HTML pages: try network then fallback to offline page
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((res) => res)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Static resources: cache-first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      // Put in cache for future
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return res;
    }).catch(() => {
      // If request is an image and fails, return a transparent 1x1 SVG as fallback
      if (request.destination === 'image') {
        return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>', {
          headers: { 'Content-Type': 'image/svg+xml' }
        });
      }
    }))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
