# Routing Specification

## Model

Indoor routing is a small weighted graph. Nodes represent navigable points; edges represent walkable connections.

### Node kinds
- `corridor`
- `door`
- `stairs`
- `entrance`

### Edge kinds
- `corridor`
- `door`
- `connector`
- `stairs`
- `entrance`

## Algorithm

The client uses A* for route discovery. For this building the graph is tiny, so routing is effectively instant and can remain offline.

## Cross-floor routing

Stair nodes connect corresponding floor landings. The route result is split into floor segments so mobile UI can show one floor at a time instead of stacking all floors.

## Dynamic closures

Production routing will combine the static base graph with active database restrictions:

- edge ID or edge pair
- reason
- active start/end
- verification/source

A restricted edge is excluded before route search.

## Human directions

Geometry alone is not sufficient for good instructions. Verified nodes can later store landmarks/instruction hints so text can say:

- continue past MB 305
- take the center stairs
- MB 304 is on the opposite side of the corridor

rather than relying exclusively on distance and angles.

## Positioning

MVP positioning is deterministic:
- QR deep links at known anchors
- manual start selector

No indoor GPS claim is made.
