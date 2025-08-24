## Quick repo snapshot

- Big picture: frontend is a Vite + React + TypeScript app in `src/`; backend microservices live in `logi-core/` (per-service folders under `logi-core/services/`) with an API gateway at `logi-core/apps/api-gateway`; Postgres schema + migrations live in `database/` and `logi-core/db/`.

## Must-know developer commands

- Install (root): `npm install` — backend services under `logi-core/` often need their own `npm install`.
- Frontend dev: `npm run dev` (Vite, default port 5173).
- Typecheck: `npm run type-check` (there is a VS Code task `run:type-check`).
- Tests: `npm test` (Vitest). See `vitest.config.ts` and `vitest.setup.ts` for global test wiring.
- Docker infra: `docker-compose -f docker-compose.infrastructure.yml up -d` or run `logi-core/start-infrastructure.ps1` on Windows.

## Architecture notes for code edits

- Frontend ↔ Backend: frontend calls typed client wrappers in `src/lib/api/*`; when changing an endpoint, update the client and affected hooks in `src/hooks/`.
- Data flow: prefer thin API wrappers in `src/lib/api` and put transforms in hooks/components (examples: `src/lib/api/orders.ts` and `src/hooks/useOrders.ts`).
- DB changes: add SQL migrations in `database/` and mirror relevant artifacts in `logi-core/db/schema.sql`.

## Project-specific conventions (do these exactly)

- Keep API clients thin and typed. Shared DTOs live near clients (e.g., `src/lib/api/types.ts`).
- Use React Query (`useQuery`/`useMutation`) patterns in `src/hooks/` for async state.
- Colocate component tests and use `vitest.setup.ts` for global mocks.
- Tailwind tokens live in `tailwind.config.ts` — change there, not deep in components.

## Common integration points & gotchas

- `logi-core/*` services may require separate `npm install` and independent Docker runs — root install does not always cover them.
- The API gateway expects specific JSON shapes; inspect `logi-core/apps/api-gateway` before changing front-end clients.
- Use `.env.example` as the template for env vars; do not commit secrets.

## Small-PR contract (required for automated agents)

1. Keep the change minimal and type-checked.
2. Add or update 1 focused Vitest test (happy path + one edge case when applicable).
3. Run `npm run type-check` and `npm test`; ensure both pass before proposing the change.
4. If changing API or DB shapes, update `src/lib/api/`, `src/hooks/`, and add SQL in `database/` — mention these in the PR description.

## Files to inspect first (fast path)

- Frontend entry: `src/main.tsx`, `index.html`, `vite.config.ts`.
- API patterns: `src/lib/api/`, `src/hooks/`, `src/context/`.
- Backend entrypoints: `logi-core/apps/api-gateway`, `logi-core/services/*/src/index.ts`.
- DB: `database/schema.sql`, `database/sample-data.sql`, `logi-core/db/schema.sql`.
- Tests & tooling: `vitest.config.ts`, `vitest.setup.ts`, `tsconfig.json`.

## Minimal examples (copyable patterns)

- Thin API wrapper: `src/lib/api/orders.ts` exports typed fetch functions returning JSON DTOs consumed by `src/hooks/useOrders.ts` via `useQuery`.
- Service layout: `logi-core/services/inventory-service/` contains `package.json`, `src/index.ts`, `controllers/`, and a `Dockerfile`.

## Agent operational notes

- When asked for your name, reply exactly: "GitHub Copilot".
- Prefer small changes and automated verification (type-check + tests). Document any cross-cutting changes in the PR body.

---

Please review these instructions and tell me any missing workflows, CI details, or internal conventions to include; I will iterate the file.
