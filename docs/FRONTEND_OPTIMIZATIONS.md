# Frontend Performance & Accessibility Improvements

This document summarizes the recent low-priority (nice-to-have) improvements applied to the frontend to improve performance, accessibility, and offline capabilities.

## What I changed
- Added route-level code-splitting is already present via `React.lazy` and a `lazyWithErrorHandling` wrapper — kept and left as the primary code-splitting mechanism.
- Added a basic Service Worker at `public/sw.js` with caching strategies (cache-first for static assets, network-first for /api requests, offline fallback for navigation).
- Registered the service worker from `src/main.tsx` using `src/registerSW.ts` (registration is a no-op in dev).
- Optimized hero background loading via `loading="lazy"` in `src/components/MediaBackground.tsx` (already present).
- Added an accessible "Skip to content" link in `index.html` and marked the main app container with `id="main-content"` and `role="main"` in `src/App.tsx`.

## How to run locally

Start the dev server (service worker is skipped in dev):

```bash
npm install
npm run dev
```

Build for production and preview (service worker will be registered):

```bash
npm run build
npm run preview
```

Notes:
- The service worker is intentionally conservative and will skip registration in development and headless test environments. You can force-skip it in production by adding `?no-sw=1` to the URL.

## API documentation (frontend-facing)

- The frontend expects backend APIs under `/api/*`. The service worker treats requests whose path starts with `/api` as network-first (live preferred, fallback to cache).
- Health checks: the app expects backend services to be available and may time out on initial loading if services are down. See `src/components/LoadingScreen.tsx` for timeout behavior and retry patterns.

## Troubleshooting

- Service worker not updating: open DevTools > Application > Service Workers and check the status. You can unregister the worker there, or use `?no-sw=1` to skip registration.
- Assets not loading offline: confirm `public/sw.js` includes the asset path and rebuild the app. The SW caches `/', '/index.html', '/offline.html', '/favicon.ico', '/pwa-192x192.png', '/pwa-512x512.png', '/hero-logistics.jpg'` by default.
- Dev server still showing old content: Clear site data and disable SW in DevTools, then reload.
- Missing backend services / health check failures: verify the backend containers/services are running (see `docker-compose.yml` and `logi-core/docker-compose.yml`) and that API hostnames match the frontend's expected origins.

## Next steps (recommended)

- Add more granular chunking with route-based prefetching for high-traffic flows.
- Implement image srcset and modern formats (WebP/AVIF) for hero and product images with responsive selection.
- Expand the service worker strategy to use Workbox for robust strategies and analytics about updates.
- Add automated tests verifying SW registration and offline fallbacks.

If you'd like, I can open a follow-up PR to implement image srcset generation and Workbox integration.
