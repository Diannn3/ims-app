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
  const startNode =
    graph.nodes.find((node) => node.id === requestedStartNodeId) ??
    graph.nodes.find((node) => node.id === 'gf-main-entrance')!;
  const startAnchor = getLocationAnchorByNode(startNode.id);

  let floor = $state<FloorId>(initialSpace?.floor ?? 'ground');
  let selectedSpaceId = $state<string | null>(initialSpace?.id ?? null);
  let query = $state('');
  let mobileSheetExpanded = $state(false);
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
  const currentSegmentIndex = $derived(segments.findIndex((segment) => segment.floor === floor));
  const routeNodeIdsForFloor = $derived(
    currentSegmentIndex >= 0 ? segments[currentSegmentIndex].points.map((node) => node.id) : []
  );
  const floorSpaces = $derived(spaces.filter((space) => space.floor === floor));

  function selectSpace(id: string) {
    selectedSpaceId = id;
    const space = spaces.find((item) => item.id === id);
    if (space) floor = space.floor;
    query = '';
    activeRoute = null;
    mobileSheetExpanded = false;
  }

  function chooseFloor(nextFloor: FloorId) {
    floor = nextFloor;
    mobileSheetExpanded = false;
  }

  function startRoute() {
    if (!selected?.doorNode) return;
    activeRoute = findRoute(graph, startNode.id, selected.doorNode);
    if (activeRoute) floor = startNode.floor;
    mobileSheetExpanded = false;
  }

  function clearRoute() {
    activeRoute = null;
    if (selected) floor = selected.floor;
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
        Search a room, inspect a floor, or build a prototype route from
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
          onclick={() => chooseFloor(floorId)}
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
          <span class="kicker">Reference-matched schematic</span>
          <h2 id="map-floor-title">{floorDisplayName(floor)}</h2>
        </div>
        <span class="verification-status">
          <span aria-hidden="true"></span>
          Site verification pending
        </span>
      </div>

      <MapViewport
        {floor}
        {selectedSpaceId}
        routeNodeIds={routeNodeIdsForFloor}
        routeSegmentIndex={Math.max(0, currentSegmentIndex)}
        routeSegmentCount={Math.max(1, segments.length)}
        onSelect={selectSpace}
      />

      {#if activeRoute}
        <div class="route-strip" aria-label="Active route floor segments">
          <div class="route-strip__summary">
            <span class="route-mark" aria-hidden="true"></span>
            <span>
              {segments.length > 1
                ? `Route crosses ${segments.length} floors`
                : `Route shown on ${floorDisplayName(floor)}`}
            </span>
            <button type="button" onclick={clearRoute}>Clear</button>
          </div>

          {#if segments.length > 1}
            <div class="route-floor-buttons">
              {#each segments as segment, index}
                <button
                  type="button"
                  class:active={floor === segment.floor}
                  aria-pressed={floor === segment.floor}
                  onclick={() => chooseFloor(segment.floor)}
                >
                  <small>Step {index + 1}</small>
                  <strong>{floorLabels[segment.floor]}</strong>
                  {#if index < segments.length - 1}<span aria-hidden="true">↕</span>{/if}
                </button>
              {/each}
            </div>
          {/if}
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

  <section
    class:selected
    class:expanded={mobileSheetExpanded}
    class="destination-panel"
    aria-live="polite"
    aria-label="Selected destination"
  >
    {#if selected}
      <button
        class="sheet-toggle"
        type="button"
        aria-expanded={mobileSheetExpanded}
        aria-label={mobileSheetExpanded ? 'Collapse selected place details' : 'Expand selected place details'}
        onclick={() => (mobileSheetExpanded = !mobileSheetExpanded)}
      >
        <span aria-hidden="true"></span>
      </button>

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
            {activeRoute ? 'Rebuild route' : 'Directions'}
          </button>
        {/if}
      </div>
    {:else}
      <div class="destination-empty">
        <span class="destination-marker" aria-hidden="true"></span>
        <div>
          <strong>Select a destination</strong>
          <p>Tap a room, use search, or open the floor directory.</p>
        </div>
      </div>
    {/if}
  </section>
</div>

<style>
  .map-page {
    display: grid;
    gap: 14px;
    padding-top: 18px;
  }

  .map-heading {
    display: grid;
    gap: 14px;
    align-items: end;
  }

  .map-heading__copy {
    display: grid;
    gap: 5px;
  }

  .map-heading h1 {
    margin: 0;
    font-size: clamp(1.8rem, 4vw, 2.55rem);
    line-height: 1.02;
    letter-spacing: -0.04em;
  }

  .map-heading p {
    max-width: 64ch;
    margin: 0;
    color: var(--muted-strong);
    font-size: 12.5px;
    line-height: 1.5;
  }

  .map-heading p strong { color: var(--ink-strong); }

  .map-origin {
    min-height: 46px;
    padding: 7px 0;
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

  .map-origin small,
  .route-floor-buttons small {
    color: var(--muted);
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  .map-origin strong {
    color: var(--ink-strong);
    font-size: 12px;
  }

  .map-origin a {
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    color: var(--brand-blue-ink);
    font-size: 11.5px;
    font-weight: 720;
    text-underline-offset: 3px;
  }

  .map-command-bar {
    position: relative;
    z-index: 20;
    display: grid;
    gap: 7px;
  }

  .map-search-wrap { position: relative; }

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
  .results button:focus-visible { background: var(--surface-blue); }
  .results button:last-child { border-bottom: 0; }

  .results button > span:first-child {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .results strong { color: var(--ink-strong); font-size: 13px; }
  .results small { color: var(--muted); font-size: 11.5px; }
  .results button > span:last-child { color: var(--muted-strong); font-size: 10.5px; font-weight: 760; }

  .floor-controls {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--surface-subtle);
  }

  .floor-controls button {
    min-height: 43px;
    border: 0;
    border-left: 1px solid var(--line);
    background: transparent;
    color: var(--muted-strong);
    font-size: 12px;
    font-weight: 740;
  }

  .floor-controls button:first-child { border-left: 0; }

  .floor-controls button.active {
    background: var(--surface);
    color: var(--brand-blue-ink);
    box-shadow: inset 0 -3px 0 var(--brand-yellow);
  }

  .map-workspace { min-width: 0; }

  .map-stage {
    min-width: 0;
    padding: 9px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-lg);
    background: var(--surface);
  }

  .map-stage__head {
    min-height: 46px;
    padding: 1px 2px 8px;
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: end;
  }

  .map-stage__head h2 {
    margin: 2px 0 0;
    font-size: 1.08rem;
    letter-spacing: -0.02em;
  }

  .verification-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--warning);
    font-size: 10px;
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
    padding: 10px 2px 1px;
    display: grid;
    gap: 8px;
  }

  .route-strip__summary {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    color: var(--muted-strong);
    font-size: 11.5px;
    font-weight: 700;
  }

  .route-strip__summary button {
    min-height: 36px;
    padding: 0 8px;
    border: 0;
    background: transparent;
    color: var(--brand-blue-ink);
    font-size: 10.5px;
    font-weight: 750;
  }

  .route-mark {
    width: 28px;
    height: 0;
    border-top: 4px solid var(--brand-green);
    box-shadow: 0 -1px 0 #fff, 0 1px 0 #fff;
  }

  .route-floor-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .route-floor-buttons button {
    min-height: 44px;
    padding: 5px 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    display: grid;
    grid-template-columns: auto auto;
    gap: 0 7px;
    align-items: center;
    background: var(--surface);
    color: var(--muted-strong);
    text-align: left;
  }

  .route-floor-buttons small { grid-column: 1 / -1; }
  .route-floor-buttons strong { color: var(--ink-strong); font-size: 12px; }
  .route-floor-buttons span { color: var(--brand-green-deep); }

  .route-floor-buttons button.active {
    border-color: var(--brand-blue-deep);
    background: var(--surface-blue);
    box-shadow: inset 0 -3px 0 var(--brand-yellow);
  }

  .directory { min-width: 0; }
  .directory--desktop { display: none; }

  .directory--mobile {
    border-top: 1px solid var(--line-strong);
    border-bottom: 1px solid var(--line-strong);
  }

  .directory--mobile summary {
    min-height: 52px;
    padding: 7px 1px;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    cursor: pointer;
    list-style: none;
  }

  .directory--mobile summary::-webkit-details-marker { display: none; }

  .directory--mobile summary > span:first-child {
    display: grid;
    gap: 2px;
  }

  .directory--mobile summary strong { color: var(--ink-strong); font-size: 13px; }
  .directory--mobile summary small { color: var(--muted); font-size: 11px; }
  .directory--mobile[open] summary > span:last-child { transform: rotate(45deg); }

  .directory__heading {
    min-height: 48px;
    padding-bottom: 8px;
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid var(--line);
  }

  .directory__heading h2 { margin: 2px 0 0; font-size: 1rem; letter-spacing: -0.02em; }
  .directory__heading > span { color: var(--muted); font-family: ui-monospace, monospace; font-size: 11px; }

  .space-list { display: grid; }

  .space-list button {
    width: 100%;
    min-height: 52px;
    padding: 8px 4px;
    border: 0;
    border-bottom: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    background: transparent;
    color: var(--ink);
    text-align: left;
  }

  .space-list button:last-child { border-bottom: 0; }
  .space-list button:hover, .space-list button:focus-visible { background: var(--surface-blue); }
  .space-list button.selected { background: var(--surface-yellow); }

  .space-list button > span:first-child {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .space-list strong { color: var(--ink-strong); font-size: 12.5px; }
  .space-list small { color: var(--muted); font-size: 10.5px; text-transform: capitalize; }

  .destination-panel {
    min-height: 66px;
    padding: 12px 0;
    border-top: 1px solid var(--line-strong);
    display: grid;
    gap: 10px;
    background: var(--page-field);
  }

  .destination-panel.selected {
    padding: 12px;
    border: 1px solid var(--line-strong);
    border-left: 4px solid var(--brand-yellow);
    border-radius: var(--radius-lg);
    background: var(--surface);
  }

  .sheet-toggle { display: none; }

  .destination-main {
    display: grid;
    gap: 8px;
  }

  .destination-main > div { display: grid; gap: 2px; }
  .destination-main h2 { margin: 0; font-size: 1.12rem; }
  .destination-main p { margin: 0; color: var(--muted-strong); font-size: 11.5px; text-transform: capitalize; }
  .destination-verification { color: var(--muted) !important; font-size: 10.5px !important; }

  .destination-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .destination-actions .button { min-height: 42px; }

  .destination-empty {
    min-height: 50px;
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .destination-marker {
    width: 15px;
    height: 15px;
    flex: none;
    border: 3px solid #fff;
    border-radius: 50%;
    background: var(--brand-yellow);
    box-shadow: 0 0 0 1px var(--brand-blue-ink);
  }

  .destination-empty strong { color: var(--ink-strong); font-size: 12.5px; }
  .destination-empty p { margin: 2px 0 0; color: var(--muted); font-size: 11px; }

  @media (min-width: 760px) {
    .map-command-bar {
      grid-template-columns: minmax(0, 1fr) 270px;
      align-items: start;
    }

    .map-heading {
      grid-template-columns: minmax(0, 1fr) minmax(280px, 0.44fr);
    }
  }

  @media (min-width: 1020px) {
    .map-workspace {
      display: grid;
      grid-template-columns: 220px minmax(0, 1fr);
      gap: 10px;
      align-items: stretch;
    }

    .directory--desktop {
      padding: 9px 10px;
      border: 1px solid var(--line-strong);
      border-radius: var(--radius-lg);
      display: block;
      background: var(--surface);
    }

    .directory--desktop .space-list {
      max-height: min(690px, 72svh);
      overflow: auto;
      scrollbar-color: var(--line-dark) transparent;
    }

    .directory--mobile { display: none; }

    .destination-panel.selected {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
    }

    .destination-main {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
    }

    .destination-verification { text-align: right; }
  }

  @media (max-width: 759px) {
    .map-page {
      gap: 10px;
      padding-top: 10px;
    }

    .map-heading { gap: 8px; }
    .map-heading__copy p { display: none; }
    .map-heading h1 { font-size: 1.55rem; }

    .map-origin {
      min-height: 42px;
      padding-block: 4px;
    }

    .map-command-bar {
      position: sticky;
      top: calc(var(--header-height) + 5px);
      z-index: 35;
      padding: 6px;
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      background: rgb(245 248 251 / 0.94);
      box-shadow: var(--shadow-sm);
    }

    @supports (backdrop-filter: blur(10px)) {
      .map-command-bar {
        background: rgb(245 248 251 / 0.88);
        backdrop-filter: blur(10px);
      }
    }

    .map-stage {
      padding: 5px;
      border-radius: 16px;
    }

    .map-stage__head {
      min-height: 38px;
      padding: 1px 2px 5px;
    }

    .map-stage__head .kicker,
    .verification-status {
      display: none;
    }

    .map-stage__head h2 { font-size: 0.98rem; }

    .route-strip { padding-inline: 4px; }

    .destination-panel.selected {
      position: sticky;
      bottom: calc(var(--mobile-nav-height) + env(safe-area-inset-bottom) + 8px);
      z-index: 30;
      margin-inline: 3px;
      padding: 12px 12px 10px;
      border-left-width: 1px;
      border-top: 4px solid var(--brand-yellow);
      box-shadow: 0 -12px 30px rgb(8 31 49 / 0.16);
    }

    .sheet-toggle {
      width: 56px;
      height: 18px;
      margin: -8px auto -2px;
      border: 0;
      display: grid;
      place-items: center;
      background: transparent;
    }

    .sheet-toggle span {
      width: 32px;
      height: 4px;
      border-radius: 999px;
      background: var(--line-dark);
    }

    .destination-panel.selected:not(.expanded) .destination-verification,
    .destination-panel.selected:not(.expanded) .destination-actions .button--secondary {
      display: none;
    }

    .destination-panel.selected:not(.expanded) .destination-main p:not(.destination-verification) {
      max-width: 38ch;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .destination-actions {
      display: grid;
      grid-template-columns: 1fr;
    }

    .destination-panel.expanded .destination-actions {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .destination-panel.expanded .destination-main {
      gap: 10px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .directory--mobile summary > span:last-child { transition: none; }
  }
</style>
