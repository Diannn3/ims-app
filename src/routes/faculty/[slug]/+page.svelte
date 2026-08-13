<script lang="ts">
  import AcademicEmptyState from '$lib/components/academic/AcademicEmptyState.svelte';
  import AcademicErrorState from '$lib/components/academic/AcademicErrorState.svelte';
  import SourceBadge from '$lib/components/academic/SourceBadge.svelte';
  import ConsultationSchedule from '$lib/components/faculty/ConsultationSchedule.svelte';
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.faculty ? `${data.faculty.displayName} · IMS Academic Hub` : 'Faculty · IMS Academic Hub'}</title>
</svelte:head>

<div class="page page-stack faculty-page">
  {#if !data.repositoryStatus.configured}
    <section class="page-heading">
      <span class="eyebrow">Faculty</span>
      <h1>Academic data is not connected yet.</h1>
    </section>
    <AcademicEmptyState
      message="Faculty profiles will appear here only after a verified source is configured."
      actionHref="/people"
      actionLabel="Back to faculty directory"
    />
  {:else if !data.repositoryStatus.available}
    <AcademicErrorState message={data.repositoryStatus.message} />
  {:else if data.faculty}
    <section class="faculty-hero">
      <a class="back-link" href="/people">← Faculty directory</a>
      <div class="avatar" aria-hidden="true">
        {data.faculty.displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')}
      </div>
      <div class="page-heading">
        <span class="eyebrow">Faculty profile</span>
        <h1>{data.faculty.displayName}</h1>
        <p>{data.faculty.title ?? 'Faculty member'}</p>
      </div>

      <div class="profile-actions">
        {#if data.faculty.officialEmail}
          <a class="button button--secondary" href={`mailto:${data.faculty.officialEmail}`}>Email</a>
        {/if}
        {#if data.faculty.officialProfileUrl}
          <a class="button button--secondary" href={data.faculty.officialProfileUrl} target="_blank" rel="noopener noreferrer">
            Official profile
          </a>
        {/if}
        {#if data.faculty.publicationsUrl}
          <a class="button button--quiet" href={data.faculty.publicationsUrl} target="_blank" rel="noopener noreferrer">
            Publications
          </a>
        {/if}
      </div>

      <SourceBadge
        label={data.faculty.meta.sourceLabel}
        url={data.faculty.meta.sourceUrl}
        lastVerifiedAt={data.faculty.meta.lastVerifiedAt}
      />
    </section>

    <div class="faculty-layout">
      <div class="main-column">
        <section class="profile-section card">
          <span class="kicker">Office</span>
          <h2>Where to find this faculty member</h2>
          {#if data.faculty.officeSpaceId}
            <div class="office-card">
              <div>
                <strong>{data.faculty.officeSpaceName ?? data.faculty.officeSpaceId.toUpperCase()}</strong>
                <span>Published office location</span>
              </div>
              <div class="cluster">
                <a class="button button--secondary" href={`/room/${data.faculty.officeSpaceId}`}>Room details</a>
                <a class="button button--primary" href={`/map?room=${data.faculty.officeSpaceId}`}>View on map</a>
              </div>
            </div>
          {:else}
            <p class="muted">No published office location for the current record.</p>
          {/if}
        </section>

        <section class="profile-section card">
          <span class="kicker">Scheduled consultations</span>
          <h2>Consultation hours</h2>
          <p class="section-note">
            These are scheduled consultation windows, not a claim that the faculty member is physically present right now.
          </p>
          {#if data.faculty.consultations.length}
            <ConsultationSchedule items={data.faculty.consultations} />
          {:else}
            <AcademicEmptyState
              title="No published consultation schedule"
              message="A verified consultation schedule has not been published for the current term."
            />
          {/if}
        </section>

        <section class="profile-section card">
          <span class="kicker">Teaching</span>
          <h2>Current published sections</h2>
          {#if data.faculty.currentSections.length}
            <div class="course-links">
              {#each data.faculty.currentSections as section}
                <a class="course-link" href={`/course/${encodeURIComponent(section.courseCode)}`}>
                  <span>
                    <strong>{section.courseCode}</strong>
                    <small>{section.courseTitle ?? 'Course title pending'}</small>
                  </span>
                  <span class="badge">Section {section.sectionCode}</span>
                </a>
              {/each}
            </div>
          {:else}
            <p class="muted">No published current-term teaching assignments.</p>
          {/if}
        </section>
      </div>

      <aside class="side-column">
        <section class="profile-section card card--green">
          <span class="kicker">Research</span>
          <h2>Research areas</h2>
          {#if data.faculty.researchAreas.length}
            <div class="cluster">
              {#each data.faculty.researchAreas as area}
                <span class="badge badge--green">{area.name}</span>
              {/each}
            </div>
          {:else}
            <p class="muted">No published research-area tags.</p>
          {/if}
        </section>

        {#if data.faculty.bio}
          <section class="profile-section card">
            <span class="kicker">Profile</span>
            <h2>About</h2>
            <p class="bio">{data.faculty.bio}</p>
          </section>
        {/if}
      </aside>
    </div>
  {/if}
</div>

<style>
  .faculty-page { gap: 30px; }

  .faculty-hero {
    display: grid;
    gap: 13px;
    max-width: 900px;
  }

  .back-link {
    width: fit-content;
    color: var(--muted-strong);
    font-weight: 760;
    text-decoration: none;
  }

  .avatar {
    width: 78px;
    height: 78px;
    display: grid;
    place-items: center;
    border-radius: 24px;
    background:
      linear-gradient(145deg, rgb(0 155 255 / 0.18), rgb(23 150 14 / 0.12)),
      #fff;
    color: var(--brand-blue-ink);
    font-size: 1.35rem;
    font-weight: 920;
    box-shadow: var(--shadow-sm);
  }

  .profile-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
  }

  .faculty-layout {
    display: grid;
    gap: 14px;
  }

  .main-column,
  .side-column {
    display: grid;
    align-content: start;
    gap: 14px;
  }

  .profile-section {
    padding: 20px;
    display: grid;
    gap: 12px;
  }

  .profile-section h2 {
    margin: 2px 0 0;
    color: var(--ink-strong);
    font-size: 1.35rem;
    letter-spacing: -0.035em;
  }

  .section-note,
  .bio {
    margin: 0;
    color: var(--muted);
    line-height: 1.6;
  }

  .office-card {
    display: grid;
    gap: 14px;
    align-items: center;
  }

  .office-card > div:first-child {
    display: grid;
    gap: 3px;
  }

  .office-card strong {
    color: var(--brand-blue-ink);
    font-size: 1.4rem;
  }

  .office-card span {
    color: var(--muted);
    font-size: 0.82rem;
  }

  .course-links {
    display: grid;
    gap: 8px;
  }

  .course-link {
    min-height: 66px;
    padding: 11px 12px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--surface-soft);
    text-decoration: none;
  }

  .course-link > span:first-child {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .course-link strong { color: var(--ink-strong); }
  .course-link small { color: var(--muted); }

  @media (min-width: 760px) {
    .office-card {
      grid-template-columns: 1fr auto;
    }
  }

  @media (min-width: 940px) {
    .faculty-layout {
      grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
    }
  }
</style>
