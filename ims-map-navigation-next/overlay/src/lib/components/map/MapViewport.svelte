<script lang="ts">
  import { onMount } from 'svelte';
  import MapCanvas from './MapCanvas.svelte';
  import graphData from '$lib/data/math-building/graph.json';
  import { floorVisuals } from '$lib/data/math-building/floor-visuals';
  import {
    MAP_CANVAS_BOUNDS,
    boundsFromPoints,
    fitBounds,
    focusRect,
    mapPointFromViewport,
    panViewBox,
    viewBoxZoomPercent,
    zoomViewBox,
    zoomViewBoxAt,
    type MapViewBox
  } from '$lib/domain/navigation/map-camera';
  import { spaces } from '$lib/domain/navigation/spaces';
  import type { FloorId, GraphData } from '$lib/domain/navigation/types';

  let {
    floor,
    selectedSpaceId = null,
    routeNodeIds = [],
    routeSegmentIndex = 0,
    routeSegmentCount = 1,
    onSelect = () => {}
  }: {
    floor: FloorId;
    selectedSpaceId?: string | null;
    routeNodeIds?: string[];
    routeSegmentIndex?: number;
    routeSegmentCount?: number;
    onSelect?: (spaceId: string) => void;
  } = $props();

  const graph = graphData as GraphData;
  const nodeIndex = new Map(graph.nodes.map((node) => [node.id, node]));

  let viewportEl = $state<HTMLDivElement | null>(null);
  let viewportWidth = $state(0);
  let camera = $state<MapViewBox>({ ...MAP_CANVAS_BOUNDS });
  let dragPointerId = $state<number | null>(null);
  let dragX = $state(0);
  let dragY = $state(0);
  let lastFloor = $state<FloorId | null>(null);
  let lastSelected = $state<string | null>(null);
  let lastRouteKey = $state('');

  const selectedSpace = $derived(spaces.find((space) => space.id === selectedSpaceId) ?? null);
  const routeNodes = $derived(
    routeNodeIds
      .map((id) => nodeIndex.get(id))
      .filter((node): node is NonNullable<typeof node> => Boolean(node) && node.floor === floor)
  );
  const routeBounds = $derived(boundsFromPoints(routeNodes));
  const zoomPercent = $derived(viewBoxZoomPercent(camera));
  const detailLevel = $derived(
    viewportWidth > 0 && camera.width / viewportWidth <= 1.7 ? 'detail' : 'overview'
  );

  function fitFloor() {
    camera = fitBounds(floorVisuals[floor].contentBounds, {
      padding: 38,
      minWidth: 920,
      minHeight: 560
    });
  }

  function focusSelected() {
    if (!selectedSpace || selectedSpace.floor !== floor) return;
    camera = focusRect(selectedSpace.geometry, 72);
  }

  function fitRoute() {
    if (!routeBounds) return;
    camera = fitBounds(routeBounds, {
      padding: 105,
      minWidth: 520,
      minHeight: 330
    });
  }

  function zoomIn() {
    camera = zoomViewBox(camera, 0.78);
  }

  function zoomOut() {
    camera = zoomViewBox(camera, 1.28);
  }

  function panByFraction(xFraction: number, yFraction: number) {
    camera = panViewBox(camera, camera.width * xFraction, camera.height * yFraction);
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
      fitFloor();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      panByFraction(-0.09, 0);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      panByFraction(0.09, 0);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      panByFraction(0, -0.09);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      panByFraction(0, 0.09);
      return;
    }

    if (event.key.toLowerCase() === 'r' && routeBounds) {
      event.preventDefault();
      fitRoute();
      return;
    }

    if (event.key.toLowerCase() === 's' && selectedSpace?.floor === floor) {
      event.preventDefault();
      focusSelected();
    }
  }

  function onWheel(event: WheelEvent) {
    // Ctrl+wheel is commonly browser/page zoom. Do not intercept it.
    if (event.ctrlKey || !viewportEl) return;
    event.preventDefault();
    const rect = viewportEl.getBoundingClientRect();
    const anchor = mapPointFromViewport(event.clientX, event.clientY, rect, camera);
    camera = zoomViewBoxAt(camera, event.deltaY < 0 ? 0.86 : 1.16, anchor);
  }

  function isInteractiveTarget(target: EventTarget | null) {
    return target instanceof Element && Boolean(target.closest('[role="button"], button, a, input'));
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0 || isInteractiveTarget(event.target)) return;
    dragPointerId = event.pointerId;
    dragX = event.clientX;
    dragY = event.clientY;
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent) {
    if (dragPointerId !== event.pointerId || !viewportEl) return;
    const rect = viewportEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const deltaClientX = event.clientX - dragX;
    const deltaClientY = event.clientY - dragY;
    dragX = event.clientX;
    dragY = event.clientY;

    camera = panViewBox(
      camera,
      -(deltaClientX / rect.width) * camera.width,
      -(deltaClientY / rect.height) * camera.height
    );
  }

  function finishPointer(event: PointerEvent) {
    if (dragPointerId !== event.pointerId) return;
    const current = event.currentTarget as HTMLDivElement;
    if (current.hasPointerCapture(event.pointerId)) current.releasePointerCapture(event.pointerId);
    dragPointerId = null;
  }

  $effect(() => {
    const routeKey = routeNodeIds.join('|');

    if (floor !== lastFloor) {
      lastFloor = floor;
      lastSelected = selectedSpaceId;
      lastRouteKey = routeKey;
      if (routeKey) fitRoute();
      else if (selectedSpace?.floor === floor) focusSelected();
      else fitFloor();
      return;
    }

    if (routeKey !== lastRouteKey) {
      lastRouteKey = routeKey;
      if (routeKey) fitRoute();
      else if (selectedSpace?.floor === floor) focusSelected();
      else fitFloor();
    }

    if (selectedSpaceId !== lastSelected) {
      lastSelected = selectedSpaceId;
      if (!routeKey && selectedSpace?.floor === floor) focusSelected();
    }
  });

  onMount(() => {
    if (!viewportEl || typeof ResizeObserver === 'undefined') return;

    const updateWidth = () => {
      if (!viewportEl) return;
      viewportWidth = viewportEl.getBoundingClientRect().width;
    };

    updateWidth();
    const observer = new ResizeObserver(() => requestAnimationFrame(updateWidth));
    observer.observe(viewportEl);
    return () => observer.disconnect();
  });
