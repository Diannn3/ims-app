# IMS UI System V2

## Design goal

IMS Academic Hub uses the **Academic Instrument** design language: a precise, mobile-first academic product that feels like campus wayfinding, a timetable, and a scientific instrument. The interface exists to help students finish tasks quickly; it is not a marketing landing page or a generic SaaS dashboard.

## Product hierarchy

Prefer hierarchy in this order:

1. semantic structure and readable copy;
2. typography and identifiers;
3. spacing/alignment;
4. divider or surface change;
5. elevation only when elements actually overlap.

Do not create a new card simply because a section needs visual separation.

## Brand source

The supplied IMS mark remains unchanged. Brand anchors:

- IMS blue `#009BFF`
- IMS green `#17960E`
- IMS yellow `#FAF807`

Accessible UI derivatives:

- deep blue `#0077B8`
- blue ink `#005F91`
- deep green `#116B0A`

Semantic use:

- blue = navigation, selection, primary action, route focus;
- green = verified/success and route origin;
- yellow = destination, attention, site/review state;
- red = destructive/error only.

Most screens should be cool neutral + blue + at most one additional semantic state. Do not decorate a component with all three logo colors just to make it look branded.

## Typography

The runtime remains system-first for performance/offline reliability: `Aptos`, `Segoe UI Variable`, `Segoe UI`, and `system-ui`. Room/course identifiers may use a system monospace stack so `MB 304`, `MATH 38`, IDs, times, and codes scan quickly.

Routine product-page headings are compact. Avoid display-sized marketing typography. Long official names, URLs, section codes, and room identifiers must wrap safely.

## Geometry and elevation

Rounded scale:

- 4px micro;
- 6px compact controls;
- 8px standard controls and rows;
- 12px bounded surfaces/overlays;
- 16px rare large overlays.

Normal content is flat. Shadows are for transient or overlapping elements such as dialogs, popovers, map controls, and the fixed mobile navigation layer. Avoid 20–36px product radii, glow effects, floating card grids, and nested surfaces.

## Shell

Desktop uses a compact sticky header with:

- IMS identity;
- direct global search;
- primary destinations;
- no development/status pill in the permanent navigation chrome.

Mobile uses a full-width safe-area bottom navigation. It is attached to the viewport edge rather than rendered as a floating glass dock. Fixed navigation must not obscure keyboard focus or important content.

## Search

Search is a first-class product control. It should accept rooms, courses, people, services, and resources through one path. Strong identifiers appear before supporting metadata. The input is capped to the same 80-character contract enforced by search normalization.

## Rows before cards

Default to aligned rows for rooms, courses, people, resources, import batches, and review items. Use cards only for truly bounded objects/tasks such as a gradebook, selected destination, import batch workflow, or modal task.

## Zero-data behavior

Institutional data is allowed to be empty. An empty state must explain:

1. what the area is;
2. why data is absent;
3. what will appear later;
4. what the user can still do now.

Never fabricate a current course, schedule, faculty assignment, consultation, event, or institutional notice to make a screen look complete.

## Map workspace

The map is the dominant surface on `/map`. Search, floor selection, route state, and selected destination are compact controls around it. Desktop should evolve toward directory/sidebar + map. Mobile keeps equivalent functionality in compact controls and a destination region rather than hiding features.

Route semantics:

- origin = green;
- route = deep IMS blue plus non-color treatment;
- destination = yellow attention marker;
- selected room must remain distinguishable from route state.

## Accessibility and platform behavior

- maintain at least 44×44 CSS-pixel targets for primary controls;
- visible `:focus-visible` indicators;
- stable skip link and `<main id="main-content">`;
- preserve browser pinch/page zoom;
- preserve native links/history behavior;
- never make drag the only way to complete an action;
- fixed/sticky chrome must not fully obscure keyboard focus;
- respect `prefers-reduced-motion`;
- use semantic HTML and progressive enhancement before adding JavaScript/UI libraries.

## Motion

Motion is spatial and functional only: map camera movement, route drawing, selected-room state, a mobile destination sheet, disclosure, or search-result appearance. No bounce/elastic easing, animated background blobs, floating-card choreography, or decorative logo motion.

## Migration rule

`src/design-system-v2.css` intentionally layers over the original `src/app.css` while routes are migrated. Do not duplicate global tokens in route styles. When every major route has completed its V2 pass, consolidate the two stylesheets and remove compatibility rules in a separate cleanup change.
