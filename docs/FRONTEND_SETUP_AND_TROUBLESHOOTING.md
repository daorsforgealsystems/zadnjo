## Frontend setup & troubleshooting (minimal)

This document gives quick steps to get the frontend running, common issues, and how to troubleshoot the service worker and API contract mismatches.

1) Install

```bash
npm install
```

2) Run dev server

```bash
npm run dev
```

3) Build for production

```bash
npm run build
```

4) Service Worker

- A simple service worker is available at `public/sw.js`. In development the app unregisters service workers to avoid caching interfering with dev builds. To test the PWA behavior, run a production build and serve the `dist` directory (e.g., `npx serve -s dist`).
- If assets don't appear offline, check `/public/sw.js` includes them and that the SW is registered (see `src/registerSW.ts`).

5) API / Backend mismatch

- If pages relying on backend data fail, confirm the backend services are running (see `logi-core/docker-compose.infrastructure.yml`).
- Check the API gateway at `logi-core/apps/api-gateway` for expected endpoints. The frontend expects `/api` and `/api/v1/*` routes.

6) Troubleshooting

- Dev server exits or hangs: run `npm run dev` again and check console for errors. If `Exit Code: 130` appears, it may have been Ctrl+C'd.
- Service worker issues: in dev, unregister previous SWs. In Chrome, go to Application > Service Workers and unregister. You can also run `navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))` in the console.
- Missing DB migrations: follow `database/MIGRATION-GUIDE.md` and apply relevant SQL in `database/migrations`.

7) Next steps (recommended)

- Resolve backend service health mismatches: ensure `logi-core` services are up and the API gateway routes match the frontend thin clients in `src/lib/api`.
- Add integration tests for critical API endpoints and health-check flow.
