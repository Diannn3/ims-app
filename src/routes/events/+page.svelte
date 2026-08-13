<script lang="ts">
  import AcademicEmptyState from '$lib/components/academic/AcademicEmptyState.svelte';
  import SourceBadge from '$lib/components/academic/SourceBadge.svelte';
  let { data } = $props();
  const dt = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' });
</script>

<svelte:head><title>Academic events · IMS Academic Hub</title></svelte:head>

<div class="page page-stack events-page">
  <section class="page-heading">
    <span class="eyebrow">Events</span>
    <h1>Academic events connected to the rooms where they happen.</h1>
    <p>Published seminars, colloquia, and institute activities can link directly into the building map.</p>
  </section>

  {#if !data.repositoryStatus.configured}
    <AcademicEmptyState title="Event data is not connected yet" message="No public academic repository is configured." />
  {:else if data.events.length === 0}
    <AcademicEmptyState title="No published events yet" message="Only verified event records are displayed." />
  {:else}
    <section class="event-grid" aria-label="Published academic events">
      {#each data.events as event}
        <article class="event-card card">
          <div class="event-time"><span class="badge badge--yellow">Event</span><time datetime={event.startsAt}>{dt.format(new Date(event.startsAt))}</time></div>
          <div class="event-copy">
            <h2>{event.title}</h2>
            {#if event.description}<p>{event.description}</p>{/if}
            {#if event.organizer}<span class="muted">{event.organizer}</span>{/if}
          </div>
          <div class="event-actions cluster">
            {#if event.spaceId}<a class="button button--primary" href={`/room/${event.spaceId}`}>Open room</a>{/if}
            {#if event.officialUrl}<a class="button button--secondary" href={event.officialUrl} target="_blank" rel="noreferrer">Official details ↗</a>{/if}
          </div>
          <SourceBadge label={event.meta.sourceLabel} url={event.meta.sourceUrl} lastVerifiedAt={event.meta.lastVerifiedAt} />
        </article>
      {/each}
    </section>
  {/if}
</div>

<style>
  .event-grid { display:grid; gap:12px; }
  .event-card { padding:20px; display:grid; gap:15px; }
  .event-time { display:flex; flex-wrap:wrap; gap:9px; align-items:center; color:var(--muted-strong); font-size:.86rem; font-weight:760; }
  .event-copy h2 { margin:0; color:var(--ink-strong); font-size:clamp(1.3rem,4vw,1.7rem); letter-spacing:-.03em; }
  .event-copy p { margin:7px 0; color:var(--muted); line-height:1.55; }
  @media (min-width:760px){ .event-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
</style>