</script>

<div class="map-viewport-shell">
  <div class="map-toolbar" aria-label="Map camera controls">
    <button class="icon-button" type="button" onclick={zoomOut} aria-label="Zoom map out" title="Zoom out">−</button>
    <span aria-live="polite">{zoomPercent}%</span>
    <button class="icon-button" type="button" onclick={zoomIn} aria-label="Zoom map in" title="Zoom in">+</button>

    {#if selectedSpace?.floor === floor}
      <button class="tool-action" type="button" onclick={focusSelected} aria-label="Center selected place" title="Center selected place">◎</button>
    {/if}

    {#if routeBounds}
      <button class="tool-action" type="button" onclick={fitRoute} aria-label="Fit active route" title="Fit active route">↗</button>
    {/if}

    <button class="reset" type="button" onclick={fitFloor}>Fit floor</button>
  </div>

  <p class="visually-hidden" id="map-keyboard-help">
    Drag the map to pan. Use the mouse wheel or plus and minus to zoom. Arrow keys pan. Zero fits the
    floor, R fits the active route, and S centers the selected place. Rooms remain individually
    keyboard-selectable inside the map.
  </p>

  <div
    class="viewport"
    class:dragging={dragPointerId !== null}
    bind:this={viewportEl}
    tabindex="0"
    role="region"
    aria-label={`${floorVisuals[floor].displayLabel} interactive map viewport`}
    aria-describedby="map-keyboard-help"
    onkeydown={onViewportKeydown}
    onwheel={onWheel}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={finishPointer}
    onpointercancel={finishPointer}
  >
    <MapCanvas
      {floor}
      {selectedSpaceId}
      {routeNodeIds}
      {routeSegmentIndex}
      {routeSegmentCount}
      viewBox={camera}
      {detailLevel}
      {onSelect}
    />
  </div>
</div>

<style>
  .map-viewport-shell {
    position: relative;
    min-width: 0;
  }

  .map-toolbar {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 5;
    min-height: 44px;
    padding: 4px;
    display: flex;
    align-items: center;
    gap: 3px;
    border: 1px solid rgb(255 255 255 / 0.78);
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

  .map-toolbar button {
    min-width: 36px;
    height: 36px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--brand-blue-ink);
    font-weight: 800;
  }

  .map-toolbar .icon-button {
    font-size: 19px;
  }

  .map-toolbar .tool-action {
    font-size: 16px;
  }

  .map-toolbar button:hover {
    background: var(--surface-yellow);
  }

  .reset {
    padding: 0 10px;
    border-left: 1px solid var(--line) !important;
    border-radius: 0 !important;
    font-size: 10.5px;
  }

  .map-toolbar button:focus-visible {
    outline: 3px solid rgb(250 248 7 / 0.86);
    outline-offset: 1px;
  }

  .viewport {
    width: 100%;
    height: clamp(470px, 67svh, 720px);
    overflow: hidden;
    position: relative;
    border: 1px solid var(--brand-blue-deep);
    border-radius: 18px;
    background: var(--brand-blue-deep);
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12);
    cursor: grab;
    touch-action: pinch-zoom;
    user-select: none;
  }

  .viewport.dragging {
    cursor: grabbing;
  }

  .viewport:focus-visible {
    border-color: var(--brand-yellow);
    box-shadow: 0 0 0 4px rgb(250 248 7 / 0.30);
    outline: 0;
  }

  .viewport :global(.map-wrap) {
    width: 100%;
    height: 100%;
    border-radius: 17px;
  }

  @media (min-width: 960px) {
    .viewport {
      height: min(690px, 72svh);
      min-height: 560px;
    }
  }

  @media (max-width: 759px) {
    .map-toolbar {
      top: 8px;
      right: 8px;
    }

    .map-toolbar span {
      display: none;
    }

    .reset {
      padding-inline: 8px;
    }

    .viewport {
      height: min(64svh, 610px);
      min-height: 430px;
      border-radius: 14px;
    }
  }

  @media (max-width: 430px) {
    .map-toolbar .tool-action {
      display: none;
    }

    .viewport {
      height: min(61svh, 560px);
      min-height: 410px;
    }
  }
</style>
