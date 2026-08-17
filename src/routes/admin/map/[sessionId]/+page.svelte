<script lang="ts">
  import MapViewport from '$lib/components/map/MapViewport.svelte';
  import { floorDisplayName, spaces } from '$lib/domain/navigation/spaces';
  import type { PhysicalVerificationChecklist } from '$lib/domain/map-verification';
  import type { FloorId } from '$lib/domain/navigation/types';

  let { data, form } = $props();
  let floor = $state<FloorId>('ground');
  let selectedSpaceId = $state<string | null>(null);
  let geometry = $state({ x: 0, y: 0, width: 120, height: 80 });
  let geometryHistory = $state<Array<typeof geometry>>([]);
  let geometryFuture = $state<Array<typeof geometry>>([]);
  const floorIds: FloorId[] = ['ground', 'second', 'third'];

  const selectedSpace = $derived(spaces.find((space) => space.id === selectedSpaceId) ?? null);
  const checklistFields: Array<[keyof PhysicalVerificationChecklist, string]> = [
    ['signage_name', 'Signage/name'],
    ['doorway_location', 'Doorway'],
    ['corridor_connection', 'Corridor'],
    ['nearby_context', 'Nearby context'],
    ['anchor_exact_location', 'Anchor exact location'],
    ['anchor_mounting', 'Anchor mounting']
  ];

  function checklistChecked(name: keyof PhysicalVerificationChecklist) {
    return Boolean(data.detail?.session.checklist[name]);
  }

  function selectSpace(id: string) {
    selectedSpaceId = id;
    const space = spaces.find((item) => item.id === id);
    if (!space) return;
    floor = space.floor;
    geometry = { ...space.geometry };
    geometryHistory = [];
    geometryFuture = [];
  }

  function updateGeometry(key: keyof typeof geometry, value: string) {
    const next = { ...geometry, [key]: Number(value) || 0 };
    geometryHistory = [...geometryHistory, geometry].slice(-20);
    geometryFuture = [];
    geometry = next;
  }

  function undoGeometry() {
    const previous = geometryHistory.at(-1);
    if (!previous) return;
    geometryFuture = [geometry, ...geometryFuture].slice(0, 20);
    geometry = previous;
    geometryHistory = geometryHistory.slice(0, -1);
  }

  function redoGeometry() {
    const next = geometryFuture[0];
    if (!next) return;
    geometryHistory = [...geometryHistory, geometry].slice(-20);
    geometry = next;
    geometryFuture = geometryFuture.slice(1);
  }

  function beforeJson() {
    return JSON.stringify(selectedSpace?.geometry ?? {}, null, 0);
  }

  function afterJson() {
    return JSON.stringify(geometry, null, 0);
  }
</script>

<svelte:head><title>{data.detail?.session.title || 'Map draft'} · IMS Map Studio</title></svelte:head>

