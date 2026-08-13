# Validation Gate — Academic Core Hardening

Date: 2026-08-13

This document records the gate between "implemented in source" and "proven by the real toolchain". The project must not be described as production-ready until every blocking command below passes against a replayed local Supabase stack.

## What this gate hardened

### Public data minimization

Migration `009_integrity_privacy_hardening.sql` introduces curated public projections for data whose base tables contain internal identity/moderation fields:

- `public.public_faculty` — intentionally omits `faculty.user_id`.
- `public.public_faculty_notices` — intentionally omits `created_by`.
- `public.public_route_restrictions` — intentionally omits `created_by` and internal `source_id`.

The anonymous role no longer reads the corresponding base tables directly. Public academic read models use `public_faculty`.

### Consultation fail-closed integrity

Any material consultation edit now automatically:

1. sets `review_status = needs_verification`;
2. sets `publication_status = needs_verification`;
3. clears `last_verified_at`.

An edit can therefore never silently preserve a stale "verified/published" state. Editors/admins still own explicit review/publication transitions.

### Import identity

The V1 fallback source identity is now stable across changes in meeting days/time/room/faculty:

`source + term + course + section`

This intentionally means V1 supports one canonical source row per course+section unless the source supplies a stable `source_record_key`/`record_id`. A source that has several independent rows for the same section must provide that key.

Identical duplicate rows in one file are retained for audit but staged as `skipped`; conflicting duplicates remain validation errors.

Unknown faculty email addresses now produce an explicit unresolved warning even when no faculty name is supplied.

### Source-record uniqueness

`source_records` now uses a `NULLS NOT DISTINCT` unique index so non-term-specific source identities cannot duplicate merely because `term_id` is null.

### Schedule child fail-closed integrity

Migration `011_schedule_child_integrity.sql` makes the published section a reviewed composition, not just a parent-row flag. Material meeting changes and instructor-assignment inserts/updates/deletes automatically withdraw the affected section (and its meetings) to `needs_verification`. This also closes the source-record reassignment edge case where a stable source key could otherwise move its children while leaving the old section published.

### Snapshot semantics

The "complete-source snapshot" flag is visibly disabled for now. Current imports are add/update-only. The application does **not** infer deletions/retirements from rows absent in an uploaded file until a separately reviewed reconciliation transaction exists.


### Source-metadata privacy

Data sources now have an explicit `public_metadata` opt-in. Internal sheet/file sources remain available to trusted staff/import tooling but are omitted from the anonymous `public_data_sources` projection unless an admin deliberately marks their label/authority/URL safe for public provenance.

### Private response caching

SvelteKit marks staff/auth/admin response paths `Cache-Control: private, no-store` in addition to the service-worker exclusions. A baseline `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` are also applied server-side. CSP remains intentionally deferred until the full build/browser gate is available, because an unvalidated CSP can break SvelteKit hydration or future integrations.

## Dependency/toolchain reproducibility

The Supabase CLI is pinned as the project dev dependency `2.110.0`, and database CI uses the same version. Node 22+ is required.

A framework-free typecheck is available:

```bash
npm run check:domain
```

A parser-level source syntax fallback is also available for constrained environments:

```bash
npm run verify:syntax
```

It parses every TypeScript file and every `<script>` block in Svelte components. It is intentionally **not** a replacement for `svelte-check`; it exists to catch syntax regressions when the npm toolchain cannot be installed.

The dependency-light verification also runs a small Node 22 grade-engine smoke via `npm run smoke:domain`, while `verify:data` now confirms the entire routing graph is reachable from the main-entrance anchor.

A generated DB type drift check is prepared:

```bash
npm run types:check
```

Locally it uses the project-pinned Supabase CLI and a running local stack. Database CI can explicitly set `SUPABASE_BIN=supabase` after `supabase/setup-cli`, while keeping the same comparison script. The command compares freshly generated output against `src/lib/database.types.ts` without overwriting the committed file.

## Cross-platform gate runner

