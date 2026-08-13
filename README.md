# IMS Academic Hub

A mobile-first SvelteKit application for the UPLB Institute of Mathematical Sciences (IMS) Math Building. The product connects **indoor wayfinding**, **verified academic information**, and **private student tools** through permanent room/space IDs.

## Product model

The application is intentionally split into three domains:

1. **Navigation engine** — semantic SVG floor maps, static space metadata, a client-side A* graph, deep-linked rooms, and prototype QR/deep-link “You Are Here” anchors.
2. **Academic knowledge engine** — published courses, sections, faculty, offices, consultation schedules, services, research, forms/resources, academic dates, and events backed by Supabase/PostgreSQL.
3. **Personal academic tools** — local-only gradebooks in IndexedDB with weighted categories, raw scores, what-if simulations, target-grade solving, and optional user-supplied transmutation tables.

The gradebook does **not** use Supabase. Student-facing academic pages expose only records that pass the publication boundary. Imported schedule rows are staged and reviewed before they can be published.

## Current implementation

### Student-facing

- Premium responsive shell using the supplied IMS mark and a tokenized blue/green/yellow visual system
- Accessible Home / Map / Academics / People / Tools information architecture
- Interactive three-floor schematic Math Building map
- Room and facility search, deep links, prototype `/loc/[slug]` location anchors, focusable SVG room controls, pan/zoom viewport, A* routing, cross-floor route segments, and textual route alternatives
- Course, faculty, consultation, room, Math Clinic, research, forms/resources, academic calendar, events, and academic-help routes
- Universal Search V2 across static rooms and published academic entities
- Published-only provenance and freshness badges
- Local-first multi-gradebook workspace with IndexedDB persistence, what-if mode, target grade, custom grading scale, JSON backup/restore

### Data and administration

- Local Supabase project with migrations and synthetic seed data
- Request-scoped SvelteKit/Supabase SSR integration using cookie sessions
- Staff sign-in/sign-out and role-aware `/admin` guard
- RLS/publication hardening and separate review status
- Safe public provenance view; internal source notes are not exposed publicly
- One-current-academic-term database invariant
- RFC-compatible CSV parsing through `csv-parse`
- Schedule import staging, canonical normalization, room/course/faculty resolution, issue reporting, preview hashes, and content hashes
- Stable external `source_record_key` support for idempotent corrections
- Admin import preview, warning acknowledgement, transactional apply, immutable applied/rejected batches
- Normalized `source_records` provenance for imported rows
- **Fail-closed import application:** changed schedules become `needs_verification`, never public automatically
- Schedule review queue: editors can verify/return; only admins can publish/withdraw
- Data source and academic-term administration
- pgTAP security-test scaffold, Vitest domain tests, Playwright smoke journeys, and dependency-free project/data verification scripts

## Critical map caveat

The floorplans under `reference/` are user-provided orientation graphics, not architectural drawings. The reconstructed geometry and route graph are deliberately **schematic and site-unverified**.

Do not claim production-grade accessibility routing, emergency evacuation routing, or exact physical geometry until a Math Building walkthrough verifies doors, corridors, stair connections, restricted areas, and relevant official safety/accessibility information.

## Development setup

Requirements:

- Node.js 20+ (22 recommended)
- npm
- Supabase CLI for local database/auth/RLS testing

```bash
npm install
cp .env.example .env
supabase start
supabase db reset
npm run types:db
npm run verify
npm run dev
```

The local seed is deliberately synthetic (`DEMO 101`, `Prof. Demo Alpha`, etc.). It exists to exercise real repository/RLS/query paths without fabricating current UPLB offerings.

### Quality commands

```bash
npm run check
npm run test:unit
npm run test:db
npm run test:e2e
npm run verify
npm run build
```

`npm run test:db` requires a running local Supabase stack. `npm run types:db` must be rerun after schema changes; generated database types should not be hand-maintained.

## Real-data rule

Do not insert guessed current-semester classes, professor assignments, consultation hours, or room schedules. Real data must enter through a verified source and, for bulk schedules, the staging/review pipeline.

Preferred schedule columns include:

```text
source_record_key  # optional but strongly recommended
course_code
section_code
days
start_time
end_time
room
faculty_email
faculty_name
```

See `docs/IMPORT_PIPELINE.md` and `docs/DATA_SOURCE_MATRIX.md`.

## Framework decision

The application stays on **SvelteKit**. Astro is not part of the app runtime. This product is interaction-heavy (map state, offline behavior, IndexedDB gradebooks, SSR auth, form actions, admin workflows), so keeping one SvelteKit client/server model avoids an unnecessary framework boundary.

## Documentation

- `docs/ARCHITECTURE.md`
- `docs/UI_SYSTEM.md`
- `docs/DATA_SOURCE_MATRIX.md`
- `docs/IMPORT_PIPELINE.md`
- `docs/LOCAL_DEVELOPMENT.md`
- `docs/STAFF_AUTH.md`
- `docs/QR_ANCHORS.md`
- `docs/CI.md`
- Existing map/routing/grade/security specifications under `docs/`
