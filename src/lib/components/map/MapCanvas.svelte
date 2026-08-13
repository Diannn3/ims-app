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
    role="img"
    aria-label={`${floor} floor schematic map`}
  >
    <rect class="canvas" width={building.canvas.width} height={building.canvas.height} rx="24" />
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
          rx="14"
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
      <polyline class="route" points={routePoints} aria-hidden="true" />
    {/if}
  </svg>

  <div class="legend" aria-label="Map legend">
    <span><i class="room-dot"></i> Room / facility</span>
    <span><i class="route-dot"></i> Prototype route</span>
  </div>
</div>

<style>
  .map-wrap {
    width: 100%;
    min-width: 680px;
  }

  svg {
    width: 100%;
    display: block;
    touch-action: manipulation;
  }

  .canvas {
    fill: #fafdff;
    stroke: #cfe1ed;
    stroke-width: 2;
  }

  .hallway {
    fill: #fff7b9;
    stroke: #d8bd33;
    stroke-width: 4;
    opacity: 0.92;
  }

  .space {
    cursor: pointer;
    outline: none;
  }

  .space rect {
    fill: #f9fcff;
    stroke: #176c9d;
    stroke-width: 5;
    transition: fill 150ms ease, stroke 150ms ease, stroke-width 150ms ease;
  }

  .space.lab rect,
  .space.service rect {
    fill: #e9f7ff;
  }

  .space.toilet rect {
    fill: #f4f7fb;
  }

  .space.stairs rect,
  .space.entrance rect {
    fill: #edf3f7;
  }

  .space text {
    fill: #0c3d5a;
    font-weight: 850;
    font-size: 19px;
    pointer-events: none;
  }

  .space.stairs text,
  .space.toilet text,
  .space.entrance text {
    font-size: 14px;
  }

  .space text .sub {
    font-size: 14px;
    fill: #607587;
  }

  .space:hover rect,
  .space:focus-visible rect {
    fill: #fffde3;
    stroke: #7a6200;
    stroke-width: 7;
  }

  .space:focus-visible {
    outline: none;
  }

  .space.selected rect {
    fill: #006ea8;
    stroke: #faf807;
    stroke-width: 8;
  }

  .space.selected text,
  .space.selected text .sub {
    fill: #fff;
  }

  .route {
    fill: none;
    stroke: #d5ad00;
    stroke-width: 13;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 1 24;
  }

  .legend {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    padding: 10px 4px 2px;
    color: var(--muted);
    font-size: 12px;
  }

  .legend span {
    display: inline-flex;
    gap: 7px;
    align-items: center;
  }

  .legend i {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    display: inline-block;
  }

  .room-dot { background: var(--brand-blue-deep); }
  .route-dot { background: #d5ad00; }
</style>
