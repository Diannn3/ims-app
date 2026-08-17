<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  let { data, form } = $props();
  let busy = $state<string | null>(null);

  const rows = $derived(data.rows ?? []);
  const warningCount = $derived(rows.flatMap((row: any) => row.import_issues ?? []).filter((issue: any) => issue.issue_type === 'warning').length);
  const unacknowledgedWarnings = $derived(rows.flatMap((row: any) => row.import_issues ?? []).filter((issue: any) => issue.issue_type === 'warning' && !issue.acknowledged_at).length);
  const changedRows = $derived(rows.filter((row: any) => row.status === 'changed').length);
  const unchangedRows = $derived(rows.filter((row: any) => row.status === 'unchanged' || row.status === 'skipped').length);
  const addedRows = $derived(rows.filter((row: any) => row.status === 'valid').length);

  function rowCourse(row: any) { return row.normalized_payload?.courseCode ?? row.raw_payload?.course_code ?? row.raw_payload?.course ?? '—'; }
  function rowSection(row: any) { return row.normalized_payload?.sectionCode ?? row.raw_payload?.section_code ?? row.raw_payload?.section ?? '—'; }
  function rowSchedule(row: any) {
    const p = row.normalized_payload;
    if (!p) return 'Could not normalize';
    const days = Array.isArray(p.weekdays) ? p.weekdays.join(' · ') : '—';
    return `${days} · ${p.startsAt ?? '—'}–${p.endsAt ?? '—'} · ${p.roomId ?? 'TBA'}`;
  }
</script>

<svelte:head><title>Import review · IMS Academic Hub</title></svelte:head>

<header class="review-head">
  <div>
    <a class="back-link" href="/admin/imports">← All imports</a>
    <p class="eyebrow">Import review</p>
    <h2>{data.batch.filename ?? 'Schedule batch'}</h2>
    <p>{data.source?.label ?? 'Unknown source'} · {data.term ? `${data.term.academicYear} · ${data.term.termName}` : 'Unknown term'}</p>
  </div>
  <span class:ready={data.batch.status === 'ready'} class:failed={data.batch.status === 'validation_failed'} class:applied={data.batch.status === 'applied'} class="state-pill">{data.batch.status.replace('_',' ')}</span>
</header>

