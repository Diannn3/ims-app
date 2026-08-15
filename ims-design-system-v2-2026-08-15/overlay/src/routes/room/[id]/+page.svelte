<script lang="ts">
  import AcademicEmptyState from '$lib/components/academic/AcademicEmptyState.svelte';
  import AcademicErrorState from '$lib/components/academic/AcademicErrorState.svelte';
  import { formatClock, weekdayName } from '$lib/domain/academic/formatters';
  import { floorDisplayName } from '$lib/domain/navigation/spaces';
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.space.name} · IMS Academic Hub</title>
</svelte:head>

<div class="page room-page">
  <header class="room-heading">
    <a class="back-link" href="/map">← Building map</a>

    <div class="room-identity">
      <strong class="identifier">{data.space.name}</strong>
      <span>{floorDisplayName(data.space.floor)}</span>
    </div>

    <div class="page-heading">
      <span class="eyebrow">Mapped location</span>
      <h1>{data.space.subtitle ?? data.space.name}</h1>
      <p>
        {data.space.kind.replaceAll('-', ' ')} · Geometry status:
        {data.space.verificationStatus.replaceAll('-', ' ')}
      </p>
    </div>

    <div class="room-actions">
      <a class="button button--primary" href={`/map?room=${data.space.id}`}>View on map</a>
      {#if data.space.doorNode}
        <a class="button button--secondary" href={`/map?room=${data.space.id}&route=1`}>Route from entrance</a>
      {/if}
    </div>
  </header>

  <div class="room-layout">
    <section class="schedule" aria-labelledby="room-schedule-title">
      <div class="section-header schedule-heading">
        <div>
          <span class="kicker">Academic schedule</span>
          <h2 id="room-schedule-title">Published class meetings</h2>
        </div>
        {#if data.schedule.currentTerm}
          <span class="term-label">{data.schedule.currentTerm.termName} · {data.schedule.currentTerm.academicYear}</span>
        {/if}
      </div>

      {#if !data.repositoryStatus.configured}
        <AcademicEmptyState
          title="Schedule data is not connected"
          message="The room and map information remain available even without the academic database."
        />
      {:else if !data.repositoryStatus.available}
        <AcademicErrorState message={data.repositoryStatus.message} />
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
                <a class="identifier" href={`/course/${encodeURIComponent(meeting.courseCode)}`}>{meeting.courseCode}</a>
                <span>{meeting.courseTitle ?? `Section ${meeting.sectionCode}`}</span>
              </div>
              <span class="section-code identifier">{meeting.sectionCode}</span>
            </article>
          {/each}
        </div>
      {/if}
    </section>

    <aside class="room-meta" aria-labelledby="room-meta-title">
      <div class="room-meta__heading">
        <span class="kicker">Location record</span>
        <h2 id="room-meta-title">About this place</h2>
      </div>

      <dl>
        <div><dt>Room</dt><dd class="identifier">{data.space.name}</dd></div>
        <div><dt>Floor</dt><dd>{floorDisplayName(data.space.floor)}</dd></div>
        <div><dt>Type</dt><dd>{data.space.kind.replaceAll('-', ' ')}</dd></div>
        <div><dt>Verification</dt><dd>{data.space.verificationStatus.replaceAll('-', ' ')}</dd></div>
      </dl>

      <div class="verification-note">
        <span aria-hidden="true"></span>
        <p>
          Floor geometry still comes from orientation references and needs an in-building walkthrough
          before production wayfinding is treated as authoritative.
        </p>
      </div>
    </aside>
  </div>
</div>

<style>
  .room-page {
    display: grid;
    gap: clamp(36px, 6vw, 60px);
    padding-top: clamp(26px, 5vw, 46px);
  }

  .room-heading {
    max-width: 880px;
    display: grid;
    justify-items: start;
    gap: 12px;
  }

  .back-link {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    color: var(--muted-strong);
    font-size: 12.5px;
    font-weight: 720;
    text-decoration: none;
  }

  .back-link:hover {
    color: var(--brand-blue-ink);
  }

  .room-identity {
    min-height: 42px;
    padding: 0 0 9px;
    display: inline-flex;
    align-items: end;
    gap: 12px;
    border-bottom: 2px solid var(--brand-blue-deep);
  }

  .room-identity strong {
    color: var(--brand-blue-ink);
    font-size: 1.1rem;
  }

  .room-identity span {
    padding-bottom: 1px;
    color: var(--muted);
    font-size: 11px;
    font-weight: 680;
  }

  .room-actions {
    margin-top: 4px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .room-layout {
    display: grid;
    gap: 36px;
  }

  .schedule,
  .room-meta {
    min-width: 0;
    padding-top: 16px;
    border-top: 2px solid var(--ink-strong);
  }

  .schedule {
    display: grid;
    gap: 16px;
  }

  .schedule-heading {
    padding-bottom: 10px;
    border-bottom: 1px solid var(--line);
  }

  .term-label {
    color: var(--muted);
    font-family: ui-monospace, monospace;
    font-size: 10.5px;
  }

  .meeting-list {
    display: grid;
  }

  .meeting {
    min-height: 76px;
    padding: 11px 1px;
    display: grid;
    gap: 9px;
    border-bottom: 1px solid var(--line);
  }

  .time,
  .course {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .time span,
  .course span {
    color: var(--muted);
    font-size: 11px;
  }

  .time strong,
  .course a {
    color: var(--ink-strong);
    font-size: 13px;
    font-weight: 760;
  }

  .course a {
    color: var(--brand-blue-ink);
    text-underline-offset: 3px;
  }

  .section-code {
    justify-self: start;
    color: var(--muted-strong);
    font-size: 10.5px;
  }

  .room-meta {
    align-content: start;
  }

  .room-meta__heading h2 {
    margin: 3px 0 0;
    font-size: 1.15rem;
    letter-spacing: -0.025em;
  }

  .room-meta dl {
    margin: 16px 0 0;
    display: grid;
    border-top: 1px solid var(--line);
  }

  .room-meta dl div {
    min-height: 46px;
    padding: 9px 1px;
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
    gap: 16px;
    align-items: center;
    border-bottom: 1px solid var(--line);
  }

  .room-meta dt {
    color: var(--muted);
    font-size: 11.5px;
  }

  .room-meta dd {
    margin: 0;
    color: var(--ink-strong);
    font-size: 12px;
    font-weight: 700;
    text-align: right;
    text-transform: capitalize;
  }

  .verification-note {
    margin-top: 16px;
    padding: 13px 0 0 14px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 10px;
    border-top: 1px solid var(--line);
  }

  .verification-note > span {
    width: 8px;
    height: 8px;
    margin-top: 4px;
    border-radius: 50%;
    background: #d3b100;
  }

  .verification-note p {
    margin: 0;
    color: var(--muted);
    font-size: 11.5px;
    line-height: 1.5;
  }

  @media (min-width: 680px) {
    .meeting {
      grid-template-columns: 150px minmax(0, 1fr) auto;
      align-items: center;
    }

    .section-code {
      justify-self: end;
    }
  }

  @media (min-width: 920px) {
    .room-layout {
      grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
      gap: clamp(48px, 7vw, 80px);
    }
  }
</style>
