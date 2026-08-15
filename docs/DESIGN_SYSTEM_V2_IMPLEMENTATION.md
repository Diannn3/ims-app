# Design System V2 — Implementation Notes

Base repository SHA: `a922d74f881d97075d61ac9277c6927efdabc21e`

## Implemented in the first V2 slice

- Added a compatibility-layer stylesheet at `src/design-system-v2.css`.
- Flattened the global page field and removed decorative background grid/gradients through V2 overrides.
- Reduced shared radius/elevation tokens without rewriting every legacy route at once.
- Reworked the sticky header into a compact product shell with global search.
- Removed the permanent `Build phase` status pill from navigation chrome.
- Reworked mobile navigation from a floating rounded dock into a safe-area, edge-attached navigation bar.
- Rebuilt the home page around utility search, current system state, task rows, and explicit zero-data communication.
- Removed the giant marketing hero, logo orbit, capability-card grid, decorative gradients/glows, and quick-action card grid from Home.
- Rebuilt `/map` as a map-first workspace with desktop floor directory, native mobile directory disclosure, compact command bar, route-floor controls, and a dedicated selected-destination region.
- Fixed the map SVG accessibility model by removing the flattening image role while preserving keyboard-operable room controls.
- Added keyboard zoom shortcuts (+, −, 0) alongside visible buttons; drag/pan is not required for core map operation.
- Changed route rendering to deep IMS blue with a white halo and dash pattern; selected destinations retain the yellow attention treatment.
- Rebuilt `/search` as grouped, identifier-led rows instead of colored icon cards.
- Migrated `/room/[id]` to a location-first record with flat schedule rows and explicit geometry verification.
- Migrated `/services/math-clinic` to a location-first, truthful zero-data service record.
- Migrated `/academics` from a colored navigation-card grid to a numbered academic-directory list and flat course rows.
- Reworked shared `AcademicEmptyState` and `AcademicErrorState` components into consistent status rows so downstream academic routes inherit V2 zero-data/error behavior.
- Reworked `CourseCard` into an identifier-led course row while preserving source/freshness provenance.
- Preserved the existing routing/domain architecture and did not add a UI framework or runtime dependency.

## Why the stylesheet is layered

The repository contains many route-specific styles that still reference the original global token names. A destructive replacement of `app.css` would make Map, Academics, Grades, and Admin harder to review in one change. V2 therefore overrides the shared contract first. Each route can then migrate deliberately, followed by a final CSS consolidation after visual QA.

## Next route migration order

1. `/loc/[slug]` — align anchor pages with the same location-record language.
2. `/people`, `/consultations`, `/research`, `/events`, `/academics/forms`, `/academics/calendar` — carry the new academic-directory and shared-state language through the remaining list routes.
3. `/course/[code]` and `/faculty/[slug]` — identifier-led academic detail pages.
4. `/tools/grades` — only after grade correctness/persistence audit blockers are fixed.
5. `/admin/*` — dense quiet operational UI with provenance and state changes prioritized over visual metrics.
6. Consolidate `app.css` + `design-system-v2.css` only after route migration and visual QA are complete.

## Required QA before calling V2 stable

Viewport sweep:

- 320×568
- 375×812
- 390×844
- 430×932
- 768×1024
- 1024×768
- 1280×800
- 1440×900

Interaction/accessibility:

- keyboard-only traversal;
- visible focus around fixed header/mobile nav;
- 200% browser zoom;
- reduced motion;
- high contrast where available;
- long faculty/course/room labels;
- empty, single-item, and dense data;
- offline/static-map behavior;
- error and unavailable repository states.

## Impeccable workflow

Once the full project is available in a normal development checkout:

1. `npx impeccable install`
2. run `/impeccable document` to generate `.impeccable/design.json` from the reviewed `DESIGN.md` and actual code;
3. `npx impeccable detect src/` as an advisory scan;
4. use `/impeccable critique` on Home/Map/Search;
5. use `/impeccable audit`, `/harden`, and `/adapt` before final polish;
6. only consider blocking detector findings in CI after false positives/intentional exceptions are documented.
