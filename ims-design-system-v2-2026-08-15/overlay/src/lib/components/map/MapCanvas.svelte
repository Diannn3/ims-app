<script lang="ts">
  import building from '$lib/data/math-building/building.json';
  import graphData from '$lib/data/math-building/graph.json';
  import { spaces } from '$lib/domain/navigation/spaces';
  import type { FloorId, GraphData } from '$lib/domain/navigation/types';

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

  const graph = graphData as GraphData;
  const nodeIndex = new Map(graph.nodes.map((node) => [node.id, node]));

  const floorSpaces = $derived(spaces.filter((space) => space.floor === floor));
  const routePoints = $derived(
    routeNodeIds
      .map((id) => nodeIndex.get(id))
      .filter((node): node is NonNullable<typeof node> => Boolean(node) && node.floor === floor)
      .map((node) => `${node.x},${node.y}`)
      .join(' ')
  );

  function labelLines(space: (typeof spaces)[number]) {
    if (space.kind === 'stairs') return [space.name.replace(' Stairs', ''), 'Stairs'];
    if (space.kind === 'toilet') return [space.name.replace(' Toilet', ''), 'Toilet'];
    return space.subtitle ? [space.name, space.subtitle] : [space.name];
  }

  function onKeydown(event: KeyboardEvent, id: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(id);
    }
  }
</script>

<div class="map-wrap">
  <svg
    viewBox={`0 0 ${building.canvas.width} ${building.canvas.height}`}
    role="group"
    aria-label={`${floor} floor schematic map with selectable rooms and facilities`}
  >
    <rect class="canvas" width={building.canvas.width} height={building.canvas.height} rx="10" />
    <path class="hallway" d="M105 320 H1085 V445 H170 V420 H105 Z" />

    {#each floorSpaces as space}
      <g
        class={`space ${space.kind}`}
        class:selected={space.id === selectedSpaceId}
        role="button"
        tabindex="0"
        aria-label={`${space.name}${space.subtitle ? `, ${space.subtitle}` : ''}`}
        aria-pressed={space.id === selectedSpaceId}
        onclick={() => onSelect(space.id)}
        onkeydown={(event) => onKeydown(event, space.id)}
      >
        <rect
          x={space.geometry.x}
          y={space.geometry.y}
          width={space.geometry.width}
          height={space.geometry.height}
          rx="8"
        />
        <text
          x={space.geometry.x + space.geometry.width / 2}
          y={space.geometry.y + space.geometry.height / 2 - (labelLines(space).length - 1) * 10}
          text-anchor="middle"
          dominant-baseline="middle"
        >
          {#each labelLines(space) as line, index}
            <tspan
              x={space.geometry.x + space.geometry.width / 2}
              dy={index === 0 ? 0 : 22}
              class:sub={index > 0}
            >{line}</tspan>
          {/each}
        </text>
      </g>
    {/each}

    {#if routePoints}
      <polyline class="route-halo" points={routePoints} aria-hidden="true" />
      <polyline class="route" points={routePoints} aria-hidden="true" />
    {/if}
  </svg>

  <div class="legend" aria-label="Map legend">
    <span><i class="room-dot"></i> Room / facility</span>
    <span><i class="route-dot"></i> Prototype route</span>
    <span><i class="destination-dot"></i> Selected destination</span>
  </div>
</div>

<style>
  .map-wrap {
    width: 100%;
    min-width: 620px;
  }

  svg {
    width: 100%;
    display: block;
    touch-action: manipulation;
  }

  .canvas {
    fill: #f8fbfd;
    stroke: #cbd9e2;
    stroke-width: 2;
  }

  .hallway {
    fill: #edf3f6;
    stroke: #acbec9;
    stroke-width: 3;
  }

  .space {
    cursor: pointer;
    outline: none;
  }

  .space rect {
    fill: #ffffff;
    stroke: #5c879f;
    stroke-width: 3;
    transition: fill 120ms ease, stroke 120ms ease, stroke-width 120ms ease;
  }

  .space.lab rect,
  .space.service rect {
    fill: #edf7fc;
  }

  .space.toilet rect,
  .space.stairs rect,
  .space.entrance rect {
    fill: #f1f5f7;
  }

  .space text {
    fill: #163d52;
    font-weight: 760;
    font-size: 18px;
    pointer-events: none;
  }

  .space.stairs text,
  .space.toilet text,
  .space.entrance text {
    font-size: 14px;
  }

  .space text .sub {
    font-size: 13px;
    fill: #607587;
  }

  .space:hover rect {
    fill: var(--surface-blue);
    stroke: var(--brand-blue-deep);
    stroke-width: 4;
  }

  .space:focus-visible rect {
    fill: var(--surface-blue);
    stroke: var(--brand-blue-ink);
    stroke-width: 7;
  }

  .space:focus-visible {
    outline: none;
  }

  .space.selected rect {
    fill: var(--brand-blue-ink);
    stroke: #d4b200;
    stroke-width: 8;
  }

  .space.selected text,
  .space.selected text .sub {
    fill: #fff;
  }

  .route-halo,
  .route {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .route-halo {
    stroke: #ffffff;
    stroke-width: 18;
    opacity: 0.92;
  }

  .route {
    stroke: var(--brand-blue-deep);
    stroke-width: 10;
    stroke-dasharray: 26 12;
  }

  .legend {
    display: flex;
    gap: 9px 16px;
    flex-wrap: wrap;
    padding: 9px 3px 2px;
    color: var(--muted);
    font-size: 10.5px;
  }

  .legend span {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }

  .legend i {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    display: inline-block;
  }

  .room-dot {
    border: 1px solid #5c879f;
    background: #fff;
  }

  .route-dot {
    width: 18px !important;
    height: 0 !important;
    border-radius: 0 !important;
    border-top: 3px dashed var(--brand-blue-deep);
  }

  .destination-dot {
    border: 2px solid #a58d00;
    background: var(--brand-yellow);
  }

  @media (prefers-reduced-motion: reduce) {
    .space rect {
      transition: none;
    }
  }
</style>
