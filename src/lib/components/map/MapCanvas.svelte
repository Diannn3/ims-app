<script lang="ts">
  import building from '$lib/data/math-building/building.json';
  import spacesData from '$lib/data/math-building/spaces.json';
  import graphData from '$lib/data/math-building/graph.json';
  import type { FloorId, GraphData } from '$lib/domain/navigation/types';

  export let floor: FloorId;
  export let selectedSpaceId: string | null = null;
  export let routeNodeIds: string[] = [];
  export let onSelect: (spaceId: string) => void = () => {};

  const spaces = spacesData as any[];
  const graph = graphData as GraphData;
  $: floorSpaces = spaces.filter((space) => space.floor === floor);
  $: nodeIndex = new Map(graph.nodes.map((node) => [node.id, node]));
  $: routePoints = routeNodeIds
    .map((id) => nodeIndex.get(id))
    .filter((node): node is NonNullable<typeof node> => Boolean(node) && node.floor === floor)
    .map((node) => `${node.x},${node.y}`)
    .join(' ');

  const classFor = (kind: string) => `space ${kind}`;
  const labelLines = (space: any) => {
    if (space.kind === 'stairs') return [space.name.replace(' Stairs', ''), 'Stairs'];
    if (space.kind === 'toilet') return [space.name.replace(' Toilet', ''), 'Toilet'];
    return space.subtitle ? [space.name, space.subtitle] : [space.name];
  };
</script>

<div class="map-wrap">
  <svg viewBox={`0 0 ${building.canvas.width} ${building.canvas.height}`} role="img" aria-label={`${floor} floor prototype map`}>
    <rect class="canvas" width="1200" height="760" rx="24" />
    <path class="hallway" d="M105 320 H1085 V445 H170 V420 H105 Z" />

    {#each floorSpaces as space}
      <g
        class:selected={space.id === selectedSpaceId}
        class={classFor(space.kind)}
        role="button"
        tabindex="0"
        aria-label={`${space.name}${space.subtitle ? `, ${space.subtitle}` : ''}`}
        on:click={() => onSelect(space.id)}
        on:keydown={(event) => (event.key === 'Enter' || event.key === ' ') && onSelect(space.id)}
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
      <polyline class="route" points={routePoints} />
    {/if}
  </svg>
  <div class="legend">
    <span><i class="room-dot"></i> Room / facility</span>
    <span><i class="route-dot"></i> Prototype route</span>
  </div>
</div>

<style>
  .map-wrap { overflow: hidden; }
  svg { width: 100%; min-height: 410px; display: block; touch-action: manipulation; }
  .canvas { fill: #fbfaf6; stroke: #ded8cc; stroke-width: 2; }
  .hallway { fill: #efe0a6; stroke: #c7aa56; stroke-width: 4; opacity: .92; }
  .space { cursor: pointer; outline: none; }
  .space rect { fill: #f9fbff; stroke: #172554; stroke-width: 5; transition: .16s ease; }
  .space.lab rect, .space.service rect { fill: #e9effe; }
  .space.toilet rect { fill: #f3efff; }
  .space.stairs rect, .space.entrance rect { fill: #edf0f5; }
  .space text { fill: #172554; font-weight: 800; font-size: 19px; pointer-events: none; }
  .space.stairs text, .space.toilet text, .space.entrance text { font-size: 14px; }
  .space text .sub { font-size: 14px; fill: #5d6472; }
  .space:hover rect, .space:focus rect { fill: #fff7cf; stroke: #8f6800; }
  .space.selected rect { fill: #172554; stroke: #d6ad3c; stroke-width: 7; }
  .space.selected text, .space.selected text .sub { fill: #fff2b5; }
  .route { fill: none; stroke: #c98d00; stroke-width: 13; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1 24; }
  .legend { display: flex; gap: 16px; flex-wrap: wrap; padding: 8px 4px 0; color: #6e7480; font-size: 12px; }
  .legend span { display: inline-flex; gap: 7px; align-items: center; }
  .legend i { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
  .room-dot { background: #172554; }
  .route-dot { background: #c98d00; }
  @media (max-width: 620px) { svg { min-height: 300px; } .space text { font-size: 23px; } }
</style>
