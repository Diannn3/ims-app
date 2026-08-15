# IMS Map V3 — Guided Wayfinding

Prepared against:

- repository: `Diannn3/ims-app`
- branch: `chatgpt/map-navigation-next`
- exact commit: `31bad598713c06373e8983e998eb5d5e91d4e026`

This overlay implements the next map-hardening milestone directly on top of the pushed SVG-camera version.

## Included

- aspect-aware camera bounds that fit a wide floor on portrait phones without distortion/cropping
- pointer-to-map conversion through the SVG screen CTM, with a fallback path
- canvas dimensions derived from `building.json` instead of duplicated constants
- camera insets for the mobile selected-place overlay
- keyboard-focus visibility protection for SVG rooms
- three progressive detail levels: overview / navigation / detail
- route instruction engine: start / walk / turn / floor change / arrive
- route-step → floor → camera → route-highlight synchronization
- completed/current route visual states
- less noisy route arrow placement
- WAI-style editable room combobox with shared project ranking/normalization
- Arrow Up / Arrow Down / Enter / Escape behavior
- mobile selected-place sheet moved into the map frame as an overlay
- neutral/unverified styling and wording for poster-derived exit markers
- compass withheld until physical orientation verification
- expanded unit and Playwright regression coverage
- updated map visual-system documentation

## Apply

From this extracted bundle:

```powershell
python .\apply_map_v3.py C:\path\to\ims-app
```

or macOS/Linux/WSL:

```bash
python3 ./apply_map_v3.py /path/to/ims-app
```

The installer refuses to modify the repo unless the expected source HEAD and the eight existing-file blob hashes match. New route-instruction files must also be absent.

## Review and validate

```bash
git diff --check
git diff -- \
  src/lib/domain/navigation/map-camera.ts \
  src/lib/domain/navigation/route-instructions.ts \
  src/lib/components/map/MapViewport.svelte \
  src/lib/components/map/MapCanvas.svelte \
  src/routes/map/+page.svelte \
  tests/e2e/accessibility-and-map.spec.ts

npm run verify
npm run check:domain
npm run check
npm run test:unit
npm run build
npm run test:e2e
```

The cloud environment used to build this overlay could not clone GitHub or run the full SvelteKit/Playwright application gate, so those commands remain required in the real checkout / GitHub Actions.