<div class="detail-page">
  <header class="detail-header">
    <div><a class="back-link" href="/admin/map">← Map Studio</a><span class="eyebrow">Verification draft · {data.detail?.session.scope}</span><h1>{data.detail?.session.title || 'Untitled verification session'}</h1><p>Draft changes are review deltas only. Save, submit, and approve are separate state transitions.</p></div>
    <div class="status-block"><span>Status</span><strong>{data.detail?.session.status}</strong><small class="mono">Base {data.detail?.session.baseRevision}</small></div>
  </header>

  {#if form?.mapError || data.loadError}<div class="alert alert--error" role="alert">{form?.mapError ?? data.loadError}</div>{/if}
  {#if form?.mapSuccess}<div class="alert alert--success" role="status">{form.mapSuccess}</div>{/if}

  {#if data.detail}
    <section class="studio-toolbar" aria-label="Map draft controls">
      <div class="toolbar-steps"><span class="step done">1 <small>Upload</small></span><span class="step active">2 <small>Validate</small></span><span class="step">3 <small>Review</small></span><span class="step">4 <small>Apply</small></span></div>
      <a class="button button--secondary" href={`/admin/map/field/${data.detail.session.id}`}>Open phone field view</a>
    </section>

    <div class="detail-grid">
      <section class="map-panel" aria-labelledby="editor-title">
        <div class="panel-heading"><div><span class="kicker">Geometry editor</span><h2 id="editor-title">Reference-matched floor plan</h2></div><span class="unverified">Site verification pending</span></div>
        <div class="floor-tabs" role="group" aria-label="Editor floor"><span>Floor</span>{#each floorIds as floorId}<button type="button" class:active={floor === floorId} aria-pressed={floor === floorId} onclick={() => (floor = floorId)}>{floorDisplayName(floorId)}</button>{/each}</div>
        <MapViewport {floor} {selectedSpaceId} onSelect={selectSpace} overlayBottomInsetPx={0} />
        <p class="map-caption">Rooms are selectable for inspection. Poster-marked exits and orientation are intentionally unverified; no safety claim is promoted by this editor.</p>
      </section>

      <aside class="inspector-column">
        <section class="inspector-panel">
          <div class="panel-heading"><div><span class="kicker">Selection</span><h2>{selectedSpace?.name || 'Select a room'}</h2></div><span class="mono">{selectedSpace?.id || '—'}</span></div>
          {#if selectedSpace}
            <form method="POST" action="?/change" class="geometry-form">
              <input type="hidden" name="entityType" value="space" />
              <input type="hidden" name="entityId" value={selectedSpace.id} />
              <input type="hidden" name="beforeValue" value={beforeJson()} />
              <input type="hidden" name="afterValue" value={afterJson()} />
              <div class="numeric-grid">{#each ['x', 'y', 'width', 'height'] as key}<label>{key}<input type="number" value={geometry[key as keyof typeof geometry]} oninput={(event) => updateGeometry(key as keyof typeof geometry, (event.currentTarget as HTMLInputElement).value)} /></label>{/each}</div>
              <div class="inspector-actions"><button type="button" class="button button--ghost" disabled={!geometryHistory.length} onclick={undoGeometry}>Undo</button><button type="button" class="button button--ghost" disabled={!geometryFuture.length} onclick={redoGeometry}>Redo</button><button type="submit" class="button button--primary">Record rectangle delta</button></div>
            </form>
          {:else}<p class="empty-copy">Choose a room on the map to inspect its numeric rectangle. The selected data is the static Git-owned baseline.</p>{/if}
        </section>

        <section class="inspector-panel">
          <div class="panel-heading"><div><span class="kicker">Workflow</span><h2>Physical checks</h2></div><span class="mono">{Object.values(data.detail.session.checklist).filter(Boolean).length}/6</span></div>
          <form method="POST" action="?/save" class="checklist-mini">
            <input type="hidden" name="scope" value={data.detail.session.scope} /><input type="hidden" name="title" value={data.detail.session.title ?? ''} />
            {#each checklistFields as [name,label]}<label><input type="checkbox" name={name} checked={checklistChecked(name)} /> {label}</label>{/each}
            <button class="button button--secondary" type="submit">Save checklist</button>
          </form>
        </section>

        <section class="inspector-panel">
          <div class="panel-heading"><div><span class="kicker">Reference</span><h2>Evidence stays contextual</h2></div></div>
          <p class="empty-copy">Reference overlays and calibration values belong in evidence metadata. Attach a source or field note before relying on a visual comparison.</p>
          <form method="POST" action="?/evidence" class="evidence-form">
            <input type="hidden" name="kind" value="reference" />
            <label>Reference note <input name="caption" placeholder="Reference note" required /></label>
            <label>Evidence path <input name="storagePath" placeholder="Evidence path (optional)" /></label>
            <input type="hidden" name="metadata" value={'{}'} />
            <button class="button button--ghost" type="submit">Attach reference note</button>
          </form>
        </section>
      </aside>
    </div>

    <section class="change-table" aria-labelledby="changes-title"><div class="panel-heading"><div><span class="kicker">Recorded deltas</span><h2 id="changes-title">Changes in this draft</h2></div><span class="mono">{data.detail.changes.length}</span></div>{#if data.detail.changes.length}<div class="changes-list">{#each data.detail.changes as change}<div class="change-row"><span class="mono">{change.entityType}:{change.entityId}</span><span>{change.changeKind}</span><code>{JSON.stringify(change.afterValue)}</code></div>{/each}</div>{:else}<p class="empty-copy">No deltas yet. Select a room or use the field view to record an observation.</p>{/if}</section>

    <section class="submission-panel"><div><strong>Submit only when the field checklist is complete.</strong><p>The RPC blocks incomplete checks, missing deltas, stale rebases, and map-editor approval.</p></div><div class="submission-actions"><form method="POST" action="?/submit"><button class="button button--primary" type="submit" disabled={data.detail.session.status !== 'draft' && data.detail.session.status !== 'rejected'}>Submit for review</button></form>{#if data.adminProfile?.role === 'admin' && (data.detail.session.status === 'submitted' || data.detail.session.status === 'in_review')}<form method="POST" action="?/approve"><input type="hidden" name="canonicalRevision" value={data.canonicalRevision} /><input type="hidden" name="snapshot" value={JSON.stringify({ sessionId: data.detail.session.id, changes: data.detail.changes.map((item) => ({ entityType: item.entityType, entityId: item.entityId, afterValue: item.afterValue })) })} /><button class="button button--primary" type="submit">Approve immutable snapshot</button></form><form method="POST" action="?/reject"><input name="reason" placeholder="Reason for correction" required /><button class="button button--ghost" type="submit">Return for correction</button></form>{/if}</div></section>
  {/if}
</div>

<style>
  .detail-page { display: grid; gap: 14px; padding-block: 14px 34px; }
  .detail-header { display: grid; gap: 14px; align-items: end; }
  .back-link { min-height: 42px; display: inline-flex; align-items: center; color: var(--brand-blue-ink); font-size: 12px; font-weight: 750; text-underline-offset: 3px; }
  .detail-header h1 { margin: 3px 0 0; font-size: clamp(1.5rem, 4vw, 2.25rem); line-height: 1.04; letter-spacing: -.04em; }
  .detail-header p { margin: 6px 0 0; color: var(--muted-strong); font-size: 12px; }
  .status-block { display: grid; gap: 3px; padding: 10px 12px; border: 1px dashed var(--line-strong); background: var(--surface-subtle); }
  .status-block span { color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: .08em; }
  .status-block strong { color: var(--brand-blue-ink); text-transform: capitalize; }
  .mono { color: var(--muted); font: 10px ui-monospace, monospace; }
  .alert { padding: 10px 12px; border-left: 4px solid; font-size: 12px; }
  .alert--error { border-color: var(--danger); background: var(--surface-danger); color: var(--danger-ink); }
  .alert--success { border-color: var(--success); background: var(--surface-success); color: var(--success-ink); }
  .studio-toolbar, .submission-panel { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 10px 12px; border: 1px solid var(--line-strong); background: var(--surface); }
  .toolbar-steps { display: flex; gap: 10px; align-items: center; overflow-x: auto; }
  .step { display: inline-flex; gap: 4px; align-items: center; color: var(--muted); font: 800 11px ui-monospace, monospace; white-space: nowrap; }
  .step small { font: 700 10px var(--font-ui); }
  .step.done, .step.active { color: var(--brand-blue-ink); }
  .step.active { text-decoration: underline; text-decoration-color: var(--brand-yellow); text-underline-offset: 5px; }
  .detail-grid { display: grid; gap: 12px; }
  .map-panel, .inspector-panel, .change-table { min-width: 0; padding: 12px; border: 1px solid var(--line-strong); background: var(--surface); }
  .map-panel { display: grid; gap: 10px; }
  .inspector-column { display: grid; gap: 12px; align-content: start; }
  .panel-heading { display: flex; justify-content: space-between; gap: 12px; align-items: end; }
  .panel-heading h2 { margin: 3px 0 0; font-size: 1rem; }
  .unverified { color: var(--warning-ink); font-size: 10px; font-weight: 750; }
  .floor-tabs { display: flex; gap: 4px; align-items: center; overflow-x: auto; }
  .floor-tabs span { color: var(--muted); font-size: 10px; font-weight: 750; }
  .floor-tabs button { min-height: 38px; padding: 0 8px; border: 1px solid var(--line); background: var(--surface-subtle); color: var(--muted-strong); font-size: 10px; font-weight: 750; }
  .floor-tabs button.active { border-color: var(--brand-blue); color: var(--brand-blue-ink); background: var(--surface-blue); }
  .map-caption, .empty-copy, .submission-panel p { margin: 0; color: var(--muted); font-size: 11px; line-height: 1.45; }
  .geometry-form, .checklist-mini, .evidence-form { display: grid; gap: 8px; margin-top: 11px; }
  .numeric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .numeric-grid label, .evidence-form input { display: grid; gap: 3px; color: var(--muted-strong); font-size: 10px; font-weight: 750; }
  .numeric-grid input, .evidence-form input { min-height: 38px; min-width: 0; padding: 0 8px; border: 1px solid var(--line-strong); border-radius: var(--radius-sm); background: var(--surface); color: var(--ink-strong); }
  .inspector-actions, .submission-actions { display: flex; flex-wrap: wrap; gap: 6px; }
  .inspector-actions .button, .submission-actions .button { min-height: 40px; }
  .checklist-mini label { min-height: 32px; display: flex; gap: 7px; align-items: center; color: var(--muted-strong); font-size: 11px; }
  .checklist-mini input { width: 17px; height: 17px; accent-color: var(--brand-blue); }
  .changes-list { display: grid; margin-top: 10px; border-top: 1px solid var(--line); }
  .change-row { min-width: 0; display: grid; grid-template-columns: 150px 80px minmax(0, 1fr); gap: 10px; align-items: center; padding: 9px 2px; border-bottom: 1px solid var(--line); font-size: 11px; }
  .change-row code { overflow: hidden; color: var(--muted-strong); font: 10px ui-monospace, monospace; text-overflow: ellipsis; white-space: nowrap; }
  .submission-panel { border-top: 4px solid var(--brand-yellow); }
  .submission-panel strong { color: var(--ink-strong); font-size: 12px; }
  .submission-panel p { margin-top: 3px; }
  @media (min-width: 760px) { .detail-header { grid-template-columns: minmax(0, 1fr) 220px; } .detail-grid { grid-template-columns: minmax(0, 1.35fr) minmax(280px, .65fr); } }
  @media (max-width: 600px) { .studio-toolbar, .submission-panel { align-items: stretch; flex-direction: column; } .studio-toolbar .button, .submission-actions .button { width: 100%; } .change-row { grid-template-columns: minmax(120px, 1fr) 70px; } .change-row code { grid-column: 1 / -1; } }
</style>
