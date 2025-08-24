---
applyTo: '**/*.ts'
---
AI Context & Safety Guidelines (short, actionable)

1. Safety & secrets
    - Never expose or fabricate secrets, credentials, or private keys.
    - If a change requires secrets, prompt the user and do not hardcode values.

2. Minimal, typed changes
    - Make the smallest possible change that solves the issue.
    - Prefer explicit TypeScript types and keep API DTOs colocated in src/lib/api/.

3. Project conventions (follow exactly)
    - Data fetching: use React Query hooks (useQuery/useMutation).
    - API clients: thin, typed wrappers in src/lib/api/.
    - Styling: Tailwind utility classes; update tokens in tailwind.config.ts when needed.
    - Tests: add/update Vitest tests (happy path + one edge case) colocated with code.

4. Backend & DB
    - When changing DB shapes add migrations in database/ and update logi-core/db/schema.sql.
    - Update both frontend client types and backend adapters in logi-core/apps/api-gateway when API shapes change.

5. Quality checks (required before PR)
    - Run type-check and tests locally: npm run type-check && npm run test. Fix failures.
    - Keep commits small and focused; include clear commit message.

6. Code style & scope
    - Avoid large refactors; do not modify unrelated files.
    - Keep transformations out of API clients — do them in hooks/components.
    - Add minimal comments to explain non-obvious decisions.

7. Privacy & licensing
    - Do not add content that could infringe copyright or violate privacy rules.
    - Use only permissively licensed code and libraries already present in the repo unless approved.

8. When unsure
    - Ask for missing details (endpoints, types, environment values) instead of guessing.