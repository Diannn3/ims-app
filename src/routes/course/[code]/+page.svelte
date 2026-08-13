<script lang="ts">
  import AcademicEmptyState from '$lib/components/academic/AcademicEmptyState.svelte';
  import SourceBadge from '$lib/components/academic/SourceBadge.svelte';
  import { formatClock, weekdayName } from '$lib/domain/academic/formatters';
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.course ? `${data.course.code} · IMS Academic Hub` : 'Course · IMS Academic Hub'}</title>
</svelte:head>

<div class="page page-stack course-page">
  {#if !data.repositoryStatus.configured}
    <section class="page-heading">
      <span class="eyebrow">Course</span>
      <h1>Academic data is not connected yet.</h1>
    </section>
    <AcademicEmptyState
      message="Course details will appear here only after a verified academic data source is configured."
      actionHref="/academics"
      actionLabel="Back to academics"
    />
  {:else if data.course}
    <section class="course-hero">
      <a class="back-link" href="/academics">← Academics</a>
      <div class="code-badge">{data.course.code}</div>
      <div class="page-heading">
        <span class="eyebrow">Course</span>
        <h1>{data.course.title ?? data.course.code}</h1>
        {#if data.course.description}<p>{data.course.description}</p>{/if}
      </div>
      <div class="cluster">
        {#if data.course.units !== null}
          <span class="badge badge--blue">{data.course.units} unit{data.course.units === 1 ? '' : 's'}</span>
        {/if}
        {#if data.course.currentTerm}
          <span class="badge">{data.course.currentTerm.termName} · {data.course.currentTerm.academicYear}</span>
        {/if}
      </div>
      <SourceBadge
        label={data.course.meta.sourceLabel}
        url={data.course.meta.sourceUrl}
        lastVerifiedAt={data.course.meta.lastVerifiedAt}
      />
    </section>

    <section class="prerequisite-section" aria-labelledby="prerequisite-title">
      <div class="section-header">
        <div>
          <span class="kicker">Curriculum context</span>
          <h2 id="prerequisite-title">Prerequisites</h2>
        </div>
      </div>
      {#if data.course.prerequisites.length}
        <div class="prerequisite-list">
          {#each data.course.prerequisites as prerequisite}
            <a class="prerequisite-card card" href={`/course/${encodeURIComponent(prerequisite.code)}`}>
              <span class="badge">{prerequisite.relationshipType.replace('_', ' ')}</span>
              <strong>{prerequisite.code}</strong>
              {#if prerequisite.title}<small>{prerequisite.title}</small>{/if}
            </a>
          {/each}
        </div>
      {:else}
        <p class="muted">No published prerequisite relationship is available.</p>
      {/if}
    </section>

    <section class="sections-section" aria-labelledby="sections-title">
      <div class="section-header">
        <div>
          <span class="kicker">Current term</span>
          <h2 id="sections-title">Sections</h2>
        </div>
      </div>

      {#if data.course.sections.length === 0}
        <AcademicEmptyState
          title="No published current-term sections"
          message="The course exists, but no verified current-term section records are published. This does not mean the course is not offered."
        />
      {:else}
        <div class="section-grid">
          {#each data.course.sections as section}
            <article class="section-card card">
              <div class="section-top">
                <div>
                  <span class="kicker">Section</span>
                  <h3>{section.sectionCode}</h3>
                </div>
                <span class="badge">{section.meetings.length} meeting slot{section.meetings.length === 1 ? '' : 's'}</span>
              </div>

              <div class="section-block">
                <strong>Instructor{section.instructors.length === 1 ? '' : 's'}</strong>
                {#if section.instructors.length}
                  <div class="link-stack">
                    {#each section.instructors as instructor}
                      <a href={`/faculty/${instructor.slug}`}>{instructor.displayName}</a>
                    {/each}
                  </div>
                {:else}
                  <span class="muted">No published instructor assignment.</span>
                {/if}
              </div>

              <div class="section-block">
                <strong>Meetings</strong>
                {#if section.meetings.length}
                  <div class="meeting-list">
                    {#each section.meetings as meeting}
                      <div class="meeting">
                        <span>{weekdayName(meeting.weekday)}</span>
                        <span>{formatClock(meeting.startsAt)}–{formatClock(meeting.endsAt)}</span>
                        {#if meeting.spaceId}
                          <a href={`/room/${meeting.spaceId}`}>{meeting.spaceId.toUpperCase()}</a>
                        {:else}
                          <span class="muted">Room TBA</span>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {:else}
                  <span class="muted">No published meeting schedule.</span>
                {/if}
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>

    <aside class="privacy card card--blue">
      <div>
        <span class="kicker">Personal tools</span>
        <h2>Track your own scores separately.</h2>
        <p>The grade calculator does not write your scores into the institutional academic database.</p>
      </div>
      <a class="button button--primary" href="/tools/grades">Open grade calculator</a>
    </aside>
  {/if}
</div>

<style>
  .course-page {
    gap: 30px;
  }

  .course-hero {
    max-width: 860px;
    display: grid;
    gap: 12px;
  }

  .back-link {
    width: fit-content;
    color: var(--muted-strong);
    font-weight: 760;
    text-decoration: none;
  }

  .code-badge {
    width: fit-content;
    min-height: 48px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    border-radius: 16px;
    background: var(--brand-blue-deep);
    color: #fff;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  .sections-section,
  .section-grid,
  .prerequisite-section,
  .prerequisite-list {
    display: grid;
    gap: 12px;
  }

  .prerequisite-list {
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  }

  .prerequisite-card {
    min-height: 132px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    text-decoration: none;
  }

  .prerequisite-card strong {
    margin-top: auto;
    color: var(--brand-blue-ink);
    font-size: 1.1rem;
  }

  .prerequisite-card small {
    color: var(--muted);
    line-height: 1.4;
  }

  .section-card {
    padding: 20px;
    display: grid;
    gap: 20px;
  }

  .section-top {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: start;
  }

  .section-top h3 {
    margin: 4px 0 0;
    color: var(--ink-strong);
    font-size: 1.8rem;
    letter-spacing: -0.04em;
  }

  .section-block {
    display: grid;
    gap: 8px;
  }

  .section-block > strong {
    color: var(--muted-strong);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .link-stack,
  .meeting-list {
    display: grid;
    gap: 7px;
  }

  .link-stack a,
  .meeting a {
    color: var(--brand-blue-ink);
    font-weight: 800;
  }

  .meeting {
    min-height: 44px;
    padding: 9px 10px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 4px 12px;
    align-items: center;
    border: 1px solid var(--line);
    border-radius: 13px;
    background: var(--surface-soft);
    color: var(--muted-strong);
    font-size: 0.82rem;
  }

  .meeting a,
  .meeting .muted {
    grid-column: 1 / -1;
  }

  .privacy {
    padding: 22px;
    display: grid;
    gap: 18px;
    align-items: center;
  }

  .privacy h2 {
    margin: 6px 0 5px;
    color: var(--ink-strong);
  }

  .privacy p {
    margin: 0;
    color: var(--muted);
  }

  @media (min-width: 720px) {
    .meeting {
      grid-template-columns: 1fr auto auto;
    }

    .meeting a,
    .meeting .muted {
      grid-column: auto;
    }

    .privacy {
      grid-template-columns: 1fr auto;
    }
  }

  @media (min-width: 920px) {
    .section-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
