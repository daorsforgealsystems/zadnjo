
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
   - Cache Vite outputs: paths .vite and dist keyed on OS, build-mode, vite.config.ts and src hash
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
- Secret scanning: Not configured in this repo (GitHub has repository-level secret scanning if enabled)
- SBOM creation/publication: Not configured
- Artifact/image signing and provenance (SLSA, attestations): Not configured

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
  - Not used (repo contains frontend and logi-core subdir; CI runs from repository root)
- Concurrency and cancel-in-progress:
  - Not configured; consider adding a concurrency group to auto-cancel superseded runs

  Example addition:
  ```yaml
  # Suggest adding to the root of the workflow
  concurrency:
    group: ci-${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true
  ```
- Skip/force conventions:
  - No explicit skip/force conditions configured in YAML

--------------------------------------------------------------------------------
8) Required status checks and branch protection
- Repository contains no CODEOWNERS file and no branch protection configuration files.
- Recommended required status checks (names match GitHub check-run names):
  - "setup" (optional to require)
  - "lint-and-typecheck"
  - "test"
  - "build (build-mode: development)"
  - "build (build-mode: production)"
  - "security-scan"
  - Optionally "deployment-ready" (aggregate gate)
  - If you enable bundle linting on PRs: "bundle-analysis"
- Branch protection settings (recommended):
  - Require pull request reviews: 1-2 approvals
  - Enforce CODEOWNERS: Add a CODEOWNERS file to match ownership by paths
  - Require status checks to pass before merging: as listed above
  - Require branches up to date before merge: enabled
  - Commit signing or DCO: optional; not currently enforced by CI
  - Allowed merge strategies: choose a standard (merge commit or squash); rebase optional

--------------------------------------------------------------------------------
9) Deployment automation
Frontend (Netlify)
- Configuration: [netlify.toml](netlify.toml:1) and [docs/NETLIFY_DEPLOYMENT_GUIDE.md](docs/NETLIFY_DEPLOYMENT_GUIDE.md:1)
- Triggers and environments (from guide):
  - Production: pushes to main
  - Staging: pushes to develop
  - Preview: pull requests (Deploy Previews)
- Environment contexts:
  - [netlify.toml] production context sets VITE_API_BASE_URL and Supabase envs [.toml contexts at](netlify.toml:102)
  - branch-deploy and deploy-preview contexts configure API base URLs
- Deployment strategy: Netlify CDN; immutable file caching; CSP/HSTS headers; edge function defined (geo-router) [.netlify edge fn in](netlify.toml:97)
- Health checks/smoke tests: Health endpoints documented in [docs/NETLIFY_DEPLOYMENT_GUIDE.md](docs/NETLIFY_DEPLOYMENT_GUIDE.md:165)
- Rollback: Use Netlify dashboard to promote a previous successful deploy
- Versioning and release notes: Netlify deploys are tied to commits; no separate release notes generated by CI

Backend and services
- Docker Compose (dev/prototyping): [docker-compose.yml](docker-compose.yml:1)
- Kubernetes manifests: [logi-core/k8s/](logi-core/k8s/overlays/dev/kustomization.yaml:1)
  - Base resources: [logi-core/k8s/base](logi-core/k8s/base/kustomization.yaml:1)
  - Dev overlay references images such as ghcr.io/your-org/logi-core-api-gateway:dev [.kustomization](logi-core/k8s/overlays/dev/kustomization.yaml:7)
- Terraform for GCP infra (VPC, GKE, CloudSQL, Pub/Sub):
  - Root env module: [logi-core/infra/terraform/envs/dev/main.tf](logi-core/infra/terraform/envs/dev/main.tf:1)
- CI does not currently:
  - Build/push backend Docker images
  - Roll out to Kubernetes or Cloud Run
  - Manage environment promotion or gates
- Database migrations:
  - Optional job applies selected SQL files to DEV Supabase on CI if DEV_SUPABASE_DB_URL is present [.job](.github/workflows/ci.yml:246)
  - Order of operations for backend deploys (recommended): 
    1) Build and push images
    2) Apply database migrations compatible with both old/new versions
    3) Deploy application
    4) Run smoke tests
    5) Promote environment (if applicable)

