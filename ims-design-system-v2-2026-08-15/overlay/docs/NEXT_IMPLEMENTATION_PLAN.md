# Next implementation milestone — First Green + IMS Design System V2

Pinned baseline: `a922d74f881d97075d61ac9277c6927efdabc21e`

## Gate 1 — First Green

1. Update stale pgTAP expectations to the current RLS/read-surface architecture.
2. Stop tests from selecting internal staging tables under roles that intentionally cannot read them; capture SECURITY DEFINER RPC return IDs instead.
3. Replace the unsupported four-argument `has_check()` assertion with an exact catalog assertion for the named constraint.
4. Keep integration staff-role promotion local-only and perform it through the local database admin path rather than the Data API.
5. Regenerate database types after the database gate is green.
6. Run framework check, unit tests, DB tests, build, and seeded Playwright integration.

## Gate 2 — Impeccable context

1. Keep `PRODUCT.md` and `DESIGN.md` at repository root.
2. Install Impeccable in the developer harness; do not add it to the application runtime.
3. Run `/impeccable document` after the first token/component refactor so `.impeccable/design.json` reflects code, not just intent.
4. Start the detector as advisory/non-blocking; only promote stable design-system violations to CI blockers after reviewing false positives.

## Gate 3 — UI foundation

Order of work:

1. ✅ global tokens + shell — first V2 slice implemented in cloud bundle;
2. ✅ Home — search-first utility layout implemented;
3. ✅ Map — map-first workspace, directory adaptation, route styling, and SVG semantics implemented;
4. ✅ Search — grouped identifier-led result rows implemented;
5. ◐ Room + location-anchor pages — room detail migrated; anchor pages still pending;
6. ✅ Math Clinic — location-first zero-data service page migrated;
7. ◐ academics zero-data views — hub + shared empty/error states migrated; people/consultations/research/events/forms/calendar/detail pages still pending;
8. grade workspace correctness then UI;
9. admin/import UI;
10. full responsive/a11y/performance hardening.

## Definition of done before real academic data

- CI green from a clean migration replay.
- No known grade-workspace persistence/correctness bug.
- Map interaction is keyboard/touch/pointer usable and site-verification warnings remain explicit.
- All student routes have intentional no-data/error/offline states.
- Visual system is documented and detector drift is understood.
- No fake current-semester institutional data is introduced.
