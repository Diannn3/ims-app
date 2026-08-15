<script lang="ts">
  import AcademicErrorState from '$lib/components/academic/AcademicErrorState.svelte';
  let { data } = $props();

  const kindLabel: Record<string, string> = {
    room: 'Rooms & facilities',
    course: 'Courses',
    faculty: 'Faculty',
    service: 'Academic services',
    research: 'Research areas',
    resource: 'Academic resources'
  };

  const kindOrder = ['room', 'course', 'faculty', 'service', 'research', 'resource'];
  const groupedResults = $derived(
    kindOrder
      .map((kind) => ({ kind, items: data.results.filter((result) => result.kind === kind) }))
      .filter((group) => group.items.length > 0)
  );
</script>

<svelte:head>
  <title>{data.query ? `Search: ${data.query} · IMS Academic Hub` : 'Search · IMS Academic Hub'}</title>
</svelte:head>

<div class="page search-page">
  <header class="search-heading">
    <span class="eyebrow">Universal search</span>
    <h1>Rooms and academics, one search.</h1>
    <p>
      Building results come from version-controlled navigation data. Academic results appear only
      when their institutional records are available through the published data layer.
    </p>
  </header>

  <form class="search-shell" method="GET" role="search">
    <label class="visually-hidden" for="search-page-input">Search IMS Academic Hub</label>
    <input
      id="search-page-input"
      type="search"
      name="q"
      value={data.query}
      placeholder="MB 304, Math Clinic, course code, or faculty name"
      autocomplete="off"
      enterkeyhint="search"
      maxlength="80"
    />
    <button type="submit">Search</button>
  </form>

  {#if data.query}
    <section class="results-section" aria-labelledby="search-results-title">
      <div class="results-summary">
        <div>
          <span class="kicker">Results</span>
          <h2 id="search-results-title">“{data.query}”</h2>
        </div>
        <span>{data.results.length} result{data.results.length === 1 ? '' : 's'}</span>
      </div>

      {#if data.repositoryStatus.configured && !data.repositoryStatus.available}
        <AcademicErrorState message="Room and facility results are still available, but academic search could not be loaded right now." />
      {/if}

      {#if data.results.length === 0 && data.repositoryStatus.available}
        <div class="search-empty">
          <span class="empty-marker" aria-hidden="true"></span>
          <div>
            <strong>Nothing published matched that search.</strong>
            <p>Try a room code such as “MB 304”, “Math Clinic”, or a shorter academic term.</p>
          </div>
        </div>
      {:else if data.results.length === 0}
        <div class="search-empty">
          <span class="empty-marker" aria-hidden="true"></span>
          <div>
            <strong>No building result matched that search.</strong>
            <p>
              Academic search is unavailable in this deployment, but room codes and mapped
              facilities can still be searched.
            </p>
          </div>
        </div>
      {:else}
        <div class="result-groups">
          {#each groupedResults as group}
            <section class="result-group" aria-labelledby={`result-group-${group.kind}`}>
              <div class="result-group__heading">
                <h3 id={`result-group-${group.kind}`}>{kindLabel[group.kind]}</h3>
                <span>{group.items.length}</span>
              </div>

              <div class="result-list">
                {#each group.items as result}
                  <a class="result-row" href={result.href}>
                    <span class="result-kind" aria-hidden="true">
                      {#if result.kind === 'room'}RM
                      {:else if result.kind === 'course'}CRS
                      {:else if result.kind === 'faculty'}FAC
                      {:else if result.kind === 'research'}RES
                      {:else if result.kind === 'resource'}DOC
                      {:else}SRV{/if}
                    </span>
                    <span class="result-copy">
                      <strong class:identifier={result.kind === 'room' || result.kind === 'course'}>{result.title}</strong>
                      <small>{result.subtitle}</small>
                    </span>
                    <span class="result-arrow" aria-hidden="true">→</span>
                  </a>
                {/each}
              </div>
            </section>
          {/each}
        </div>
      {/if}

      {#if !data.repositoryStatus.configured}
        <p class="search-note">
          Academic database not connected: room and facility search is active; course, faculty,
          and other institutional results remain intentionally unavailable.
        </p>
      {/if}
    </section>
  {:else}
    <section class="search-prompts" aria-labelledby="search-prompts-title">
      <div class="prompt-heading">
        <span class="kicker">Try searching</span>
        <h2 id="search-prompts-title">Start with a mapped place.</h2>
      </div>
      <div class="prompt-list">
        <a href="/search?q=MB%20304"><strong class="identifier">MB 304</strong><small>Room</small><span aria-hidden="true">→</span></a>
        <a href="/search?q=Math%20Clinic"><strong>Math Clinic</strong><small>Service · MB 209</small><span aria-hidden="true">→</span></a>
        <a href="/search?q=CR"><strong class="identifier">CR</strong><small>Facility alias</small><span aria-hidden="true">→</span></a>
        <a href="/search?q=MB%20102"><strong class="identifier">MB 102</strong><small>Math Lab</small><span aria-hidden="true">→</span></a>
      </div>
    </section>
  {/if}
</div>

<style>
  .search-page {
    display: grid;
    gap: 26px;
    padding-top: clamp(28px, 5vw, 48px);
  }

  .search-heading {
    max-width: 760px;
    display: grid;
    gap: 7px;
  }

  .search-heading h1 {
    max-width: 18ch;
    margin: 0;
    color: var(--ink-strong);
    font-size: clamp(2rem, 5vw, 3.25rem);
    line-height: 1;
    letter-spacing: -0.045em;
  }

  .search-heading p {
    max-width: 68ch;
    margin: 0;
    color: var(--muted-strong);
    line-height: 1.6;
  }

  .search-shell {
    width: min(820px, 100%);
    min-height: 52px;
    padding: 4px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 5px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-lg);
    background: var(--surface);
  }

  .search-shell:focus-within {
    border-color: var(--brand-blue-deep);
    box-shadow: var(--focus-ring);
  }

  .search-shell input {
    min-width: 0;
    min-height: 44px;
    padding: 0 11px;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ink-strong);
    font-size: 14px;
  }

  .search-shell input::placeholder {
    color: #748493;
  }

  .search-shell button {
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid var(--brand-blue-deep);
    border-radius: var(--radius-md);
    background: var(--brand-blue-deep);
    color: #fff;
    font-size: 12.5px;
    font-weight: 760;
  }

  .search-shell button:hover {
    background: var(--brand-blue-ink);
  }

  .results-section,
  .search-prompts {
    display: grid;
    gap: 20px;
  }

  .results-summary {
    min-height: 54px;
    padding-bottom: 10px;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: end;
    border-bottom: 1px solid var(--line-strong);
  }

  .results-summary h2,
  .prompt-heading h2 {
    margin: 3px 0 0;
    color: var(--ink-strong);
    font-size: 1.25rem;
    letter-spacing: -0.025em;
  }

  .results-summary > span {
    color: var(--muted);
    font-family: ui-monospace, monospace;
    font-size: 11px;
  }

  .result-groups {
    display: grid;
    gap: 30px;
  }

  .result-group {
    display: grid;
    gap: 0;
  }

  .result-group__heading {
    min-height: 40px;
    padding-bottom: 8px;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: end;
    border-bottom: 1px solid var(--line-strong);
  }

  .result-group__heading h3 {
    margin: 0;
    color: var(--muted-strong);
    font-size: 11px;
    font-weight: 780;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .result-group__heading span {
    color: var(--muted);
    font-family: ui-monospace, monospace;
    font-size: 10.5px;
  }

  .result-list {
    display: grid;
  }

  .result-row {
    min-height: 72px;
    padding: 10px 2px;
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--line);
    color: inherit;
    text-decoration: none;
  }

  .result-row:hover,
  .result-row:focus-visible {
    background: var(--surface-soft);
  }

  .result-kind {
    color: var(--muted);
    font-family: ui-monospace, monospace;
    font-size: 9.5px;
    font-weight: 760;
    letter-spacing: 0.04em;
  }

  .result-copy {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  .result-copy strong {
    color: var(--ink-strong);
    font-size: 14px;
  }

  .result-copy small {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.4;
  }

  .result-arrow {
    color: var(--brand-blue-ink);
    font-size: 17px;
  }

  .search-empty {
    position: relative;
    padding: 17px 0 17px 18px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }

  .empty-marker {
    width: 10px;
    height: 10px;
    margin-top: 3px;
    border: 2px solid #a28a00;
    border-radius: 50%;
    background: var(--brand-yellow);
  }

  .search-empty strong {
    color: var(--ink-strong);
    font-size: 13.5px;
  }

  .search-empty p {
    max-width: 64ch;
    margin: 4px 0 0;
    color: var(--muted);
    font-size: 12.5px;
    line-height: 1.5;
  }

  .search-note {
    margin: 0;
    padding-top: 12px;
    border-top: 1px solid var(--line);
    color: var(--muted);
    font-size: 11.5px;
    line-height: 1.5;
  }

  .prompt-heading {
    padding-bottom: 10px;
    border-bottom: 1px solid var(--line-strong);
  }

  .prompt-list {
    display: grid;
  }

  .prompt-list a {
    min-height: 64px;
    padding: 10px 2px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto auto;
    align-items: center;
    gap: 2px 14px;
    border-bottom: 1px solid var(--line);
    color: inherit;
    text-decoration: none;
  }

  .prompt-list a:hover,
  .prompt-list a:focus-visible {
    background: var(--surface-soft);
  }

  .prompt-list strong {
    color: var(--ink-strong);
    font-size: 13.5px;
  }

  .prompt-list small {
    color: var(--muted);
    font-size: 11.5px;
  }

  .prompt-list a > span {
    grid-column: 2;
    grid-row: 1 / -1;
    color: var(--brand-blue-ink);
    font-size: 17px;
  }

  @media (min-width: 700px) {
    .result-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .result-row:nth-child(2n) {
      padding-left: 18px;
      border-left: 1px solid var(--line);
    }

    .prompt-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .prompt-list a:nth-child(2n) {
      padding-left: 18px;
      border-left: 1px solid var(--line);
    }
  }
</style>
