# IMS Premium UI/UX Implementation Plan

## Product Direction

IMS is a mobile-first academic wayfinding product for UPLB students, faculty, and staff. Its visual language comes from campus signage, room codes, floor plans, timetables, and verified academic records—not generic SaaS dashboards.

- Hybrid Tailwind CSS v4 migration using CSS-first design tokens.
- Source Sans 3 for interface text and IBM Plex Mono for room codes, schedules, and numeric data.
- Light theme in this release, with a complete inactive dark-token contract.
- Native Svelte transitions and motion only.
- Glass reserved for navigation, map controls, and transient sheets.
- One coordinated release covering student, staff, and administrative routes.

## Baseline & Stabilization Gate

Before visual migration, the application must have zero `svelte-check` errors or warnings, a passing production build, valid keyboard semantics, corrected text encoding, typed form state, and confirmation or recovery for destructive gradebook actions.

The pre-redesign audit found a CSS-only styling system, large route-scoped styles, no Svelte motion APIs, plain-text loading states, hard-coded colors, decorative gradients, generic cards and pills, pseudo-icons, and six errors plus seven warnings in the static check.

## Design System

### Foundations

- Preserve IMS Blue `#009BFF`, Green `#17960E`, and Yellow `#FAF807` as primitives.
- Expose semantic canvas, surface, raised, ink, muted, border, focus, info, success, warning, danger, selection, and route-path tokens.
- Define dark equivalents for every semantic token without exposing a theme toggle.
- Use a 4 px base spacing grid, restrained radius hierarchy, three elevations, and 120/180/240 ms motion tiers.
- Yellow is a highlight or caution color, never normal body text on white.

### Architecture

- Primitives: Button, IconButton, TextField, SearchField, Select, SegmentedControl, Tabs, StatusChip, SourceStamp, Skeleton, InlineAlert, EmptyState, ConfirmDialog, BottomSheet, Tooltip.
- Shell: AppHeader, DesktopNavigation, BottomNavigation, PageHeader, ContextBar, Breadcrumbs, LoadingBar.
- Academic: RoomResult, CourseRow, SectionSchedule, FacultyIdentity, ConsultationSlot, ResearchItem, GradeSummary, AssessmentRow, ImportStepper, ImportBatchRow, IssueTable.
- Domain components receive repository view models and never query Supabase directly.
- Do not create a universal Card component; component structure must reflect the academic content.

## Surface Blueprint

- **Shell:** compact header, five-destination mobile navigation, clear current-page state, safe areas, no decorative build-status pill.
- **Home:** dominant room/academic search, high-frequency tasks, current publication context, consultations, and provenance.
- **Search:** URL-backed query and filters, grouped semantic rows, highlighted matches, recent local searches, Lucide icons.
- **Map:** maximum map area, floor/fit/zoom controls, selected-room state, route summary, touch gestures, and mobile bottom sheet with a textual alternative.
- **Academics and people:** dense course, schedule, consultation, and faculty structures with source metadata.
- **Grades:** ledger editing, sticky summary, autosave status, target solver, confirmation before deletion, and local-only privacy messaging.
- **Staff/admin:** data workspace layout, filters, semantic tables, validation summaries, and safe bulk actions.
- **Imports:** upload, validate, review, and apply stepper; apply remains unavailable until backend hardening and idempotent diff support exist.

## Motion & Mobile Rules

- Use `svelte/transition` for stateful panels and alerts, `animate:flip` for reordered lists, and CSS transform/opacity for feedback.
- Use SvelteKit `onNavigate` for progressive view transitions with a non-blocking fallback.
- Respect reduced motion and never use `transition: all`.
- Loading uses structural skeletons that preserve final geometry.
- Interactive targets are at least 44 px, with primary mobile controls designed around 48 px.
- Every gesture has a visible control equivalent; map gestures remain bounded to the viewport.

## Verification

- Zero errors or warnings from `npm run check`.
- Passing unit, build, and Playwright suites.
- Automated axe coverage for student and administrative flows.
- Responsive verification at 375, 390, 768, 1024, and 1440 px.
- Keyboard, 200% zoom, reduced motion, high contrast, safe-area, long-content, empty/error/loading, and offline-font checks.
- Final anti-vibecode review: no decorative orbit/blob, pseudo-icons, indiscriminate pill/card use, meaningless gradients, or mixed legacy visual layer.

## Delivery Order

1. Stabilize types, semantics, encoding, and destructive actions.
2. Add Tailwind v4, self-hosted fonts, semantic tokens, and typed UI contracts.
3. Refactor the shell and shared primitives.
4. Migrate student routes, then staff/admin/imports within the same release.
5. Add motion and skeletons after layout geometry is stable.
6. Run automated and browser-in-the-loop verification before release acceptance.
