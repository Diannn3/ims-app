# IMS First-Green fixes after Design System V2

Target repository: `Diannn3/ims-app`

Target source branch and commit:

- `chatgpt/design-system-v2`
- `dedb2ca8dfa885ad1a0fcb6b09b1ab0c3cb09449`

This bundle intentionally contains **only the CI / database-test fixes that were deferred before the Design System V2 push**. It does not replace the V2 UI.

## What it changes

1. `supabase/tests/database/002_rbac_imports.test.sql`
   - treats student access to the RLS-protected `data_sources` table as an empty result instead of expecting a privilege exception;
   - captures staged batch IDs under the database owner before re-entering editor/admin request contexts;
   - ensures denial assertions fail for the intended authorization reason instead of a protected helper subquery.

2. `supabase/tests/database/003_assignment_provenance.test.sql`
   - captures staged batch IDs outside restricted table reads;
   - allows the initial apply to succeed before the later `changed` rows are evaluated, removing the cascade that made the provenance guard see no prior source state.

3. `supabase/tests/database/008_consultation_integrity.test.sql`
   - replaces the invalid four-argument pgTAP `has_check(...)` call with an exact named CHECK-constraint assertion using PostgreSQL catalogs.

4. `scripts/seed-integration-auth.mjs`
   - keeps Auth user creation through the local elevated Auth client;
   - moves fixture role promotion out of PostgREST and into a **local-only** `supabase db query --local` SQL statement;
   - retains the hard refusal to operate against non-local Supabase hosts;
   - does not add a production RPC or weaken `profiles` grants/RLS.

## Apply

From this extracted bundle:

```powershell
python .\apply_first_green.py C:\path\to\ims-app
```

or on macOS/Linux:

```bash
python3 ./apply_first_green.py /path/to/ims-app
```

The installer verifies the four expected Git blob hashes before modifying anything. If your branch has moved since `dedb2ca8...`, it stops rather than silently applying stale transformations.

## Review

Inside the repo:

```bash
git diff --check
git diff -- \
  scripts/seed-integration-auth.mjs \
  supabase/tests/database/002_rbac_imports.test.sql \
  supabase/tests/database/003_assignment_provenance.test.sql \
  supabase/tests/database/008_consultation_integrity.test.sql
```

Then run locally if Supabase/Docker are available:

```bash
npm install
supabase start
supabase db reset
supabase db lint --local --schema public,private --level warning --fail-on error
supabase test db
node scripts/seed-integration-auth.mjs
npm run verify
npm run check:domain
npm run check
npm run test:unit
npm run build
```

The GitHub workflows currently run automatically on pull requests and pushes to `master`, not ordinary pushes to `chatgpt/design-system-v2`. Opening a PR from the branch or using `workflow_dispatch` will exercise them.

## Security intent

Do **not** fix these failures by granting students/staff broader table access, restoring role mutation through the Data API, or weakening RLS. The production security model is the intended behavior; the stale tests/fixtures are what changed here.
