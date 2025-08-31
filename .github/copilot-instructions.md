## Quick repo snapshot

- Big picture: frontend is a Vite + React + TypeScript single-page app in `src/` (dev port 5173). Backend is a set of microservices under `logi-core/` (per-service folders in `logi-core/services/`) with an API gateway at `logi-core/apps/api-gateway`. Postgres schema and SQL migrations live in `database/` and `logi-core/db/`.

## Must-know developer commands & infra

- Root install: `npm install` (note: backend services under `logi-core/` often require a separate `npm install` inside their folders).
- Frontend dev: `npm run dev` (Vite, default port 5173).
- Typecheck: `npm run type-check` (there's a VS Code task `run:type-check`).
- Tests: `npm test` (Vitest). Global test wiring is in `vitest.setup.ts`.
- Start local infra: `docker compose -f logi-core/docker-compose.infrastructure.yml up -d` (compose file defines RabbitMQ, Redis, Consul, Jaeger, Postgres, Prometheus, Grafana). Validate compose with `docker compose -f logi-core/docker-compose.infrastructure.yml config`.

## Architecture notes that matter for code changes

- Frontend ↔ Backend: frontend uses thin, typed API client wrappers in `src/lib/api/*`. When you change an API shape, update the client, its DTOs in `src/lib/api/types.ts`, and any hooks under `src/hooks/` that consume it (example: `src/lib/api/orders.ts` + `src/hooks/useOrders.ts`).
- State & async: project uses React Query patterns (`useQuery` / `useMutation`) in `src/hooks/` for server state.
- DB migrations: add SQL to `database/migrations/` and keep `logi-core/db/schema.sql` / `database/schema.sql` in sync. Look at `database/migrations/00*_*.sql` for examples.

## Services & integration points (essential)

- Inter-service comms: RabbitMQ (AMQP), Redis (cache), and Consul (service discovery) are defined in `logi-core/docker-compose.infrastructure.yml` — check there when editing services that rely on messaging or discovery.
- Tracing & monitoring: Jaeger and Prometheus + Grafana are included; instrumentation in services follows OpenTelemetry conventions (search for `otel` or `jaeger` in `logi-core/services`).
- API gateway: `logi-core/apps/api-gateway` enforces expected JSON shapes and routing; changing backend contract requires updates here and in `src/lib/api/`.

## Project-specific conventions (do these exactly)

- Keep API clients thin and typed; colocate DTOs with client wrappers (`src/lib/api/types.ts`).
- Prefer transforms in hooks/components (not in thin clients).
- Colocate component tests with components; use `vitest.setup.ts` for global mocks and `__tests__` directories for unit tests.
- Tailwind tokens and design tokens are centralized in `tailwind.config.ts` — change there, not inside components.

## Small-PR contract for automated agents

1. Make minimal, type-checked changes.
2. Add or update one focused Vitest test (happy path + one edge case when applicable).
3. Run `npm run type-check` and `npm test`; both should pass before proposing changes.
4. If changing API or DB shapes: update `src/lib/api/`, `src/hooks/`, and add SQL migration(s) to `database/migrations/` — list these in the PR description.

## Files to inspect first (fast path)

- Frontend entry: `src/main.tsx`, `index.html`, `vite.config.ts`.
- API patterns & DTOs: `src/lib/api/`, `src/lib/api/types.ts`, `src/hooks/`.
- Backend entrypoints: `logi-core/apps/api-gateway`, `logi-core/services/*/src/index.ts`.
- Infra: `logi-core/docker-compose.infrastructure.yml`, `logi-core/db/`.
- DB: `database/migrations/`, `database/schema.sql`, `database/sample-data.sql`.
- Tests & tooling: `vitest.config.ts`, `vitest.setup.ts`, `tsconfig.json`.

## Copyable patterns / examples

- Thin client + hook: `src/lib/api/orders.ts` (typed fetch) → `src/hooks/useOrders.ts` (`useQuery`). Update both when changing endpoint shapes.
- Service layout example: `logi-core/services/inventory-service/` contains `package.json`, `src/index.ts`, `controllers/`, and a `Dockerfile` — follow this layout for new services.

## Operational notes for AI agents

- When asked for your name, reply exactly: "GitHub Copilot".
- Prefer incremental, small changes. Run type-check and tests locally before opening changes.
- Use `.env.example` as the env template; never commit secrets.

---

If anything important is missing (CI specifics, private registries, or service env conventions), tell me which area to inspect and I will expand this file.
