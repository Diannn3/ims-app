# IMS Map Navigation — Camera + Route UX pass

Prepared against:

- repository: `Diannn3/ims-app`
- branch: `chatgpt/map-redesign`
- commit: `a628b6d5a20dfafe6901dce795aa488c729819af`

This is the first implementation slice after the IMS-branded map redesign.

## Implemented

- real SVG `viewBox` camera instead of percentage-width zoom
- pure/testable map camera math
- fit floor / center selected / fit route
- wheel zoom, pointer drag pan, arrow-key pan
- `+`, `-`, `0`, `R`, `S` keyboard shortcuts
- ResizeObserver-backed progressive detail threshold
- search selection auto-focuses its room through selected-space camera behavior
- route segment auto-fit
- route direction arrowheads
- true origin/destination markers only on first/last route floors
- explicit floor-transition markers on intermediate floors
- reference-matched per-floor content bounds
- collapsed sticky mobile selected-place bottom sheet
- updated map Playwright journeys
- updated map visual-system documentation

## Safety / verification boundary

The floor posters are treated as orientation references, not architectural or emergency plans. The code continues to label geometry as site-unverified. No accessibility/emergency assertion is promoted to verified truth.

## Apply

```powershell
python .\apply_map_navigation_next.py C:\path\to\ims-app
```

macOS/Linux/WSL:

```bash
python3 ./apply_map_navigation_next.py /path/to/ims-app
```

The installer checks the expected HEAD and Git blob hashes of every replaced source file before copying the overlay. Use `--force` only after manually reviewing intentional divergence.

## Review after applying

```bash
git status
git diff --check
git diff
npm run verify
npm run check:domain
npm run check
npm run test:unit
npm run build
npm run test:e2e
```

## Local cloud validation completed

- Svelte block balance: PASS
- CSS brace balance: PASS
- all modified TypeScript/Svelte script blocks parse with TypeScript 5.8.3: PASS
- `map-camera.ts` standalone TypeScript compilation: PASS
- camera behavior smoke assertions: PASS

The cloud environment cannot clone GitHub through raw DNS and does not have this repository's complete dependency install/browser runtime, so full `svelte-check`, Vite build, Vitest, and Playwright execution are intentionally left for the real checkout/CI.
