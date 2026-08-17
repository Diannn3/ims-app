<script lang="ts">
  import building from '$lib/data/math-building/building.json';
  import graphData from '$lib/data/math-building/graph.json';
  import { floorVisuals } from '$lib/data/math-building/floor-visuals';
  import { spaces } from '$lib/domain/navigation/spaces';
  import type { MapViewBox } from '$lib/domain/navigation/map-camera';
  import type { FloorId, GraphData } from '$lib/domain/navigation/types';

  type DetailLevel = 'overview' | 'detail';

  let {
    floor,
    selectedSpaceId = null,
    routeNodeIds = [],
    routeSegmentIndex = 0,
    routeSegmentCount = 1,
    highlightNodeIds = [],
    completedNodeIds = [],
    viewBox = { x: 0, y: 0, width: building.canvas.width, height: building.canvas.height },
    detailLevel = 'overview',
    onSelect = () => {}
  }: {
    floor: FloorId;
    selectedSpaceId?: string | null;
    routeNodeIds?: string[];
    routeSegmentIndex?: number;
    routeSegmentCount?: number;
    highlightNodeIds?: string[];
    completedNodeIds?: string[];
    viewBox?: MapViewBox;
    detailLevel?: DetailLevel;
    onSelect?: (spaceId: string) => void;
  } = $props();

  const graph = graphData as GraphData;
  const nodeIndex = new Map(graph.nodes.map((node) => [node.id, node]));

  const visual = $derived(floorVisuals[floor]);
  const floorSpaces = $derived(spaces.filter((space) => space.floor === floor));
  const selectedSpace = $derived(floorSpaces.find((space) => space.id === selectedSpaceId) ?? null);
  const routeFloorNodes = $derived(
    routeNodeIds
      .flatMap((id) => {
        const node = nodeIndex.get(id);
        return node && node.floor === floor ? [node] : [];
      })
  );
  const routeSegments = $derived(
    routeFloorNodes.slice(1).map((to, index) => ({ from: routeFloorNodes[index], to }))
  );
  const highlightNodeSet = $derived(new Set(highlightNodeIds));
  const completedNodeSet = $derived(new Set(completedNodeIds));
  const routeStart = $derived(routeFloorNodes.length ? routeFloorNodes[0] : null);
  const routeEnd = $derived(routeFloorNodes.length ? routeFloorNodes[routeFloorNodes.length - 1] : null);
  const isFirstRouteFloor = $derived(routeSegmentIndex === 0);
  const isLastRouteFloor = $derived(routeSegmentIndex === routeSegmentCount - 1);
  const markerId = $derived(`route-arrow-${floor}`);

  function labelLines(space: (typeof spaces)[number]) {
    if (space.kind === 'toilet') return [space.name.replace(' Toilet', ''), 'Toilet'];
    if (space.kind === 'entrance') return ['Main', 'Entrance'];
    if (detailLevel === 'detail' || space.id === selectedSpaceId) {
      return space.subtitle ? [space.name, space.subtitle] : [space.name];
    }
    return [space.name];
  }

  function onKeydown(event: KeyboardEvent, id: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(id);
    }
  }
</script>

