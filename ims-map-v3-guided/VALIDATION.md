# Validation performed in the cloud worktree

PASS:

- source branch/HEAD rechecked against GitHub
- existing-file source blob hashes matched the pushed `31bad598...` files
- TypeScript 5.8.3 parser pass across all modified `.ts` files and all modified Svelte `<script lang="ts">` blocks
- Svelte `{#if}` / `{#each}` block-balance scan
- CSS brace-balance scan
- standalone compilation of `map-camera.ts` + `route-instructions.ts`
- runtime smoke test: portrait camera bounds expand instead of cropping the wide map
- runtime smoke test: fitted portrait floor retains viewport aspect ratio and full floor width
- runtime smoke test: route instruction generation emits turn + floor change + arrival

Not runnable in this cloud environment:

- full Svelte compiler check
- `npm run verify`
- `npm run check:domain`
- `npm run check`
- Vitest through the project runner
- Vite/SvelteKit production build
- Playwright against the actual app
- local Supabase stack

Those are intentionally not claimed as passing.
