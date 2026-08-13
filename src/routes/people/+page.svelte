<script lang="ts">
  import FacultyCard from '$lib/components/faculty/FacultyCard.svelte';
  import AcademicEmptyState from '$lib/components/academic/AcademicEmptyState.svelte';
  import AcademicErrorState from '$lib/components/academic/AcademicErrorState.svelte';
  let { data } = $props();
</script>

<svelte:head>
  <title>Faculty · IMS Academic Hub</title>
  <meta name="description" content="Browse published faculty profiles and office information." />
</svelte:head>

<div class="page page-stack people-page">
  <section class="page-heading">
    <span class="eyebrow">People</span>
    <h1>Faculty, offices, and consultations.</h1>
    <p>
      This directory is designed to connect verified faculty information to physical offices and
      scheduled consultations without implying live presence.
    </p>
  </section>

  <form class="directory-search card" method="GET" role="search">
    <label class="field">
      <span>Search faculty</span>
      <div class="search-row">
        <input class="input" type="search" name="q" value={data.query} placeholder="Search by name or title" />
        <button class="button button--primary" type="submit">Search</button>
      </div>
    </label>
  </form>

  <section class="directory" aria-labelledby="faculty-list-title">
    <div class="section-header">
      <div>
        <span class="kicker">Published directory</span>
        <h2 id="faculty-list-title">{data.query ? `Results for “${data.query}”` : 'Faculty'}</h2>
      </div>
      <a class="button button--quiet" href="/consultations">Consultations →</a>
    </div>

    {#if !data.repositoryStatus.configured}
      <AcademicEmptyState
        title="Faculty data is not connected yet"
        message="The app will show verified faculty profiles here after an official source is configured."
      />
    {:else if !data.repositoryStatus.available}
      <AcademicErrorState message={data.repositoryStatus.message} />
    {:else if data.faculty.length === 0}
      <AcademicEmptyState
        title={data.query ? 'No published faculty matched that search' : 'No published faculty profiles yet'}
        message="Unverified or draft faculty records are intentionally excluded from the public directory."
      />
    {:else}
      <div class="faculty-grid">
        {#each data.faculty as faculty}
          <FacultyCard {faculty} />
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  .people-page,
  .directory {
    gap: 22px;
  }

  .directory-search {
    padding: 14px;
  }

  .search-row,
  .faculty-grid {
    display: grid;
    gap: 9px;
  }

  @media (min-width: 640px) {
    .search-row {
      grid-template-columns: 1fr auto;
    }
  }

  @media (min-width: 820px) {
    .faculty-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
