<script lang="ts">
  let { data, form } = $props();
  const checks = [
    ['signage_name', 'Signage/name matches the room or facility'],
    ['doorway_location', 'Doorway location matches the draft geometry'],
    ['corridor_connection', 'Corridor connection is physically present'],
    ['nearby_context', 'Nearby landmark/context confirms the location'],
    ['anchor_exact_location', 'Anchor is at the exact physical location'],
    ['anchor_mounting', 'Anchor has a suitable mounting point']
  ] as const;
</script>

<svelte:head><title>Field verification · IMS Map Studio</title></svelte:head>

<div class="field-page">
  <header class="field-header">
    <a class="back-link" href={`/admin/map/${data.detail?.session.id ?? ''}`}>← Back to session</a>
    <span class="eyebrow">Phone field mode</span>
    <h1>{data.detail?.session.title || 'Untitled verification session'}</h1>
    <p>Walk the building with the map open. A checked box is a physical observation, not a visual guess from the poster.</p>
  </header>

  {#if form?.mapError || data.loadError}<div class="alert alert--error" role="alert">{form?.mapError ?? data.loadError}</div>{/if}
  {#if form?.mapSuccess}<div class="alert alert--success" role="status">{form.mapSuccess}</div>{/if}

  {#if data.detail}
    <section class="field-card" aria-labelledby="checklist-title">
      <div class="card-heading"><span class="kicker">Required before submit</span><h2 id="checklist-title">Physical verification checklist</h2></div>
      <form method="POST" action="?/save" class="checklist-form">
        <input type="hidden" name="scope" value={data.detail.session.scope} />
        <input type="hidden" name="title" value={data.detail.session.title ?? ''} />
        {#each checks as [name, label]}
          <label class="check-row"><input type="checkbox" name={name} checked={Boolean(data.detail.session.checklist[name])} /><span><strong>{label}</strong><small>{name.startsWith('anchor_') ? 'Required when this session touches a QR/location anchor.' : 'Required for room, hallway, and route changes.'}</small></span></label>
        {/each}
        <button class="button button--primary" type="submit">Save observations</button>
      </form>
    </section>

    <section class="field-card" aria-labelledby="observation-title">
      <div class="card-heading"><span class="kicker">Evidence-linked delta</span><h2 id="observation-title">Record one observed change</h2></div>
      <form method="POST" action="?/change" class="observation-form">
        <label>Entity type<select name="entityType"><option value="space">Room / space</option><option value="graph_node">Graph node</option><option value="graph_edge">Graph edge</option><option value="hallway">Hallway</option><option value="anchor">QR / anchor</option></select></label>
        <label>Entity id<input name="entityId" required placeholder="mb304 or node id" /></label>
        <label>Before value (JSON)<textarea name="beforeValue" required>{'{}'}</textarea></label>
        <label>Observed value (JSON)<textarea name="afterValue" required>{'{}'}</textarea></label>
        <button class="button button--secondary" type="submit">Save field observation</button>
      </form>
    </section>

    <section class="field-card field-card--submit">
      <div><strong>Session status: {data.detail.session.status}</strong><p>Submit only after the checklist is saved and at least one delta is recorded. The server will enforce both.</p></div>
      <form method="POST" action="?/submit"><button class="button button--primary" type="submit" disabled={data.detail.session.status !== 'draft' && data.detail.session.status !== 'rejected'}>Submit for review</button></form>
    </section>
  {/if}
</div>

<style>
  .field-page { display: grid; gap: 14px; max-width: 680px; padding-block: 14px 32px; }
  .field-header { display: grid; gap: 6px; }
  .back-link { min-height: 44px; display: inline-flex; align-items: center; color: var(--brand-blue-ink); font-size: 12px; font-weight: 750; text-underline-offset: 3px; }
  .field-header h1 { margin: 0; font-size: clamp(1.55rem, 7vw, 2.2rem); line-height: 1.04; letter-spacing: -.04em; }
  .field-header p { margin: 0; color: var(--muted-strong); font-size: 12px; line-height: 1.5; }
  .alert { padding: 10px 12px; border-left: 4px solid; font-size: 12px; }
  .alert--error { border-color: var(--danger); background: var(--surface-danger); color: var(--danger-ink); }
  .alert--success { border-color: var(--success); background: var(--surface-success); color: var(--success-ink); }
  .field-card { display: grid; gap: 12px; padding: 13px; border: 1px solid var(--line-strong); background: var(--surface); }
  .field-card--submit { grid-template-columns: minmax(0, 1fr) auto; align-items: center; border-top: 4px solid var(--brand-yellow); }
  .card-heading h2 { margin: 3px 0 0; font-size: 1.05rem; }
  .checklist-form, .observation-form { display: grid; gap: 8px; }
  .check-row { min-height: 60px; display: grid; grid-template-columns: 24px minmax(0, 1fr); gap: 10px; align-items: center; padding: 8px; border: 1px solid var(--line); background: var(--surface-subtle); }
  .check-row input { width: 20px; height: 20px; accent-color: var(--brand-blue); }
  .check-row span { display: grid; gap: 2px; }
  .check-row strong { color: var(--ink-strong); font-size: 12px; }
  .check-row small, .field-card p { color: var(--muted); font-size: 10.5px; line-height: 1.4; }
  .observation-form label { display: grid; gap: 4px; color: var(--muted-strong); font-size: 11px; font-weight: 750; }
  .observation-form input, .observation-form select, .observation-form textarea { width: 100%; min-height: 42px; padding: 8px 10px; border: 1px solid var(--line-strong); border-radius: var(--radius-sm); background: var(--surface); color: var(--ink-strong); font: inherit; }
  .observation-form textarea { min-height: 78px; font-family: ui-monospace, monospace; font-size: 11px; resize: vertical; }
  .field-card--submit strong { color: var(--ink-strong); font-size: 12px; }
  .field-card--submit p { margin: 4px 0 0; }
  @media (max-width: 480px) { .field-card--submit { grid-template-columns: 1fr; } .field-card--submit button { width: 100%; min-height: 46px; } }
</style>
