# Implementation Plan

## Milestone 0 — Foundation (started in this repository)
- SvelteKit/TypeScript shell
- domain boundaries
- schematic structured floor data
- SVG generation
- routing engine
- grade engine
- database migration
- documentation

## Milestone 1 — Verified Building Explorer
1. Perform physical building walkthrough.
2. Correct room footprints and door locations.
3. Validate all stairs and entrances.
4. Add landmark photographs.
5. Add map pan/zoom wrapper (Leaflet CRS.Simple or retained SVG viewport after UX testing).
6. Add deep links `/room/[id]` and `/loc/[anchor]`.
7. Generate QR anchor prototypes.

## Milestone 2 — Academic Core
1. Create authoritative term/course/faculty seed imports.
2. Add CSV/Google Sheet staging importer.
3. Validate references before production merge.
4. Implement course, section, room schedule, and faculty pages.
5. Implement consultation directory and faculty office navigation.

## Milestone 3 — Unified Academic Discovery
1. Build unified search index across rooms/courses/faculty/services/resources.
2. Add Math Clinic service page.
3. Add academic forms/resource directory.
4. Add academic calendar and events.
5. Add `Who do I ask?` structured help tree.

## Milestone 4 — Private Student Tools
1. Persist gradebooks in IndexedDB.
2. Add what-if mode.
3. Add user-entered transmutation tables.
4. Add optional saved courses/faculty/rooms.

## Milestone 5 — Research and Curriculum
1. Course prerequisite graph.
2. Curriculum explorer.
3. Research area → faculty explorer.
4. Thesis/SP resource center.

## Milestone 6 — Operations
1. Faculty self-service portal.
2. Admin import review/diff UI.
3. Data freshness dashboard.
4. Correction-report moderation.
5. Route restriction management.
6. Audit logs and RLS tests.

## Milestone 7 — PWA and QA
1. Offline map/navigation.
2. Cached academic snapshot with freshness indicators.
3. Full keyboard/screen-reader testing.
4. Mobile Safari/Chrome testing.
5. Physical route validation with students.
6. Closed beta before permanent QR deployment.
