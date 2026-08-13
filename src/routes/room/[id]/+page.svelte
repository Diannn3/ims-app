<script lang="ts">
  import AcademicEmptyState from '$lib/components/academic/AcademicEmptyState.svelte';
  import { formatClock, weekdayName } from '$lib/domain/academic/formatters';
  import { floorDisplayName } from '$lib/domain/navigation/spaces';
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.space.name} · IMS Academic Hub</title>
</svelte:head>

<div class="page page-stack room-page">
  <section class="room-hero">
    <a class="back-link" href="/map">← Building map</a>
    <div class="room-code">{data.space.name}</div>
    <div class="page-heading">
      <span class="eyebrow">{floorDisplayName(data.space.floor)}</span>
      <h1>{data.space.subtitle ?? data.space.name}</h1>
      <p>{data.space.kind.replaceAll('-', ' ')} · Map status: {data.space.verificationStatus.replaceAll('-', ' ')}</p>
    </div>

    <div class="cluster">
      <a class="button button--primary" href={`/map?room=${data.space.id}`}>View on map</a>
      {#if data.space.doorNode}
        <a class="button button--secondary" href={`/map?room=${data.space.id}&route=1`}>Route from entrance</a>
      {/if}
    </div>
  </section>

  <section class="room-layout">
    <div class="schedule card">
      <div class="section-header">
        <div>
          <span class="kicker">Academic schedule</span>
          <h2>Published class meetings</h2>
        </div>
        {#if data.schedule.currentTerm}
          <span class="badge">{data.schedule.currentTerm.termName} · {data.schedule.currentTerm.academicYear}</span>
        {/if}
      </div>

      {#if !data.repositoryStatus.configured}
        <AcademicEmptyState
          title="Schedule data is not connected"
          message="The physical room information remains available even without the academic database."
        />
      {:else if data.schedule.meetings.length === 0}
        <AcademicEmptyState
          title="No published schedule is available"
          message="This means there is no verified schedule record in the app—not that the room is currently empty."
        />
      {:else}
        <div class="meeting-list">
          {#each data.schedule.meetings as meeting}
            <article class="meeting">
              <div class="time">
                <span>{weekdayName(meeting.weekday)}</span>
                <strong>{formatClock(meeting.startsAt)}–{formatClock(meeting.endsAt)}</strong>
              </div>
              <div class="course">
                <a href={`/course/${encodeURIComponent(meeting.courseCode)}`}>{meeting.courseCode}</a>
                <span>{meeting.courseTitle ?? `Section ${meeting.sectionCode}`}</span>
              </div>
              <span class="badge">Section {meeting.sectionCode}</span>
            </article>
          {/each}
        </div>
      {/if}
    </div>

    <aside class="room-meta card card--blue">
      <span class="kicker">Map metadata</span>
      <h2>About this location</h2>
      <dl>
        <div><dt>Floor</dt><dd>{floorDisplayName(data.space.floor)}</dd></div>
        <div><dt>Type</dt><dd>{data.space.kind.replaceAll('-', ' ')}</dd></div>
        <div><dt>Verification</dt><dd>{data.space.verificationStatus.replaceAll('-', ' ')}</dd></div>
      </dl>
      <p>
        The floor geometry is still based on orientation graphics and must be checked in the physical
        building before production wayfinding.
      </p>
    </aside>
  </section>
</div>

<style>
  .room-page { gap: 28px; }

  .room-hero {
    display: grid;
    justify-items: start;
    gap: 12px;
  }

  .back-link {
    color: var(--muted-strong);
    font-weight: 760;
    text-decoration: none;
  }

  .room-code {
    min-height: 52px;
    padding: 0 15px;
    display: inline-flex;
    align-items: center;
    border-radius: 16px;
    background: var(--brand-blue-deep);
    color: #fff;
    font-size: 1.05rem;
    font-weight: 920;
  }

  .room-layout {
    display: grid;
    gap: 14px;
  }

  .schedule,
  .room-meta {
    padding: 20px;
    display: grid;
    align-content: start;
    gap: 16px;
  }

  .meeting-list {
    display: grid;
    gap: 8px;
  }

  .meeting {
    min-height: 78px;
    padding: 12px;
    display: grid;
    gap: 10px;
    border: 1px solid var(--line);
    border-radius: 15px;
    background: var(--surface-soft);
  }

  .time,
  .course {
    display: grid;
    gap: 2px;
  }

  .time span,
  .course span {
    color: var(--muted);
    font-size: 0.78rem;
  }

  .time strong,
  .course a {
    color: var(--ink-strong);
    font-weight: 830;
  }

  .course a {
    color: var(--brand-blue-ink);
  }

  .room-meta h2 {
    margin: 0;
    color: var(--ink-strong);
  }

  dl {
    margin: 0;
    display: grid;
    gap: 8px;
  }

  dl div {
    min-height: 44px;
    padding: 9px 10px;
    display: flex;
    justify-content: space-between;
    gap: 14px;
    border-bottom: 1px solid var(--line);
  }

  dt {
    color: var(--muted);
  }

  dd {
    margin: 0;
    color: var(--ink-strong);
    font-weight: 760;
    text-transform: capitalize;
  }

  .room-meta p {
    margin: 0;
    color: var(--muted);
    line-height: 1.55;
  }

  @media (min-width: 680px) {
    .meeting {
      grid-template-columns: 180px 1fr auto;
      align-items: center;
    }
  }

  @media (min-width: 920px) {
    .room-layout {
      grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.65fr);
    }
  }
</style>
