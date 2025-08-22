---
description: Repository Information Overview
alwaysApply: true
---

# Repository Information Overview

## Summary

This repository contains a logistics platform with a React frontend (Flow Motion) and a microservices backend (LogiCore). The frontend is built with Vite, React, TypeScript, and Tailwind CSS. The backend is a monorepo under `logi-core/` and contains multiple services, database migrations, and deployment manifests.

## Projects

### Frontend (Flow Motion)

**Tech stack**: Vite, React, TypeScript, Tailwind CSS

**Entry points**: `src/main.tsx`, `index.html`

**Main dependencies**:

- React 18.x
- React Router
- Tailwind CSS
- shadcn/ui (Radix UI)
- i18next
- Supabase client
- Framer Motion
- Leaflet

**Dev dependencies**:

- Jest (Testing)
- ESLint (Linting)
- TypeScript

#### Netlify (Build & Deploy)

Use `netlify.toml` for build settings and environment. Recommended settings:

- Build command: `npm run build:netlify` or `npm run build`
- Publish directory: `dist` (Vite default)
- Environment variables: set in Netlify dashboard or in `netlify.toml` / Netlify UI (do not commit secrets)

Example `netlify.toml` snippet:

```toml
[build]
	command = "npm run build:netlify"
	publish = "dist"

[context.production.environment]
	VITE_SUPABASE_URL = "${env:VITE_SUPABASE_URL}"
	VITE_SUPABASE_ANON_KEY = "${env:VITE_SUPABASE_ANON_KEY}"
```

Keep sensitive keys in Netlify environment variables, not in the repo.

#### Supabase (Client)

Frontend uses Supabase for auth and DB. Recommended environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Add a `.env.example` with placeholder values, and ensure `.env` is ignored in `.gitignore`.

Example `.env.example`:

```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Do not commit real keys.

#### Frontend dev commands (PowerShell)

```powershell
npm install
npm run dev
npm run build
npm run type-check
npm test
```

### LogiCore Backend

**Location**: `logi-core/`

**Languages**: Node.js, Python

**Build system**: npm workspaces

**Database**: PostgreSQL (schemas and migrations in `database/` and `logi-core/db/`)

**Services**: API gateway, user-service, inventory-service, routing-service, order-service, notification-service, geolocation-service, etc.

#### Docker & Infrastructure

- Dockerfiles present per service, prefer multi-stage builds for smaller images
- Kubernetes manifests and overlays in `k8s/`
- Terraform for cloud infra (where applicable)

#### Backend dev commands (PowerShell)

```powershell
cd logi-core/apps/api-gateway
npm install
npm run dev

cd ..\..\services\user-service
npm install
npm run dev

# For Python services
cd ..\inventory-service
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Database

- Engine: PostgreSQL
- Main schema files: `database/schema.sql`, `logi-core/db/schema.sql`
- Place migrations in `database/migrations/` or `logi-core/db/migrations/`

## Testing & Quality

- Testing: Jest + React Testing Library for frontend; pytest/pytest-asyncio or unittest for Python services
- Linting: ESLint for JS/TS, flake8/ruff for Python where applicable
- Type checking: TypeScript strict mode and `npm run type-check`

## Deployment

- Netlify for frontend (see `netlify.toml`)
- Docker / Kubernetes or cloud-specific deploy for backend
- Use `deploy.sh` / `deploy.bat` or CI pipelines to automate deployments

## Zen Agent (GPT-5) — Zen Coder Rules

The repository's automated assistant (Zen Agent) will use GPT-5 for code generation and review. The agent must follow these rules:

1. *Minimalism*: Produce minimal, correct changes. No unused imports or extraneous files.
2. *Atomic Commits*: Group changes logically; one concern per commit/PR.
3. *Explicitness*: Prefer explicit configuration and clear types. Avoid hidden side effects.
4. *Type Safety*: Always add/maintain types for public interfaces. TypeScript functions and React props should be annotated.
5. *Fail Fast*: Validate inputs and return clear errors. Use assertions where appropriate.
6. *Test First*: Add or update tests for the behaviour you change. Cover happy path + edge cases.
7. *Self-Documenting Code*: Prefer readable code and clear names over comments. Add docs for complex flows.
8. *No Secrets in Repo*: Never write real credentials into files. Use env vars and secret stores.
9. *Review Ready*: Ensure changes pass lint, type-check, and tests locally before opening PR.
10. *Continuous Improvement*: When touching files, improve structure or add small tests where sensible.

_Operational note_: the Zen Agent must prefer local edits and CI-friendly changes. For Azure or other cloud targets, follow provider best practices and do not embed secrets.

## Contribution Guidelines

- Make minimal, typed changes.
- Add/adjust unit tests (happy path + at least one edge case).
- Run `npm run type-check` and `npm test` before submitting a PR.
- Document cross-cutting changes, migrations, or schema updates in the PR description.

## Quick Reference

- UI components: `src/components/`
- Pages/routes: `src/pages/`
- API clients: `src/lib/api/`
- Global providers/hooks: `src/context/`, `src/hooks/`
- Microservices: `logi-core/services/`
- API gateway: `logi-core/apps/api-gateway`
- DB schema: `database/schema.sql`, `logi-core/db/schema.sql`

---

If you'd like, I can also:

- update `netlify.toml` with the example above (safe, non-secret values),
- add a `.env.example` with Supabase placeholders, and/or
- run a markdown lint pass and fix any remaining warnings.

Tell me which of those follow-ups you'd like me to perform next.