{#if page.url.searchParams.get('applied') === '1'}
  <div class="inline-alert success" role="status"><strong>Batch applied.</strong> Imported schedule records remain unpublished until their verification/publication review is completed.</div>
{/if}
{#if form?.actionError}
  <div class="inline-alert error" role="alert">{form.actionError}</div>
{/if}

<div class="metric-grid">
  <article class="metric-card surface-panel"><span>New</span><strong>{addedRows}</strong><small>not seen before</small></article>
  <article class="metric-card surface-panel"><span>Changed</span><strong>{changedRows}</strong><small>needs explicit review</small></article>
  <article class="metric-card surface-panel"><span>Unchanged</span><strong>{unchangedRows}</strong><small>safe to skip</small></article>
  <article class="metric-card surface-panel"><span>Errors</span><strong>{data.batch.error_count}</strong><small>must be zero</small></article>
</div>

<section class="surface-panel decision-panel">
  <div class="decision-copy">
    <p class="eyebrow">Apply gate</p>
    <h3>{data.batch.status === 'ready' ? 'Validation passed' : 'Batch is not ready to apply'}</h3>
    <p>
      Applying is transactional. Changed schedule records are deliberately moved back to <strong>needs verification</strong> instead of being published automatically.
    </p>
  </div>
  <div class="decision-actions">
    {#if unacknowledgedWarnings > 0}
      <form method="POST" action="?/acknowledgeWarnings" use:enhance={() => { busy='ack'; return async ({ update }) => { busy=null; await update(); }; }}>
        <button class="button secondary" disabled={busy !== null}>{busy === 'ack' ? 'Acknowledging…' : `Acknowledge ${unacknowledgedWarnings} warning${unacknowledgedWarnings === 1 ? '' : 's'}`}</button>
      </form>
    {/if}

    {#if data.canApply && data.batch.status === 'ready'}
      <form method="POST" action="?/apply" use:enhance={() => { busy='apply'; return async ({ update }) => { busy=null; await update(); }; }}>
        <input type="hidden" name="previewHash" value={data.batch.preview_hash ?? ''} />
        <button class="button primary" disabled={busy !== null || unacknowledgedWarnings > 0}>{busy === 'apply' ? 'Applying…' : 'Apply reviewed batch'}</button>
      </form>
    {:else if data.batch.status === 'ready'}
      <span class="permission-note">An admin must perform the final apply.</span>
    {/if}

    {#if data.canApply && ['staged','validation_failed','ready'].includes(data.batch.status)}
      <form method="POST" action="?/reject" use:enhance={() => { busy='reject'; return async ({ update }) => { busy=null; await update(); }; }}>
        <button class="button ghost danger" disabled={busy !== null}>{busy === 'reject' ? 'Rejecting…' : 'Reject batch'}</button>
      </form>
    {/if}
  </div>
</section>

<section class="surface-panel table-panel">
  <div class="section-heading">
    <div><p class="eyebrow">Normalized preview</p><h3>Rows</h3></div>
    <span>{rows.length} rows · {warningCount} warnings</span>
  </div>

  {#if rows.length}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="table-scroll" role="region" tabindex="0" aria-label="Scrollable import preview table">
      <table>
        <thead><tr><th>Row</th><th>Status</th><th>Course / section</th><th>Normalized meeting</th><th>Issues</th></tr></thead>
        <tbody>
          {#each rows as row}
            <tr>
              <td class="row-number">{row.row_number}</td>
              <td><span class:bad={row.status === 'invalid'} class:changed={row.status === 'changed'} class:unchanged={row.status === 'unchanged' || row.status === 'skipped'} class="row-status">{row.status}</span></td>
              <td><strong>{rowCourse(row)}</strong><small>Section {rowSection(row)}</small></td>
              <td><span class="schedule-cell">{rowSchedule(row)}</span></td>
              <td>
                {#if row.import_issues?.length}
                  <div class="issue-list">
                    {#each row.import_issues as issue}
                      <div class:error-issue={issue.issue_type === 'error'} class:warning-issue={issue.issue_type === 'warning'}>
                        <strong>{issue.error_code}</strong>
                        <span>{issue.message}</span>
                        {#if issue.normalized_value}<small>Normalized: {issue.normalized_value}</small>{/if}
                      </div>
                    {/each}
                  </div>
                {:else}
                  <span class="quiet">No issues</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="empty-state">No rows were staged for this batch.</div>
  {/if}
</section>

<style>
  .review-head { display:flex; justify-content:space-between; gap:1rem; align-items:flex-start; margin-bottom:1rem; }
  .back-link { display:inline-flex; min-height:36px; align-items:center; color:var(--ims-blue-ink); font-weight:750; font-size:.84rem; }
  .review-head h2 { margin:.18rem 0; font-size:clamp(1.75rem,5vw,2.6rem); letter-spacing:-.04em; }
  .review-head p:not(.eyebrow) { margin:0; color:var(--text-muted); }
  .state-pill { padding:.45rem .65rem; border-radius:999px; background:var(--surface-subtle); color:var(--text-secondary); font-size:.75rem; font-weight:850; text-transform:capitalize; white-space:nowrap; }
  .state-pill.ready { background:var(--ims-yellow-soft); color:#635d00; } .state-pill.failed { background:#fff1f1; color:#8c2020; } .state-pill.applied { background:var(--ims-green-soft); color:#275623; }
  .inline-alert { margin-bottom:1rem; padding:.8rem .9rem; border-radius:var(--radius-md); }
  .inline-alert.success { background:var(--ims-green-soft); color:#275623; border:1px solid color-mix(in srgb,var(--ims-green) 35%,white); }
  .inline-alert.error { background:#fff1f1; color:#8c2020; border:1px solid #f1b6b6; }
  .metric-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.65rem; }
  .metric-card { padding:.85rem; display:grid; gap:.15rem; }
  .metric-card span,.metric-card small { color:var(--text-muted); }
  .metric-card strong { font-size:1.85rem; letter-spacing:-.05em; }
  .decision-panel { margin-top:.8rem; padding:1rem; display:flex; justify-content:space-between; gap:1rem; align-items:center; }
  .decision-copy { max-width:65ch; } .decision-copy h3 { margin:.15rem 0; } .decision-copy p:not(.eyebrow) { margin:.25rem 0 0; color:var(--text-muted); line-height:1.5; }
  .decision-actions { display:flex; gap:.5rem; flex-wrap:wrap; justify-content:flex-end; align-items:center; }
  .permission-note { color:var(--text-muted); font-size:.82rem; }
  .button.danger { color:#9a2727; }
  .table-panel { margin-top:.8rem; padding:1rem; }
  .section-heading { display:flex; align-items:end; justify-content:space-between; gap:1rem; }
  .section-heading h3 { margin:.15rem 0; } .section-heading>span { color:var(--text-muted); font-size:.82rem; }
  .table-scroll { margin-top:.65rem; overflow:auto; border:1px solid var(--line-soft); border-radius:var(--radius-md); }
  table { width:100%; min-width:850px; border-collapse:collapse; font-size:.86rem; }
  th { position:sticky; top:0; z-index:1; text-align:left; padding:.7rem; background:var(--surface-subtle); color:var(--text-muted); font-size:.74rem; letter-spacing:.04em; text-transform:uppercase; }
  td { vertical-align:top; padding:.75rem .7rem; border-top:1px solid var(--line-soft); }
  td small { display:block; margin-top:.15rem; color:var(--text-muted); }
  .row-number { color:var(--text-muted); font-variant-numeric:tabular-nums; }
  .row-status { display:inline-flex; padding:.3rem .45rem; border-radius:999px; background:var(--ims-green-soft); color:#275623; font-size:.72rem; font-weight:800; text-transform:capitalize; }
  .row-status.bad { background:#fff1f1; color:#8c2020; } .row-status.changed { background:var(--ims-yellow-soft); color:#635d00; } .row-status.unchanged { background:var(--surface-subtle); color:var(--text-muted); }
  .schedule-cell { white-space:nowrap; }
  .issue-list { display:grid; gap:.4rem; min-width:250px; }
  .issue-list>div { display:grid; gap:.1rem; padding:.45rem .55rem; border-left:3px solid var(--line-strong); background:var(--surface-subtle); border-radius:0 var(--radius-sm) var(--radius-sm) 0; }
  .issue-list>div.error-issue { border-color:#d64a4a; background:#fff8f8; } .issue-list>div.warning-issue { border-color:#d1a700; background:#fffdf1; }
  .issue-list strong { font-size:.68rem; letter-spacing:.04em; text-transform:uppercase; }
  .issue-list span { line-height:1.4; } .quiet { color:var(--text-muted); }
  .empty-state { padding:1.4rem; color:var(--text-muted); text-align:center; }
  @media (max-width:760px){ .metric-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .decision-panel { align-items:stretch; flex-direction:column; } .decision-actions { justify-content:flex-start; } }
  @media (max-width:480px){ .metric-grid { grid-template-columns:1fr 1fr; } .review-head { flex-direction:column; } }
</style>
