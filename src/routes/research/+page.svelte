<script lang="ts">
  import AcademicEmptyState from '$lib/components/academic/AcademicEmptyState.svelte';
  import SourceBadge from '$lib/components/academic/SourceBadge.svelte';
  let { data } = $props();
</script>

<svelte:head>
  <title>Research · IMS Academic Hub</title>
  <meta name="description" content="Explore published IMS research areas and related faculty." />
</svelte:head>

<div class="page page-stack research-page">
  <section class="page-heading">
    <span class="eyebrow">Research explorer</span>
    <h1>Find people through the mathematics they work on.</h1>
    <p>Research areas connect published faculty profiles without implying adviser availability or accepting students.</p>
  </section>

  {#if !data.repositoryStatus.configured}
    <AcademicEmptyState
      title="Research data is not connected yet"
      message="Published research metadata will appear after the academic repository is configured."
      actionHref="/academics"
      actionLabel="Back to academics"
    />
  {:else if data.areas.length === 0}
    <AcademicEmptyState
      title="No published research areas yet"
      message="The production app intentionally hides unverified research metadata."
    />
  {:else}
    <section class="area-grid" aria-label="Published research areas">
      {#each data.areas as area}
        <article class="research-card card" id={`research-${area.slug}`}>
          <div class="research-head">
            <span class="badge badge--green">Research area</span>
            <h2>{area.name}</h2>
            {#if area.description}<p>{area.description}</p>{/if}
          </div>

          <div class="faculty-block">
            <span class="kicker">Related faculty</span>
            {#if area.faculty.length}
              <div class="faculty-links">
                {#each area.faculty as faculty}
                  <a href={`/faculty/${faculty.slug}`}>
                    <strong>{faculty.displayName}</strong>
                    {#if faculty.title}<span>{faculty.title}</span>{/if}
                  </a>
                {/each}
              </div>
            {:else}
              <p class="muted">No published faculty relationship is available yet.</p>
            {/if}
          </div>

          <SourceBadge
            label={area.meta.sourceLabel}
            url={area.meta.sourceUrl}
            lastVerifiedAt={area.meta.lastVerifiedAt}
          />
        </article>
      {/each}
    </section>
  {/if}
</div>

<style>
  .research-page { gap: 28px; }
  .area-grid { display:grid; gap:12px; }
  .research-card { padding:20px; display:grid; gap:20px; container-type:inline-size; }
  .research-head { display:grid; gap:8px; }
  .research-head h2 { margin:0; color:var(--ink-strong); font-size:clamp(1.35rem,4vw,1.8rem); letter-spacing:-.035em; }
  .research-head p { margin:0; color:var(--muted); line-height:1.6; }
  .faculty-block { display:grid; gap:9px; }
  .faculty-links { display:grid; gap:7px; }
  .faculty-links a { min-height:48px; padding:10px 12px; display:grid; gap:2px; border:1px solid var(--line); border-radius:var(--radius-sm); background:var(--surface-soft); text-decoration:none; }
  .faculty-links strong { color:var(--brand-blue-ink); }
  .faculty-links span { color:var(--muted); font-size:.82rem; }
  @media (min-width:760px){ .area-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
</style>
