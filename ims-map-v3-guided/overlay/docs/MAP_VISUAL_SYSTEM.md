# IMS Indoor Map Visual System

## Direction

The IMS indoor map is a high-contrast, interactive wayfinding instrument. The user-supplied floor posters remain the visual arrangement reference, but the application renders an orthogonalized semantic SVG rather than raster poster art.

The current map is **reference-matched**, not **site-verified**. A physical walkthrough is still required before making authoritative accessibility, emergency, restriction, exact-door, or compass-orientation claims.

## Brand mapping

- IMS Blue `#009BFF`: map field / primary spatial identity
- Deep Blue `#0077B8` and Ink Blue `#005F91`: rooms and structural contrast
- IMS Yellow `#FAF807`: selected destination, floor emphasis, keyboard focus
- IMS Green `#17960E`: active route and route origin
- White: structural outlines, route halo, separation
- Soft derived yellow: circulation/hallway fill
- Poster-derived exits: neutral white/deep-blue dashed treatment until site verification

## Geometry ownership

The map intentionally has three independent data responsibilities:

1. `spaces.json` — permanent room/facility identity and interactive room rectangles.
2. `graph.json` — route nodes, connectors, door nodes, and A* topology.
3. `floor-visuals.ts` — poster-matched hallway shape, poster markers, and visual content bounds.

Do not move graph nodes merely to make a screenshot prettier. If site verification proves geometry or connectivity wrong, update visual geometry and routing data intentionally and together.

## Camera model

`MapViewport.svelte` uses the SVG `viewBox` as a real map camera rather than enlarging the SVG container.

V3 camera rules:

- Canvas dimensions come from `building.json`; camera math no longer duplicates `1200 × 760`.
- The legal camera boundary expands to the rendered viewport aspect ratio, allowing a portrait phone to fit the full wide floor without distorting the map or cropping it.
- Pointer-centered wheel zoom converts screen coordinates through the SVG's actual `getScreenCTM().inverse()` transform. A ratio-based fallback is retained only for unusual embedded SVG environments.
- Mobile overlays reserve camera insets so search/focus operations do not intentionally place a room underneath the selected-place sheet.
- Keyboard-focused rooms call `ensureRectVisible(...)` and pan only as much as necessary to remain unobscured.

Supported camera operations:

- Fit floor
- Center selected room/facility
- Fit active route segment
- Fit active guidance step
- Zoom in/out
- Wheel zoom around pointer position
- Pointer drag to pan
- Arrow-key pan
- `+` / `-` zoom
- `0` fit floor
- `R` fit route
- `S` center selected space

The pure camera math lives in `src/lib/domain/navigation/map-camera.ts` and has unit coverage.

## Progressive detail

The renderer uses three levels based on the larger of horizontal/vertical map-units per rendered CSS pixel.

### Overview

- room identifiers
- hallway shape
- stairs/toilets
- selected room
- active route

### Navigation

Adds:

- Math Lab / Math Clinic subtitles
- stair labels
- stronger guidance-step context

### Detail

Adds:

- poster-marker labels
- secondary facility annotations

This prevents the phone map from turning into a label cloud.

## Guided route language

`src/lib/domain/navigation/route-instructions.ts` converts an A* route into a conservative prototype guidance sequence:

- Start
- Continue along corridor
- Turn left / right when graph geometry produces a meaningful turn
- Change floor through the named stair connector
- Arrive

Each instruction owns route node IDs. The active instruction therefore drives three things together:

1. the visible floor;
2. the camera focus bounds;
3. the emphasized route subsection.

Completed route portions are visually de-emphasized. Upcoming route geometry stays visible. Arrowheads are only placed on sufficiently long route edges instead of every graph edge.

All guidance is still prototype guidance until physical verification confirms corridor/door/stair geometry.

## Search behavior

Map search reuses the project's shared normalization/ranking logic rather than a local substring-only matcher.

The room search follows the editable WAI combobox model:

- `aria-expanded`
- `aria-controls`
- `aria-activedescendant`
- listbox/options
- Arrow Down / Arrow Up suggestion movement
- Enter selection
- Escape dismissal without destroying the query

Selecting a result still changes floors and focuses the selected room automatically.

## Mobile behavior

The map remains the dominant surface. Search and floor controls stay compact above it. Selected-place information is attached to the map frame as an overlay sheet on mobile rather than becoming a separate page block.

The camera receives an approximate bottom inset for the collapsed/expanded sheet, so auto-focus and keyboard-focus operations favor the unobscured map region.

## Safety / trust boundary

Poster-derived exit markers are not presented as verified emergency data:

- the legend explicitly calls them **Poster-marked exit · unverified**;
- emergency-marker styling is neutral/dashed rather than IMS-green route/success styling;
- the compass is withheld entirely until physical orientation is verified;
- no accessibility or emergency route is inferred from the poster layer.

## Accessibility

- Every mapped space remains keyboard-selectable.
- Enter/Space activate a focused map space.
- Focus uses IMS yellow with high structural separation.
- Focused rooms are kept clear of the mobile place-sheet inset.
- Dragging is not the only camera interaction: zoom, fit, selection focus, route focus, and arrow-key pan are available.
- Ctrl+wheel is not intercepted so browser/page zoom remains available.
- The map viewport has explicit keyboard instructions.
- Route meaning is not conveyed through color alone.
- Route guide controls use normal buttons and expose the active step with `aria-current="step"`.
- Reduced-motion preferences remove map-space transition effects.

## Site-verification pass

Verify in person before production navigation claims:

- door side and doorway location
- actual corridor turns and obstructions
- true stair connection points
- entrances/exits
- compass/building orientation
- corridor restrictions
- accessibility routes
- permanent QR anchor positions
- whether all poster exit markers still match the building
