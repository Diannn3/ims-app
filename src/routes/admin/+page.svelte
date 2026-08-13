<script lang="ts">
  let { data } = $props();
  const batches = $derived(data.batches ?? []);
  const ready = $derived(batches.filter((batch: any) => batch.status === 'ready').length);
  const failed = $derived(batches.filter((batch: any) => batch.status === 'validation_failed').length);
  const applied = $derived(batches.filter((batch: any) => batch.status === 'applied').length);
  const reviewItems = $derived(data.reviewItems ?? []);
  const needsReview = $derived(reviewItems.filter((item: any) => item.reviewStatus !== 'verified').length);
  const readyToPublish = $derived(reviewItems.filter((item: any) => item.reviewStatus === 'verified' && item.publicationStatus !== 'published').length);
</script>

<svelte:head><title>Data health · IMS Academic Hub</title></svelte:head>

<header class="page-heading">
  <div>
    <p class="eyebrow">Administration</p>
    <h2>Data health</h2>
    <p>Review the pipeline before anything becomes student-facing.</p>
  </div>
  <a class="button primary" href="/admin/imports">Stage a schedule</a>
</header>

<div class="metric-grid">
  <article class="metric-card surface-panel"><span>Ready imports</span><strong>{ready}</strong><small>validated batches</small></article>
  <article class="metric-card surface-panel"><span>Needs verification</span><strong>{needsReview}</strong><small>schedule sections</small></article>
  <article class="metric-card surface-panel"><span>Ready to publish</span><strong>{readyToPublish}</strong><small>admin publication gate</small></article>
  <article class="metric-card surface-panel"><span>Applied imports</span><strong>{applied}</strong><small>{failed} with validation errors</small></article>
</div>

<section class="surface-panel status-panel">
  <div class="status-head">
    <div><p class="eyebrow">Current milestone</p><h3>Academic Core · data-ready</h3></div>
    <span class="status-chip">Fixture mode until real data arrives</span>
  </div>
  <div class="health-list">
    <div><span class="health-dot partial"></span><div><strong>Building map</strong><p>Schematic map works; physical walkthrough still required.</p></div></div>
    <div><span class="health-dot good"></span><div><strong>Import boundary</strong><p>CSV rows are normalized and staged before any database mutation.</p></div></div>
    <div><span class:good={data.setup.sources.length > 0 && data.setup.terms.length > 0} class:partial={data.setup.sources.length === 0 || data.setup.terms.length === 0} class="health-dot"></span><div><strong>Reference setup</strong><p>{data.setup.sources.length} source{data.setup.sources.length === 1 ? '' : 's'} · {data.setup.terms.length} academic term{data.setup.terms.length === 1 ? '' : 's'} configured.</p></div></div>
    <div><span class:good={needsReview === 0} class:partial={needsReview > 0} class="health-dot"></span><div><strong>Publication review</strong><p>{needsReview === 0 ? 'No current-term schedules are waiting for verification.' : `${needsReview} schedule section${needsReview === 1 ? '' : 's'} still require verification.`}</p></div></div>
    <div><span class="health-dot partial"></span><div><strong>Academic data</strong><p>Production content remains intentionally empty until verified sources are provided.</p></div></div>
    <div><span class="health-dot good"></span><div><strong>Grade tools</strong><p>Private gradebooks remain local to the student's browser.</p></div></div>
  </div>
</section>

<style>
  .page-heading { display:flex; gap:1rem; justify-content:space-between; align-items:flex-end; margin-bottom:1.15rem; }
  .page-heading h2 { margin:.2rem 0; font-size:clamp(1.8rem,5vw,2.7rem); letter-spacing:-.04em; }
  .page-heading p:not(.eyebrow) { margin:0; color:var(--text-muted); }
  .metric-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.75rem; }
  .metric-card { padding:1rem; display:grid; gap:.25rem; }
  .metric-card span,.metric-card small { color:var(--text-muted); }
  .metric-card strong { font-size:2.2rem; letter-spacing:-.05em; }
  .status-panel { margin-top:1rem; padding:1.1rem; }
  .status-head { display:flex; gap:1rem; justify-content:space-between; align-items:center; }
  .status-head h3 { margin:.15rem 0 0; }
  .status-chip { padding:.45rem .65rem; border-radius:999px; background:var(--ims-yellow-soft); color:#635d00; font-size:.78rem; font-weight:800; }
  .health-list { display:grid; gap:.7rem; margin-top:1rem; }
  .health-list>div { display:grid; grid-template-columns:auto 1fr; gap:.7rem; align-items:start; padding:.8rem 0; border-top:1px solid var(--line-soft); }
  .health-list p { margin:.15rem 0 0; color:var(--text-muted); font-size:.9rem; }
  .health-dot { width:10px; height:10px; margin-top:.4rem; border-radius:999px; box-shadow:0 0 0 4px color-mix(in srgb,currentColor 12%,transparent); }
  .health-dot.good { color:var(--ims-green-deep); background:currentColor; }
  .health-dot.partial { color:#b58e00; background:currentColor; }
  @media (max-width:900px){ .metric-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media (max-width:680px){ .page-heading { align-items:stretch; flex-direction:column; } .metric-grid { grid-template-columns:1fr; } .status-head { align-items:flex-start; flex-direction:column; } }
</style>
