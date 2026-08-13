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
    zoom = Math.min(1.8, Math.round((zoom + 0.2) * 10) / 10);
  }

  function zoomOut() {
    zoom = Math.max(0.7, Math.round((zoom - 0.2) * 10) / 10);
  }

  function reset() {
    zoom = 1;
  }
</script>

<div class="map-viewport-shell">
  <div class="map-toolbar" aria-label="Map zoom controls">
    <button class="icon-button" type="button" onclick={zoomOut} aria-label="Zoom map out">−</button>
    <span aria-live="polite">{Math.round(zoom * 100)}%</span>
    <button class="icon-button" type="button" onclick={zoomIn} aria-label="Zoom map in">+</button>
    <button class="reset" type="button" onclick={reset}>Fit</button>
  </div>

  <div class="viewport" tabindex="0" aria-label="Scrollable floor map">
    <div class="scaled" style={`width: ${zoom * 100}%`}>
      <MapCanvas {floor} {selectedSpaceId} {routeNodeIds} {onSelect} />
    </div>
  </div>
</div>

<style>
  .map-viewport-shell {
    display: grid;
    gap: 9px;
  }

  .map-toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }

  .map-toolbar span {
    min-width: 48px;
    color: var(--muted);
    text-align: center;
    font-size: 11px;
    font-weight: 800;
  }

  .map-toolbar .icon-button {
    width: 42px;
    min-width: 42px;
    height: 42px;
  }

  .reset {
    min-height: 42px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 13px;
    background: #fff;
    color: var(--ink-strong);
    font-weight: 780;
  }

  .viewport {
    width: 100%;
    overflow: auto;
    overscroll-behavior-inline: contain;
    border-radius: 18px;
    background: #fafdff;
    scrollbar-color: #9fc5dc transparent;
  }

  .scaled {
    min-width: 680px;
  }

  @media (max-width: 620px) {
    .scaled {
      min-width: 620px;
    }
  }
</style>
