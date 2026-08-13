<script lang="ts">
  import AcademicEmptyState from '$lib/components/academic/AcademicEmptyState.svelte';
  import SourceBadge from '$lib/components/academic/SourceBadge.svelte';
  let { data } = $props();

  function groupByCategory(items: typeof data.resources) {
    const groups = new Map<string, typeof data.resources>();
    for (const item of items) {
      const key = item.category || 'Other';
      const values = groups.get(key) ?? [];
      values.push(item);
      groups.set(key, values);
    }
    return [...groups.entries()];
  }
</script>

<svelte:head><title>Academic resources · IMS Academic Hub</title></svelte:head>

<div class="page page-stack resources-page">
  <section class="page-heading">
    <span class="eyebrow">Official resources</span>
    <h1>Forms, templates, and academic links.</h1>
    <p>The hub points back to authoritative resources instead of maintaining unofficial copies that can go stale.</p>
  </section>

  {#if !data.repositoryStatus.configured}
    <AcademicEmptyState title="Resources are not connected yet" message="No public academic repository is configured in this deployment." />
  {:else if data.resources.length === 0}
    <AcademicEmptyState title="No published resources yet" message="Only verified official links are shown here." />
  {:else}
    <div class="resource-groups">
      {#each groupByCategory(data.resources) as [category, items]}
        <section class="resource-group" aria-labelledby={`resource-${category}`}>
          <div class="section-header">
            <div><span class="kicker">Category</span><h2 id={`resource-${category}`}>{category}</h2></div>
            <span class="badge">{items.length}</span>
          </div>
          <div class="resource-list">
            {#each items as resource}
              <article class="resource-card card" id={`resource-${resource.slug}`}>
                <div>
                  <h3>{resource.title}</h3>
                  {#if resource.description}<p>{resource.description}</p>{/if}
                </div>
                <SourceBadge
                  label={resource.meta.sourceLabel}
                  url={resource.meta.sourceUrl}
                  lastVerifiedAt={resource.lastCheckedAt}
                  freshnessLabel="Checked"
                />
                <a class="button button--secondary" href={resource.officialUrl} target="_blank" rel="noreferrer">Open official resource ↗</a>
              </article>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {/if}
</div>

<style>
  .resources-page,.resource-groups,.resource-group,.resource-list { display:grid; gap:16px; }
  .resource-card { padding:18px; display:grid; gap:14px; }
  .resource-card h3 { margin:0; color:var(--ink-strong); }
  .resource-card p { margin:6px 0 0; color:var(--muted); line-height:1.55; }
  .resource-card .button { justify-self:start; }
  @media (min-width:760px){ .resource-list { grid-template-columns:repeat(2,minmax(0,1fr)); } }
</style>
