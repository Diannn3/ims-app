# IMS Academic Hub — Implementation Handoff

## Canonical baseline audited

The implementation was based on GitHub `Diannn3/ims-app` `master` at commit:

`f144aab4865e4a30010079c5198cfe43dc9dcb11`

That commit already contained migrations 001–003 and the synthetic seed foundation. The current cloud-local implementation adds the application/data-governance work described below.

## Added/expanded in this pass

- premium IMS visual system and logo integration
- SvelteKit/Supabase SSR/auth boundary
- academic repository/read models and public routes
- map viewport/deep-link route improvements
- local IndexedDB gradebook workspace
- CSV importer/parser/validator/staging/admin preview
- migrations 004–008 for review/publication security, provenance, import hardening, staff auth bootstrap, reference management, and schedule review/publication
- research/forms/calendar/events/help routes
- admin data health, imports, sources, terms, review queue
- service-worker caching boundary
- test scaffolding and dependency-free verifiers

## Important limitation

GitHub repository reads worked in this session, but GitHub write operations returned HTTP 403 `Resource not accessible by integration`. Therefore no branch/commit/PR was successfully pushed from this environment.

Use the generated overlay/full package from this implementation session, or re-enable GitHub App repository-content write permission and push the implementation branch afterward.

## Before merging to production

1. Install dependencies.
2. Run local Supabase migrations 001–008 from scratch.
3. Run `npm run test:db` and fix any SQL signature/policy issues revealed by a real Postgres execution.
4. Run `npm run types:db`.
5. Run `npm run check`, unit tests, Playwright, and production build.
6. Verify the synthetic complete path and governance path.
7. Conduct a physical Math Building walkthrough before trusting route geometry.
8. Keep production academic content empty until real verified sources are available.
