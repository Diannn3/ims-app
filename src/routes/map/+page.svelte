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
  <section class="page-heading">
    <span class="eyebrow">Indoor explorer</span>
    <h1>Math Building</h1>
    <p>
      Search a room or facility and inspect the structured floor map. Prototype routes currently
      start at {startAnchor?.shortLabel ?? startNode.label}.
    </p>
    <div class="map-start-row">
      <span class="badge badge--blue">Start · {startAnchor?.shortLabel ?? startNode.label}</span>
      {#if startAnchor}<a href={`/loc/${startAnchor.slug}`}>Anchor details</a>{/if}
    </div>
  </section>

  <section class="search-card card">
    <label class="field" for="room-search">
      <span>Search the building</span>
      <input
        class="input"
        id="room-search"
        bind:value={query}
        placeholder="Try “MB 304”, “Math Clinic”, or “CR”"
        autocomplete="off"
      />
    </label>

    {#if results.length}
      <div class="results" role="listbox" aria-label="Room search results">
        {#each results as result}
          <button type="button" role="option" onclick={() => selectSpace(result.id)}>
            <span>
              <strong>{result.name}</strong>
              {#if result.subtitle}<small>{result.subtitle}</small>{/if}
            </span>
            <span>{floorLabels[result.floor]}</span>
          </button>
        {/each}
      </div>
    {/if}
  </section>

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

  <section class="map-card card" aria-labelledby="map-floor-title">
    <div class="map-card__head">
      <div>
        <span class="kicker">Schematic floorplan</span>
        <h2 id="map-floor-title">{floorDisplayName(floor)}</h2>
      </div>
      <span class="badge badge--yellow">Needs site verification</span>
    </div>

    <MapViewport
      {floor}
      {selectedSpaceId}
      routeNodeIds={routeNodeIdsForFloor}
      onSelect={selectSpace}
    />
  </section>

  {#if activeRoute && segments.length > 1}
    <section class="route-strip card" aria-label="Route floor segments">
      <div>
        <span class="kicker">Route</span>
        <strong>Follow the highlighted floor segments</strong>
      </div>
      <div class="route-floor-buttons">
        {#each segments as segment, index}
          <button
            type="button"
            class:active={floor === segment.floor}
            onclick={() => (floor = segment.floor)}
          >
            {floorLabels[segment.floor]}{index < segments.length - 1 ? ' →' : ''}
          </button>
        {/each}
      </div>
    </section>
  {/if}

  <div class="map-details-layout">
    <section class="details card" aria-live="polite">
      {#if selected}
        <div>
          <span class="eyebrow">{floorDisplayName(selected.floor)}</span>
          <h2>{selected.name}</h2>
          <p>{selected.subtitle ?? selected.kind.replaceAll('-', ' ')}</p>
        </div>

        <div class="cluster">
          <a class="button button--secondary" href={`/room/${selected.id}`}>Room details</a>
          {#if selected.doorNode}
            <button class="button button--primary" type="button" onclick={startRoute}>
              Route from {startAnchor?.shortLabel ?? startNode.label}
            </button>
          {/if}
        </div>

        <p class="verify">
          Geometry status: {selected.verificationStatus.replaceAll('-', ' ')}.
        </p>
      {:else}
        <div>
          <span class="kicker">Select a destination</span>
          <h2>Tap a room on the map.</h2>
          <p>Or use the search field above to jump directly to a room or facility.</p>
        </div>
      {/if}
    </section>

    <section class="directory card">
      <div class="section-header">
        <div>
          <span class="kicker">Text alternative</span>
          <h2>Places on this floor</h2>
        </div>
      </div>

      <div class="space-list">
        {#each floorSpaces as space}
          <button
            type="button"
            class:selected={space.id === selectedSpaceId}
            onclick={() => selectSpace(space.id)}
          >
            <span>
              <strong>{space.name}</strong>
              <small>{space.subtitle ?? space.kind.replaceAll('-', ' ')}</small>
            </span>
            <span aria-hidden="true">→</span>
          </button>
        {/each}
      </div>
    </section>
  </div>
</div>

<style>
  .map-page {
    display: grid;
    gap: 14px;
  }

  .map-start-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-top:12px; }
  .map-start-row a { color:var(--brand-blue-ink); font-size:.8rem; font-weight:800; }

  .search-card {
    position: relative;
    z-index: 10;
    padding: 13px;
  }

  .results {
    position: absolute;
    top: calc(100% - 2px);
    left: 13px;
    right: 13px;
    overflow: hidden;
    border: 1px solid var(--line-strong);
    border-radius: 16px;
    background: #fff;
    box-shadow: var(--shadow-md);
  }

  .results button {
    width: 100%;
    min-height: 58px;
    padding: 10px 13px;
    border: 0;
    border-bottom: 1px solid var(--line);
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    background: #fff;
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

  .results small {
    color: var(--muted);
  }

  .results button > span:last-child {
    color: var(--muted);
    font-size: 0.75rem;
    font-weight: 800;
  }

  .floor-controls {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 5px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: #eaf2f7;
  }

  .floor-controls button {
    min-height: 44px;
    border: 0;
    border-radius: 12px;
    background: transparent;
    color: var(--muted-strong);
    font-weight: 830;
  }

  .floor-controls button.active {
    background: #fff;
    color: var(--brand-blue-ink);
    box-shadow: var(--shadow-sm);
  }

  .map-card {
    padding: 11px;
    overflow: hidden;
  }

  .map-card__head {
    padding: 8px 7px 12px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: end;
  }

  .map-card__head h2 {
    margin: 3px 0 0;
    color: var(--ink-strong);
    font-size: 1.2rem;
  }

  .route-strip,
  .details,
  .directory {
    padding: 18px;
  }

  .route-strip {
    display: grid;
    gap: 12px;
  }

  .route-strip > div:first-child {
    display: grid;
    gap: 4px;
  }

  .route-strip strong {
    color: var(--ink-strong);
  }

  .route-floor-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .route-floor-buttons button {
    min-height: 40px;
    padding: 0 11px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: #fff;
    color: var(--muted-strong);
    font-weight: 780;
  }

  .route-floor-buttons button.active {
    border-color: #c4a300;
    background: var(--surface-yellow);
    color: #5f4d00;
  }

  .map-details-layout {
    display: grid;
    gap: 14px;
  }

  .details {
    display: grid;
    align-content: start;
    gap: 15px;
  }

  .details h2 {
    margin: 5px 0 1px;
    color: var(--ink-strong);
    font-size: 2rem;
    letter-spacing: -0.045em;
  }

  .details p {
    margin: 0;
    color: var(--muted);
    text-transform: capitalize;
  }

  .verify {
    font-size: 0.76rem;
    text-transform: none !important;
  }

  .directory {
    display: grid;
    gap: 12px;
  }

  .space-list {
    display: grid;
    gap: 6px;
  }

  .space-list button {
    min-height: 56px;
    padding: 9px 10px;
    border: 1px solid var(--line);
    border-radius: 13px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    background: #fff;
    color: var(--ink);
    text-align: left;
  }

  .space-list button.selected {
    border-color: rgb(0 119 184 / 0.35);
    background: var(--surface-blue);
  }

  .space-list button > span:first-child {
    display: grid;
    gap: 1px;
  }

  .space-list strong {
    color: var(--ink-strong);
  }

  .space-list small {
    color: var(--muted);
    text-transform: capitalize;
  }

  @media (min-width: 760px) {
    .route-strip {
      grid-template-columns: 1fr auto;
      align-items: center;
    }
  }

  @media (min-width: 960px) {
    .map-details-layout {
      grid-template-columns: minmax(0, 0.9fr) minmax(340px, 1.1fr);
    }
  }
</style>
