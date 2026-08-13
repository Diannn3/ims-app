# QR / Location Anchor Strategy

## Purpose

The app must not pretend that browser GPS can identify a specific indoor room or floor. Location anchors are deterministic entry points into the routing graph: scanning a QR (or opening the same URL manually) sets the route start to a known, site-verified graph node.

## Implemented prototype

Stable prototype slugs are defined in `src/lib/domain/navigation/anchors.ts` and resolve through `/loc/[slug]`.

Current prototype anchors cover:

- main entrance
- Ground Floor west / center / east stair landings
- Second Floor west / center / east stair landings
- Third Floor west / center / east stair landings

The anchor page labels them **prototype / site-unverified** and links into `/map?from=<graph-node>` so the map and routing engine share one canonical node ID.

## Data contract

Each anchor needs:

```text
slug
label
floor_id
graph_node_id
optional space_id
verification status
last verified date
```

Permanent QR artwork should encode a stable HTTPS URL such as:

```text
https://<production-domain>/loc/3f-west-stairs
```

Do not encode implementation-only SVG coordinates or a route directly in the QR.

## Verification gate

No QR should be permanently printed or installed until a physical walkthrough confirms:

1. the anchor exists at the described physical location;
2. the graph node is on the correct floor and corridor/stair landing;
3. the route graph from that node does not cross walls or restricted areas;
4. the printed label and destination URL match;
5. the code remains readable at the intended placement height and lighting;
6. any required building/IMS approval for physical placement has been obtained.

The existing floor posters are orientation references, not architectural drawings, so they are insufficient for this approval by themselves.

## QR generation

Generate printable QR assets only after the production domain is known. Keep the URL slug stable so a future renderer or map redesign does not invalidate deployed codes.

For a pilot, print removable test cards for the walkthrough first. Permanent materials come after route verification and approval.

## Privacy

An anchor identifies a **place**, not a person. The public route flow does not need to store a user's location history. Aggregate usage may be added later without retaining person-level movement trails.
