# CI/CD Guide

This document is a self-contained, end-to-end reference for how continuous integration and deployment work in this repository. It covers providers, workflow files and links, what each job does, test matrices, caching, artifacts, coverage, security scanning, triggers and conditions, required checks and branch protection, deployment automation, runners and infrastructure, secrets and identity, IaC/Kubernetes usage, third‑party integrations and notifications, developer experience guidance, and a quick start change lifecycle.

--------------------------------------------------------------------------------
1) Providers and pipeline existence
- GitHub Actions: CI exists and is defined at [.github/workflows/ci.yml](.github/workflows/ci.yml:1)
- Netlify: Frontend continuous deployment is configured via [netlify.toml](netlify.toml:1) with environment contexts; process documented in [docs/NETLIFY_DEPLOYMENT_GUIDE.md](docs/NETLIFY_DEPLOYMENT_GUIDE.md:1)
- Codecov: Coverage upload via codecov/codecov-action in [.github/workflows/ci.yml](.github/workflows/ci.yml:97)

No other CI providers (GitLab CI, CircleCI, Jenkins, Azure Pipelines) are configured in this repo.

--------------------------------------------------------------------------------
2) Workflow files and links
- GitHub Actions workflows directory: [.github/workflows/](.github/workflows/ci.yml:1)
  - CI Pipeline: [.github/workflows/ci.yml](.github/workflows/ci.yml:1)

Related config and scripts referenced by the pipeline:
- Root package manifest and scripts: [package.json](package.json:1)
- Frontend Docker build: [Dockerfile](Dockerfile:1)
- Local orchestration: [docker-compose.yml](docker-compose.yml:1)
- Frontend deployment config (Netlify): [netlify.toml](netlify.toml:1)
- Deployment how-to: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md:1)
- Database SQL and migrations:
  - [database/logicore-schema.sql](database/logicore-schema.sql:1)
  - [database/add-frontend-tables-to-logicore.sql](database/add-frontend-tables-to-logicore.sql:1)
  - [database/add-orders-table.sql](database/add-orders-table.sql:1)
  - Migrations folder: [database/migrations/](database/migrations/001_init_schema.sql:1)

--------------------------------------------------------------------------------
3) CI workflow: jobs, order, and responsibilities
Workflow: CI Pipeline at [.github/workflows/ci.yml](.github/workflows/ci.yml:1)

Triggers
- push: branches [main, develop] [.github/workflows/ci.yml](.github/workflows/ci.yml:3)
- pull_request: branches [main, develop] [.github/workflows/ci.yml](.github/workflows/ci.yml:6)

Global env
- NODE_VERSION: 20 [.github/workflows/ci.yml](.github/workflows/ci.yml:9)

Jobs (run on hosted Ubuntu runners):
1) setup [.github/workflows/ci.yml](.github/workflows/ci.yml:13)
   - actions/checkout
   - Generate cache key keyed on OS, Node version, and hash of all package-lock.json files
   - Exposes outputs.cache-key used by dependent jobs

2) lint-and-typecheck (needs: setup) [.github/workflows/ci.yml](.github/workflows/ci.yml:25)
   - actions/checkout
   - actions/setup-node with Node 20 and npm cache
   - Cache ~/.npm using setup.cache-key
   - npm ci
   - npm run lint (ESLint) — see [package.json](package.json:9)
   - npm run type-check (tsc --noEmit)
   - npm run validate:components (custom script) — see [scripts/validate-components.js](scripts/validate-components.js:1)

3) test (needs: setup) [.github/workflows/ci.yml](.github/workflows/ci.yml:58)
   - actions/checkout
   - actions/setup-node with npm cache
   - Cache ~/.npm using setup.cache-key
   - npm ci
   - Unit tests: npm run test -- --run (Vitest) with test env vars
   - Coverage: npm run test:coverage -- --run
   - Upload coverage: codecov/codecov-action@v4 with token and file ./coverage/coverage-final.json

   Notes:
   - Coverage provider: @vitest/coverage-v8 (see [package.json](package.json:81))
   - No configured coverage threshold gate in CI (fails do not block by coverage)

