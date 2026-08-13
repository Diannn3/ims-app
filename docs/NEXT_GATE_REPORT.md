# Next Gate Report — 2026-08-13

## Scope

This pass continues the release-validation gate after the first academic-core implementation. It does not claim the full Svelte/Supabase/browser gate is green; the cloud runner still has no npm registry resolution and no Docker-compatible runtime.

## Hardening completed

### Database / governance
- Migration sequence extended through `020_consultation_time_integrity.sql`.
- Import-managed instructor assignments now use many-to-many source ownership so one source row cannot accidentally delete an assignment still corroborated by another source row.
- Staged schedule payloads are validated again at the database boundary before they can be considered actionable.
- Faculty office identity is NULL-safe for permanent offices and enforces at most one primary office per faculty/term.
- Public academic/spatial reads are explicit column-curated `public_*` views; anonymous canonical-table reads are revoked.
- Duplicate section occurrences, non-canonical weekday arrays, cross-building/floor space relationships, and ambiguous consultation time windows are rejected by database constraints/triggers.
- pgTAP suite now contains 8 files / 128 declared assertions, including public-view security-mode checks.

### Application / public-data boundary
- Public academic repositories query only audited `public_*` surfaces.
- A dependency-light contract verifier checks every literal `.from()` and `.rpc()` target against database objects created by migrations.
- Universal search no longer interpolates free text into raw PostgREST `.or()` expressions.
- Search input strips SQL-LIKE wildcard/control characters, is NFKC-normalized, and is capped at 80 characters.

### Runtime configuration / HTTP security
- Hosted Supabase URL must be HTTPS; loopback HTTP remains valid for local development.
- Public Supabase configuration rejects `sb_secret_*` keys and legacy JWTs carrying `service_role` / `supabase_admin`.
- Document responses deny framing/object embedding, set `nosniff`, use strict-origin referrer behavior, and disable currently unused powerful browser features.
- Dynamic academic SSR is explicitly `no-store` until the dedicated sanitized public offline snapshot exists.

## Validation executed in this cloud runner

Passed:

```text
npm run verify
npm run verify:data-contracts
tsc -p tsconfig.domain.json --pretty false
git diff --check
```

Current dependency-light evidence:

```text
20 ordered migrations
43 spaces
64 graph nodes
67 graph edges
8 pgTAP files / 128 declared assertions
56 public table/view names discovered by the static DB contract verifier
5 public RPC names discovered
62 .from() calls + 7 .rpc() calls checked
```

## Still blocking a full green gate

The environment cannot currently resolve `registry.npmjs.org`, so `node_modules` and `package-lock.json` cannot be produced here. It also has no Docker-compatible runtime, which the Supabase local stack requires.

Therefore these remain intentionally unclaimed:

```text
npm run check
npm run test:unit
npm run build
npm run db:start
npm run db:reset
npm run db:lint
npm run test:db
npm run types:db / types:check
npm run test:e2e
```

The first compatible machine/CI runner should execute `npm run gate` after a reviewed dependency install and generated database-type refresh.

## Release rule

Do not call the app production-ready until migration replay, pgTAP, generated-type drift, Svelte/TypeScript compilation, unit tests, production build, and seeded Playwright governance journeys all pass against the same commit.
