/* Basic service worker for offline support
   - Cache-first for static assets
   - Network-first for API calls
   - Navigation fallback to /offline.html
*/
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
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Simple routing: network-first for /api, cache-first for others
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass non-GET
  if (request.method !== 'GET') return;

  // Network-first for API routes
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request).then((resp) => {
        // Update cache for successful responses
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return resp;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // For navigation requests, try network then cache then offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((resp) => resp).catch(() => caches.match(request).then((r) => r || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Default: try cache first then network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((resp) => {
      // Cache images and static assets
      if (request.destination === 'image' || request.destination === 'script' || request.destination === 'style') {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return resp;
    }).catch(() => null))
  );
});

// Simple message handler (skip waiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