After the initial `npm install`, the same blocking sequence can be driven from Windows, macOS, or Linux with:

```bash
npm run gate
```

The runner is deliberately conservative: it runs `types:check` before any type regeneration and stops if drift is detected. It never overwrites `database.types.ts`. Use `npm run types:db` only after reviewing that the drift is expected, then rerun the gate. It also stops the local Supabase stack on exit unless `-- --keep-db` is supplied. `-- --skip-e2e` exists for iteration only and does not count as a full release gate.

## Blocking validation sequence

Run on a normal development machine with Node 22+ and a Docker-compatible container runtime:

> Node 22+ is intentional: the current Supabase JavaScript 2.110 line no longer supports Node 20.

```bash
npm install
npm run doctor:strict
npm run verify
npm run check:domain
npm run db:start
npm run db:reset
npm run db:lint
npm run test:db
npm run types:check   # expected to fail if committed generated types are stale
npm run types:db      # run only when the drift above is intentional
npm run types:check   # must pass after the reviewed regeneration
npm run check
npm run test:unit
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

After the first successful, reviewed install, commit the generated `package-lock.json` and change application CI from `npm install` to `npm ci`.

## Required evidence before calling this gate green

- Migrations `001` through `013` replay from zero via `supabase db reset`.
- `supabase test db` passes all pgTAP security/integrity assertions.
- RBAC database tests cover anonymous/student/faculty/editor/admin staging, apply, review, publication, and atomic rollback boundaries.
- Freshly generated `src/lib/database.types.ts` is committed and `npm run types:check` passes.
- `npm run check` has zero Svelte/TypeScript errors.
- Vitest import/grade/search tests pass.
- Production build succeeds.
- Playwright mobile and desktop journeys pass.
- Synthetic public path works: `DEMO 101 → Section A → Prof. Demo Alpha → MB 304 → Map`.
- Governance path works: `CSV → stage → validate → acknowledge → admin apply → editor verify → admin publish → public schedule`.
- Anonymous API access cannot retrieve `faculty.user_id`, notice `created_by`, or route-restriction `created_by/source_id`.

## Current cloud-environment limitation

The current cloud container has Node and a global TypeScript compiler, but it does not have a working npm registry connection, Docker/container runtime, local Supabase CLI install, PostgreSQL, or Playwright browser dependencies. Dependency-free verification and the framework-free domain typecheck pass here; the blocking integration commands above still require normal CI/development infrastructure.


## Environment contract

Copy `.env.example` to `.env` for local application development and provide the real public project URL and publishable key. These values are not secrets; database safety still depends on least-privilege grants and RLS. Never place a Supabase secret/service-role key in a `PUBLIC_` variable or browser bundle.

### Atomic staging boundary

Migration `012_atomic_import_staging.sql` closes a transaction gap in the initial server implementation. Creating an import batch, its rows, and its issues through three independent Data API calls could leave a partial `ready` batch if a later request failed. `stage_schedule_import_batch(...)` now owns those writes in one PostgreSQL transaction, recomputes counts from the supplied staged rows/issues, records `auth.uid()` itself, and rejects direct authenticated INSERTs into the staging tables. Editors/admins may stage through the RPC; only admins may apply.

### Immutable staged evidence

Migration `013_import_staging_immutability.sql` makes the staged preview an immutable audit artifact. Authenticated application roles cannot update/delete `import_rows`, cannot delete validation issues, and may update only `acknowledged_at`/`acknowledged_by` on warning issues through the guarded reviewer policy. Admins may directly update only a batch's `status`/`updated_at` for rejection; apply transitions and row-status changes remain owned by SECURITY DEFINER RPCs. This removes a stale-preview class where application code could otherwise mutate staged content after review.

## Gate-configuration self-check and durable evidence

The dependency-light `npm run verify` phase now includes `verify:gate-config`. This does not pretend to execute Svelte, browser, or database tooling. Instead, it fails early when the release gate itself drifts into an unsafe configuration, including:

- direct dependency versions becoming floating semver ranges before the first reviewed lockfile exists;
- Node dropping below the supported `>=22.0.0` contract;
- application CI omitting static/type/unit/build/browser phases or running Playwright before the production build;
- Playwright CI no longer exercising `vite preview`, deterministic one-worker execution, or failure traces/screenshots/video;
- database CI omitting migration replay, lint, pgTAP, or generated-type drift checks;
- the Supabase CLI version drifting between `package.json` and database CI.

A missing `package-lock.json` remains a **warning**, not a pass for full reproducibility. Exact top-level pins reduce direct drift only. npm's lockfile is still required to freeze the transitive dependency tree, after which CI must use `npm ci`.

Successful application and database workflows also create small machine-readable evidence manifests under `validation-evidence/` and upload them as short-retention GitHub Actions artifacts. Each manifest records the commit, Node/npm versions, package manifest hash, Playwright-config hash, and SHA-256 hashes for every migration. The manifest is not a cryptographic attestation and does not replace GitHub's workflow result; it is a compact audit aid proving which source/toolchain state reached the final evidence step.

Application E2E in CI intentionally runs against `npm run preview` **after** `npm run build`, while local Playwright iteration uses the Vite development server. This keeps local feedback fast while making the release smoke journey exercise the production bundle.

## Seeded full-stack integration evidence

A third CI gate now verifies the real seam between the SvelteKit application and the replayed local Supabase stack. It is intentionally stricter than a UI smoke test: the workflow creates only synthetic local staff accounts, exercises SSR authentication and RLS, and runs the complete schedule-governance state machine through browser-visible controls.

A particularly important testing detail is that the fail-closed assertions are made **after signing staff out**. Staff roles are supposed to see unpublished review material, so viewing a public route while still authenticated as an editor/admin would not prove public invisibility. The integration journey therefore checks the course page anonymously immediately after apply and again immediately after editor verification. Only the explicit admin publication transition makes the new section visible to the anonymous read model.

The workflow keeps the local `SERVICE_ROLE_KEY` scoped to the one synthetic fixture-preparation process. Only the local API URL and anon/browser key enter the application environment. `scripts/seed-integration-auth.mjs` additionally refuses any non-loopback Supabase hostname before it creates or updates test users.

The integration gate is configured as a release-quality production-preview journey: build first, then Playwright starts `vite preview`. CI uses one Playwright worker to reduce mutation-order nondeterminism. The database itself is reset before the journey, while the mutating browser test uses a run-specific source/section key to avoid accidental collisions during manual reruns.

### Local `npm run gate` behavior

The local gate now mirrors the seeded CI seam instead of stopping at isolated app/database checks. After migration replay, pgTAP, and type-drift validation, it reads local Supabase status in machine-readable JSON, keeps only the API URL/browser key in the parent environment, scopes the service-role key to the synthetic Auth fixture child process, builds the application, and runs Playwright with `CI=1` + `INTEGRATION_SUPABASE=1`. That forces the production-preview server path and includes the governance journey.

The script still runs `doctor:strict` before changing database state. In this cloud container the doctor currently blocks cleanly because `node_modules`, the project-local Supabase CLI, and a Docker-compatible runtime are unavailable. That failure is an environment limitation, not a passing gate.


## Generated-type review artifact

The database/integration gate never auto-commits generated schema types. When the replayed schema does not match the committed `src/lib/database.types.ts` (including the initial state where that file is absent), `scripts/check-database-types.mjs` writes the exact generated output to `validation-evidence/database.types.generated.ts` before failing. CI uploads that file for human review. The reviewed file may then be copied to `src/lib/database.types.ts` and committed; the next gate must prove an exact match.

The local/CI Supabase helper prefers publishable + secret key names and falls back to legacy anon + service-role names because the local CLI may expose either contract during Supabase's key transition. Only the browser-safe key is inherited by the app/browser process. Elevated local credentials are scoped to synthetic fixture provisioning and are rejected if the Supabase URL is not loopback-only.
