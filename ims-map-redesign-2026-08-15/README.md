# IMS branded indoor map redesign

Prepared against:

- repository: `Diannn3/ims-app`
- branch: `chatgpt/first-green-after-v2`
- commit: `1fa2cbfd107abc20e3899b2501cfd80925c68ccb`

## What changes

- replaces the generic one-hallway SVG treatment with floor-specific presentation geometry
- applies the official IMS blue / yellow / green palette
- increases room-vs-hallway contrast
- renders stairs as stair pictograms instead of room-like boxes
- adds entrance and emergency-exit markers
- adds a compact floor stamp and compass
- improves route visibility with white halo + green dashed route
- separates route origin (green) from destination (yellow)
- preserves all existing room IDs, search behavior, door-node IDs, A* topology and deep links
- documents the map-specific visual/geometry contract

## Important geometry note

The supplied IMS orientation posters are now treated as the presentation reference. This redesign is still an **orthogonalized schematic**, not an architectural survey. The existing routing graph stays deliberately unchanged in this pass. Physical validation is still required before claiming exact door placement, accessible routes or emergency/safety routing.

## Apply on Windows

From the extracted bundle directory:

```powershell
python .\apply_map_redesign.py C:\path\to\ims-app
```

## Apply on macOS/Linux/WSL

```bash
python3 ./apply_map_redesign.py /path/to/ims-app
```

The script refuses to apply if the checkout HEAD or the two existing map-component blob hashes do not match the expected source unless `--force` is supplied.

## Validate in your full checkout

```bash
npm install
npm run verify
npm run check
npm run test:unit
npm run build
```

Then visually check `/map` at mobile and desktop widths, including selected rooms and a cross-floor route.
