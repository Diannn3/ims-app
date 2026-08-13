<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
</script>

<svelte:head><title>Academic terms · IMS Academic Hub</title></svelte:head>
<header class="page-heading"><div><p class="eyebrow">Term control</p><h2>Academic terms</h2><p>Only one term can be current. Switching is performed atomically by the database.</p></div></header>

{#if form?.message}<div class="inline-alert error" role="alert">{form.message}</div>{/if}
{#if form?.created}<div class="inline-alert success" role="status">Academic term created.</div>{/if}
{#if form?.currentUpdated}<div class="inline-alert success" role="status">Current academic term updated.</div>{/if}

<div class="term-grid">
  <form class="surface-panel term-form" method="POST" action="?/create" use:enhance>
    <div><p class="eyebrow">Admin only</p><h3>Create a term</h3></div>
    <label class="field"><span>Stable term ID</span><input class="input" name="id" required placeholder="AY2627-1" /></label>
    <label class="field"><span>Academic year</span><input class="input" name="academicYear" required placeholder="2026-2027" /></label>
    <label class="field"><span>Term name</span><input class="input" name="termName" required placeholder="First Semester" /></label>
    <div class="date-grid"><label class="field"><span>Starts</span><input class="input" name="startsOn" type="date" /></label><label class="field"><span>Ends</span><input class="input" name="endsOn" type="date" /></label></div>
    <button class="button primary" type="submit">Create term</button>
  </form>

  <section class="surface-panel term-list" aria-labelledby="term-list-title">
    <div class="section-heading"><div><p class="eyebrow">Registry</p><h3 id="term-list-title">Terms</h3></div><span>{data.terms.length}</span></div>
    <div class="rows">
      {#each data.terms as term}
        <article>
          <div><strong>{term.academic_year} · {term.term_name}</strong><span>{term.id}{term.starts_on ? ` · ${term.starts_on}` : ''}</span></div>
          {#if term.is_current}<span class="current-pill">Current</span>{:else}<form method="POST" action="?/makeCurrent" use:enhance><input type="hidden" name="termId" value={term.id}/><button class="button secondary" type="submit">Make current</button></form>{/if}
        </article>
      {/each}
    </div>
  </section>
</div>

<style>
  .page-heading{margin-bottom:1rem}.page-heading h2{margin:.2rem 0;font-size:clamp(1.8rem,5vw,2.7rem);letter-spacing:-.04em}.page-heading p:not(.eyebrow){margin:0;color:var(--text-muted)}.inline-alert{margin-bottom:.75rem;padding:.7rem;border-radius:var(--radius-md)}.inline-alert.error{background:var(--danger-soft);color:var(--danger)}.inline-alert.success{background:var(--ims-green-soft);color:var(--ims-green-deep)}
  .term-grid{display:grid;gap:1rem;align-items:start}.term-form,.term-list{padding:1rem;display:grid;gap:.85rem}.term-form h3,.term-list h3{margin:.15rem 0}.date-grid{display:grid;gap:.65rem}.section-heading{display:flex;justify-content:space-between;gap:1rem;align-items:end}.section-heading>span{color:var(--text-muted)}.rows{display:grid}.rows article{min-height:68px;padding:.7rem 0;display:flex;align-items:center;justify-content:space-between;gap:1rem;border-top:1px solid var(--line-soft)}.rows article>div{display:grid;gap:.15rem}.rows span{color:var(--text-muted);font-size:.82rem}.current-pill{padding:.4rem .6rem;border-radius:999px;background:var(--ims-green-soft);color:var(--ims-green-deep)!important;font-weight:800}.rows .button{white-space:nowrap}
  @media(min-width:620px){.date-grid{grid-template-columns:1fr 1fr}}@media(min-width:900px){.term-grid{grid-template-columns:minmax(320px,.75fr) minmax(0,1.25fr)}}
</style>
