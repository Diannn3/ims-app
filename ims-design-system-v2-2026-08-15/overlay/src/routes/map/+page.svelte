<script lang="ts">
  import { page } from '$app/state';
  import MapViewport from '$lib/components/map/MapViewport.svelte';
  import graphData from '$lib/data/math-building/graph.json';
  import { findRoute } from '$lib/domain/navigation/a-star';
  import { splitRouteByFloor } from '$lib/domain/navigation/route-builder';
  import { spaces, floorDisplayName } from '$lib/domain/navigation/spaces';
  import { getLocationAnchorByNode } from '$lib/domain/navigation/anchors';
  import type { FloorId, GraphData } from '$lib/domain/navigation/types';

  const graph = graphData as GraphData;
  const floorLabels: Record<FloorId, string> = { ground: 'Ground', second: '2nd', third: '3rd' };
  const floorIds: FloorId[] = ['ground', 'second', 'third'];

  const initialId = page.url.searchParams.get('room');
  const initialSpace = spaces.find((space) => space.id === initialId) ?? null;
  const requestedStartNodeId = page.url.searchParams.get('from');
  const startNode = graph.nodes.find((node) => node.id === requestedStartNodeId) ?? graph.nodes.find((node) => node.id === 'gf-main-entrance')!;
  const startAnchor = getLocationAnchorByNode(startNode.id);

  let floor = $state<FloorId>(initialSpace?.floor ?? 'ground');
  let selectedSpaceId = $state<string | null>(initialSpace?.id ?? null);
  let query = $state('');
  let activeRoute = $state<ReturnType<typeof findRoute>>(
    page.url.searchParams.get('route') === '1' && initialSpace?.doorNode
      ? findRoute(graph, startNode.id, initialSpace.doorNode)
      : null
  );

  const selected = $derived(spaces.find((space) => space.id === selectedSpaceId) ?? null);
  const normalized = $derived(query.trim().toLowerCase().replaceAll(' ', ''));
  const results = $derived(
    normalized.length < 1
      ? []
      : spaces
          .filter((space) => {
            const hay = [space.name, space.subtitle, ...(space.aliases ?? [])]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .replaceAll(' ', '');
            return hay.includes(normalized);
          })
          .slice(0, 7)
  );
  const segments = $derived(activeRoute ? splitRouteByFloor(graph, activeRoute) : []);
  const routeNodeIdsForFloor = $derived(
    segments.find((segment) => segment.floor === floor)?.points.map((node) => node.id) ?? []
  );
  const floorSpaces = $derived(spaces.filter((space) => space.floor === floor));

  function selectSpace(id: string) {
    selectedSpaceId = id;
    const space = spaces.find((item) => item.id === id);
    if (space) floor = space.floor;
    query = '';
    activeRoute = null;
  }

  function startRoute() {
    if (!selected?.doorNode) return;
    activeRoute = findRoute(graph, startNode.id, selected.doorNode);
    if (activeRoute) floor = startNode.floor;
  }
</script>

<svelte:head>
  <title>Building Map · IMS Academic Hub</title>
  <meta name="description" content="Interactive schematic floor explorer for the UPLB IMS Math Building." />
</svelte:head>