4) build (needs: setup) with matrix build-mode: [development, production] [.github/workflows/ci.yml](.github/workflows/ci.yml:105)
   - actions/checkout
   - actions/setup-node with npm cache
   - Cache ~/.npm using setup.cache-key
   - npm ci
   - Cache Vite outputs: paths .vite and dist keyed on OS, build-mode, and hash of vite.config.ts and src/**
   - If development: npm run build:dev, with DEV API/Supabase env
   - If production: npm run build:netlify, with PROD API/Supabase env
   - Upload artifact: dist-${{ matrix.build-mode }} (retention 7 days)

5) security-scan (needs: setup) [.github/workflows/ci.yml](.github/workflows/ci.yml:163)
   - actions/checkout
   - actions/setup-node
   - npm ci
   - npm audit --audit-level=high (hard fail)
   - npm audit --audit-level=moderate --json > audit-results.json || true (soft collect)
   - Upload artifact: security-scan-results (retention 30 days)

6) bundle-analysis (needs: [setup, build], PR-only) [.github/workflows/ci.yml](.github/workflows/ci.yml:192)
   - actions/checkout
   - Download dist-production artifact to dist/
   - Run github/super-linter@v5 with validation for JS/TS/CSS/HTML
   Note: Despite the job name, this currently runs static linters, not a true bundle size analyzer.

7) deployment-ready (needs: [lint-and-typecheck, test, build, security-scan], if: always) [.github/workflows/ci.yml](.github/workflows/ci.yml:218)
   - Shell gate that prints each dependency job result and:
     - exits 0 if all four were "success"
     - exits 1 otherwise
   - Effective as an aggregate check for PRs

8) apply-migrations (optional; needs: setup; runs only if secret DEV_SUPABASE_DB_URL is set) [.github/workflows/ci.yml](.github/workflows/ci.yml:246)
   - actions/checkout
   - apt-get install postgresql-client
   - Applies selected SQL files to dev database using psql:
     - [database/logicore-schema.sql](database/logicore-schema.sql:1)
     - [database/add-frontend-tables-to-logicore.sql](database/add-frontend-tables-to-logicore.sql:1)
     - [database/add-orders-table.sql](database/add-orders-table.sql:1)

What’s covered vs not covered
- Type-checking: Yes (tsc)
- Linting: Yes (ESLint)
- Unit tests: Yes (Vitest)
- Integration/E2E tests: Not configured
- Builds/packaging: Yes (Vite builds dev and prod)
- Docker image builds/pushes: Not configured in CI; Dockerfile exists at [Dockerfile](Dockerfile:1)
- Code generation/schema checks: Component validation script; no codegen tooling wired into CI
- Database migrations: Optional job for DEV only (psql-based)
- Bundle size checks: Not implemented; job name is misleading

--------------------------------------------------------------------------------
4) Test matrix, services, and execution environment
- Runners: Hosted GitHub Actions runners (runs-on: ubuntu-latest for all jobs)
- Languages/tools:
  - Node.js 20 (global env; setup-node uses 20)
  - npm cache: enabled via actions/setup-node cache and actions/cache on ~/.npm
- Matrix:
  - Only the build job uses a matrix (build-mode: development, production)
  - No OS/architecture or Node version matrix
- Service containers: None used
- Databases: No containers for tests; optional migrations target a remote DEV Supabase DB if secret present
- Parallelism:
  - Jobs run independently; build uses a matrix to create parallel runs for dev/prod
- Timeouts:
  - No explicit job timeouts (default GitHub Actions limits apply)
- Retries / flake handling:
  - No retry strategies or flake suppression configured

--------------------------------------------------------------------------------
5) Caching, artifacts, coverage
- Dependency caching:
  - npm cache at ~/.npm keyed by: setup output "${{ runner.os }}-node-${{ env.NODE_VERSION }}-${{ hashFiles('**/package-lock.json') }}"
  - Restore keys: "${{ runner.os }}-node-${{ env.NODE_VERSION }}-"
