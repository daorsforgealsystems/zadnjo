# Frontend Performance & Accessibility Improvements

This document summarizes the small, safe improvements added to the frontend to improve performance, offline support, and accessibility.

## Changes Made

- Code-splitting: The app already uses route-level lazy loading via `React.lazy` and a helper `lazyWithErrorHandling`. No large change required; the existing approach was kept and small fixes were added to ensure lazy imports have robust error boundaries.

- Image optimizations: The `MediaBackground` component uses `loading="lazy"` and `decoding="async"`. Several other images in the app already include descriptive `alt` attributes. The hero background is lazy-loaded.

- Service Worker: A basic `public/sw.js` service worker was added to cache core assets and provide an offline HTML fallback (`/offline.html`). The registration is invoked from `src/main.tsx` (production only). The service worker uses a network-first strategy for API requests and cache-first for static assets.

- Accessibility: A keyboard-accessible "Skip to content" link was added to `index.html`. The hero background includes an `alt`. Where appropriate, components should include ARIA labels and roles; a next step is scanning UI components for missing semantics.

- Documentation: This doc contains setup notes and a troubleshooting section.

## How it works

- The service worker caches the core assets during `install`. On `fetch`, API calls are attempted over network first, with cached fallback. Static assets are served from cache first for faster repeat loads.

- The `skip` link is visible when focused (keyboard navigation) and points to `#main-content`. For components to fully benefit, ensure main page containers include `id="main-content"` and `role="main"`.

## Setup & Local Development

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

Notes:
- The service worker registration is disabled in development. To test service worker behavior locally, build and preview a production build:

```bash
npm run build
npm run preview
```

- Confirm `public/sw.js` is served from the site's root in production. Netlify/other hosts may require configuration to ensure `sw.js` is deployed at the site root.

## API Documentation

This repository ships frontend code only. The app talks to backend services under `/api` and other service prefixes. Recommendations:

- Document backend endpoints in `docs/API.md` (existing) with expected request/response shapes.
- Use an API mock server (e.g., MSW) for frontend development when backend services are unavailable.

## Troubleshooting

- If the app shows stale content after deployment, unregister the service worker in the browser devtools (Application > Service Workers) and hard-refresh. The service worker attempts to update and reload once per new install.

- If images fail to load offline, ensure they are included in `ASSETS_TO_CACHE` in `public/sw.js` or are available via a CDN that permits caching.

- If service worker fails to register in production, check server logs and ensure `sw.js` is reachable at `https://<your-site>/sw.js` and that `Content-Type` is `application/javascript`.

## Next steps (recommended)

- Audit ARIA labels and missing roles across interactive components.
- Add automated lighthouse checks to CI for accessibility and performance budgets.
- Convert large, non-critical bundles to dynamic imports and add prefetch hints for next likely routes.
- Add tests for service worker messaging and update flows.

---

Requirements coverage summary:
- Code splitting: existing lazy imports used (Done)
- Lazy image loading: `MediaBackground` uses `loading="lazy"` (Done)
- Service worker: `public/sw.js` added and registered (Done)
- ARIA/Keyboard: skip link added; further component ARIA improvements recommended (Partially Done)
- Docs: this file added with setup and troubleshooting (Done)
