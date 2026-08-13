<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
  let staging = $state(false);

  const sourceLabel = (id: string | null) => data.setup.sources.find((source: any) => source.id === id)?.label ?? 'Source';
  const termLabel = (id: string | null) => {
    const term = data.setup.terms.find((item: any) => item.id === id);
    return term ? `${term.academicYear} · ${term.termName}` : 'Term';
  };
</script>

<svelte:head><title>Schedule imports · IMS Academic Hub</title></svelte:head>

<header class="page-heading">
  <div>
    <p class="eyebrow">Data ingestion</p>
    <h2>Schedule imports</h2>
    <p>Nothing here writes directly to student-facing schedules. Every row is normalized, validated, staged, and reviewed first.</p>
  </div>
</header>

{#if data.setup.sources.length === 0 || data.setup.terms.length === 0}
  <aside class="setup-gate surface-panel" role="status" aria-labelledby="setup-gate-title">
    <div class="setup-gate__mark" aria-hidden="true">!</div>
    <div>
      <p class="eyebrow">Setup required</p>
      <h3 id="setup-gate-title">Add the reference data before staging a schedule.</h3>
      <p>
        {#if data.setup.sources.length === 0 && data.setup.terms.length === 0}
          This workspace has no data sources or academic terms yet.
        {:else if data.setup.sources.length === 0}
          This workspace has no approved data source yet.
        {:else}
          This workspace has no academic term yet.
        {/if}
      </p>
      <div class="setup-gate__actions">
        {#if data.setup.sources.length === 0}<a class="button secondary" href="/admin/sources">Add data source</a>{/if}
        {#if data.setup.terms.length === 0}<a class="button secondary" href="/admin/terms">Add academic term</a>{/if}
      </div>
    </div>
  </aside>
{/if}

<section class="import-grid">
  <form
    class="surface-panel upload-card"
    method="POST"
    action="?/stage"
    enctype="multipart/form-data"
    use:enhance={() => {
      staging = true;
      return async ({ update }) => { staging = false; await update(); };
    }}
  >
    <div class="upload-icon" aria-hidden="true">CSV</div>
    <div>
      <p class="eyebrow">New import</p>
      <h3>Stage a class schedule</h3>
      <p class="muted">UTF-8 CSV · max 2 MB · max 5,000 data rows</p>
    </div>

    {#if form?.stageError}
      <div class="inline-alert error" role="alert">{form.stageError}</div>
    {/if}

    {#if form?.headerIssues?.length}
      <div class="issue-stack" aria-label="Header problems">
        {#each form.headerIssues as issue}
          <div><strong>{issue.code}</strong><span>{issue.message}</span></div>
        {/each}
      </div>
    {/if}

    <label class="field">
      <span>Official data source</span>
      <select name="sourceId" required>
        <option value="">Choose source</option>
        {#each data.setup.sources as source}
          <option value={source.id}>{source.label}{source.authority ? ` · ${source.authority}` : ''}</option>
        {/each}
      </select>
    </label>

    <label class="field">
      <span>Academic term</span>
      <select name="termId" required>
        <option value="">Choose term</option>
        {#each data.setup.terms as term}
          <option value={term.id}>{term.academicYear} · {term.termName}{term.isCurrent ? ' · current' : ''}</option>
        {/each}
      </select>
    </label>

    <label class="file-field">
      <span>Schedule CSV</span>
      <input name="schedule" type="file" accept=".csv,text/csv" required />
    </label>

    <div class="check-row check-row--disabled" aria-label="Complete-source snapshot is not enabled yet">
      <input type="checkbox" disabled aria-hidden="true" tabindex="-1" />
      <span><strong>Complete-source snapshot</strong><small>Not enabled yet. This importer only adds or updates rows it can identify safely; it will not infer that missing rows should be retired.</small></span>
    </div>

    <button
      class="button primary"
      type="submit"
      disabled={staging || data.setup.sources.length === 0 || data.setup.terms.length === 0}
      aria-describedby={data.setup.sources.length === 0 || data.setup.terms.length === 0 ? 'setup-gate-title' : undefined}
    >
      {staging ? 'Checking CSV…' : 'Stage & validate'}
    </button>
  </form>

  <aside class="surface-panel contract-card">
    <p class="eyebrow">Canonical V1</p>
    <h3>Expected schedule fields</h3>
    <div class="schema-list">
      <div><code>course_code</code><span>Required</span></div>
      <div><code>section_code</code><span>Required</span></div>
      <div><code>days</code><span>Required · e.g. MWF / TTh</span></div>
      <div><code>start_time</code><span>Required</span></div>
      <div><code>end_time</code><span>Required</span></div>
      <div><code>room</code><span>Optional / TBA</span></div>
      <div><code>faculty_name</code><span>Optional</span></div>
      <div><code>faculty_email</code><span>Preferred identity</span></div>
      <div><code>source_record_key</code><span>Optional · strongly recommended</span></div>
    </div>
    <p class="contract-note">Unknown rooms fail validation. Unknown faculty stay unresolved and never create a faculty profile automatically. V1 assumes one canonical source row per course + section unless you provide a stable <code>source_record_key</code>; sources with multiple independent meeting rows for the same section must provide that key.</p>
  </aside>
</section>

<section class="surface-panel batch-card">
  <div class="section-heading"><div><p class="eyebrow">Audit trail</p><h3>Recent batches</h3></div><span>{data.batches.length} shown</span></div>
  {#if data.batches.length}
    <div class="batch-list">
      {#each data.batches as batch}
        <a class="batch-row" href={`/admin/imports/${batch.id}`}>
          <div class="batch-main"><strong>{batch.filename ?? 'Untitled import'}</strong><span>{sourceLabel(batch.source_id)} · {termLabel(batch.term_id)}</span></div>
          <div class="batch-counts"><span>{batch.row_count} rows</span><span>{batch.error_count} errors</span></div>
          <span class:failed={batch.status === 'validation_failed'} class:ready={batch.status === 'ready'} class:applied={batch.status === 'applied'} class="state-pill">{batch.status.replace('_',' ')}</span>
        </a>
      {/each}
    </div>
  {:else}
    <div class="empty-state"><strong>No imports yet</strong><p>The first staged CSV will appear here as an immutable audit record.</p></div>
  {/if}
</section>

<style>
  .setup-gate { margin-bottom:1rem; padding:1rem; display:grid; grid-template-columns:auto minmax(0,1fr); gap:.85rem; align-items:start; border-color:color-mix(in srgb,var(--ims-yellow) 70%,var(--line-soft)); background:linear-gradient(135deg,var(--ims-yellow-soft),var(--surface-raised)); }
  .setup-gate__mark { width:42px; height:42px; display:grid; place-items:center; border-radius:14px; background:var(--ims-yellow); color:#3f3d00; font-weight:950; box-shadow:var(--shadow-sm); }
  .setup-gate h3 { margin:.1rem 0 .25rem; }
  .setup-gate p:not(.eyebrow) { margin:0; color:var(--text-muted); line-height:1.5; }
  .setup-gate__actions { display:flex; flex-wrap:wrap; gap:.45rem; margin-top:.75rem; }
  .page-heading { margin-bottom:1rem; }
  .page-heading h2 { margin:.2rem 0; font-size:clamp(1.8rem,5vw,2.7rem); letter-spacing:-.04em; }
  .page-heading p:not(.eyebrow) { max-width:68ch; margin:0; color:var(--text-muted); }
  .import-grid { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr); gap:1rem; align-items:start; }
  .upload-card,.contract-card,.batch-card { padding:1.05rem; }
  .upload-card { display:grid; gap:.9rem; }
  .upload-icon { width:48px; height:48px; border-radius:15px; display:grid; place-items:center; font-size:.72rem; font-weight:900; letter-spacing:.08em; color:white; background:linear-gradient(145deg,var(--ims-blue),var(--ims-blue-ink)); box-shadow:var(--shadow-sm); }
  h3 { margin:.15rem 0; }
  .muted { margin:.2rem 0 0; color:var(--text-muted); font-size:.9rem; }
  .field,.file-field { display:grid; gap:.4rem; font-weight:700; font-size:.88rem; }
  select,input[type='file'] { min-height:46px; width:100%; border:1px solid var(--line-strong); background:var(--surface-raised); color:var(--text-primary); border-radius:var(--radius-md); padding:.65rem .75rem; font:inherit; }
  input[type='file'] { padding:.5rem; }
  .check-row { display:grid; grid-template-columns:auto 1fr; gap:.7rem; align-items:start; padding:.8rem; border:1px solid var(--line-soft); border-radius:var(--radius-md); background:var(--surface-subtle); cursor:pointer; }
  .check-row input { width:20px; height:20px; margin-top:.1rem; accent-color:var(--ims-blue-deep); }
  .check-row--disabled { cursor:not-allowed; opacity:.72; }
  .check-row span { display:grid; gap:.2rem; }
  .check-row small { color:var(--text-muted); line-height:1.45; }
  .inline-alert { padding:.75rem; border-radius:var(--radius-md); font-weight:700; }
  .inline-alert.error { color:#8c2020; background:#fff1f1; border:1px solid #f1b6b6; }
  .issue-stack { display:grid; gap:.35rem; }
  .issue-stack>div { display:grid; gap:.1rem; padding:.65rem; border:1px solid #f1b6b6; border-radius:var(--radius-sm); background:#fff8f8; }
  .issue-stack strong { font-size:.75rem; text-transform:uppercase; color:#8c2020; }
  .issue-stack span { font-size:.86rem; }
  .contract-card { position:relative; overflow:hidden; }
  .contract-card::after { content:''; position:absolute; right:-55px; top:-55px; width:130px; height:130px; border-radius:50%; background:color-mix(in srgb,var(--ims-yellow) 18%,transparent); pointer-events:none; }
  .schema-list { display:grid; gap:.1rem; margin-top:.8rem; }
  .schema-list div { display:flex; justify-content:space-between; gap:.8rem; padding:.58rem 0; border-top:1px solid var(--line-soft); }
  .schema-list code { color:var(--ims-blue-ink); font-weight:800; }
  .schema-list span { color:var(--text-muted); font-size:.82rem; text-align:right; }
  .contract-note { margin:.8rem 0 0; padding:.75rem; border-radius:var(--radius-md); background:var(--ims-green-soft); color:#275623; font-size:.84rem; line-height:1.5; }
  .batch-card { margin-top:1rem; }
  .section-heading { display:flex; justify-content:space-between; gap:1rem; align-items:end; }
  .section-heading span { color:var(--text-muted); font-size:.84rem; }
  .batch-list { display:grid; margin-top:.65rem; }
  .batch-row { min-height:66px; display:grid; grid-template-columns:minmax(0,1fr) auto auto; align-items:center; gap:1rem; padding:.7rem 0; border-top:1px solid var(--line-soft); color:inherit; }
  .batch-main { min-width:0; display:grid; gap:.18rem; }
  .batch-main span,.batch-counts { color:var(--text-muted); font-size:.82rem; }
  .batch-counts { display:grid; gap:.1rem; text-align:right; white-space:nowrap; }
  .state-pill { padding:.38rem .55rem; border-radius:999px; background:var(--surface-subtle); color:var(--text-secondary); font-size:.72rem; font-weight:800; text-transform:capitalize; white-space:nowrap; }
  .state-pill.failed { background:#fff1f1; color:#8c2020; } .state-pill.ready { background:var(--ims-yellow-soft); color:#635d00; } .state-pill.applied { background:var(--ims-green-soft); color:#275623; }
  .empty-state { padding:1.5rem .4rem .5rem; text-align:center; color:var(--text-muted); }
  .empty-state p { margin:.3rem 0; }
  @media (max-width:820px){ .import-grid { grid-template-columns:1fr; } }
  @media (max-width:620px){ .batch-row { grid-template-columns:minmax(0,1fr) auto; } .batch-counts { display:none; } }
</style>
