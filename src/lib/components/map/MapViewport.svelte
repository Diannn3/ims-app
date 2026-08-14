<script lang="ts">
  import MapCanvas from './MapCanvas.svelte';
  import AppIcon from '$lib/components/ui/AppIcon.svelte';
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
  let viewport: HTMLDivElement;
  let dragOrigin: { x: number; y: number; left: number; top: number } | null = null;
  let pinchOrigin: { distance: number; zoom: number } | null = null;
  const pointers = new Map<number, { x: number; y: number }>();

  function setZoom(next: number) {
    zoom = Math.min(1.8, Math.max(0.7, Math.round(next * 10) / 10));
  }

  function zoomIn() {
    setZoom(zoom + 0.2);
  }

  function zoomOut() {
    setZoom(zoom - 0.2);
  }

  function reset() {
    zoom = 1;
    viewport?.scrollTo({ left: 0, top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  function pointerDistance() {
    const [first, second] = [...pointers.values()];
    return first && second ? Math.hypot(second.x - first.x, second.y - first.y) : 0;
  }

  function onPointerDown(event: PointerEvent) {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    viewport.setPointerCapture(event.pointerId);
    if (pointers.size === 1) dragOrigin = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    if (pointers.size === 2) pinchOrigin = { distance: pointerDistance(), zoom };
  }

  function onPointerMove(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2 && pinchOrigin) {
      const distance = pointerDistance();
      if (pinchOrigin.distance > 0) setZoom(pinchOrigin.zoom * (distance / pinchOrigin.distance));
      return;
    }
    if (pointers.size === 1 && dragOrigin) {
      viewport.scrollLeft = dragOrigin.left - (event.clientX - dragOrigin.x);
      viewport.scrollTop = dragOrigin.top - (event.clientY - dragOrigin.y);
    }
  }

  function onPointerUp(event: PointerEvent) {
    pointers.delete(event.pointerId);
    dragOrigin = null;
    pinchOrigin = null;
  }

  function onWheel(event: WheelEvent) {
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    event.preventDefault();
    setZoom(zoom + (event.deltaY < 0 ? 0.1 : -0.1));
  }
</script>

<div class="map-viewport-shell">
  <div class="map-toolbar" aria-label="Map zoom controls">
    <button class="icon-button" type="button" onclick={zoomOut} aria-label="Zoom map out"><AppIcon name="minus" size={18} /></button>
    <span aria-live="polite">{Math.round(zoom * 100)}%</span>
    <button class="icon-button" type="button" onclick={zoomIn} aria-label="Zoom map in"><AppIcon name="plus" size={18} /></button>
    <button class="reset" type="button" onclick={reset}><AppIcon name="fit" size={16} />Fit</button>
  </div>

  <div bind:this={viewport} class="viewport" role="region" aria-label="Interactive floor map. Drag to pan, pinch or use controls to zoom." onpointerdown={onPointerDown} onpointermove={onPointerMove} onpointerup={onPointerUp} onpointercancel={onPointerUp} ondblclick={zoomIn} onwheel={onWheel}>
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
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .viewport {
    width: 100%;
    overflow: auto;
    overscroll-behavior-inline: contain;
    border-radius: 18px;
    background: #fafdff;
    scrollbar-color: #9fc5dc transparent;
    touch-action: none;
    cursor: grab;
    user-select: none;
  }

  .viewport:active { cursor: grabbing; }

  .scaled {
    min-width: 680px;
  }

  @media (max-width: 620px) {
    .scaled {
      min-width: 620px;
    }
  }
</style>