<div class="map-wrap" class:detail={detailLevel === 'detail'}>
  <svg
    viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
    preserveAspectRatio="xMidYMid meet"
    role="group"
    aria-label={`${visual.displayLabel} schematic map with selectable rooms and facilities`}
  >
    <title>{visual.displayLabel} — IMS Math Building</title>
    <desc>
      Interactive schematic floor plan. Rooms and facilities are selectable. Direction arrows show the
      active prototype route. Geometry is reference-matched to supplied orientation posters and still
      requires physical site verification.
    </desc>

    <defs>
      <linearGradient id="ims-map-field" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#009bff" />
        <stop offset="100%" stop-color="#0077b8" />
      </linearGradient>
      <linearGradient id="ims-hallway" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fff98a" />
        <stop offset="100%" stop-color="#f6e95f" />
      </linearGradient>
      <linearGradient id="ims-room" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0077b8" />
        <stop offset="100%" stop-color="#005f91" />
      </linearGradient>
      <filter id="room-shadow" x="-12%" y="-12%" width="124%" height="135%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#00476d" flood-opacity="0.24" />
      </filter>
      <filter id="route-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#00476d" flood-opacity="0.32" />
      </filter>
      <marker
        id={markerId}
        markerWidth="14"
        markerHeight="14"
        refX="11"
        refY="7"
        orient="auto"
        markerUnits="userSpaceOnUse"
        viewBox="0 0 14 14"
      >
        <path d="M 1 1 L 13 7 L 1 13 Z" class="route-arrow" />
      </marker>
    </defs>

    <rect class="canvas" width={building.canvas.width} height={building.canvas.height} rx="24" />
    <rect class="frame" x="18" y="18" width="1164" height="724" rx="20" aria-hidden="true" />

    <g class="floor-stamp" aria-hidden="true">
      <rect x="42" y="45" width="70" height="52" rx="10" />
      <text x="77" y="72" text-anchor="middle" dominant-baseline="middle">{visual.shortLabel}</text>
      <text class="floor-name" x="132" y="72" dominant-baseline="middle">{visual.displayLabel}</text>
      <line x1="132" y1="91" x2="330" y2="91" />
    </g>

    <g class="hallway-layer" aria-hidden="true">
      <path class="hallway-outline" d={visual.hallwayPath} />
      <path class="hallway" d={visual.hallwayPath} />
    </g>

    {#each floorSpaces as space}
      <g
        class={`space ${space.kind}`}
        class:selected={space.id === selectedSpaceId}
        role="button"
        tabindex="0"
        aria-label={`${space.name}${space.subtitle ? `, ${space.subtitle}` : ''}, ${visual.displayLabel}`}
        aria-pressed={space.id === selectedSpaceId}
        onclick={() => onSelect(space.id)}
        onkeydown={(event) => onKeydown(event, space.id)}
      >
        {#if space.kind === 'stairs'}
          <rect
            class="facility-tile"
            x={space.geometry.x}
            y={space.geometry.y}
            width={space.geometry.width}
            height={space.geometry.height}
            rx="8"
          />
          <g class="stairs-glyph" aria-hidden="true">
            <path
              d={`M ${space.geometry.x + 15} ${space.geometry.y + space.geometry.height - 18}
                  H ${space.geometry.x + 30}
                  V ${space.geometry.y + space.geometry.height - 31}
                  H ${space.geometry.x + 45}
                  V ${space.geometry.y + space.geometry.height - 44}
                  H ${space.geometry.x + 60}
                  V ${space.geometry.y + 18}`}
            />
          </g>
          {#if detailLevel === 'detail' || space.id === selectedSpaceId}
            <text
              class="facility-label"
              x={space.geometry.x + space.geometry.width / 2}
              y={space.geometry.y + space.geometry.height + 18}
              text-anchor="middle"
            >Stairs</text>
          {/if}
        {:else if space.kind === 'entrance'}
          <rect
            class="entrance-hit"
            x={space.geometry.x}
            y={space.geometry.y}
            width={space.geometry.width}
            height={space.geometry.height}
            rx="8"
          />
          <g class="entrance-glyph" aria-hidden="true">
            <circle
              cx={space.geometry.x + space.geometry.width / 2}
              cy={space.geometry.y + space.geometry.height / 2}
              r="25"
            />
            <path
              d={`M ${space.geometry.x + 25} ${space.geometry.y + space.geometry.height / 2}
                  H ${space.geometry.x + 49}
                  M ${space.geometry.x + 41} ${space.geometry.y + space.geometry.height / 2 - 8}
                  L ${space.geometry.x + 50} ${space.geometry.y + space.geometry.height / 2}
                  L ${space.geometry.x + 41} ${space.geometry.y + space.geometry.height / 2 + 8}`}
            />
          </g>
        {:else}
          <rect
            x={space.geometry.x}
            y={space.geometry.y}
            width={space.geometry.width}
            height={space.geometry.height}
            rx="7"
            filter="url(#room-shadow)"
          />

          {#if space.kind === 'lab' || space.kind === 'service'}
            <rect
              class="feature-accent"
              x={space.geometry.x + 8}
              y={space.geometry.y + 8}
              width="8"
              height={Math.max(24, space.geometry.height - 16)}
              rx="4"
              aria-hidden="true"
            />
          {/if}

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
        {/if}
      </g>
    {/each}

    {#if routeSegments.length}
      <g class="route-layer" aria-hidden="true" filter="url(#route-shadow)">
        {#each routeSegments as segment}
          <line
            class="route-halo"
            x1={segment.from.x}
            y1={segment.from.y}
            x2={segment.to.x}
            y2={segment.to.y}
          />
          <line
            class:route-highlight={highlightNodeSet.has(segment.from.id) || highlightNodeSet.has(segment.to.id)}
            class:route-completed={completedNodeSet.has(segment.from.id) && completedNodeSet.has(segment.to.id)}
            class="route"
            x1={segment.from.x}
            y1={segment.from.y}
            x2={segment.to.x}
            y2={segment.to.y}
            marker-end={`url(#${markerId})`}
          />
        {/each}

        {#if routeStart}
          {#if isFirstRouteFloor}
            <circle class="route-origin-ring" cx={routeStart.x} cy={routeStart.y} r="16" />
            <circle class="route-origin" cx={routeStart.x} cy={routeStart.y} r="8" />
          {:else}
            <g class="floor-transition" transform={`translate(${routeStart.x} ${routeStart.y})`}>
              <circle r="18" />
              <path d="M -7 -2 L 0 -9 L 7 -2 M -7 3 L 0 10 L 7 3" />
            </g>
          {/if}
        {/if}

        {#if routeEnd}
          {#if isLastRouteFloor}
            <circle class="route-destination-ring" cx={routeEnd.x} cy={routeEnd.y} r="18" />
            <circle class="route-destination" cx={routeEnd.x} cy={routeEnd.y} r="9" />
          {:else}
            <g class="floor-transition" transform={`translate(${routeEnd.x} ${routeEnd.y})`}>
              <circle r="18" />
              <path d="M -7 -2 L 0 -9 L 7 -2 M -7 3 L 0 10 L 7 3" />
            </g>
          {/if}
        {/if}
      </g>
    {/if}

    {#if selectedSpace}
      <g
        class="selected-pin"
        transform={`translate(${selectedSpace.geometry.x + selectedSpace.geometry.width - 8} ${selectedSpace.geometry.y + 8})`}
        aria-hidden="true"
      >
        <circle r="13" />
        <circle r="4" />
      </g>
    {/if}

    {#each visual.exits as marker}
      <g class={`exit-marker ${marker.kind}`} transform={`translate(${marker.x} ${marker.y})`} aria-hidden="true">
        <title>{marker.label} — physical verification pending</title>
        <circle r="21" />
        {#if marker.kind === 'emergency'}
          <path class="exit-person" d="M -2 -10 a4 4 0 1 0 0.1 0 M -3 -3 l7 3 5 -6 M 1 0 l-5 9 M 3 1 l6 8 M 8 -11 v18" />
        {:else}
          <path class="entrance-arrow" d="M -11 0 H 9 M 2 -8 L 11 0 L 2 8" />
        {/if}
        {#if detailLevel === 'detail'}
          <text x="0" y="36" text-anchor="middle">{marker.label}</text>
        {/if}
      </g>
    {/each}

    {#if (visual.verificationStatus as string) === 'site-verified'}
    <g class="compass" transform={`translate(${visual.compass.x} ${visual.compass.y})`} aria-hidden="true">
      <circle r="37" />
      <circle r="5" />
      <path d="M 0 -30 L 7 -6 L 0 -12 L -7 -6 Z" />
      <path d="M 0 30 L 7 6 L 0 12 L -7 6 Z" />
      <path d="M -30 0 L -6 7 L -12 0 L -6 -7 Z" />
      <path d="M 30 0 L 6 7 L 12 0 L 6 -7 Z" />
      <text x="0" y="-45" text-anchor="middle">N</text>
      <text x="47" y="4" text-anchor="middle">E</text>
      <text x="0" y="53" text-anchor="middle">S</text>
      <text x="-47" y="4" text-anchor="middle">W</text>
    </g>
    {/if}
  </svg>

  <div class="legend" aria-label="Map legend">
    <span><i class="room-dot"></i> Room / facility</span>
    <span><i class="hallway-dot"></i> Hallway</span>
    <span><i class="route-dot"></i> Active route</span>
    <span><i class="origin-dot"></i> Route origin</span>
    <span><i class="transition-dot"></i> Change floor</span>
    <span><i class="destination-dot"></i> Destination</span>
    <span><i class="exit-dot"></i> Reference marker · unverified</span>
  </div>
</div>

<style>
  .map-wrap {
    width: 100%;
    min-width: 0;
    overflow: hidden;
    border-radius: 18px;
    background: var(--brand-blue, #009bff);
  }

  svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: hidden;
  }

  .canvas { fill: url(#ims-map-field); }

  .frame {
    fill: rgb(0 95 145 / 0.16);
    stroke: rgb(255 255 255 / 0.46);
    stroke-width: 2;
  }

  .floor-stamp rect {
    fill: var(--brand-yellow, #faf807);
    stroke: #fff;
    stroke-width: 3;
  }

  .floor-stamp text {
    fill: var(--brand-blue-ink, #005f91);
    font-family: ui-monospace, "SFMono-Regular", "Cascadia Code", monospace;
    font-size: 22px;
    font-weight: 900;
    letter-spacing: -0.04em;
  }

  .floor-stamp .floor-name {
    fill: #fff;
    font-family: inherit;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.03em;
  }

  .floor-stamp line {
    stroke: var(--brand-yellow, #faf807);
    stroke-width: 5;
    stroke-linecap: round;
  }

  .hallway-outline {
    fill: none;
    stroke: #fff;
    stroke-width: 18;
    stroke-linejoin: round;
  }

  .hallway {
    fill: url(#ims-hallway);
    stroke: #e7d90a;
    stroke-width: 4;
    stroke-linejoin: round;
  }

  .space {
    cursor: pointer;
    outline: none;
  }

  .space > rect:not(.feature-accent):not(.entrance-hit) {
    fill: url(#ims-room);
    stroke: #fff;
    stroke-width: 4;
    vector-effect: non-scaling-stroke;
    transition: fill 120ms ease, stroke 120ms ease, stroke-width 120ms ease;
  }

  .space.lab > rect:first-of-type,
  .space.service > rect:first-of-type,
  .space.toilet > rect:first-of-type {
    fill: var(--brand-blue-ink, #005f91);
  }

  .feature-accent {
    fill: var(--brand-green, #17960e);
    stroke: #fff;
    stroke-width: 1.5;
  }

  .space text,
  .facility-label {
    fill: #fff;
    font-family: ui-monospace, "SFMono-Regular", "Cascadia Code", monospace;
    font-size: 18px;
    font-weight: 850;
    letter-spacing: -0.025em;
    pointer-events: none;
  }

  .space.toilet text {
    font-family: inherit;
    font-size: 14px;
    font-weight: 760;
  }

  .space text .sub {
    fill: var(--brand-yellow, #faf807);
    font-family: inherit;
    font-size: 13px;
    font-weight: 760;
  }

  .facility-label {
    font-size: 11px;
    font-weight: 760;
  }

  .space:hover > rect:not(.feature-accent):not(.entrance-hit) {
    fill: #005f91;
    stroke: var(--brand-yellow, #faf807);
    stroke-width: 6;
  }

  .space:focus-visible > rect:not(.feature-accent):not(.entrance-hit),
  .space:focus-visible .facility-tile,
  .space:focus-visible .entrance-hit,
  .space.selected > rect:not(.feature-accent):not(.entrance-hit),
  .space.selected .facility-tile,
  .space.selected .entrance-hit {
    stroke: var(--brand-yellow, #faf807);
    stroke-width: 9;
  }

  .space.selected > rect:not(.feature-accent):not(.entrance-hit) {
    fill: var(--brand-blue-ink, #005f91);
  }

  .facility-tile {
    fill: var(--brand-blue-ink, #005f91) !important;
    stroke: #fff !important;
    stroke-width: 4 !important;
  }

  .stairs-glyph path {
    fill: none;
    stroke: #fff;
    stroke-width: 6;
    stroke-linecap: square;
    stroke-linejoin: miter;
    pointer-events: none;
  }

  .entrance-hit {
    fill: rgb(23 150 14 / 0.22);
    stroke: rgb(255 255 255 / 0.88);
    stroke-width: 3;
  }

  .entrance-glyph circle {
    fill: var(--brand-green, #17960e);
    stroke: #fff;
    stroke-width: 4;
  }

  .entrance-glyph path {
    fill: none;
    stroke: #fff;
    stroke-width: 5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .route-halo,
  .route {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  .route-halo {
    stroke: #fff;
    stroke-width: 18;
    opacity: 0.98;
  }

  .route {
    stroke: var(--brand-green, #17960e);
    stroke-width: 8;
  }

  .route.route-highlight {
    stroke: var(--brand-yellow, #faf807);
    stroke-width: 10;
  }

  .route.route-completed {
    stroke: rgb(255 255 255 / 0.62);
    stroke-width: 7;
  }

  .route-arrow {
    fill: var(--brand-green, #17960e);
    stroke: #fff;
    stroke-width: 0.8;
  }

  .route-origin-ring,
  .route-destination-ring {
    fill: #fff;
  }

  .route-origin {
    fill: var(--brand-green, #17960e);
    stroke: var(--brand-green-deep, #116b0a);
    stroke-width: 3;
  }

  .route-destination {
    fill: var(--brand-yellow, #faf807);
    stroke: var(--brand-blue-ink, #005f91);
    stroke-width: 4;
  }

  .floor-transition circle {
    fill: #fff;
    stroke: var(--brand-blue-ink, #005f91);
    stroke-width: 4;
  }

  .floor-transition path {
    fill: none;
    stroke: var(--brand-blue-ink, #005f91);
    stroke-width: 4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .selected-pin circle:first-child {
    fill: var(--brand-yellow, #faf807);
    stroke: #fff;
    stroke-width: 4;
  }

  .selected-pin circle:last-child {
    fill: var(--brand-blue-ink, #005f91);
  }

  .exit-marker circle {
    fill: rgb(255 255 255 / 0.22);
    stroke: #fff;
    stroke-width: 3;
    stroke-dasharray: 6 4;
  }

  .exit-marker path {
    fill: none;
    stroke: #fff;
    stroke-width: 4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .exit-marker.entrance path { stroke: #fff; }

  .exit-marker text {
    fill: #fff;
    font-size: 11px;
    font-weight: 760;
    paint-order: stroke;
    stroke: var(--brand-blue-ink, #005f91);
    stroke-width: 3;
    stroke-linejoin: round;
  }

  .compass circle:first-child {
    fill: rgb(0 95 145 / 0.30);
    stroke: #fff;
    stroke-width: 2;
  }

  .compass circle:nth-child(2) {
    fill: var(--brand-yellow, #faf807);
    stroke: #fff;
    stroke-width: 2;
  }

  .compass path {
    fill: #fff;
    stroke: #fff;
    stroke-width: 1;
  }

  .compass path:first-of-type { fill: var(--brand-yellow, #faf807); }

  .compass text {
    fill: #fff;
    font-size: 12px;
    font-weight: 850;
  }

  .legend {
    min-height: 48px;
    padding: 9px 14px 12px;
    display: flex;
    align-items: center;
    gap: 8px 16px;
    flex-wrap: wrap;
    border-top: 1px solid rgb(255 255 255 / 0.34);
    background: var(--brand-blue-ink, #005f91);
    color: #fff;
    font-size: 10.5px;
    font-weight: 700;
  }

  .legend span {
    display: inline-flex;
    gap: 7px;
    align-items: center;
    white-space: nowrap;
  }

  .legend i {
    width: 11px;
    height: 11px;
    border: 2px solid #fff;
    border-radius: 3px;
    display: inline-block;
    flex: none;
  }

  .room-dot { background: var(--brand-blue-deep, #0077b8); }
  .hallway-dot { background: var(--brand-yellow, #faf807); }

  .route-dot {
    width: 22px !important;
    height: 0 !important;
    border: 0 !important;
    border-top: 4px solid var(--brand-green, #17960e) !important;
    border-radius: 0 !important;
    box-shadow: 0 -1px 0 #fff, 0 1px 0 #fff;
  }

  .origin-dot,
  .destination-dot,
  .exit-dot,
  .transition-dot {
    border-radius: 50% !important;
  }

  .origin-dot,
  .exit-dot { background: var(--brand-green, #17960e); }
  .destination-dot { background: var(--brand-yellow, #faf807); }
  .transition-dot { background: #fff; border-color: var(--brand-blue-ink, #005f91) !important; }

  @media (prefers-reduced-motion: reduce) {
    .space > rect { transition: none; }
  }
</style>
