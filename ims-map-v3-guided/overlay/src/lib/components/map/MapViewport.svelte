<script lang="ts">
  import { onMount } from 'svelte';
  import MapCanvas from './MapCanvas.svelte';
  import building from '$lib/data/math-building/building.json';
  import graphData from '$lib/data/math-building/graph.json';
  import { floorVisuals } from '$lib/data/math-building/floor-visuals';
  import {
    applyViewportInsets,
    boundsFromPoints,
    cameraBoundsForAspect,
    canvasBounds,
    ensureRectVisible,
    fitBounds,
    focusRect,
    mapPointFromViewport,
    panViewBox,
    viewBoxZoomPercent,
    zoomViewBox,
    zoomViewBoxAt,
    type MapInsets,
    type MapPoint,
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
    focusNodeIds = [],
    highlightNodeIds = [],
    completedNodeIds = [],
    overlayBottomInsetPx = 0,
    onSelect = () => {}
  }: {
    floor: FloorId;
    selectedSpaceId?: string | null;
    routeNodeIds?: string[];
    routeSegmentIndex?: number;
    routeSegmentCount?: number;
    focusNodeIds?: string[];
    highlightNodeIds?: string[];
    completedNodeIds?: string[];
    overlayBottomInsetPx?: number;
    onSelect?: (spaceId: string) => void;
  } = $props();

  const graph = graphData as GraphData;
  const nodeIndex = new Map(graph.nodes.map((node) => [node.id, node]));
  const mapBounds = canvasBounds(building.canvas.width, building.canvas.height);

  let viewportEl = $state<HTMLDivElement | null>(null);
  let viewportWidth = $state(0);
  let viewportHeight = $state(0);
  let camera = $state<MapViewBox>({ ...mapBounds });
  let dragPointerId = $state<number | null>(null);
  let dragX = $state(0);
  let dragY = $state(0);
  let lastFloor = $state<FloorId | null>(null);
  let lastSelected = $state<string | null>(null);
  let lastRouteKey = $state('');
  let lastFocusKey = $state('');

  const selectedSpace = $derived(spaces.find((space) => space.id === selectedSpaceId) ?? null);
  const routeNodes = $derived(
    routeNodeIds
      .map((id) => nodeIndex.get(id))
      .filter((node): node is NonNullable<typeof node> => Boolean(node) && node.floor === floor)
  );
  const focusNodes = $derived(
    focusNodeIds
      .map((id) => nodeIndex.get(id))
      .filter((node): node is NonNullable<typeof node> => Boolean(node) && node.floor === floor)
  );
  const routeBounds = $derived(boundsFromPoints(routeNodes));
  const focusBounds = $derived(boundsFromPoints(focusNodes));
  const viewportAspect = $derived(viewportWidth > 0 && viewportHeight > 0 ? viewportWidth / viewportHeight : undefined);
  const cameraBounds = $derived(viewportAspect ? cameraBoundsForAspect(mapBounds, viewportAspect) : mapBounds);
  const zoomPercent = $derived(viewBoxZoomPercent(camera, mapBounds));
  const mapUnitsPerPixel = $derived(
    viewportWidth > 0 && viewportHeight > 0
      ? Math.max(camera.width / viewportWidth, camera.height / viewportHeight)
      : Number.POSITIVE_INFINITY
  );
  const detailLevel = $derived(
    mapUnitsPerPixel <= 1.15 ? 'detail' : mapUnitsPerPixel <= 2.1 ? 'navigation' : 'overview'
  );
  const cameraInsets = $derived<MapInsets>({
    top: 10,
    right: 10,
    bottom: viewportWidth > 0 && viewportWidth <= 759 ? Math.max(0, overlayBottomInsetPx) : 0,
    left: 10
  });

  function withInsets(box: MapViewBox) {
    return applyViewportInsets(
      box,
      { width: viewportWidth, height: viewportHeight },
      cameraInsets,
      cameraBounds
    );
  }

  function fitFloor() {
    camera = withInsets(
      fitBounds(floorVisuals[floor].contentBounds, {
        padding: 38,
        minWidth: 920,
        minHeight: 560,
        canvas: cameraBounds,
        aspectRatio: viewportAspect
      })
    );
  }

  function focusSelected() {
    if (!selectedSpace || selectedSpace.floor !== floor) return;
    camera = withInsets(
      focusRect(selectedSpace.geometry, {
        canvas: cameraBounds,
        aspectRatio: viewportAspect,
        padding: 72
      })
    );
  }

  function fitRoute() {
    if (!routeBounds) return;
    camera = withInsets(
      fitBounds(routeBounds, {
        padding: 105,
        minWidth: 520,
        minHeight: 330,
        canvas: cameraBounds,
        aspectRatio: viewportAspect
      })
    );
  }

  function fitFocus() {
    if (!focusBounds) return;
    camera = withInsets(
      fitBounds(focusBounds, {
        padding: 92,
        minWidth: 470,
        minHeight: 300,
        canvas: cameraBounds,
        aspectRatio: viewportAspect
      })
    );
  }

  function zoomIn() {
    camera = zoomViewBox(camera, 0.78, cameraBounds);
  }

  function zoomOut() {
    camera = zoomViewBox(camera, 1.28, cameraBounds);
  }

  function panByFraction(xFraction: number, yFraction: number) {
    camera = panViewBox(camera, camera.width * xFraction, camera.height * yFraction, cameraBounds);
  }

  function ensureSpaceVisible(spaceId: string) {
    const space = spaces.find((item) => item.id === spaceId);
    if (!space || space.floor !== floor) return;
    camera = ensureRectVisible(
      camera,
      space.geometry,
      { width: viewportWidth, height: viewportHeight },
      cameraInsets,
      cameraBounds,
      20
    );
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

  function screenPointToMap(clientX: number, clientY: number): MapPoint {
    const svg = viewportEl?.querySelector('svg');
    const matrix = svg?.getScreenCTM();
    if (matrix && typeof DOMPoint !== 'undefined') {
      try {
        const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
        return { x: point.x, y: point.y };
      } catch {
        // Fall through to the ratio-based fallback for unusual embedded SVG environments.
      }
    }

    const rect = viewportEl?.getBoundingClientRect();
    if (!rect) return { x: camera.x + camera.width / 2, y: camera.y + camera.height / 2 };
    return mapPointFromViewport(clientX, clientY, rect, camera);
  }

  function onWheel(event: WheelEvent) {
    // Ctrl+wheel remains browser/page zoom for low-vision users and normal browser behavior.
    if (event.ctrlKey || !viewportEl) return;
    event.preventDefault();
    camera = zoomViewBoxAt(
      camera,
      event.deltaY < 0 ? 0.86 : 1.16,
      screenPointToMap(event.clientX, event.clientY),
      cameraBounds
    );
  }

  function isInteractiveTarget(target: EventTarget | null) {
    return target instanceof Element && Boolean(target.closest('[role="button"], button, a, input, summary'));
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
      -(deltaClientY / rect.height) * camera.height,
      cameraBounds
    );
  }

  function finishPointer(event: PointerEvent) {
    if (dragPointerId !== event.pointerId) return;
    const current = event.currentTarget as HTMLDivElement;
    if (current.hasPointerCapture(event.pointerId)) current.releasePointerCapture(event.pointerId);
    dragPointerId = null;
  }

  function refitCurrentContext() {
    if (focusBounds) fitFocus();
    else if (routeBounds) fitRoute();
    else if (selectedSpace?.floor === floor) focusSelected();
    else fitFloor();
  }

  $effect(() => {
    const routeKey = routeNodeIds.join('|');
    const focusKey = focusNodeIds.join('|');

    if (floor !== lastFloor) {
      lastFloor = floor;
      lastSelected = selectedSpaceId;
      lastRouteKey = routeKey;
      lastFocusKey = focusKey;
      refitCurrentContext();
      return;
    }

    if (focusKey !== lastFocusKey) {
      lastFocusKey = focusKey;
      if (focusKey) fitFocus();
      else refitCurrentContext();
      return;
    }

    if (routeKey !== lastRouteKey) {
      lastRouteKey = routeKey;
      if (!focusKey && routeKey) fitRoute();
      else if (!routeKey) refitCurrentContext();
    }

    if (selectedSpaceId !== lastSelected) {
      lastSelected = selectedSpaceId;
      if (!routeKey && !focusKey && selectedSpace?.floor === floor) focusSelected();
    }
  });

  onMount(() => {
    if (!viewportEl || typeof ResizeObserver === 'undefined') return;

    let frame = 0;
    const updateSize = () => {
      if (!viewportEl) return;
      const rect = viewportEl.getBoundingClientRect();
      const changed = Math.abs(rect.width - viewportWidth) > 1 || Math.abs(rect.height - viewportHeight) > 1;
      viewportWidth = rect.width;
      viewportHeight = rect.height;
      if (changed) refitCurrentContext();
    };

    updateSize();
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateSize);
    });
    observer.observe(viewportEl);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  });
