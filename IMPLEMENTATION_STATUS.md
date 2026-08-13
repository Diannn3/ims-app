# Implementation Status

Last implementation pass: 2026-08-13

## Implemented

### Application shell and UI system
- SvelteKit 2 + Svelte 5 + TypeScript structure
- Supplied IMS logo asset under `static/brand/ims-mark.png`
- Tokenized IMS palette, typography, spacing, surfaces, shadows, focus states, and reduced-motion behavior
- Accessible skip link, stable `#main-content`, keyboard focus visibility, 44×44 touch targets, safe-area-aware mobile navigation, and responsive desktop navigation
- Public navigation: Home / Map / Academics / People / Tools

### Navigation engine
- 43 schematic spaces/facilities across three floors
- 64 navigation nodes and 67 graph edges
- Semantic SVG renderer and generated floor SVG fallbacks
- Client-side A* routing and floor segmentation
- Room/facility search and deep-link selection
- Pan/zoom map viewport without disabling browser zoom
- Text route alternatives
- Prototype location-anchor registry and `/loc/[slug]` deep-link flow
- Deliberately site-unverified geometry

### Academic core
- Request-scoped Supabase SSR client in SvelteKit hooks
- Authenticated profile/role resolution
- Typed academic repository/read-model layer; Svelte components do not query Supabase directly
- Published-only public reads
- Courses, faculty, consultations, rooms, services, research, resources/forms, dates/calendar, events
- Course prerequisites in course read models
- Universal Search V2: rooms + published courses/faculty/services/research/resources
- Source/freshness UI and explicit no-published-data states

### Grade tools
- Weighted categories and raw score input
- Pending items excluded instead of silently treated as zero
- Points and equal-assessment category modes
- What-if simulation
- Target-grade solver
- User-defined transmutation/grading scale
- Multiple versioned gradebooks persisted in IndexedDB
- JSON export/import
- No Supabase coupling

### Academic data governance
- Migrations 001–008
- Separate `review_status` from public visibility lifecycle
- RLS hardening and published-only student reads
- One-current-term unique database invariant
- Safe public provenance view
- Private role helper and protected staff visibility
- Faculty consultation publication transitions protected from self-publishing
- Synthetic local seed matrix
- CSV staging tables and issue metadata
- Normalized `source_records` provenance
- Transactional `apply_import_batch(...)`
- Imported schedule changes fail closed into verification state
- Schedule review audit log
- Editors can verify/return schedule sections
- Only admins can publish/withdraw schedule sections
- Admin source/term management

### Import workflow
- UTF-8 CSV parser with byte/row/cell limits
- Header validation/mapping
- Course/room/faculty normalization
- `source_record_key` / `record_id` support
- Stable canonical hashes and preview hashes
- Unknown rooms fail validation
- Unknown/ambiguous faculty are warnings and remain unresolved
- Duplicate source keys with conflicting content fail
- Existing source hashes classify unchanged/changed records
- Admin preview, warning acknowledgement, admin-only apply/reject
- Applied/rejected batches retained as audit records

### Offline boundary
- Static build/map/brand assets cache-first
- Explicit audited public shell pages network-first with cached fallback
- Dynamic academic SSR remains network-owned until a dedicated public snapshot format is designed
- Admin, staff/auth, RPC, import, and non-GET requests are never runtime-cached

### Testing and verification
- Grade/import Vitest tests
- Playwright smoke journeys
- pgTAP security/invariant tests
- `scripts/verify-data.mjs`
- `scripts/verify-project.mjs`
- GitHub Actions scaffolds for app quality and Supabase/pgTAP database security tests

## Validated in this cloud environment

The dependency-free checks pass:

```text
Project verification passed.
8 ordered database migrations.
43 spaces, 64 graph nodes, 67 graph edges.
All space routing references resolve.
```

## Not executable in this cloud environment

This environment does not currently have the project npm dependencies, Supabase CLI/Postgres, or browser test dependencies installed. Therefore the following still need to be executed on a normal dev machine/CI environment:

- `npm install`
- `npm run check`
- `npm run test:unit`
- `npm run test:db`
- `npm run test:e2e`
- `npm run build`
- `npm run types:db`

The database migrations and Svelte code should be treated as **implemented but awaiting real toolchain execution**, not as proven production-ready.

## Intentionally pending

- Physical Math Building route/door/facility verification
- Real current-semester section/faculty/consultation dataset
- Production Supabase project configuration
- Generated DB types after migrations 004–008
- Permanent QR placement/printing (prototype anchor routes are implemented)
- Dedicated offline academic public snapshot format
- Faculty self-service profile/consultation editor UI
- Current-term authoritative-snapshot deletion/reconciliation policy
- Full closed beta and accessibility/device QA

## Next best engineering step

Run the full local toolchain against migrations 001–008, fix any SQL/Svelte/type issues revealed by real execution, regenerate DB types, then test the complete synthetic path:

`DEMO 101 → Section A → Prof. Demo Alpha → MB 304 → map`

and the governance path:

`CSV → stage → validate → acknowledge → admin apply → editor verify → admin publish → public course/room schedule`.
