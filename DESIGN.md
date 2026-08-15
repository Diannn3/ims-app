# Design System: IMS Academic Hub

## Overview

**Creative North Star: “Academic Instrument.”**

IMS Academic Hub is a precise academic utility, not a generic SaaS dashboard and not an expressive marketing site. The interface should feel like campus wayfinding, a timetable, and a scientific instrument combined: cool, legible, compact, trustworthy, and distinctly IMS.

Hierarchy comes from typography, spacing, alignment, and restrained color before elevation. Product screens prioritize the task and current state; branding supports orientation rather than dominating the viewport.

The visual system preserves the supplied IMS mark and its blue/green/yellow identity while using darker accessible derivatives for UI text and controls. Most screens should read as cool neutral + IMS blue, with green or yellow appearing only when their semantic meaning is needed.

## Colors

### Brand anchors

- **IMS Blue** `#009BFF` — original logo/brand anchor; use carefully on large or high-contrast surfaces.
- **IMS Green** `#17960E` — original logo/brand anchor.
- **IMS Yellow** `#FAF807` — original logo/brand anchor; attention/destination, never general body text on white.

### Accessible UI derivatives

- **Deep Blue** `#0077B8` — primary interactive color.
- **Blue Ink** `#005F91` — strong link/identifier color.
- **Deep Green** `#116B0A` — verified/success state.
- **Ink** `#102132` — default text, tinted toward IMS blue rather than neutral gray.
- **Ink Strong** `#071728` — high-emphasis text.
- **Muted Strong** `#425468` — secondary text.
- **Muted** `#617183` — tertiary text; only where contrast remains sufficient.

### Surfaces

- **Paper** `#FFFFFF` — primary surface.
- **Page** `#F6FBFF` — default page field.
- **Blue Wash** `#EAF6FF` — selected/navigation context.
- **Green Wash** `#EFF9EE` — verified/success context.
- **Yellow Wash** `#FFFEDE` — attention/review context.
- **Rule** `#D9E6EF` — normal divider.
- **Rule Strong** `#BDD3E2` — stronger structural boundary.

### Semantic roles

- Blue = navigation, selection, primary action, route focus.
- Green = verified, successful, route origin.
- Yellow = destination, needs-review/site-verification attention.
- Red = destructive/error only.

Do not use all three brand colors decoratively in the same component simply to make it “look IMS.”

## Typography

Typography is compact, highly legible, and optimized for identifiers, long official names, tables, forms, and map controls.

### Runtime stack

- **Primary UI:** `Aptos`, `Segoe UI Variable`, `Segoe UI`, then `system-ui`. This remains system-first so navigation and offline use do not depend on a font download.
- **Identifiers / numeric accent:** `ui-monospace`, `SFMono-Regular`, `Cascadia Code`, `Menlo`, or `Consolas`, used sparingly for room/course codes and technical metadata.

A future font-family change should be evaluated across Home, Map, Course, Faculty, Grade Workspace, and Admin before being introduced. Do not silently add a third family or an external font dependency.

### Hierarchy

- Utility-page H1: compact and decisive; avoid landing-page display sizes.
- Section headings: strong weight, modest size jump.
- Body: minimum comfortable reading size; target 16px on primary content.
- Labels/metadata: may be smaller, but retain readable contrast and spacing.
- Room/course identifiers such as `MB 304` and `MATH 38` should scan faster than supporting metadata.

Use `text-wrap: balance` for short headings and `text-wrap: pretty` for prose where supported. Long official names, URLs, and identifiers must wrap without layout breakage.

## Elevation

**Flat by default.** Elevation is functional, not decorative.

Use boundaries in this order:

1. spacing/alignment;
2. tinted surface change;
3. thin cool divider/border;
4. shadow only when depth communicates behavior.

Shadows are appropriate for transient overlays, search result popovers, floating map controls, dialogs, and sticky layers that physically overlap content. Normal sections, rows, and informational groups should not become floating cards merely to create hierarchy.

### Rounded scale

- 4px — tiny indicators/micro controls.
- 6px — compact controls.
- 8px — standard fields/buttons/rows.
- 12px — prominent bounded surfaces and overlays.
- 16px — rare large overlays/dialogs.

Avoid 20–36px radii as a default product language. Full pills are reserved for true tags/status chips or segmented controls where the geometry communicates grouping.

## Components

### Application shell

- Desktop: compact sticky header with IMS identity, primary destinations, and direct search access.
- Mobile: safe-area-aware bottom navigation for primary destinations; do not duplicate large desktop chrome.
- Fixed/sticky navigation must never obscure keyboard focus.

### Search

Search is a primary product control, not a decorative hero element. Results group by entity type and expose the strongest identifier first. Empty academic groups explain that verified data is not loaded instead of disappearing ambiguously.

### Entity rows

Rooms, courses, faculty, resources, review items, and import batches default to aligned rows/lists before card grids. Rows should expose:

- primary identifier/title;
- one concise supporting line;
- status/metadata only when decision-relevant;
- clear affordance for navigation/action.

### Cards

A card must represent an actual bounded object or task, such as a gradebook, selected destination, import batch, or discrete workflow. Do not use a card merely as a background behind every paragraph or section heading. Never nest cards without a strong interaction reason.

### Map workspace

The map is the dominant surface on the navigation route. Search, floor switcher, selected destination, and route actions stay compact around it. Desktop uses a directory/sidebar + map workspace; mobile adapts that functionality into compact controls and a destination sheet rather than hiding it.

Route language:

- origin = green;
- route = deep IMS blue with a non-color contrast treatment where needed;
- destination = yellow attention marker;
- selected room remains distinguishable from route state.

### Status and provenance

Use concise status lines/badges for verification, freshness, publication, and site-verification only when the status changes trust or action. Avoid badge soup.

### Empty states

Every intentional no-data state should answer:

1. what area the user is in;
2. why data is absent;
3. what will appear here later;
4. what useful action is available now.

Example: `No verified current-term schedule loaded. You can still find the room or use the grade calculator.`

### Forms and admin

Prefer dense, predictable forms/tables with bounded horizontal scrolling on narrow screens. Use native controls unless a custom control materially improves the task. Destructive actions require clear wording and separation from routine actions.

## Do’s and Don’ts

### Do

- Prioritize utility over marketing presentation.
- Let whitespace and alignment create hierarchy before adding containers.
- Keep the IMS mark intact.
- Use blue for navigation/primary action, green for verified/origin, yellow for destination/attention.
- Preserve native links for navigation and browser history behavior.
- Keep primary touch targets at least 44×44 CSS pixels.
- Provide strong `:focus-visible` states.
- Respect browser zoom and pinch zoom.
- Support `prefers-reduced-motion`.
- Adapt functionality for mobile instead of removing it.
- Design zero-data, error, offline, long-text, and dense-data states intentionally.
- Keep academic truthfulness more important than visual completeness.

### Don’t

- Do not create giant hero sections on routine product pages.
- Do not use a grid of cards as the default information architecture.
- Do not nest cards for visual depth.
- Do not use decorative gradients/glows as the main brand signal.
- Do not use bright yellow as a general background or small text color.
- Do not add bounce or elastic easing.
- Do not hide critical controls on mobile.
- Do not replace reliable browser behavior with unnecessary JavaScript.
- Do not introduce arbitrary colors, font families, radii, or shadows outside this system without updating this document.
- Do not fabricate institutional data, even for placeholders or screenshots.
