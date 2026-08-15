# IMS Indoor Map Visual System

## Direction

The IMS indoor map is a high-contrast, interactive wayfinding instrument. The user-supplied floor posters remain the visual arrangement reference, but the application renders an orthogonalized semantic SVG rather than raster poster art.

The current map is **reference-matched**, not **site-verified**. A physical walkthrough is still required before making authoritative accessibility, emergency, restriction, or exact-door claims.

## Brand mapping

- IMS Blue `#009BFF`: map field / primary spatial identity
- Deep Blue `#0077B8` and Ink Blue `#005F91`: rooms and structural contrast
- IMS Yellow `#FAF807`: selected destination, floor emphasis, focus
- IMS Green `#17960E`: route, route origin, emergency markers
- White: structural outlines, route halo, separation
- Soft derived yellow: circulation/hallway fill

## Geometry ownership

The map intentionally has three independent data responsibilities:

1. `spaces.json` — permanent room/facility identity and interactive room rectangles.
2. `graph.json` — route nodes, connectors, door nodes, and A* topology.
3. `floor-visuals.ts` — poster-matched hallway shape, exit markers, compass, and visual content bounds.

Do not move graph nodes merely to make a screenshot prettier. If site verification proves geometry or connectivity wrong, update visual geometry and routing data intentionally and together.

## Camera model

`MapViewport.svelte` now uses the SVG `viewBox` as a real map camera rather than enlarging the SVG container.

Supported camera operations:

- Fit floor
- Center selected room/facility
- Fit active route segment
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

The renderer chooses an overview/detail state based on map units per visible CSS pixel.

Overview prioritizes:

- room identifiers
- hallway shape
- stairs/toilets/exits
- selected room
- active route

Detail additionally reveals:

- Math Lab / Math Clinic subtitles
- stair labels
- exit labels

This prevents the phone map from turning into a label cloud.

## Route language

Routes use multiple redundant cues:

- thick white halo
- IMS-green centerline
- directional arrowheads
- green origin marker
- yellow destination marker
- white/deep-blue floor-transition marker

For cross-floor routes, intermediate floor segments do **not** receive fake origin/destination markers. The edge of the floor segment is rendered as a floor-change marker instead.

## Mobile behavior

The map remains the dominant surface. Search and floor controls stay compact above it. Selected-place information becomes a sticky bottom sheet above the mobile navigation bar and begins in a collapsed state. Expanding the sheet reveals secondary detail without permanently reducing map height.

## Accessibility

- Every mapped space remains keyboard-selectable.
- Enter/Space activate a focused map space.
- Focus uses IMS yellow with high structural separation.
- Dragging is not the only camera interaction: zoom, fit, selection focus, route fit, and arrow-key pan are available.
- Ctrl+wheel is not intercepted so browser/page zoom remains available.
- The map viewport has explicit keyboard instructions.
- Route meaning is not conveyed through color alone.
- Reduced-motion preferences remove map-space transition effects.

## Next site-verification pass

Verify in person before production navigation claims:

- door side and doorway location
- true stair connection points
- entrances/exits
- corridor restrictions
- accessibility routes
- permanent QR anchor positions
- whether all poster emergency markers still match the building
