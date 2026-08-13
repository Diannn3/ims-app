# Continuous Integration

Three GitHub Actions workflows are included:

- `.github/workflows/ci.yml` — project/data invariants, Svelte/TypeScript checks, Vitest, production build, and Chromium Playwright smoke journeys.
- `.github/workflows/database-tests.yml` — local Supabase startup/reset plus pgTAP security and database-invariant tests.
- `.github/workflows/integration-gate.yml` — a fresh seeded local Supabase stack plus production SvelteKit preview, synthetic staff Auth, public academic reads, and the end-to-end import/review/publication governance journey.

The database workflow follows the official Supabase `supabase/setup-cli@v1` testing pattern.

## Lockfile gate

The repository did not have a verified `package-lock.json` in the current cloud environment, and this environment could not complete `npm install`. The app workflow therefore uses `npm install` temporarily.

On the first normal development machine/CI run:

1. run `npm install`;
2. run the full quality suite;
3. inspect dependency changes;
4. commit the verified `package-lock.json`;
5. replace CI's `npm install` with `npm ci`.

Do not commit a fabricated lockfile.

## Database-generated types

After migrations change, run:

```bash
npm run db:start
npm run db:reset
npm run types:db
```

Then inspect and commit `src/lib/database.types.ts`. The generated-type drift gate is already wired; it becomes meaningful only after the current migration set (currently 001–020) have been replayed successfully and the committed types are regenerated/reviewed against that schema. If CI finds the file missing or stale, it preserves the freshly generated output as `validation-evidence/database.types.generated.ts` and uploads it as a review artifact instead of asking anyone to reconstruct types by hand.

## Validation-gate additions

- The Supabase CLI version is intentionally pinned in both `package.json` and database CI. Do not switch database CI back to `latest` without a reviewed upgrade/reset cycle.
- `npm run check:domain` gives a fast framework-free check of core TypeScript domains.
- `npm run types:check` compares committed database types with freshly generated local types. It is already a blocking database/integration-CI step; regenerate and review `src/lib/database.types.ts` against the current migration set (currently 001–020) before treating the gate as green.
- Playwright uses a single worker in CI to reduce non-deterministic smoke-test behavior.


## Generated database type drift

The database workflow replays migrations/seed, runs pgTAP, then executes `scripts/check-database-types.mjs` with `SUPABASE_BIN=supabase`. This uses the same CLI version pinned by `supabase/setup-cli` and fails if `src/lib/database.types.ts` does not match the replayed schema. Local development uses the project-pinned CLI in `node_modules/.bin` by default.

## Seeded integration gate

The integration workflow is deliberately separate from the fast app and database gates because it validates the seam between them rather than only one layer. It performs, in order:

1. Node 22 dependency install.
2. Pinned Supabase CLI setup.
3. `supabase start` and `supabase db reset` so all migrations and `seed.sql` replay from zero.
4. Export of only the local API URL and low-privilege publishable/legacy anon key to the application environment through the machine-readable local-status helper.
5. Creation of synthetic editor/admin Auth fixtures using an elevated local secret/service-role credential held only inside the fixture process. The workflow never shell-evaluates `supabase status` output and never persists that elevated key to `GITHUB_ENV`.
6. Project invariants, domain typecheck, Svelte check, unit tests, database lint, pgTAP, and generated-type drift check.
7. Production application build.
8. Chromium Playwright integration journeys against the production preview.
9. A compact evidence manifest/artifact only after every preceding command succeeds.

The integration Auth fixture helper refuses any Supabase URL whose host is not `localhost`, `127.0.0.1`, or `::1`. This is a defense against accidentally running synthetic credential provisioning against a hosted project. Supabase's admin Auth APIs require elevated server credentials, so those credentials must never be exposed to the browser.

The governance browser journey uses a unique section/source key on each run and checks the boundary from an anonymous session between state transitions. This matters because an authenticated editor/admin may legitimately have RLS access to unpublished review data; staff visibility is **not** evidence that student-facing publication occurred.

The expected journey is:

```text
admin login
  → upload synthetic CSV
  → staging succeeds with zero errors
  → transactional admin apply
  → sign out
  → anonymous cannot see imported section
  → editor login
  → verify section
  → editor has no Publish control
  → sign out
  → anonymous still cannot see section
  → admin login
  → publish verified section
  → public course read model exposes section and canonical room label
```

This does not replace pgTAP. The SQL suite remains the lower-level proof for RLS, grants, triggers, and RPC authorization, while Playwright proves the actual application wiring.


## Dependency lockfile review workflow

`.github/workflows/dependency-lock-review.yml` is a manual bootstrap/review workflow for the current pre-lock phase. It runs `npm install --package-lock-only --ignore-scripts` against the real npm registry, verifies that the generated lock root exactly matches the exact-pinned `package.json`, and uploads `package-lock.json` as a short-retention artifact. It never auto-commits the result. After a human reviews and commits that artifact, both application and seeded integration CI must be switched to `npm ci`; `verify:gate-config` enforces that transition as soon as a lockfile exists.
