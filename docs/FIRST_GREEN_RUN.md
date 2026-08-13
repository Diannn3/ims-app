# First Green Validation Run

This repository intentionally refuses to fabricate the two generated artifacts that the current cloud runner cannot produce safely: the npm lockfile and generated Supabase database types.

## 1. Resolve the dependency lockfile

Run the manual GitHub Actions workflow **Dependency lockfile review** after this implementation is available on GitHub. It:

1. uses Node 22;
2. resolves the exact-pinned `package.json` against the real npm registry;
3. disables package lifecycle scripts during lockfile generation;
4. verifies the lockfile root matches `package.json`;
5. uploads `package-lock.json` for human review.

After review, commit that artifact. Then replace the temporary `npm install --no-audit --no-fund` steps in both `.github/workflows/ci.yml` and `.github/workflows/integration-gate.yml` with `npm ci`. `npm run verify:gate-config` is designed to fail if the lockfile exists but either workflow is still using the pre-lock install path.

## 2. Replay the current migration set (currently 001–020) and generate database types

On a machine/CI runner with the pinned Supabase CLI and a Docker-compatible runtime:

```bash
npm ci
npm run db:start
npm run db:reset
npm run db:lint
npm run test:db
npm run types:db
npm run types:check
```

Review `src/lib/database.types.ts` before committing it. Do not hand-edit it to resemble the migrations.

If database CI encounters missing/stale committed types, `scripts/check-database-types.mjs` preserves the exact replay-generated output at:

```text
validation-evidence/database.types.generated.ts
```

and CI uploads it as a short-retention review artifact while keeping the gate red.

## 3. Run the complete application/database/integration gates

After both generated artifacts are committed:

```bash
npm run verify
npm run check:domain
npm run check
npm run test:unit
npm run db:lint
npm run test:db
npm run types:check
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Or use the orchestrated local gate:

```bash
npm run gate
```

A successful full gate means the source invariants, Svelte/TypeScript compiler, unit tests, migration replay, database lint, pgTAP/RLS tests, generated-type contract, production build, and seeded Playwright governance journey have all passed in one compatible toolchain environment.

## 4. What must remain local/test-only

The seeded editor/admin accounts and elevated Supabase credential are for the loopback local stack only. The integration helper refuses non-loopback Supabase URLs. Only the local API URL and browser-safe publishable/legacy anon key are inherited by the app/browser process.

Do not point the seeded integration gate at a hosted production project.
