<script lang="ts">
  import MapCanvas from '$lib/components/map/MapCanvas.svelte';
  import spacesData from '$lib/data/math-building/spaces.json';
  import graphData from '$lib/data/math-building/graph.json';
  import { findRoute } from '$lib/domain/navigation/a-star';
  import { splitRouteByFloor } from '$lib/domain/navigation/route-builder';
  import type { FloorId, GraphData } from '$lib/domain/navigation/types';

  const spaces = spacesData as any[];
  const graph = graphData as GraphData;
  const floorLabel: Record<FloorId, string> = { ground: 'Ground', second: '2nd', third: '3rd' };

  let floor: FloorId = 'ground';
  let selectedSpaceId: string | null = null;
  let query = '';
  let activeRoute: ReturnType<typeof findRoute> = null;

  $: selected = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  $: normalized = query.trim().toLowerCase().replaceAll(' ', '');
  $: results = normalized.length < 1 ? [] : spaces
    .filter((space) => {
      const hay = [space.name, space.subtitle, ...(space.aliases ?? [])]
        .filter(Boolean).join(' ').toLowerCase().replaceAll(' ', '');
      return hay.includes(normalized);
    })
    .slice(0, 7);
  $: segments = activeRoute ? splitRouteByFloor(graph, activeRoute) : [];
  $: routeNodeIdsForFloor = segments.find((segment) => segment.floor === floor)?.points.map((node) => node.id) ?? [];

  function selectSpace(id: string) {
    selectedSpaceId = id;
    const space = spaces.find((item) => item.id === id);
    if (space) floor = space.floor as FloorId;
    query = '';
    activeRoute = null;
  }

  function startRoute() {
    if (!selected?.doorNode) return;
    activeRoute = findRoute(graph, 'gf-main-entrance', selected.doorNode);
    if (activeRoute) floor = 'ground';
  }
</script>

<svelte:head><title>Building Map · Math Building Hub</title></svelte:head>

<main class="page map-page">
  <section class="intro">
    <span class="eyebrow">INDOOR EXPLORER</span>
    <h1>Math Building</h1>
    <p>Search a room or facility. The current route demo starts at the main ground-floor entrance.</p>
  </section>

  <section class="search-card card">
    <label for="room-search">Search the building</label>
    <input id="room-search" bind:value={query} placeholder="MB 304, Math Clinic, CR..." autocomplete="off" />
    {#if results.length}
      <div class="results">
        {#each results as result}
          <button on:click={() => selectSpace(result.id)}>
            <span><strong>{result.name}</strong>{#if result.subtitle}<small>{result.subtitle}</small>{/if}</span>
            <span>{floorLabel[result.floor as FloorId]}</span>
          </button>
        {/each}
      </div>
    {/if}
  </section>

  <div class="floor-tabs" role="tablist" aria-label="Floors">
    {#each ['ground','second','third'] as floorId}
      <button class:active={floor === floorId} on:click={() => floor = floorId as FloorId}>{floorLabel[floorId as FloorId]}</button>
    {/each}
  </div>

  <section class="map-card card">
    <MapCanvas {floor} {selectedSpaceId} routeNodeIds={routeNodeIdsForFloor} onSelect={selectSpace} />
  </section>

  {#if activeRoute && segments.length > 1}
    <section class="route-strip card">
      <strong>Route floors</strong>
      <div>
        {#each segments as segment, i}
          <button class:active={floor === segment.floor} on:click={() => floor = segment.floor}>
            {floorLabel[segment.floor]}{i < segments.length - 1 ? ' →' : ''}
          </button>
        {/each}
      </div>
    </section>
  {/if}

  {#if selected}
    <section class="details card">
      <div>
        <span class="eyebrow">{floorLabel[selected.floor as FloorId]} FLOOR</span>
        <h2>{selected.name}</h2>
        <p>{selected.subtitle ?? selected.kind.replace('-', ' ')}</p>
      </div>
      {#if selected.doorNode}
        <button class="route-button" on:click={startRoute}>Route from main entrance</button>
      {/if}
      <p class="verify">Prototype geometry: {selected.verificationStatus.replaceAll('-', ' ')}.</p>
    </section>
  {/if}
</main>

<style>
  .map-page { display: grid; gap: 14px; }
  .intro h1 { margin: 5px 0 4px; font-size: clamp(32px,7vw,54px); color: var(--navy); letter-spacing: -.04em; }
  .intro p { margin: 0; color: var(--muted); }
  .eyebrow { color: #9b6b00; font-size: 11px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
  .search-card { position: relative; padding: 12px; z-index: 10; }
  label { display: block; font-size: 12px; font-weight: 800; color: #606776; margin: 0 0 6px 4px; }
  input { width: 100%; border: 1px solid #d8d2c7; background: white; border-radius: 14px; padding: 13px 14px; outline: none; }
  input:focus { border-color: #172554; box-shadow: 0 0 0 3px rgba(23,37,84,.09); }
  .results { position: absolute; left: 12px; right: 12px; top: calc(100% - 4px); background: white; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; box-shadow: var(--shadow); }
  .results button { width: 100%; padding: 12px 14px; border: 0; border-bottom: 1px solid #eee9df; background: white; display: flex; justify-content: space-between; text-align: left; }
  .results small { display: block; color: var(--muted); margin-top: 2px; }
  .floor-tabs { display: grid; grid-template-columns: repeat(3,1fr); gap: 5px; background: #e9e5dc; padding: 5px; border-radius: 15px; }
  .floor-tabs button { border: 0; border-radius: 11px; padding: 10px; background: transparent; font-weight: 800; color: #666d7a; }
  .floor-tabs button.active { background: var(--navy); color: white; }
  .map-card { padding: 10px; overflow: hidden; }
  .details, .route-strip { padding: 18px; }
  .details h2 { font-size: 30px; color: var(--navy); margin: 4px 0 0; }
  .details p { color: var(--muted); margin: 2px 0; text-transform: capitalize; }
  .route-button { margin-top: 14px; width: 100%; border: 0; background: var(--navy); color: white; padding: 13px 16px; border-radius: 14px; font-weight: 800; }
  .verify { font-size: 12px; margin-top: 12px !important; text-transform: none !important; }
  .route-strip { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .route-strip div { display: flex; gap: 5px; }
  .route-strip button { border: 1px solid var(--line); border-radius: 999px; background: white; padding: 8px 10px; font-weight: 700; }
  .route-strip button.active { background: #fff1b8; border-color: #c98d00; }
</style>
