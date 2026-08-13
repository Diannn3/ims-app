<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
  let busy = $state<string | null>(null);

  const weekday = new Intl.DateTimeFormat('en-PH', { weekday: 'short' });
  const dayName = (day: number) => weekday.format(new Date(2026, 7, 9 + day));
  const time = (value: string) => {
    const [hour, minute] = value.split(':').map(Number);
    return new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(new Date(2026, 0, 1, hour, minute));
  };

  const needsReview = $derived(data.items.filter((item: any) => item.reviewStatus !== 'verified').length);
  const verified = $derived(data.items.filter((item: any) => item.reviewStatus === 'verified' && item.publicationStatus !== 'published').length);
  const published = $derived(data.items.filter((item: any) => item.publicationStatus === 'published').length);
</script>

<svelte:head><title>Schedule review · IMS Academic Hub</title></svelte:head>

<header class="review-heading">
  <div>
    <p class="eyebrow">Publication gate</p>
    <h2>Schedule review</h2>
    <p>Imported schedules stay private until a reviewer verifies them and an administrator explicitly publishes them.</p>
  </div>
</header>

{#if form?.reviewError}
  <div class="inline-alert error" role="alert">{form.reviewError}</div>
{:else if form?.reviewSuccess}
  <div class="inline-alert success" role="status">{form.reviewSuccess}</div>
{/if}

<div class="metric-grid" aria-label="Schedule review status">
  <article class="metric-card surface-panel"><span>Needs verification</span><strong>{needsReview}</strong><small>not public</small></article>
  <article class="metric-card surface-panel"><span>Verified</span><strong>{verified}</strong><small>waiting for publication</small></article>
  <article class="metric-card surface-panel"><span>Published</span><strong>{published}</strong><small>student-facing</small></article>
</div>

{#if data.items.length === 0}
  <section class="surface-panel empty-state">
    <div class="empty-mark" aria-hidden="true">✓</div>
    <h3>No current-term schedules to review.</h3>
    <p>Apply a validated schedule import first. The review queue will populate without exposing imported rows to students.</p>
    <a class="button secondary" href="/admin/imports">Open imports</a>
  </section>
{:else}
  <div class="review-list">
    {#each data.items as item (item.id)}
      <article class="review-card surface-panel">
        <header class="review-card__head">
          <div>
            <span class="eyebrow">{item.courseCode} · Section {item.sectionCode}</span>
            <h3>{item.courseTitle ?? 'Current-term schedule'}</h3>
          </div>
          <div class="status-stack" aria-label="Status">
            <span class:verified={item.reviewStatus === 'verified'} class="status-pill">Review · {item.reviewStatus.replace('_', ' ')}</span>
            <span class:published={item.publicationStatus === 'published'} class="status-pill">Visibility · {item.publicationStatus.replace('_', ' ')}</span>
          </div>
        </header>

        <div class="schedule-grid">
          <section>
            <span class="micro-label">Meetings</span>
            {#if item.meetings.length}
              <div class="meeting-list">
                {#each item.meetings as meeting}
                  <div>
                    <strong>{dayName(meeting.weekday)}</strong>
                    <span>{time(meeting.startsAt)}–{time(meeting.endsAt)}</span>
                    {#if meeting.roomId}
                      <a href={`/room/${meeting.roomId}`}>{meeting.roomName ?? meeting.roomId.toUpperCase()}</a>
                    {:else}
                      <span class="room-tba">TBA</span>
                    {/if}
                  </div>
                {/each}
              </div>
            {:else}
              <p class="quiet">No meeting rows are attached to this section.</p>
            {/if}
          </section>

          <section>
            <span class="micro-label">Faculty</span>
            {#if item.faculty.length}
              <div class="faculty-list">
                {#each item.faculty as person}<span>{person.displayName}</span>{/each}
              </div>
            {:else}
              <p class="quiet">No resolved faculty assignment.</p>
            {/if}
          </section>
        </div>

        {#if item.lastEvent}
          <p class="audit-line">Last review action: <strong>{item.lastEvent.action}</strong>{item.lastEvent.note ? ` · ${item.lastEvent.note}` : ''}</p>
        {/if}

        <form
          method="POST"
          class="review-actions"
          use:enhance={() => {
            busy = item.id;
            return async ({ update }) => { await update(); busy = null; };
          }}
        >
          <input type="hidden" name="sectionId" value={item.id} />
          <label class="note-field">
            <span>Review note <small>optional</small></span>
            <input name="note" type="text" maxlength="500" placeholder="Add context for the audit trail" />
          </label>
          <div class="button-row">
            {#if item.reviewStatus !== 'verified'}
              <button class="button secondary" formaction="?/verify" disabled={busy === item.id}>Verify schedule</button>
            {:else}
              <button class="button ghost" formaction="?/returnForReview" disabled={busy === item.id}>Return for review</button>
            {/if}

            {#if data.canPublish}
              {#if item.publicationStatus === 'published'}
                <button class="button ghost" formaction="?/withdraw" disabled={busy === item.id}>Withdraw</button>
              {:else}
                <button class="button primary" formaction="?/publish" disabled={busy === item.id || item.reviewStatus !== 'verified'}>Publish</button>
              {/if}
            {:else}
              <span class="permission-note">Only administrators can publish.</span>
            {/if}
          </div>
        </form>
      </article>
    {/each}
  </div>
{/if}

<style>
  .review-heading { margin-bottom:1rem; }
  .review-heading h2 { margin:.15rem 0; font-size:clamp(1.8rem,5vw,2.7rem); letter-spacing:-.04em; }
  .review-heading p:not(.eyebrow) { max-width:72ch; margin:0; color:var(--text-muted); line-height:1.55; }
  .metric-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.7rem; }
  .metric-card { padding:1rem; display:grid; gap:.18rem; }
  .metric-card span,.metric-card small { color:var(--text-muted); }
  .metric-card strong { font-size:2rem; letter-spacing:-.05em; }
  .inline-alert { margin-bottom:1rem; padding:.8rem .9rem; border-radius:var(--radius-md); }
  .inline-alert.success { background:var(--ims-green-soft); color:#275623; border:1px solid color-mix(in srgb,var(--ims-green) 35%,white); }
  .inline-alert.error { background:#fff1f1; color:#8c2020; border:1px solid #f1b6b6; }
  .review-list { display:grid; gap:.8rem; margin-top:.8rem; }
  .review-card { padding:1rem; display:grid; gap:1rem; }
  .review-card__head { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
  .review-card__head h3 { margin:.2rem 0 0; font-size:1.2rem; }
  .status-stack { display:flex; flex-wrap:wrap; gap:.35rem; justify-content:flex-end; }
  .status-pill { padding:.38rem .55rem; border-radius:999px; background:var(--surface-subtle); color:var(--text-muted); font-size:.7rem; font-weight:850; text-transform:capitalize; white-space:nowrap; }
  .status-pill.verified { background:var(--ims-yellow-soft); color:#635d00; }
  .status-pill.published { background:var(--ims-green-soft); color:#275623; }
  .schedule-grid { display:grid; grid-template-columns:minmax(0,1.3fr) minmax(220px,.7fr); gap:1rem; }
  .micro-label { display:block; margin-bottom:.45rem; color:var(--text-muted); font-size:.72rem; font-weight:850; letter-spacing:.07em; text-transform:uppercase; }
  .meeting-list { display:grid; gap:.3rem; }
  .meeting-list>div { display:grid; grid-template-columns:60px minmax(150px,1fr) auto; gap:.6rem; align-items:center; min-height:44px; padding:.5rem .65rem; border:1px solid var(--line-soft); border-radius:var(--radius-sm); background:var(--surface-subtle); }
  .meeting-list a { color:var(--ims-blue-ink); font-weight:800; text-decoration:none; }
  .room-tba { color:var(--text-muted); font-size:.82rem; font-weight:750; }
  .faculty-list { display:flex; flex-wrap:wrap; gap:.4rem; }
  .faculty-list span { padding:.48rem .62rem; border-radius:999px; background:var(--ims-blue-soft); color:var(--ims-blue-ink); font-size:.82rem; font-weight:750; }
  .quiet,.audit-line,.permission-note { color:var(--text-muted); font-size:.84rem; }
  .audit-line { margin:0; padding-top:.7rem; border-top:1px solid var(--line-soft); }
  .review-actions { display:grid; gap:.7rem; padding-top:.8rem; border-top:1px solid var(--line-soft); }
  .note-field { display:grid; gap:.35rem; font-size:.82rem; font-weight:750; }
  .note-field small { color:var(--text-muted); font-weight:600; }
  .note-field input { min-height:44px; border:1px solid var(--line-strong); border-radius:var(--radius-md); padding:.62rem .72rem; background:var(--surface-raised); color:var(--text-primary); }
  .button-row { display:flex; flex-wrap:wrap; gap:.45rem; align-items:center; }
  .empty-state { margin-top:.8rem; padding:2rem 1rem; text-align:center; display:grid; justify-items:center; gap:.45rem; }
  .empty-state h3,.empty-state p { margin:0; }
  .empty-state p { max-width:58ch; color:var(--text-muted); }
  .empty-mark { width:50px; height:50px; display:grid; place-items:center; border-radius:16px; background:var(--ims-green-soft); color:var(--ims-green-deep); font-weight:900; font-size:1.3rem; }
  @media(max-width:760px){ .metric-grid { grid-template-columns:1fr; } .review-card__head { flex-direction:column; } .status-stack { justify-content:flex-start; } .schedule-grid { grid-template-columns:1fr; } }
  @media(max-width:520px){ .meeting-list>div { grid-template-columns:52px minmax(0,1fr); } .meeting-list a,.room-tba { grid-column:2; } }
</style>
