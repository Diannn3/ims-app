<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
</script>

<svelte:head><title>Data sources · IMS Academic Hub</title></svelte:head>

<header class="page-heading">
  <div><p class="eyebrow">Provenance</p><h2>Data sources</h2><p>Register the authority behind an import before academic records can reference it.</p></div>
</header>

<div class="source-grid">
  <form class="surface-panel source-form" method="POST" action="?/create" use:enhance>
    <div><p class="eyebrow">Admin only</p><h3>Register a source</h3></div>
    {#if form?.message}<div class="inline-alert" class:error={!form?.created} role={form?.created ? 'status' : 'alert'}>{form.message ?? 'Source registered.'}</div>{/if}
    {#if form?.created}<div class="inline-alert success" role="status">Source registered.</div>{/if}
    <label class="field"><span>Label</span><input class="input" name="label" required placeholder="IMS official class schedule" /></label>
    <label class="field"><span>Source type</span><select class="select" name="sourceType" required><option value="">Choose type</option><option value="official_web">Official website</option><option value="official_sheet">Official sheet</option><option value="official_csv">Official CSV</option><option value="faculty_entry">Faculty entry</option><option value="admin_entry">Admin entry</option><option value="verified_report">Verified report</option><option value="other">Other</option></select></label>
    <label class="field"><span>Authority</span><input class="input" name="authority" placeholder="Institute of Mathematical Sciences" /></label>
    <label class="field"><span>HTTPS source URL</span><input class="input" name="sourceUrl" type="url" inputmode="url" placeholder="https://…" /></label>
    <label class="field"><span>Internal notes</span><textarea class="textarea" name="notes" placeholder="Private reviewer notes. Never exposed by the public source view."></textarea></label>
    <button class="button primary" type="submit">Register source</button>
  </form>

  <section class="surface-panel source-list" aria-labelledby="source-list-title">
    <div class="section-heading"><div><p class="eyebrow">Safe public metadata</p><h3 id="source-list-title">Registered sources</h3></div><span>{data.sources.length}</span></div>
    {#if data.sources.length}
      <div class="rows">
        {#each data.sources as source}
          <article>
            <div><strong>{source.label}</strong><span>{source.authority ?? source.source_type.replaceAll('_', ' ')}</span></div>
            {#if source.source_url}<a href={source.source_url} target="_blank" rel="noreferrer">Source ↗</a>{/if}
          </article>
        {/each}
      </div>
    {:else}<p class="empty">No sources registered yet.</p>{/if}
  </section>
</div>

<style>
  .page-heading{margin-bottom:1rem}.page-heading h2{margin:.2rem 0;font-size:clamp(1.8rem,5vw,2.7rem);letter-spacing:-.04em}.page-heading p:not(.eyebrow){margin:0;color:var(--text-muted)}
  .source-grid{display:grid;gap:1rem;align-items:start}.source-form,.source-list{padding:1rem;display:grid;gap:.85rem}.source-form h3,.source-list h3{margin:.15rem 0}.inline-alert{padding:.7rem;border-radius:var(--radius-md);background:var(--surface-subtle)}.inline-alert.error{background:var(--danger-soft);color:var(--danger)}.inline-alert.success{background:var(--ims-green-soft);color:var(--ims-green-deep)}
  .section-heading{display:flex;justify-content:space-between;gap:1rem;align-items:end}.section-heading>span{color:var(--text-muted)}.rows{display:grid}.rows article{min-height:64px;padding:.7rem 0;display:flex;justify-content:space-between;gap:1rem;align-items:center;border-top:1px solid var(--line-soft)}.rows article>div{display:grid;gap:.15rem}.rows span{color:var(--text-muted);font-size:.82rem;text-transform:capitalize}.rows a{color:var(--ims-blue-ink);font-weight:750}.empty{color:var(--text-muted)}
  @media(min-width:900px){.source-grid{grid-template-columns:minmax(320px,.75fr) minmax(0,1.25fr)}}
</style>
