# Continuous Integration

Two GitHub Actions workflows are included:

- `.github/workflows/ci.yml` — project/data invariants, Svelte/TypeScript checks, Vitest, production build, and Chromium Playwright smoke journeys.
- `.github/workflows/database-tests.yml` — local Supabase startup/reset plus pgTAP security and database-invariant tests.

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

Then inspect and commit `src/lib/database.types.ts`. A generated-type drift CI gate can be added after migrations 001–008 have been executed successfully in a real local Supabase stack.