Recommended (not yet implemented) GH Actions additions for backend CD
- Build/push images to GHCR and deploy with kubectl or Helm:
  ```yaml
  jobs:
    build-and-push:
      runs-on: ubuntu-latest
      permissions:
        contents: read
        packages: write
      steps:
        - uses: actions/checkout@v4
        - uses: docker/setup-buildx-action@v3
        - uses: docker/login-action@v3
          with:
            registry: ghcr.io
            username: ${{ github.actor }}
            password: ${{ secrets.GITHUB_TOKEN }}
        - name: Build and push api-gateway
          run: |
            docker buildx build \
              -t ghcr.io/<org>/logi-core-api-gateway:${{ github.sha }} \
              -f logi-core/apps/api-gateway/Dockerfile \
              --push logi-core/apps/api-gateway
    deploy-dev:
      needs: build-and-push
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - name: Set Kube context
          run: |
            # configure kubeconfig via OIDC or a secret
            echo "configure kubectl auth here"
        - name: Rollout
          run: |
            kubectl apply -k logi-core/k8s/overlays/dev
            kubectl rollout status deploy/api-gateway -n logi-core
  ```
- Strategy: rolling updates on K8s; consider blue-green/canary via service selectors or progressive delivery (Argo Rollouts/Flagger)
- Smoke tests: curl health endpoints post-deploy
- Rollback:
  - Kubernetes: kubectl rollout undo deployment <name> -n logi-core
  - Netlify: promote previous deploy in UI
- Artifact registry details:
  - Suggested: GHCR ghcr.io/<org>/<image>:<tag>
  - Tagging convention: sha or semver tags; add branch aliases (dev, staging, latest)
- Image signing/attestation: Consider cosign and SLSA provenance attestations in CI

--------------------------------------------------------------------------------
10) Runners and infrastructure
- CI runners: Hosted GitHub Actions runners (ubuntu-latest) across all jobs [.github/workflows/ci.yml](.github/workflows/ci.yml:14)
- Container privileges: No Docker-in-Docker used in current CI workflows
- Netlify build environment: Node 20 with increased memory via NODE_OPTIONS; configured in [netlify.toml](netlify.toml:5)
- Network/VPN prereqs: None required for current CI; optional DB migrations require internet to Supabase
- Cloud resources:
  - Terraform modules suggest GCP (VPC, GKE, CloudSQL, Pub/Sub) for backend infra [main.tf](logi-core/infra/terraform/envs/dev/main.tf:1)
  - Not wired into CI; apply via terraform CLI from infra repo path

--------------------------------------------------------------------------------
11) Secrets and identity management
GitHub Actions secrets used (by reference in workflow):
- CODECOV_TOKEN (Codecov upload) [.github/workflows/ci.yml](.github/workflows/ci.yml:101)
- DEV_SUPABASE_DB_URL (optional; Postgres connection string for migrations) [.github/workflows/ci.yml](.github/workflows/ci.yml:262)
- DEV_SUPABASE_URL, DEV_SUPABASE_ANON_KEY (optional; used in build dev) [.github/workflows/ci.yml](.github/workflows/ci.yml:145)
- PROD_SUPABASE_URL, PROD_SUPABASE_ANON_KEY (production build) [.github/workflows/ci.yml](.github/workflows/ci.yml:153)

Where stored
- GitHub Actions repository secrets (Settings > Secrets and variables > Actions)
- Netlify environment variables for frontend (set in Netlify UI) — see [docs/NETLIFY_DEPLOYMENT_GUIDE.md](docs/NETLIFY_DEPLOYMENT_GUIDE.md:25)

Access scoping and identity
- Current CI uses GITHUB_TOKEN (scoped to repo) implicitly for artifact and actions operations
- No OIDC integration configured for cloud access; recommended to adopt OIDC for GCP if automating Terraform/K8s deploys

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
  - Namespace: logi-core [.kustomization](logi-core/k8s/overlays/dev/kustomization.yaml:3)
- Templating:
  - Kustomize overlays
  - Helm not used in this repo (could be introduced for better parameterization)

--------------------------------------------------------------------------------
13) Third-party integrations and notifications
- Codecov: Coverage upload on CI [.github/workflows/ci.yml](.github/workflows/ci.yml:97)
- Slack/Teams/email/pager: Not configured
- Dashboards: Not configured

--------------------------------------------------------------------------------
14) Developer experience: reproduce CI locally and common tasks
Pre-requisites
- Node 20+ and npm 10+
- Docker and Docker Compose for containerized runs

Run CI checks locally (same order as CI)
```bash
# From repo root
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
# Build
docker build -t flow-frontend:local -f Dockerfile .

# Run on port 3000
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
- Netlify Deploy Previews on PRs (configure via Netlify repo connection per [docs/NETLIFY_DEPLOYMENT_GUIDE.md](docs/NETLIFY_DEPLOYMENT_GUIDE.md:257))

Update or add workflows
- Edit or add YAML files under [.github/workflows/](.github/workflows/ci.yml:1)
- Example: add concurrency (see section 7) or new jobs (e.g., CodeQL)

Common env vars
