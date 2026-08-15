<script lang="ts">
  import MapCanvas from './MapCanvas.svelte';
  import type { FloorId } from '$lib/domain/navigation/types';

  let {
    floor,
    selectedSpaceId = null,
    routeNodeIds = [],
    onSelect = () => {}
  }: {
    floor: FloorId;
    selectedSpaceId?: string | null;
    routeNodeIds?: string[];
    onSelect?: (spaceId: string) => void;
  } = $props();

  let zoom = $state(1);

  function zoomIn() {
    zoom = Math.min(2.2, Math.round((zoom + 0.2) * 10) / 10);
  }

  function zoomOut() {
    zoom = Math.max(0.8, Math.round((zoom - 0.2) * 10) / 10);
  }

  function reset() {
    zoom = 1;
  }

  function onViewportKeydown(event: KeyboardEvent) {
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomIn();
      return;
    }

    if (event.key === '-') {
      event.preventDefault();
      zoomOut();
      return;
    }

    if (event.key === '0') {
      event.preventDefault();
      reset();
    }
  }
</script>

<div class="map-viewport-shell">
  <div class="map-toolbar" aria-label="Map zoom controls">
    <button class="icon-button" type="button" onclick={zoomOut} aria-label="Zoom map out">−</button>
    <span aria-live="polite">{Math.round(zoom * 100)}%</span>
    <button class="icon-button" type="button" onclick={zoomIn} aria-label="Zoom map in">+</button>
    <button class="reset" type="button" onclick={reset}>Fit</button>
  </div>

  <p class="visually-hidden" id="map-keyboard-help">
    Use plus and minus to zoom the map, or zero to reset. Rooms are keyboard-selectable inside the map.
  </p>

  <div
    class="viewport"
    tabindex="0"
    aria-label="Scrollable floor map"
    aria-describedby="map-keyboard-help"
    onkeydown={onViewportKeydown}
  >
    <div class="scaled" style={`width: ${zoom * 100}%`}>
      <MapCanvas {floor} {selectedSpaceId} {routeNodeIds} {onSelect} />
    </div>
  </div>
</div>

<style>
  .map-viewport-shell {
    position: relative;
    min-width: 0;
  }

  .map-toolbar {
    position: absolute;
    top: 11px;
    right: 11px;
    z-index: 5;
    min-height: 44px;
    padding: 4px;
    display: flex;
    align-items: center;
    gap: 3px;
    border: 1px solid rgb(255 255 255 / 0.72);
    border-radius: var(--radius-md);
    background: rgb(255 255 255 / 0.96);
    box-shadow: 0 8px 24px rgb(0 71 109 / 0.22);
  }

  .map-toolbar span {
    min-width: 45px;
    color: var(--brand-blue-ink);
    text-align: center;
    font-family: ui-monospace, monospace;
    font-size: 10px;
    font-weight: 800;
  }

  .map-toolbar .icon-button {
    width: 36px;
    min-width: 36px;
    height: 36px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--brand-blue-ink);
    font-size: 19px;
    font-weight: 800;
  }

  .map-toolbar .icon-button:hover {
    background: var(--surface-yellow);
  }

  .reset {
    min-height: 36px;
    padding: 0 10px;
    border: 0;
    border-left: 1px solid var(--line);
    border-radius: 0;
    background: transparent;
    color: var(--brand-blue-ink);
    font-size: 10.5px;
    font-weight: 800;
  }

  .map-toolbar button:focus-visible {
    outline: 3px solid rgb(250 248 7 / 0.82);
    outline-offset: 1px;
  }

  .viewport {
    width: 100%;
    min-height: 445px;
    max-height: min(720px, 72svh);
    overflow: auto;
    overscroll-behavior: contain;
    border: 1px solid var(--brand-blue-deep);
    border-radius: 18px;
    background: var(--brand-blue-deep);
    scrollbar-color: var(--brand-yellow) var(--brand-blue-ink);
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12);
  }

  .viewport:focus-visible {
    border-color: var(--brand-yellow);
    box-shadow: 0 0 0 4px rgb(250 248 7 / 0.30);
    outline: 0;
  }

  .scaled {
    min-width: 660px;
    transform-origin: top left;
  }

  @media (min-width: 960px) {
    .viewport {
      min-height: 560px;
    }

    .scaled {
      min-width: 760px;
    }
  }

  @media (max-width: 759px) {
    .map-toolbar {
      top: 8px;
      right: 8px;
    }

    .viewport {
      min-height: 430px;
      max-height: min(640px, 66svh);
    }
  }
</style>
