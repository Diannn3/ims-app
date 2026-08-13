<script lang="ts">
  import CourseCard from '$lib/components/academic/CourseCard.svelte';
  import AcademicEmptyState from '$lib/components/academic/AcademicEmptyState.svelte';
  import AcademicErrorState from '$lib/components/academic/AcademicErrorState.svelte';
  let { data } = $props();
</script>

<svelte:head>
  <title>Academics · IMS Academic Hub</title>
  <meta name="description" content="Browse published IMS courses and academic information." />
</svelte:head>

<div class="page page-stack academics-page">
  <section class="page-heading">
    <span class="eyebrow">Academic knowledge</span>
    <h1>Courses and academic information.</h1>
    <p>
      Published records are source-tracked and term-aware. Unverified class or faculty information
      never appears as if it were official.
    </p>
  </section>

  <form class="course-search card" method="GET" role="search">
    <label class="field">
      <span>Search courses</span>
      <div class="search-row">
        <input class="input" type="search" name="q" value={data.query} placeholder="Try “MATH 38” or a course title" />
        <button class="button button--primary" type="submit">Search</button>
      </div>
    </label>
  </form>

  <section class="academic-nav" aria-labelledby="academic-nav-title">
    <div class="section-header">
      <div>
        <span class="kicker">Explore</span>
        <h2 id="academic-nav-title">Academic hub</h2>
      </div>
    </div>

    <div class="academic-nav-grid">
      <a class="card nav-tile" href="/consultations">
        <span class="badge badge--green">People</span>
        <strong>Consultations</strong>
        <small>Find scheduled consultation hours once verified.</small>
      </a>
      <a class="card nav-tile" href="/services/math-clinic">
        <span class="badge badge--yellow">Service</span>
        <strong>Math Clinic</strong>
        <small>Open the MB 209 location and official service information.</small>
      </a>
      <a class="card nav-tile" href="/people">
        <span class="badge badge--blue">Directory</span>
        <strong>Faculty</strong>
        <small>Browse faculty offices, teaching, and research metadata.</small>
      </a>
      <a class="card nav-tile" href="/research">
        <span class="badge badge--green">Research</span>
        <strong>Research explorer</strong>
        <small>Browse published research areas and related faculty.</small>
      </a>
      <a class="card nav-tile" href="/academics/forms">
        <span class="badge">Resources</span>
        <strong>Forms & links</strong>
        <small>Open source-tracked official academic resources.</small>
      </a>
      <a class="card nav-tile" href="/academics/calendar">
        <span class="badge badge--yellow">Calendar</span>
        <strong>Academic dates</strong>
        <small>See published dates with their authoritative source attached.</small>
      </a>
      <a class="card nav-tile" href="/academics/help">
        <span class="badge badge--blue">Guide</span>
        <strong>Who do I ask?</strong>
        <small>Start with your concern and find the appropriate people or service.</small>
      </a>
      <a class="card nav-tile" href="/events">
        <span class="badge badge--yellow">Events</span>
        <strong>Academic events</strong>
        <small>Connect seminars and activities directly to their building spaces.</small>
      </a>
      <a class="card nav-tile" href="/search">
        <span class="badge">Universal</span>
        <strong>Search everything</strong>
        <small>Rooms, courses, faculty, and services in one place.</small>
      </a>
    </div>
  </section>

  <section class="course-section" aria-labelledby="course-list-title">
    <div class="section-header">
      <div>
        <span class="kicker">Published data</span>
        <h2 id="course-list-title">{data.query ? `Results for “${data.query}”` : 'Courses'}</h2>
      </div>
      {#if data.courses.length}
        <span class="badge">{data.courses.length} result{data.courses.length === 1 ? '' : 's'}</span>
      {/if}
    </div>

    {#if !data.repositoryStatus.configured}
      <AcademicEmptyState
        title="Academic data is not connected yet"
        message="The public academic repository has not been configured in this deployment. The map and grade tools remain available."
        actionHref="/map"
        actionLabel="Use the building map"
      />
    {:else if !data.repositoryStatus.available}
      <AcademicErrorState message={data.repositoryStatus.message} />
    {:else if data.courses.length === 0}
      <AcademicEmptyState
        title={data.query ? 'No published course matched that search' : 'No published courses yet'}
        message="Production intentionally shows no academic claims until verified course records are published."
      />
    {:else}
      <div class="course-list">
        {#each data.courses as course}
          <CourseCard {course} />
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  .academics-page {
    gap: 28px;
  }

  .course-search {
    padding: 14px;
  }

  .search-row {
    display: grid;
    gap: 8px;
  }

  .academic-nav,
  .course-section {
    display: grid;
    gap: 14px;
  }

  .academic-nav-grid,
  .course-list {
    display: grid;
    gap: 10px;
  }

  .nav-tile {
    min-height: 150px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 9px;
    text-decoration: none;
  }

  .nav-tile:hover {
    border-color: #a9c8dc;
    box-shadow: var(--shadow-md);
  }

  .nav-tile strong {
    margin-top: auto;
    color: var(--ink-strong);
    font-size: 1.12rem;
  }

  .nav-tile small {
    color: var(--muted);
    line-height: 1.45;
  }

  @media (min-width: 640px) {
    .search-row {
      grid-template-columns: 1fr auto;
    }

    .academic-nav-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 960px) {
    .academic-nav-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    .course-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