</script>

<div class="map-viewport-shell" style={`--map-overlay-bottom: ${Math.max(0, overlayBottomInsetPx)}px`}>
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

  <details class="map-legend">
    <summary>Legend</summary>
    <div>
      <span><i class="room-dot"></i>Room</span>
      <span><i class="hallway-dot"></i>Hallway</span>
      <span><i class="route-dot"></i>Route</span>
      <span><i class="origin-dot"></i>Origin</span>
      <span><i class="transition-dot"></i>Change floor</span>
      <span><i class="destination-dot"></i>Destination</span>
      <span><i class="unverified-dot"></i>Poster-marked exit · unverified</span>
    </div>
  </details>

  <p class="visually-hidden" id="map-keyboard-help">
    Drag the map to pan. Use the mouse wheel or plus and minus to zoom. Arrow keys pan. Zero fits the
    floor, R fits the active route, and S centers the selected place. Rooms remain individually
    keyboard-selectable inside the map. Focused rooms are kept clear of the mobile place sheet.
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
      {highlightNodeIds}
      {completedNodeIds}
      viewBox={camera}
      {detailLevel}
      {onSelect}
      onFocusSpace={ensureSpaceVisible}
    />
  </div>
</div>

<style>
  .map-viewport-shell {
    position: relative;
    min-width: 0;
  }

  .map-toolbar,
  .map-legend {
    position: absolute;
    z-index: 7;
    border: 1px solid rgb(255 255 255 / 0.78);
    background: rgb(255 255 255 / 0.96);
    box-shadow: 0 8px 24px rgb(0 71 109 / 0.22);
  }

  .map-toolbar {
    top: 10px;
    right: 10px;
    min-height: 44px;
    padding: 4px;
    display: flex;
    align-items: center;
    gap: 3px;
    border-radius: var(--radius-md);
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

  .map-toolbar .icon-button { font-size: 19px; }
  .map-toolbar .tool-action { font-size: 16px; }
  .map-toolbar button:hover { background: var(--surface-yellow); }

  .reset {
    padding: 0 10px;
    border-left: 1px solid var(--line) !important;
    border-radius: 0 !important;
    font-size: 10.5px;
  }

  .map-toolbar button:focus-visible,
  .map-legend summary:focus-visible {
    outline: 3px solid rgb(250 248 7 / 0.86);
    outline-offset: 1px;
  }

  .map-legend {
    left: 10px;
    bottom: 10px;
    border-radius: var(--radius-md);
    color: var(--brand-blue-ink);
    font-size: 10.5px;
  }

  .map-legend summary {
    min-height: 36px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    cursor: pointer;
    font-weight: 800;
    list-style: none;
  }

  .map-legend summary::-webkit-details-marker { display: none; }

  .map-legend > div {
    max-width: min(430px, calc(100vw - 40px));
    padding: 2px 10px 10px;
    display: flex;
    gap: 7px 12px;
    flex-wrap: wrap;
  }

  .map-legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }

  .map-legend i {
    width: 10px;
    height: 10px;
    border: 2px solid #fff;
    border-radius: 3px;
    box-shadow: 0 0 0 1px var(--brand-blue-ink);
  }

  .room-dot { background: var(--brand-blue-deep); }
  .hallway-dot { background: var(--brand-yellow); }
  .origin-dot { border-radius: 50% !important; background: var(--brand-green); }
  .destination-dot { border-radius: 50% !important; background: var(--brand-yellow); }
  .transition-dot { border-radius: 50% !important; background: #fff; }
  .unverified-dot { border-style: dashed !important; background: #fff; }
  .route-dot {
    width: 22px !important;
    height: 0 !important;
    border: 0 !important;
    border-top: 4px solid var(--brand-green) !important;
    border-radius: 0 !important;
    box-shadow: 0 -1px 0 #fff, 0 1px 0 #fff;
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

  .viewport.dragging { cursor: grabbing; }

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
    .map-toolbar { top: 8px; right: 8px; }
    .map-toolbar span { display: none; }
    .reset { padding-inline: 8px; }
    .map-legend { left: 8px; bottom: calc(8px + var(--map-overlay-bottom, 0px)); }
    .map-legend:not([open]) { opacity: 0.9; }

    .viewport {
      height: min(64svh, 610px);
      min-height: 430px;
      border-radius: 14px;
    }
  }

  @media (max-width: 430px) {
    .map-toolbar .tool-action { display: none; }
    .viewport { height: min(61svh, 560px); min-height: 410px; }
  }
</style>
