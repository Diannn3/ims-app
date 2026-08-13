<script lang="ts">
  let { data } = $props();

  const kindLabel: Record<string, string> = {
    room: 'Room / facility',
    course: 'Course',
    faculty: 'Faculty',
    service: 'Academic service',
    research: 'Research area',
    resource: 'Academic resource'
  };
</script>

<svelte:head>
  <title>{data.query ? `Search: ${data.query} · IMS Academic Hub` : 'Search · IMS Academic Hub'}</title>
</svelte:head>

<div class="page page-stack search-page">
  <section class="page-heading">
    <span class="eyebrow">Universal search</span>
    <h1>Search the building and academics together.</h1>
    <p>
      Room results come from version-controlled map data. Academic results appear only when a
      published institutional source is available.
    </p>
  </section>

  <form class="search-shell card" method="GET" role="search">
    <label class="field">
      <span>Search</span>
      <div class="search-row">
        <input
          class="input"
          type="search"
          name="q"
          value={data.query}
          placeholder="MB 304, Math Clinic, course code, or faculty name"
          autocomplete="off"
          enterkeyhint="search"
        />
        <button class="button button--primary" type="submit">Search</button>
      </div>
    </label>
  </form>

  {#if data.query}
    <section class="results-section" aria-labelledby="search-results-title">
      <div class="section-header">
        <div>
          <span class="kicker">Results</span>
          <h2 id="search-results-title">“{data.query}”</h2>
        </div>
        <span class="badge">{data.results.length} result{data.results.length === 1 ? '' : 's'}</span>
      </div>

      {#if data.results.length === 0}
        <div class="empty-state card card--flat">
          <span class="badge badge--yellow">No match</span>
          <h2>Nothing published matched that search.</h2>
          <p>Try a room code such as “MB 304”, “Math Clinic”, or a shorter academic search term.</p>
        </div>
      {:else}
        <div class="result-list">
          {#each data.results as result}
            <a class="result card" href={result.href}>
              <span class:room={result.kind === 'room'} class:course={result.kind === 'course'} class:faculty={result.kind === 'faculty'} class:service={result.kind === 'service'} class:research={result.kind === 'research'} class:resource={result.kind === 'resource'} class="result-icon">
                {#if result.kind === 'room'}M
                {:else if result.kind === 'course'}C
                {:else if result.kind === 'faculty'}P
                {:else if result.kind === 'research'}R
                {:else if result.kind === 'resource'}F
                {:else}S{/if}
              </span>
              <span class="result-copy">
                <span class="result-kind">{kindLabel[result.kind]}</span>
                <strong>{result.title}</strong>
                <small>{result.subtitle}</small>
              </span>
              <span class="result-arrow" aria-hidden="true">→</span>
            </a>
          {/each}
        </div>
      {/if}

      {#if !data.repositoryStatus.configured}
        <p class="search-note">
          Academic database not connected: room/facility search is active, while course and faculty
          results remain unavailable.
        </p>
      {/if}
    </section>
  {:else}
    <section class="search-prompts">
      <span class="kicker">Try searching</span>
      <div class="prompt-grid">
        <a class="card prompt" href="/search?q=MB%20304"><strong>MB 304</strong><small>Room</small></a>
        <a class="card prompt" href="/search?q=Math%20Clinic"><strong>Math Clinic</strong><small>Service</small></a>
        <a class="card prompt" href="/search?q=CR"><strong>CR</strong><small>Facility alias</small></a>
        <a class="card prompt" href="/search?q=MB%20102"><strong>MB 102</strong><small>Math Lab</small></a>
      </div>
    </section>
  {/if}
</div>

<style>
  .search-page,
  .results-section,
  .search-prompts {
    gap: 20px;
  }

  .search-shell {
    padding: 14px;
  }

  .search-row {
    display: grid;
    gap: 8px;
  }

  .result-list,
  .prompt-grid {
    display: grid;
    gap: 9px;
  }

  .result {
    min-height: 88px;
    padding: 13px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 13px;
    text-decoration: none;
  }

  .result:hover {
    border-color: #a9c8dc;
    box-shadow: var(--shadow-md);
  }

  .result-icon {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    background: var(--surface-blue);
    color: var(--brand-blue-ink);
    font-weight: 920;
  }

  .result-icon.course { background: var(--surface-yellow); color: #675400; }
  .result-icon.faculty { background: var(--surface-green); color: var(--brand-green-deep); }
  .result-icon.service { background: linear-gradient(145deg, var(--surface-blue), var(--surface-green)); }
  .result-icon.research { background: var(--surface-green); color: var(--brand-green-deep); }
  .result-icon.resource { background: #f4f0ff; color: #5b3d91; }

  .result-copy {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .result-kind {
    color: var(--muted);
    font-size: 0.68rem;
    font-weight: 820;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .result strong {
    color: var(--ink-strong);
    font-size: 1rem;
  }

  .result small {
    color: var(--muted);
    line-height: 1.35;
  }

  .result-arrow {
    color: var(--brand-blue-ink);
    font-size: 1.15rem;
  }

  .search-note {
    margin: 0;
    color: var(--muted);
    font-size: 0.82rem;
  }

  .prompt {
    min-height: 110px;
    padding: 16px;
    display: grid;
    align-content: end;
    gap: 3px;
    text-decoration: none;
  }

  .prompt strong { color: var(--ink-strong); }
  .prompt small { color: var(--muted); }

  @media (min-width: 640px) {
    .search-row {
      grid-template-columns: 1fr auto;
    }

    .prompt-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 920px) {
    .result-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .prompt-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
</style>
