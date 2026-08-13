# Local Development

## Requirements

- Node.js 20+ (22 recommended)
- npm
- Supabase CLI
- Docker-compatible runtime required by local Supabase

## First run

```bash
npm install
cp .env.example .env
supabase start
supabase db reset
npm run types:db
npm run verify
npm run dev
```

The default local Supabase URL/publishable key printed by `supabase start` should be copied into `.env` if they differ from your local defaults.

## Database workflow

Schema is migration-owned. Do not make production-only dashboard edits that are not represented in SQL.

```bash
# after adding/editing migrations
supabase db reset
npm run test:db
npm run types:db
```

`src/lib/database.types.ts` is generated output and must be regenerated after migrations 004–008. Do not hand-edit it to match the schema.

## Synthetic fixture account

The SQL seed creates academic fixture records but not a password-bearing Auth user. Create a local Auth account using the normal Supabase local tooling/UI, then promote its `profiles.role` with trusted local/admin SQL for staff testing. See `docs/STAFF_AUTH.md`.

## Quality gate

```bash
npm run check
npm run test:unit
npm run test:db
npm run test:e2e
npm run verify
npm run build
```

### What each gate proves

- `check`: Svelte/TypeScript diagnostics
- `test:unit`: grade/import domain logic
- `test:db`: pgTAP RLS/security/invariant checks
- `test:e2e`: browser-level public journey smoke tests
- `verify`: dependency-free structural + map/graph invariants
- `build`: production bundling

## Environment safety

Only public Supabase URL/publishable key belong in public environment variables. Do not place a service-role/secret key in browser-accessible variables. The current normal admin/import flows are designed to work through RLS and narrowly scoped database functions instead of a browser-visible privileged key.
