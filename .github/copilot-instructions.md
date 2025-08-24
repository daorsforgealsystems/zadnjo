# Copilot Instructions — DaorsForge AI Logistics

Purpose: short, repo-specific guidance so an AI coding agent can make safe, small changes quickly.

Big picture
- Frontend: `src/` — Vite + React + TypeScript + Tailwind. Entrypoints: `src/main.tsx` and `index.html`.
- Backend: `logi-core/` contains per-service folders under `logi-core/services/` and an API gateway at `logi-core/apps/api-gateway`.
- Database: PostgreSQL (Supabase-compatible). Schema, migrations and seed data live in `database/` and `logi-core/db/`.

Essential commands (what to run locally)
- Install (root): `npm install`. Note: some services in `logi-core/` have their own `package.json` — run `npm install` inside them when working on backend code.
- Dev (frontend): `npm run dev` (Vite — default port 5173).
- Build: `npm run build` (site) and `npm run build:netlify` (Netlify flavor).
- Typecheck: `npm run type-check`. A VS Code task `run:type-check` exists.
- Tests: `npm run test` (Vitest + Testing Library). Config: `vitest.config.ts`, `vitest.setup.ts`.
- Lint: `npm run lint` and `npm run lint:fix`.
- Docker: root `docker-compose.yml` for the full stack; `logi-core/docker-compose.yml` for backend-only runs.

Concrete repo conventions (follow these exactly)
- Data fetching: prefer React Query hooks (`useQuery` / `useMutation`) — search for `useQuery` in `src/` to see patterns.
- API clients: place thin, typed wrappers in `src/lib/api/` (example pattern: functions that return typed DTOs consumed by `src/hooks/`).
- Styling: Tailwind utilities in components; update tokens in `tailwind.config.ts`.
- Tests: use Vitest. Keep tests colocated with components when appropriate and use `vitest.setup.ts` for global mocks.

Integration & cross-cutting
- Frontend ↔ backend: frontend expects specific JSON shapes — check `src/lib/api/*` for expected shapes and `logi-core/apps/api-gateway` for server-side adapters.
- DB changes: when altering schemas, add SQL migrations/changes in `database/` and reflect service DB artifacts in `logi-core/db/`.
- Third-party libs: mapping uses `leaflet`/`react-leaflet`; dashboards use `recharts` and `framer-motion`.

Repository gotchas
- `package.json` has duplicated router entries (dependencies vs devDependencies). If router-related runtime errors occur, verify which version is bundled.
- Backend services under `logi-core/` may require separate `npm install` and independent Docker runs — don't assume root install covers them.
- Use `.env.example` as a template. Never commit secrets.

Agent small-PR contract (required steps for any small change)
1. Make minimal, typed changes and keep commits small.
2. Add/update a focused test (happy path + one edge case) using Vitest.
3. Run `npm run type-check` and `npm run test`; fix failures before opening a PR.
4. If you change API shapes or DB fields: update `src/lib/api/`, add SQL migration(s) in `database/`, and update `logi-core/db/schema.sql` as needed — document these in the PR body.

Where to inspect first (exact files)
- `package.json`, `vite.config.ts`, `src/main.tsx`, `index.html`
- `src/lib/api/`, `src/hooks/`, `src/context/` for data-flow and auth patterns
- `logi-core/apps/api-gateway`, `logi-core/services/*/` for backend behavior
- `database/schema.sql`, `database/sample-data.sql`, `logi-core/db/schema.sql` for DB shape
- `vitest.config.ts`, `vitest.setup.ts` for test wiring

Tool usage requirement (must include exactly)

Answer the user's request using the relevant tool(s), if they are available. Check that all the required parameters for each tool call are provided or can reasonably be inferred from context. IF there are no relevant tools or there are missing values for required parameters, ask the user to supply these values; otherwise proceed with the tool calls. If the user provides a specific value for a parameter (for example provided in quotes), make sure to use that value EXACTLY. DO NOT make up values for or ask about optional parameters. Carefully analyze descriptive terms in the request as they may indicate required parameter values that should be included even if not explicitly quoted.

Identity note (short)

When asked for your name, you must respond with "GitHub Copilot".

Examples (concrete patterns)
- API client wrapper (example file: `src/lib/api/orders.ts`)

```ts
// src/lib/api/orders.ts (thin, typed wrapper)
export type Order = { id: string; items: { sku: string; qty: number }[]; status: string };

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch('/api/orders');
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}
```

- React Query hook that consumes the client (example file: `src/hooks/useOrders.ts`)

```ts
// src/hooks/useOrders.ts
import { useQuery } from '@tanstack/react-query';
import { fetchOrders, Order } from '../lib/api/orders';

export function useOrders() {
  return useQuery<Order[], Error>({ queryKey: ['orders'], queryFn: fetchOrders });
}
```

- Backend service layout (example folder: `logi-core/services/inventory-service/`)

```
logi-core/services/inventory-service/
  ├─ package.json           # service dependencies + scripts
  ├─ src/
  │   ├─ index.ts          # service entry (express/fastify) wiring
  │   └─ controllers/
  │       └─ inventory.ts  # handlers calling DB from logi-core/db
  └─ Dockerfile
```

Notes on these examples
- Keep API wrappers slim: do not embed complex transforms — transformations belong to hooks or components.
- Put shared DTO types next to the client (`src/lib/api/types.ts`) so hooks and components import the same typings.
- When changing an endpoint shape, update both the client in `src/lib/api/` and any affected hooks in `src/hooks/`.