- Build caching:
  - Vite cache and build outputs: .vite and dist; key includes OS, build-mode, and hash of vite.config.ts and src/**
- Artifacts:
  - Build artifacts: "dist-development", "dist-production"; path: dist/; retention: 7 days [.github/workflows/ci.yml](.github/workflows/ci.yml:156)
  - Security scan results: "security-scan-results"; path: audit-results.json; retention: 30 days [.github/workflows/ci.yml](.github/workflows/ci.yml:185)
- Coverage:
  - Tooling: Vitest coverage via v8 provider; uploaded with codecov/codecov-action@v4 [.github/workflows/ci.yml](.github/workflows/ci.yml:97)
  - Files: ./coverage/coverage-final.json
  - Thresholds: Not enforced in CI
  - External service: Codecov (token required via CODECOV_TOKEN secret)

--------------------------------------------------------------------------------
6) Security scanning, SBOM, signing, provenance
- Static app security (SAST): Not configured
- Dependency scanning: npm audit (high -> fail; moderate -> collect)
- Container scanning: Not configured
- Secret scanning: Not configured in this repo (GitHub may provide org-level or repo-level secret scanning)
- SBOM creation/publication: Not configured
- Artifact/image signing and provenance (SLSA, attestations): Not configured

Suggested additions (not yet implemented):
```yaml
# Add CodeQL
name: CodeQL
on:
  push: { branches: [main, develop] }
  pull_request: { branches: [main, develop] }
jobs:
  analyze:
    uses: github/codeql-action/.github/workflows/codeql.yml@v3
```
```yaml
# Add SBOM & dep scan with Anchore/Syft/Grype
- uses: anchore/sbom-action@v0
  with: { path: ., format: spdx-json, artifact-name: sbom-spdx.json }
- uses: anchore/scan-action@v5
  with: { path: ., fail-build: false }
```
```yaml
# Sign images with cosign
- uses: sigstore/cosign-installer@v3
- run: cosign sign ghcr.io/your-org/your-image:${{ github.sha }}
  env:
    COSIGN_EXPERIMENTAL: "true"
```

--------------------------------------------------------------------------------
7) Triggers, filters, concurrency, skipping
- Triggers:
  - push on branches: main, develop [.github/workflows/ci.yml](.github/workflows/ci.yml:3)
  - pull_request targeting: main, develop [.github/workflows/ci.yml](.github/workflows/ci.yml:6)
- Tags/schedules/manual:
  - No tag-based releases, no schedule, and no workflow_dispatch/repository_dispatch
- Branch/path filters:
  - No path filters; entire repo triggers on listed branches
- Monorepo scoping:
  - Not used (repo contains frontend and logi-core subdirs; CI runs from repo root)
- Concurrency and cancel-in-progress:
  - Not configured; consider adding a concurrency group to auto-cancel superseded runs

Example addition:
```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```
- Skip/force conventions:
  - No explicit skip/force conditions configured in YAML

--------------------------------------------------------------------------------
8) Required status checks and branch protection
- The repo contains no CODEOWNERS file and no branch protection config files.
- Recommended required status checks (names match GitHub check-run names):
  - "lint-and-typecheck"
  - "test"
  - "build (build-mode: development)"
  - "build (build-mode: production)"
  - "security-scan"
  - "deployment-ready" (aggregate gate)
  - For PR-only jobs, you may include "bundle-analysis"
- Branch protection settings (recommended in GitHub Settings):
  - Require pull request reviews: at least 1-2 approvals
  - Enforce CODEOWNERS: add a CODEOWNERS file at [.github/CODEOWNERS](.github/CODEOWNERS)
  - Require status checks to pass before merge: checks above
  - Require branches up to date before merging: enabled
  - Require signed commits or DCO: optional; not currently enforced
  - Allowed merge strategies: prefer "squash"; allow merge commits and/or rebase per team policy

--------------------------------------------------------------------------------
9) Deployment automation
Frontend (Netlify)
- Configuration: [netlify.toml](netlify.toml:1) and [docs/NETLIFY_DEPLOYMENT_GUIDE.md](docs/NETLIFY_DEPLOYMENT_GUIDE.md:1)
- Triggers and environments (from guide):
  - Production: pushes to main
  - Staging: pushes to develop
  - Preview: pull requests (Deploy Previews)
- Environment contexts:
  - Production context sets VITE_API_BASE_URL and Supabase envs [netlify.toml](netlify.toml:102)
  - branch-deploy and deploy-preview contexts set API base URLs [netlify.toml](netlify.toml:106)
- Deployment strategy: Netlify CDN; immutable file caching; CSP/HSTS headers; edge function defined (geo-router) [netlify.toml](netlify.toml:97)
- Health checks/smoke tests: Health endpoints documented in [docs/NETLIFY_DEPLOYMENT_GUIDE.md](docs/NETLIFY_DEPLOYMENT_GUIDE.md:165)
- Rollback: Promote a previous successful deploy in Netlify UI
- Versioning and release notes: Netlify deploys are tied to commits; release notes not generated by CI

Backend and services
- Docker Compose (dev/prototyping): [docker-compose.yml](docker-compose.yml:1)
- Kubernetes manifests: [logi-core/k8s/](logi-core/k8s/overlays/dev/kustomization.yaml:1)
  - Base resources: [logi-core/k8s/base](logi-core/k8s/base/kustomization.yaml:1)
  - Dev overlay references images such as ghcr.io/your-org/logi-core-api-gateway:dev [logi-core/k8s/overlays/dev/kustomization.yaml](logi-core/k8s/overlays/dev/kustomization.yaml:7)
- Terraform for GCP infra (VPC, GKE, CloudSQL, Pub/Sub):
  - Root env module: [logi-core/infra/terraform/envs/dev/main.tf](logi-core/infra/terraform/envs/dev/main.tf:1)

CI currently does NOT:
- Build/push backend Docker images
- Roll out to Kubernetes or Cloud Run
- Manage environment promotion or gates

Database migrations
- Optional job applies selected SQL files to DEV Supabase on CI if DEV_SUPABASE_DB_URL is present [.github/workflows/ci.yml](.github/workflows/ci.yml:246)
- Recommended deploy order:
  1) Build and push images
  2) Apply database migrations (backward/forward compatible)
  3) Deploy application
  4) Run smoke tests and health checks
  5) Promote environment

Rollback procedures
- Kubernetes: kubectl rollout undo deployment <name> -n logi-core
- Netlify: promote previous deploy
- Database: provide down migrations and/or backup restore (manual, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md:165))

Versioning and tagging
- Suggested image tags: <semver>, <git-sha>, and channel tags (dev, staging, prod)
- Releases: consider GitHub Releases and changelog generation (e.g., Release Please)

Artifact/image registry
- Suggested: GHCR ghcr.io/<org>/<image>:<tag>
- Image signing/attestations: consider cosign and SLSA provenance

--------------------------------------------------------------------------------
10) Runners and infrastructure
- CI runners: Hosted GitHub Actions runners (ubuntu-latest) across all jobs [.github/workflows/ci.yml](.github/workflows/ci.yml:14)
- Container privileges: No Docker-in-Docker used in current CI workflows
- Netlify build environment: Node 20 with increased memory via NODE_OPTIONS [netlify.toml](netlify.toml:5)
- Network/VPN prereqs: None for current CI; optional DB migrations require internet to Supabase
- Cloud resources referenced (not provisioned by CI):
  - Terraform modules for VPC, GKE, CloudSQL, Pub/Sub [logi-core/infra/terraform/envs/dev/main.tf](logi-core/infra/terraform/envs/dev/main.tf:1)

--------------------------------------------------------------------------------
11) Secrets and identity management
GitHub Actions secrets used (by reference in workflow):
- CODECOV_TOKEN (Codecov upload) [.github/workflows/ci.yml](.github/workflows/ci.yml:101)
- DEV_SUPABASE_DB_URL (optional; Postgres connection string for migrations) [.github/workflows/ci.yml](.github/workflows/ci.yml:262)
- DEV_SUPABASE_URL, DEV_SUPABASE_ANON_KEY (optional; used in build dev) [.github/workflows/ci.yml](.github/workflows/ci.yml:145)
- PROD_SUPABASE_URL, PROD_SUPABASE_ANON_KEY (production build) [.github/workflows/ci.yml](.github/workflows/ci.yml:153)

Storage locations
- GitHub Actions repository secrets (Settings > Secrets and variables > Actions)
- Netlify environment variables for frontend (set in Netlify UI) — see [docs/NETLIFY_DEPLOYMENT_GUIDE.md](docs/NETLIFY_DEPLOYMENT_GUIDE.md:25)

Access scoping and identity
- Current CI uses GITHUB_TOKEN implicitly (scoped to the repository)
- No OIDC integration configured for cloud access; adopt OIDC for GCP if automating Terraform/K8s deploys

Rotation policies
- Not automated in this repo; rotate tokens (Codecov, Supabase) regularly via providers

Environment variable naming conventions
- VITE_* for frontend runtime env
- DEV_* and PROD_* prefixes differentiate environment scopes

--------------------------------------------------------------------------------
12) Infrastructure as Code and Kubernetes
- Terraform (GCP):
  - Modules at [logi-core/infra/terraform/modules](logi-core/infra/terraform/modules/vpc/main.tf:1)
  - Dev env at [logi-core/infra/terraform/envs/dev](logi-core/infra/terraform/envs/dev/main.tf:1)
- Kubernetes:
  - Base manifests in [logi-core/k8s/base](logi-core/k8s/base/kustomization.yaml:1)
  - Overlays (dev) in [logi-core/k8s/overlays/dev](logi-core/k8s/overlays/dev/kustomization.yaml:1)
  - Namespace: logi-core [logi-core/k8s/overlays/dev/kustomization.yaml](logi-core/k8s/overlays/dev/kustomization.yaml:3)
- Templating:
  - Kustomize overlays
  - Helm not used in this repo (could be introduced)

--------------------------------------------------------------------------------
13) Third-party integrations and notifications
- Codecov: Coverage upload on CI [.github/workflows/ci.yml](.github/workflows/ci.yml:97)
- Slack/Teams/email/pager: Not configured
- Dashboards: Not configured

Suggested Slack notifications (example)
```yaml
- uses: slackapi/slack-github-action@v1
  with:
    payload: '{"text":"CI completed for ${{ github.sha }}: ${{ job.status }}"}'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

--------------------------------------------------------------------------------
14) Developer experience: reproduce CI locally and common tasks
Pre-requisites
- Node 20+ and npm 10+
- Docker and Docker Compose for containerized runs

Run CI checks locally (same order as CI)
```bash
npm ci
npm run lint
npm run type-check
npm run validate:components
npm run test -- --run
npm run test:coverage -- --run
npm run build:dev
npm run build:netlify
```

Full test suite and linters
```bash
npm run check         # lint + type-check + component/i18n validation
npm run test          # watchless unit tests
npm run test:coverage # coverage
```

Build and run Docker image locally (frontend)
```bash
docker build -t flow-frontend:local -f Dockerfile .
docker run --rm -p 3000:80 flow-frontend:local
```
Files: [Dockerfile](Dockerfile:1), [nginx.conf](nginx.conf:1)

Run full stack locally via Docker Compose
```bash
docker-compose up -d
# Frontend: http://localhost:3000
# API gateway: http://localhost:8080
# Postgres: localhost:5432
```
Compose file: [docker-compose.yml](docker-compose.yml:1)

Database schema and migrations
- SQL sources at [database/](database/schema.sql:1)
- Apply migration examples in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md:125)

Preview/ephemeral environments
- Netlify Deploy Previews on PRs (connect repo to Netlify) — see [docs/NETLIFY_DEPLOYMENT_GUIDE.md](docs/NETLIFY_DEPLOYMENT_GUIDE.md:257)

Update or add workflows
- Edit or add YAML files under [.github/workflows/](.github/workflows/ci.yml:1)
- Example: add concurrency (see section 7) or new jobs (e.g., CodeQL/SBOM)

Performance tips and cost controls
- Enable workflow concurrency to cancel superseded runs
- Use npm cache and Vite build cache keys already configured
- Limit build matrix where not needed; consider path filters in monorepo setups
- Keep artifact retention days minimal (currently 7 for dist, 30 for security reports)

Artifact and cache retention policies
- Build artifacts: 7 days
- Security scan results: 30 days
- Caches: restored by key; no explicit expiration beyond Actions defaults

Path ownership / CODEOWNERS mappings
- Add a CODEOWNERS file at [.github/CODEOWNERS](.github/CODEOWNERS) to enforce reviews by area (e.g., /database, /logi-core, /src)

Manual steps or credentials to obtain
- CODECOV_TOKEN (Codecov project token) as a GitHub Actions secret
- Netlify environment variables (set in Netlify UI) — see [docs/NETLIFY_DEPLOYMENT_GUIDE.md](docs/NETLIFY_DEPLOYMENT_GUIDE.md:25)
- Optional DEV_SUPABASE_DB_URL for migrations [.github/workflows/ci.yml](.github/workflows/ci.yml:262)

--------------------------------------------------------------------------------
15) Quick start: typical change lifecycle
1. Run checks locally
   ```bash
   npm ci
   npm run check
   npm run test -- --run
   npm run build:netlify
   ```
2. Open a Pull Request to main or develop
3. Observe required CI checks:
   - lint-and-typecheck
   - test
   - build (development, production)
   - security-scan
   - deployment-ready
4. Get approvals (CODEOWNERS if enforced)
5. Merge
6. Deployment:
   - Frontend: Netlify auto-deploys on merge (main -> production, develop -> staging)
   - Backend: manual or future automated CD (build, push, kubectl apply -k overlays/dev)
7. Verify health:
   - Frontend health/edge: see [docs/NETLIFY_DEPLOYMENT_GUIDE.md](docs/NETLIFY_DEPLOYMENT_GUIDE.md:165)
   - Backend readiness: API /health and /readyz (see guide)
8. Roll back if needed:
   - Netlify: promote previous deploy
   - Kubernetes: kubectl rollout undo
   - Database: apply rollback SQL as per [database/rollback-frontend-tables.sql](database/rollback-frontend-tables.sql:1)

Appendix: helpful YAML snippets
- Enforce coverage threshold via Vitest
```yaml
- name: Test with coverage threshold
  run: |
    npx vitest --run --coverage.enabled true --coverage.threshold.lines 80
```
- Add workflow_dispatch and schedule
```yaml
on:
  workflow_dispatch: {}
  schedule:
    - cron: "0 3 * * *" # nightly
```
- Add paths filter (monorepo optimization)
```yaml
on:
  pull_request:
    branches: [main, develop]
    paths:
      - "src/**"
      - ".github/workflows/**"