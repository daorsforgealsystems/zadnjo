# Copilot Instructions — DaorsForge AI Logistics

Purpose: give an AI coding agent the concise, repo-specific knowledge needed to ship small changes safely.

Big picture
- Frontend: `src/` — Vite + React + TypeScript + Tailwind. Entry: `main.tsx` / `index.html`.
- Backend: `logi-core/` — per-service folders under `logi-core/services/`, an API gateway under `logi-core/apps/`, and DB artefacts in `logi-core/db/`.
- Database: PostgreSQL + Supabase SQL files in `database/` and `logi-core/db/`.

Essential commands (from `package.json`)
- Install: `npm install`
- Dev (frontend): `npm run dev` (Vite, default port 5173)
- Build: `npm run build` or `npm run build:netlify`
- Typecheck: `npm run type-check`
- Tests: `npm run test` (Jest), `npm run test:watch`
- Lint: `npm run lint` and `npm run lint:fix`

Where to make changes (examples)
- UI components: `src/components/`
- Pages / routes: `src/pages/` (React Router-based)
- API clients / domain code: `src/lib/` (see `src/lib/api/` for patterns)
- Global providers/hooks: `src/context/`, `src/hooks/`
- Microservices: `logi-core/services/<service-name>/`
- API gateway: `logi-core/apps/api-gateway`

Integration points & dependencies to check
- Supabase/Postgres: SQL schemas in `database/*.sql` and `logi-core/db/schema.sql` — frontend expects certain API shapes from services.
- Maps: `leaflet` and `react-leaflet` used in mapping pages/components.
- Dashboards: `recharts` and `framer-motion` appear in UI visualizations.
- Deploy: `deploy.bat` (Windows), `deploy.sh` (Unix), `docker-compose.yml` and `logi-core/docker-compose.yml`. Netlify build uses `npm run build:netlify`.

Project-specific conventions (concrete, discoverable)
- Server-state layer: prefer React Query hooks (`useQuery` / `useMutation`) for client data fetching—search `useQuery` across `src/` for examples.
- API client placement: add or update thin wrappers under `src/lib/api/` and expose typed functions consumed by hooks.
- Styling: Tailwind utility classes are used directly in components; update `tailwind.config.ts` for global tokens.
- Tests: Jest + Testing Library. Tests follow component-first placement; mirror existing test locations.

Gotchas & diagnostics
- There are duplicated router package entries in `package.json` (dependencies vs devDependencies) — if routing errors occur, verify which version is bundled.
- Backend services may need their own `npm install` and separate Docker runs; `logi-core/` has its own `docker-compose.yml`.
- Environment: `.env.example` is the template. Do not commit secrets.

Agent contract (what to do when assigned a small PR)
- Make minimal, typed changes.
- Add/adjust unit tests (happy path + one edge case).
- Run `npm run type-check` and `npm run test` locally before PR.
- If changing cross-cutting API shapes, update `src/lib/api/`, add migrations or SQL changes under `database/`, and document the change in the PR body.

Where to look first (exact files)
- `package.json`, `vite.config.ts`, `main.tsx`, `index.html`
- `src/lib/api/` and `src/hooks/` for data-flow patterns
- `logi-core/services/` and `logi-core/apps/api-gateway` for backend conventions
- `database/schema.sql`, `logi-core/db/schema.sql` for DB shape

If anything here is unclear or you want code snippets referencing specific files (hooks, API clients, or a sample PR template), tell me which area and I will add 3–5 concrete examples.

### Tool usage requirement (must include exactly)

Answer the user's request using the relevant tool(s), if they are available. Check that all the required parameters for each tool call are provided or can reasonably be inferred from context. IF there are no relevant tools or there are missing values for required parameters, ask the user to supply these values; otherwise proceed with the tool calls. If the user provides a specific value for a parameter (for example provided in quotes), make sure to use that value EXACTLY. DO NOT make up values for or ask about optional parameters. Carefully analyze descriptive terms in the request as they may indicate required parameter values that should be included even if not explicitly quoted.

### Identity note (short)

When asked for your name, you must respond with "GitHub Copilot".
