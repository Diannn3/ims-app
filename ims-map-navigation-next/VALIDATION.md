# Validation notes

## Static checks executed

- balanced Svelte `{#if}` / `{/if}` and `{#each}` / `{/each}` blocks
- balanced `<script>` and `<style>` tags
- balanced CSS braces
- TypeScript transpile diagnostics for all changed `.ts` files and Svelte `<script lang="ts">` blocks
- standalone `tsc` compilation of camera math
- runtime smoke assertions for route bounds, room focus, anchored zoom, and pan clamping

## Browser checks to run after applying

1. `/map` — Fit floor, plus/minus, arrow-key pan, wheel zoom.
2. Search `MB 304` — switch to Third Floor and auto-center room.
3. `/map?room=mb304` — Directions — inspect Ground → 2F → 3F transition markers.
4. `390×844` — selected room sheet remains collapsed above mobile nav and can expand.
5. Keyboard-only — map region focus remains visible; individual room controls remain reachable.
6. 200% browser zoom — controls and bottom sheet do not obscure focused elements.
