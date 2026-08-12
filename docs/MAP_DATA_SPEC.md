# Map Data Specification

## Source status

The current prototype uses three supplied orientation posters as visual references. These are not treated as architectural plans. All generated geometry carries `verificationStatus: needs-site-verification`.

## Coordinate space

Every floor uses a common local Cartesian canvas:

- width: `1200`
- height: `760`
- origin: upper-left for rendering

The coordinate space is deliberately non-geographic. A later site survey can calibrate pixels/units to approximate physical meters without changing entity IDs.

## Entity separation

### Space geometry
Answers: **what/where is a room or facility?**

`spaces.json` stores:
- permanent `id`
- display `name`
- `floor`
- `kind`
- aliases
- rectangle/polygon geometry
- routing entry node
- door node when applicable
- verification status

### Routing graph
Answers: **where can a user walk?**

`graph.json` stores:
- corridor nodes
- door nodes
- stairs/transition nodes
- entrance nodes
- weighted edges

The routing graph is independent of the visual polygon geometry. Redrawing a room must not break routing as long as permanent IDs and valid door/entry nodes are preserved.

## Permanent IDs

Examples:

- `mb304`
- `mb209`
- `2f-men-toilet`
- `gf-main-entrance`
- `3f-center-stairs`

Do not use display names as primary keys.

## Floor IDs

- `ground`
- `second`
- `third`

These remain stable even if display labels change.

## Required site-verification checklist

Before production navigation:

- verify every room label
- verify each physical door location
- verify that mapped hallway segments are actually walkable
- verify all stairs and which floors they connect
- verify entrances/exits
- identify restricted/non-public paths
- verify accessibility infrastructure separately
- photograph key landmarks if landmark instructions are used
- compare route instructions against actual walking behavior

## Emergency information

The source posters show emergency-exit markers. The application may display verified exit locations, but must not generate emergency evacuation routes unless an authorized UPLB/IMS safety plan is provided and validated.

## SVG generation

`npm run generate:maps` converts the structured space dataset into fallback semantic SVGs in:

`static/maps/math-building/`

Runtime interaction should continue to use structured data rather than scraping or parsing the generated SVG.
