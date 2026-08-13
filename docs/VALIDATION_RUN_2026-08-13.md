# Validation Run — 2026-08-13

This is an evidence log, not a claim that the full gate is green.

> **Historical snapshot:** the `13 ordered migrations` line below records the earlier run exactly as observed. The current worktree has since advanced to migrations 001–020; use `npm run verify`/`npm run gate` for the current gate rather than treating this file as head-state evidence.

## Passed in the current cloud container

```text
npm run verify
  PASS — 43 spaces
  PASS — 64 graph nodes
  PASS — 67 graph edges
  PASS — all space routing references resolve
  PASS — 13 ordered migrations detected
  PASS — presentation files do not contain raw Supabase table/RPC calls
  PASS — grade domain remains isolated from Supabase
  PASS — IMS mark exists
  PASS — accessibility shell invariants
  PASS — fail-closed import/review static invariants

npm run check:domain
  PASS — framework-free TypeScript domain compilation

git diff --check
  PASS

node --check scripts/check-database-types.mjs
  PASS
```

## Environment doctor

```text
PASS  Node.js >= 22 — v22.16.0
BLOCK npm dependencies — registry install unavailable in this container
WARN  package-lock.json — intentionally absent until a successful reviewed install
BLOCK project-local Supabase CLI — requires npm install
BLOCK Docker-compatible runtime — not available in this container
PASS  Git CLI
```

`npm install` was attempted with audit/fund disabled and a short fetch timeout, but the registry request did not complete before the command timeout. No fabricated lockfile or partial dependency tree was committed.

## Not run / still blocking

The following require the missing normal-development infrastructure:

```text
npm run db:start
npm run db:reset
npm run db:lint
npm run test:db
npm run types:check   # detect drift before overwriting the committed file
npm run types:db      # only when the drift is expected/reviewed
npm run types:check   # must then pass
npm run check
npm run test:unit
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

## Code hardening completed during this run

- Added migration `009_integrity_privacy_hardening.sql`.
- Added safe public projections for faculty, faculty notices, and route restrictions.
- Removed anonymous reads from sensitive base tables.
- Public academic repository now uses `public_faculty`.
- Consultation material edits now automatically invalidate verification/publication.
- Source identity fallback is stable across schedule corrections.
- Duplicate identical import rows stage as `skipped`; conflicting duplicates fail.
- Unknown faculty email produces an explicit warning.
- Misleading authoritative-snapshot control is disabled until reconciliation exists.
- `source_records` uses `NULLS NOT DISTINCT` uniqueness.
- pgTAP security suite expanded from 13 to 26 assertions.
- Supabase CLI pinned to `2.110.0` in project and DB CI.
- Database CI now runs `supabase db lint` before pgTAP tests.
- Playwright CI is restricted to one worker.
- Added `npm run doctor`, `npm run check:domain`, and `npm run types:check`.
- Database CI now checks committed generated Supabase types after replaying the local schema.
- Admin action failures are converted to safe user-facing messages; raw database/RPC details stay server-side.
- Added `.env.example` for the publishable Supabase SSR environment contract.
- Raised the runtime floor to Node 22 because the current Supabase JavaScript line no longer supports Node 20.
- Added migration `010_source_visibility_hardening.sql`: source labels/URLs are now public provenance only by explicit admin opt-in; trusted staff/import tooling reads internal sources through RLS.
- Staff/auth/admin responses now receive `Cache-Control: private, no-store`; server responses also get baseline `nosniff` and strict-origin referrer policy headers.

## Next real-machine action

Run:

```bash
npm install
npm run doctor:strict
npm run verify
npm run check:domain
npm run db:start
npm run db:reset
npm run db:lint
npm run test:db
npm run types:check   # detect drift before overwriting the committed file
npm run types:db      # only when the drift is expected/reviewed
npm run types:check   # must then pass
npm run check
npm run test:unit
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

If all pass, commit the reviewed `package-lock.json` and regenerated `src/lib/database.types.ts`, then switch app CI to `npm ci` and make generated-type drift a blocking DB-CI step.