<div class="page map-page">
  <header class="map-heading">
    <div class="map-heading__copy">
      <span class="eyebrow">Indoor explorer</span>
      <h1>Math Building</h1>
      <p>
        Find a room, switch floors, and build a prototype route from
        <strong>{startAnchor?.shortLabel ?? startNode.label}</strong>.
      </p>
    </div>

    <div class="map-origin" aria-label="Current route origin">
      <span class="origin-dot" aria-hidden="true"></span>
      <span>
        <small>Route origin</small>
        <strong>{startAnchor?.shortLabel ?? startNode.label}</strong>
      </span>
      {#if startAnchor}<a href={`/loc/${startAnchor.slug}`}>Details</a>{/if}
    </div>
  </header>

  <section class="map-command-bar" aria-label="Map search and floor controls">
    <div class="map-search-wrap">
      <label class="visually-hidden" for="room-search">Search the Math Building</label>
      <input
        id="room-search"
        bind:value={query}
        type="search"
        maxlength="80"
        placeholder="Search MB 304, Math Clinic, CR…"
        autocomplete="off"
        enterkeyhint="search"
      />

      {#if results.length}
        <div class="results" aria-label="Room search results">
          {#each results as result}
            <button type="button" onclick={() => selectSpace(result.id)}>
              <span>
                <strong class="identifier">{result.name}</strong>
                {#if result.subtitle}<small>{result.subtitle}</small>{/if}
              </span>
              <span>{floorLabels[result.floor]}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <div class="floor-controls" role="group" aria-label="Choose floor">
      {#each floorIds as floorId}
        <button
          type="button"
          class:active={floor === floorId}
          aria-pressed={floor === floorId}
          onclick={() => (floor = floorId)}
        >
          {floorLabels[floorId]}
        </button>
      {/each}
    </div>
  </section>

  <div class="map-workspace">
    <aside class="directory directory--desktop" aria-labelledby="directory-title">
      <div class="directory__heading">
        <div>
          <span class="kicker">{floorDisplayName(floor)}</span>
          <h2 id="directory-title">Places on this floor</h2>
        </div>
        <span>{floorSpaces.length}</span>
      </div>

      <div class="space-list">
        {#each floorSpaces as space}
          <button
            type="button"
            class:selected={space.id === selectedSpaceId}
            aria-pressed={space.id === selectedSpaceId}
            onclick={() => selectSpace(space.id)}
          >
            <span>
              <strong class="identifier">{space.name}</strong>
              <small>{space.subtitle ?? space.kind.replaceAll('-', ' ')}</small>
            </span>
            <span aria-hidden="true">→</span>
          </button>
        {/each}
      </div>
    </aside>

    <section class="map-stage" aria-labelledby="map-floor-title">
      <div class="map-stage__head">
        <div>
          <span class="kicker">Schematic floorplan</span>
          <h2 id="map-floor-title">{floorDisplayName(floor)}</h2>
        </div>
        <span class="verification-status">
          <span aria-hidden="true"></span>
          Needs site verification
        </span>
      </div>

      <MapViewport
        {floor}
        {selectedSpaceId}
        routeNodeIds={routeNodeIdsForFloor}
        onSelect={selectSpace}
      />

      {#if activeRoute && segments.length > 1}
        <div class="route-strip" aria-label="Route floor segments">
          <div>
            <span class="route-mark" aria-hidden="true"></span>
            <span>Route continues across floors</span>
          </div>
          <div class="route-floor-buttons">
            {#each segments as segment, index}
              <button
                type="button"
                class:active={floor === segment.floor}
                aria-pressed={floor === segment.floor}
                onclick={() => (floor = segment.floor)}
              >
                {floorLabels[segment.floor]}{index < segments.length - 1 ? ' →' : ''}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </section>
  </div>

  <details class="directory directory--mobile">
    <summary>
      <span>
        <strong>Places on {floorDisplayName(floor)}</strong>
        <small>{floorSpaces.length} mapped places</small>
      </span>
      <span aria-hidden="true">＋</span>
    </summary>
    <div class="space-list">
      {#each floorSpaces as space}
        <button
          type="button"
          class:selected={space.id === selectedSpaceId}
          aria-pressed={space.id === selectedSpaceId}
          onclick={() => selectSpace(space.id)}
        >
          <span>
            <strong class="identifier">{space.name}</strong>
            <small>{space.subtitle ?? space.kind.replaceAll('-', ' ')}</small>
          </span>
          <span aria-hidden="true">→</span>
        </button>
      {/each}
    </div>
  </details>

  <section class:selected class="destination-panel" aria-live="polite" aria-label="Selected destination">
    {#if selected}
      <div class="destination-main">
        <div>
          <span class="eyebrow">{floorDisplayName(selected.floor)}</span>
          <h2 class="identifier">{selected.name}</h2>
          <p>{selected.subtitle ?? selected.kind.replaceAll('-', ' ')}</p>
        </div>
        <p class="destination-verification">
          Geometry: {selected.verificationStatus.replaceAll('-', ' ')}
        </p>
      </div>

      <div class="destination-actions">
        <a class="button button--secondary" href={`/room/${selected.id}`}>Room details</a>
        {#if selected.doorNode}
          <button class="button button--primary" type="button" onclick={startRoute}>
            Route from {startAnchor?.shortLabel ?? startNode.label}
          </button>
        {/if}
      </div>
    {:else}
      <div class="destination-empty">
        <span class="destination-marker" aria-hidden="true"></span>
        <div>
          <strong>Select a destination</strong>
          <p>Choose a room on the map, use search, or open the floor directory.</p>
        </div>
      </div>
    {/if}
  </section>
</div>

<style>
  .map-page {
    display: grid;
    gap: 16px;
    padding-top: 22px;
  }

  .map-heading {
    display: grid;
    gap: 18px;
    align-items: end;
  }

  .map-heading__copy {
    display: grid;
    gap: 6px;
  }

  .map-heading h1 {
    margin: 0;
    font-size: clamp(1.9rem, 4vw, 2.65rem);
    line-height: 1.02;
    letter-spacing: -0.04em;
  }

  .map-heading p {
    max-width: 64ch;
    margin: 0;
    color: var(--muted-strong);
    font-size: 13px;
    line-height: 1.55;
  }

  .map-heading p strong {
    color: var(--ink-strong);
  }

  .map-origin {
    min-height: 48px;
    padding: 8px 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 9px;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }

  .origin-dot {
    width: 10px;
    height: 10px;
    border: 2px solid #fff;
    border-radius: 50%;
    background: var(--brand-green);
    box-shadow: 0 0 0 1px var(--brand-green-deep);
  }

  .map-origin > span:nth-child(2) {
    display: grid;
    gap: 1px;
  }

  .map-origin small {
    color: var(--muted);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .map-origin strong {
    color: var(--ink-strong);
    font-size: 12.5px;
  }

  .map-origin a {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    color: var(--brand-blue-ink);
    font-size: 12px;
    font-weight: 720;
    text-underline-offset: 3px;
  }

  .map-command-bar {
    position: relative;
    z-index: 20;
    display: grid;
    gap: 8px;
  }

  .map-search-wrap {
    position: relative;
  }

  .map-search-wrap > input {
    width: 100%;
    min-height: 46px;
    padding: 0 13px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-md);
    outline: 0;
    background: var(--surface);
    color: var(--ink-strong);
    font-size: 14px;
  }

  .map-search-wrap > input:focus-visible {
    border-color: var(--brand-blue-deep);
    box-shadow: var(--focus-ring);
  }

  .results {
    position: absolute;
    top: calc(100% + 5px);
    left: 0;
    right: 0;
    overflow: hidden;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow-md);
  }

  .results button {
    width: 100%;
    min-height: 54px;
    padding: 9px 12px;
    border: 0;
    border-bottom: 1px solid var(--line);
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    background: var(--surface);
    color: var(--ink);
    text-align: left;
  }

  .results button:hover,
  .results button:focus-visible {
    background: var(--surface-blue);
  }

  .results button:last-child {
    border-bottom: 0;
  }

  .results button > span:first-child {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .results strong {
    color: var(--ink-strong);
    font-size: 13px;
  }

  .results small {
    color: var(--muted);
    font-size: 11.5px;
  }

  .results button > span:last-child {
    color: var(--muted-strong);
    font-size: 10.5px;
    font-weight: 760;
  }

  .floor-controls {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-md);
    background: var(--surface-subtle);
  }

  .floor-controls button {
    min-height: 44px;
    border: 0;
    border-left: 1px solid var(--line);
    background: transparent;
    color: var(--muted-strong);
    font-size: 12px;
    font-weight: 740;
  }

  .floor-controls button:first-child {
    border-left: 0;
  }

  .floor-controls button.active {
    background: var(--surface);
    color: var(--brand-blue-ink);
    box-shadow: inset 0 -2px 0 var(--brand-blue-deep);
  }

  .map-workspace {
    min-width: 0;
  }

  .map-stage {
    min-width: 0;
    padding: 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-lg);
    background: var(--surface);
  }

  .map-stage__head {
    min-height: 48px;
    padding: 2px 2px 9px;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: end;
  }

  .map-stage__head h2 {
    margin: 2px 0 0;
    font-size: 1.1rem;
    letter-spacing: -0.02em;
  }

  .verification-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--warning);
    font-size: 10.5px;
    font-weight: 700;
    text-align: right;
  }

  .verification-status > span {
    width: 7px;
    height: 7px;
    flex: none;
    border-radius: 50%;
    background: #d3b100;
  }

  .route-strip {
    padding: 9px 2px 0;
    display: grid;
    gap: 8px;
    border-top: 1px solid var(--line);
  }

  .route-strip > div:first-child {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted-strong);
    font-size: 11.5px;
    font-weight: 700;
  }

  .route-mark {
    width: 26px;
    height: 0;
    border-top: 3px dashed var(--brand-blue-deep);
  }

  .route-floor-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .route-floor-buttons button {
    min-height: 36px;
    padding: 0 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--muted-strong);
    font-size: 11px;
    font-weight: 730;
  }

  .route-floor-buttons button.active {
    border-color: var(--brand-blue-deep);
    color: var(--brand-blue-ink);
    box-shadow: inset 0 -2px 0 var(--brand-blue-deep);
  }

  .directory {
    min-width: 0;
  }

  .directory--desktop {
    display: none;
  }

  .directory--mobile {
    border-top: 1px solid var(--line-strong);
    border-bottom: 1px solid var(--line-strong);
  }

  .directory--mobile summary {
    min-height: 54px;
    padding: 8px 1px;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    cursor: pointer;
    list-style: none;
  }

  .directory--mobile summary::-webkit-details-marker {
    display: none;
  }

  .directory--mobile summary > span:first-child {
    display: grid;
    gap: 2px;
  }

  .directory--mobile summary strong {
    color: var(--ink-strong);
    font-size: 13px;
  }

  .directory--mobile summary small {
    color: var(--muted);
    font-size: 11px;
  }

  .directory--mobile[open] summary > span:last-child {
    transform: rotate(45deg);
  }

  .directory__heading {
    min-height: 50px;
    padding-bottom: 9px;
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid var(--line);
  }

  .directory__heading h2 {
    margin: 2px 0 0;
    font-size: 1rem;
    letter-spacing: -0.02em;
  }

  .directory__heading > span {
    color: var(--muted);
    font-family: ui-monospace, monospace;
    font-size: 11px;
  }

  .space-list {
    display: grid;
  }

  .space-list button {
    width: 100%;
    min-height: 54px;
    padding: 9px 1px;
    border: 0;
    border-bottom: 1px solid var(--line);
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    background: transparent;
    color: var(--ink);
    text-align: left;
  }

  .space-list button:hover,
  .space-list button:focus-visible {
    background: var(--surface-soft);
  }

  .space-list button.selected {
    color: var(--brand-blue-ink);
    background: var(--surface-blue);
    box-shadow: inset 3px 0 0 var(--brand-blue-deep);
  }

  .space-list button > span:first-child {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .space-list strong {
    color: currentColor;
    font-size: 12.5px;
  }

  .space-list small {
    color: var(--muted);
    font-size: 10.5px;
    text-transform: capitalize;
  }

  .destination-panel {
    min-height: 96px;
    padding: 15px;
    display: grid;
    gap: 14px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-lg);
    background: var(--surface);
  }

  .destination-panel.selected {
    border-color: #d8c84f;
    box-shadow: inset 4px 0 0 #d3b100;
  }

  .destination-main {
    display: grid;
    gap: 10px;
  }

  .destination-main h2 {
    margin: 4px 0 1px;
    font-size: clamp(1.55rem, 5vw, 2.05rem);
    letter-spacing: -0.04em;
  }

  .destination-main p {
    margin: 0;
    color: var(--muted);
    font-size: 12.5px;
    text-transform: capitalize;
  }

  .destination-verification {
    font-size: 10.5px !important;
    text-transform: none !important;
  }

  .destination-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: end;
  }

  .destination-empty {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }

  .destination-marker {
    width: 12px;
    height: 12px;
    margin-top: 3px;
    border: 2px solid #a28a00;
    border-radius: 50%;
    background: var(--brand-yellow);
  }

  .destination-empty strong {
    color: var(--ink-strong);
    font-size: 13px;
  }

  .destination-empty p {
    margin: 3px 0 0;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.45;
  }

  @media (min-width: 700px) {
    .map-heading {
      grid-template-columns: minmax(0, 1fr) minmax(250px, 0.45fr);
      gap: 36px;
    }

    .map-command-bar {
      grid-template-columns: minmax(280px, 1fr) auto;
    }

    .floor-controls {
      min-width: 260px;
    }

    .destination-panel {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
    }
  }

  @media (min-width: 960px) {
    .map-page {
      gap: 14px;
    }

    .map-workspace {
      display: grid;
      grid-template-columns: minmax(230px, 0.28fr) minmax(0, 1fr);
      gap: 12px;
      align-items: stretch;
    }

    .directory--desktop {
      max-height: min(690px, calc(100svh - 188px));
      padding: 10px 12px;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      border: 1px solid var(--line-strong);
      border-radius: var(--radius-lg);
      background: var(--surface);
    }

    .directory--desktop .space-list {
      overflow: auto;
      overscroll-behavior: contain;
    }

    .directory--mobile {
      display: none;
    }

    .map-stage {
      min-height: 560px;
    }
  }
</style>
