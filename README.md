# Math Building Academic Hub

A mobile-first prototype for turning the UPLB Math Building into an indoor navigation + academic information hub.

## What is implemented in this starter

- SvelteKit + TypeScript project shell
- Semantic, schematic vector floor data for Ground / Second / Third Floor
- Generated SVG floorplan fallbacks
- Searchable rooms and facilities
- Interactive room selection
- Cross-floor graph data and client-side A* routing engine
- Prototype route from the ground-floor main entrance to a selected room
- Weighted grade-calculation engine with raw score input
- Pending assessments are not silently counted as zero
- Target-grade calculation foundation
- Supabase/Postgres schema for buildings, spaces, courses, sections, faculty, consultation hours, research, resources, events, corrections, and imports
- Service-worker scaffold for offline assets
- Architecture/specification documents

## Critical map caveat

The three floorplans in `reference/` were supplied by the user and are orientation graphics, not architectural drawings. The vector geometry in this repository is a schematic reconstruction and is intentionally tagged `needs-site-verification`.

Do not publish production navigation, accessibility routing, or emergency routing until the physical building is checked on site and the relevant official safety/accessibility information is verified.

## Run locally

```bash
npm install
npm run generate:maps
npm run verify:data
npm run dev
```

Current SvelteKit projects are normally created with the official `sv` CLI; this starter is laid out as a conventional SvelteKit app so it can be moved into an existing repository or regenerated with the CLI if preferred.

## Next implementation milestones

1. Site-verify vector geometry and door locations.
2. Replace schematic hallway path with verified geometry.
3. Add location-anchor QR deep links.
4. Add course/section import pipeline.
5. Add faculty + consultation UIs.
6. Add universal search index.
7. Persist private gradebooks in IndexedDB.
8. Add admin/faculty editing flows with Supabase RLS.
9. Perform accessibility and physical-route QA.
