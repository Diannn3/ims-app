<script lang="ts">
  import AcademicEmptyState from '$lib/components/academic/AcademicEmptyState.svelte';
  import AcademicErrorState from '$lib/components/academic/AcademicErrorState.svelte';
  import SourceBadge from '$lib/components/academic/SourceBadge.svelte';
  let { data } = $props();

  const dateFormatter = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatDate = (value: string) => dateFormatter.format(new Date(`${value}T00:00:00+08:00`));
</script>

<svelte:head><title>Academic calendar · IMS Academic Hub</title></svelte:head>

<div class="page page-stack calendar-page">
  <section class="page-heading">
    <span class="eyebrow">Academic calendar</span>
    <h1>Important dates, with their source attached.</h1>
    <p>This is an information layer over published dates—not a replacement for the Registrar's authoritative calendar.</p>
  </section>

  {#if !data.repositoryStatus.configured}
    <AcademicEmptyState title="Calendar data is not connected yet" message="No academic repository is configured in this deployment." />
  {:else if !data.repositoryStatus.available}
    <AcademicErrorState message={data.repositoryStatus.message} />
  {:else if data.dates.length === 0}
    <AcademicEmptyState title="No published academic dates yet" message="Dates appear only after their source has been reviewed and published." />
  {:else}
    <ol class="date-list">
      {#each data.dates as item}
        <li class="date-card card">
          <time datetime={item.startsOn} class="date-block">
            <strong>{formatDate(item.startsOn)}</strong>
            {#if item.endsOn}<span>to {formatDate(item.endsOn)}</span>{/if}
          </time>
          <div class="date-copy">
            {#if item.category}<span class="badge badge--blue">{item.category}</span>{/if}
            <h2>{item.title}</h2>
            <SourceBadge label={item.meta.sourceLabel} url={item.meta.sourceUrl} lastVerifiedAt={item.meta.lastVerifiedAt} />
          </div>
          {#if item.officialUrl}<a class="button button--quiet" href={item.officialUrl} target="_blank" rel="noreferrer">Official source ↗</a>{/if}
        </li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  .date-list { list-style:none; padding:0; margin:0; display:grid; gap:10px; }
  .date-card { padding:16px; display:grid; gap:14px; align-items:center; }
  .date-block { display:grid; gap:2px; color:var(--brand-blue-ink); }
  .date-block span { color:var(--muted); font-size:.8rem; }
  .date-copy { min-width:0; display:grid; gap:7px; }
  .date-copy h2 { margin:0; font-size:1.1rem; color:var(--ink-strong); }
  @media (min-width:720px){ .date-card { grid-template-columns:170px minmax(0,1fr) auto; } }
</style>
