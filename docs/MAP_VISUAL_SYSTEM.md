# IMS Indoor Map Visual System

## Direction

The interactive map uses the high-contrast IMS brand system rather than reproducing the old orientation posters as raster art. The posters remain the geometry/reference source; the app renders an orthogonalized, interactive SVG.

## Brand mapping

- IMS Blue `#009BFF`: map field / primary spatial identity
- Deep Blue `#0077B8` and Ink Blue `#005F91`: rooms, controls, structural contrast
- IMS Yellow `#FAF807`: destination emphasis, floor badge, key accents
- IMS Green `#17960E`: route/origin and emergency markers
- White: room outlines, labels, route halo, focus separation
- Soft derived yellow: hallway fill, because raw logo yellow across the entire corridor is visually exhausting

## Spatial hierarchy

1. Hallway must be visible before room decoration.
2. Room IDs must scan before subtitles.
3. Selected destination must remain obvious at every zoom level.
4. Route must have a white halo and a dashed green core so it is distinguishable by more than color.
5. Stairs, entrances and emergency exits use pictograms rather than room-like rectangles.
6. The current floor is identified inside the map with a compact badge, not a decorative title.

## Geometry contract

`spaces.json` and `graph.json` remain the source of permanent identities and routing coordinates. `floor-visuals.ts` contains presentation-only hallway/exit geometry reconstructed from the supplied IMS posters.

Do not move a permanent room ID or graph node merely to make a screenshot look prettier. If site verification changes geometry, update the visual layer and the routing layer intentionally and together.

## Accessibility

- Every mapped space remains keyboard-selectable.
- Enter/Space activate the focused space.
- Focus uses a thick IMS-yellow outline rather than color-only fill change.
- Zoom is available through buttons and `+`, `-`, `0` keyboard shortcuts.
- Route origin, destination and path use distinct shapes/patterns.
- The SVG itself is a grouped interactive control, not a single `role="img"` containing nested buttons.

## Verification

The supplied posters establish room/facility arrangement, but production routing still requires a physical walk-through for door positions, accessible paths, stairs, exits and restrictions. Never convert the visual emergency-exit markers into safety claims until verified on site.
