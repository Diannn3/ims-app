<script lang="ts">
  import { page } from '$app/state';
  import type { MapVerificationSession } from '$lib/data-access/map-verification/repository.server';
  import { CANONICAL_MAP_REVISION } from '$lib/domain/navigation/canonical-revision';

  let { data, form } = $props<{ data: { sessions: MapVerificationSession[]; canonicalRevision: string; loadError: string | null; adminProfile?: { role: string } | null }; form?: { mapError?: string; mapSuccess?: string } }>();
  let selectedMode = $state('Verify');
  const modes = ['Verify', 'Geometry', 'Routing', 'Anchors', 'Reference'];
  const statusLabel: Record<string, string> = {
    draft: 'Draft', submitted: 'Awaiting review', in_review: 'In review', approved: 'Approved', rejected: 'Needs correction', archived: 'Archived'
  };
</script>

<svelte:head>
  <title>Map Verification Studio · IMS Academic Hub</title>
  <meta name="description" content="Review and submit physically verified Math Building map changes." />
</svelte:head>

<div class="studio-page">
  <header class="studio-header">
    <div>
      <span class="eyebrow">Map Verification Studio</span>
      <h1>Verify the building, then change the map.</h1>
      <p>Git owns canonical geometry. This workspace records evidence, review state, and deltas until an administrator seals a snapshot.</p>
    </div>
    <div class="revision-stamp">
      <span>Base revision</span>
      <strong>{data.canonicalRevision || CANONICAL_MAP_REVISION}</strong>
      <small>Nothing here publishes directly to the public map.</small>
    </div>
  </header>

  {#if form?.mapError || data.loadError}
    <div class="alert alert--error" role="alert">{form?.mapError ?? data.loadError}</div>
  {/if}
  {#if form?.mapSuccess}
    <div class="alert alert--success" role="status">{form.mapSuccess}</div>
  {/if}

  <section class="studio-grid" aria-label="Map verification workspace">
    <div class="workspace-panel">
      <div class="panel-heading">
        <div>
          <span class="kicker">Instrument modes</span>
          <h2>Choose a verification lens</h2>
        </div>
        <span class="mode-readout">{selectedMode}</span>
      </div>
      <div class="mode-tabs" role="tablist" aria-label="Verification modes">
        {#each modes as mode}
          <button type="button" role="tab" aria-selected={selectedMode === mode} class:active={selectedMode === mode} onclick={() => (selectedMode = mode)}>{mode}</button>
        {/each}
      </div>
      <div class="mode-brief">
        {#if selectedMode === 'Verify'}
          <strong>Field truth first.</strong>
          <p>Confirm signage, doorway, corridor connection, and nearby context before submitting any room or route change.</p>
        {:else if selectedMode === 'Geometry'}
          <strong>Numeric room rectangles.</strong>
          <p>Record a proposed rectangle as a review delta. Existing Git geometry remains untouched until approval and a reviewed commit.</p>
        {:else if selectedMode === 'Routing'}
          <strong>Graph continuity.</strong>
          <p>Inspect nodes, edges, and orthogonal hallway vertices without treating poster lines as physical truth.</p>
        {:else if selectedMode === 'Anchors'}
          <strong>QR and wayfinding anchors.</strong>
          <p>Anchor changes require exact physical location and a suitable mounting point in addition to the room checklist.</p>
        {:else}
          <strong>Reference calibration.</strong>
          <p>Keep poster/reference overlays clearly labelled as unverified. They are evidence, not an authorization to publish safety claims.</p>
        {/if}
      </div>
    </div>

    <div class="workspace-panel workspace-panel--new">
      <div class="panel-heading">
        <div>
          <span class="kicker">New field session</span>
          <h2>Start a reviewable draft</h2>
        </div>
        <span class="step-badge">1 / 4</span>
      </div>
      <form method="POST" action="?/create" class="new-session-form">
        <label>Session title <input name="title" maxlength="120" placeholder="e.g. Third-floor room signage walk" /></label>
        <label>Scope
          <select name="scope">
            <option value="mixed">Mixed verification</option>
            <option value="space">Rooms and facilities</option>
            <option value="graph">Routing graph</option>
            <option value="hallway">Hallway geometry</option>
            <option value="anchor">QR/location anchors</option>
          </select>
        </label>
        <input type="hidden" name="baseRevision" value={data.canonicalRevision || CANONICAL_MAP_REVISION} />
        <button class="button button--primary" type="submit">Open verification draft</button>
      </form>
      <p class="form-note">Upload and evidence storage can be attached from the field view. Drafts are private to map staff.</p>
    </div>
  </section>

  <section class="session-section" aria-labelledby="sessions-title">
    <div class="panel-heading">
      <div>
        <span class="kicker">Review queue</span>
        <h2 id="sessions-title">Verification sessions</h2>
      </div>
      <span class="count-badge">{data.sessions.length}</span>
    </div>

    {#if data.sessions.length}
      <div class="session-table" role="table" aria-label="Map verification sessions">
        <div class="session-row session-row--head" role="row"><span>Session</span><span>Scope</span><span>Status</span><span>Updated</span><span>Action</span></div>
        {#each data.sessions as session}
          <div class="session-row" role="row">
            <span><strong>{session.title || 'Untitled field session'}</strong><small class="mono">{session.id.slice(0, 8)} · {session.baseRevision}</small></span>
            <span class="mono">{session.scope}</span>
            <span><span class:status-good={session.status === 'approved'} class:status-warn={session.status === 'submitted' || session.status === 'in_review'} class="status-chip">{statusLabel[session.status] ?? session.status}</span></span>
            <span class="muted">{new Date(session.updatedAt).toLocaleDateString()}</span>
            <span class="row-actions"><a class="button button--secondary" href={`/admin/map/${session.id}`}>Open</a>{#if session.status === 'draft' || session.status === 'rejected'}<a class="text-link" href={`/admin/map/field/${session.id}`}>Field view</a>{/if}</span>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-state"><strong>No verification sessions yet.</strong><p>Create a draft when you are ready to walk the building. Synthetic academic seed data never stands in for site verification.</p></div>
    {/if}
  </section>

  <aside class="trust-note" aria-label="Verification trust rules">
    <strong>Publish gate</strong>
    <span>Apply remains an administrator-only action. The database blocks incomplete physical checklists, stale rebases, and snapshot mutation after approval.</span>
  </aside>
</div>

<style>
  .studio-page { display: grid; gap: 18px; padding-block: 18px 34px; }
  .studio-header { display: grid; gap: 14px; align-items: end; }
  .studio-header h1 { margin: 4px 0 0; max-width: 24ch; font-size: clamp(1.65rem, 4vw, 2.5rem); line-height: 1.02; letter-spacing: -.04em; }
  .studio-header p { max-width: 70ch; margin: 8px 0 0; color: var(--muted-strong); font-size: 13px; line-height: 1.5; }
  .revision-stamp { display: grid; gap: 3px; padding: 10px 12px; border: 1px dashed var(--line-strong); background: var(--surface-subtle); }
  .revision-stamp span, .revision-stamp small { color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: .08em; }
  .revision-stamp strong { color: var(--brand-blue-ink); font-family: ui-monospace, monospace; font-size: 12px; }
  .revision-stamp small { text-transform: none; letter-spacing: 0; }
  .alert { padding: 10px 12px; border-left: 4px solid; font-size: 12px; }
  .alert--error { border-color: var(--danger); background: var(--surface-danger); color: var(--danger-ink); }
  .alert--success { border-color: var(--success); background: var(--surface-success); color: var(--success-ink); }
  .studio-grid { display: grid; gap: 12px; }
  .workspace-panel, .session-section { min-width: 0; padding: 13px; border: 1px solid var(--line-strong); background: var(--surface); }
  .workspace-panel--new { border-top: 4px solid var(--brand-blue); }
  .panel-heading { display: flex; justify-content: space-between; gap: 12px; align-items: end; }
  .panel-heading h2 { margin: 3px 0 0; font-size: 1.05rem; letter-spacing: -.02em; }
  .mode-readout, .count-badge, .step-badge { color: var(--brand-blue-ink); font: 800 11px ui-monospace, monospace; }
  .mode-tabs { display: flex; gap: 4px; margin-top: 12px; overflow-x: auto; border-bottom: 1px solid var(--line); }
  .mode-tabs button { min-height: 42px; padding: 0 10px; border: 0; border-bottom: 3px solid transparent; background: transparent; color: var(--muted-strong); font-size: 11px; font-weight: 750; white-space: nowrap; }
  .mode-tabs button.active { border-color: var(--brand-yellow); color: var(--brand-blue-ink); }
  .mode-brief { min-height: 76px; padding-top: 13px; }
  .mode-brief strong { color: var(--ink-strong); font-size: 13px; }
  .mode-brief p, .form-note { margin: 5px 0 0; color: var(--muted); font-size: 11.5px; line-height: 1.5; }
  .new-session-form { display: grid; gap: 9px; margin-top: 13px; }
  .new-session-form label { display: grid; gap: 4px; color: var(--muted-strong); font-size: 11px; font-weight: 750; }
  .new-session-form input, .new-session-form select { min-height: 42px; padding: 0 10px; border: 1px solid var(--line-strong); border-radius: var(--radius-sm); background: var(--surface); color: var(--ink-strong); }
  .new-session-form button { min-height: 44px; }
  .session-section { display: grid; gap: 12px; }
  .session-table { overflow-x: auto; border-top: 1px solid var(--line); }
  .session-row { min-width: 680px; display: grid; grid-template-columns: minmax(210px, 1.5fr) 100px 130px 110px minmax(140px, .8fr); gap: 10px; align-items: center; padding: 10px 4px; border-bottom: 1px solid var(--line); font-size: 11.5px; }
  .session-row--head { color: var(--muted); font-size: 9px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .session-row > span:first-child { display: grid; gap: 3px; min-width: 0; }
  .session-row strong { overflow: hidden; color: var(--ink-strong); text-overflow: ellipsis; white-space: nowrap; }
  .mono { font-family: ui-monospace, monospace; font-size: 10px; }
  .muted { color: var(--muted); }
  .status-chip { display: inline-flex; min-height: 25px; align-items: center; padding: 0 7px; border: 1px solid var(--line-strong); border-radius: 999px; color: var(--muted-strong); font-size: 10px; font-weight: 750; }
  .status-chip.status-good { border-color: var(--success); color: var(--success-ink); background: var(--surface-success); }
  .status-chip.status-warn { border-color: var(--warning); color: var(--warning-ink); background: var(--surface-warning); }
  .row-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .row-actions .button { min-height: 36px; }
  .text-link { color: var(--brand-blue-ink); font-size: 10.5px; font-weight: 750; text-underline-offset: 3px; }
  .empty-state { padding: 18px 2px; border-top: 1px dashed var(--line-strong); }
  .empty-state strong { color: var(--ink-strong); }
  .empty-state p { max-width: 60ch; margin: 4px 0 0; color: var(--muted); font-size: 12px; line-height: 1.5; }
  .trust-note { display: grid; gap: 4px; padding: 11px 12px; border-left: 4px solid var(--brand-yellow); background: var(--surface-yellow); font-size: 11.5px; }
  .trust-note strong { color: var(--ink-strong); }
  .trust-note span { color: var(--muted-strong); line-height: 1.45; }
  @media (min-width: 760px) { .studio-header { grid-template-columns: minmax(0, 1fr) 260px; } .studio-grid { grid-template-columns: minmax(0, 1.05fr) minmax(300px, .95fr); } }
</style>
