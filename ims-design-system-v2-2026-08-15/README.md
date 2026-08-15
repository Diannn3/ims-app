# IMS Academic Hub — Design System V2 overlay

Prepared against GitHub `master` commit:

`a922d74f881d97075d61ac9277c6927efdabc21e`

This ZIP contains only the new Design System V2 work. It does **not** apply the separate database/CI fixes from the earlier handoff.

## Included

- `PRODUCT.md` + canonical six-section `DESIGN.md`
- Impeccable advisory configuration
- `src/design-system-v2.css` compatibility layer
- compact sticky shell with global search
- edge-attached mobile navigation
- search-first Home
- map-first `/map` workspace
- map SVG accessibility semantics + keyboard zoom controls
- grouped row-based `/search`
- location-first `/room/[id]`
- truthful zero-data Math Clinic
- row-based `/academics`
- shared academic empty/error states
- identifier-led course rows
- updated V2 design/implementation docs

## Windows PowerShell

```powershell
.\apply.ps1 -Repo "C:\path\to\ims-app"
```

If your repository HEAD has intentionally moved from the pinned base:

```powershell
.\apply.ps1 -Repo "C:\path\to\ims-app" -Force
```

## macOS / Linux / WSL

```bash
./apply.sh /path/to/ims-app
```

If your repository HEAD has intentionally moved:

```bash
./apply.sh /path/to/ims-app --force
```

## Review and validate

```bash
git status
git diff
npm run check
npm run verify
npm run test:unit
npm run build
```

Run the database/integration/Playwright gates separately in your normal full checkout.

The cloud mirror did not have the repository's full npm dependencies or local Supabase runtime. Static validation here covered TypeScript parsing of all modified Svelte script blocks, Svelte block balance, CSS brace balance, `git diff --check`, the 80-character search input contract, and map accessibility/design invariants.
