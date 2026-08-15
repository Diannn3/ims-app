<script lang="ts">
  import CourseCard from '$lib/components/academic/CourseCard.svelte';
  import AcademicEmptyState from '$lib/components/academic/AcademicEmptyState.svelte';
  import AcademicErrorState from '$lib/components/academic/AcademicErrorState.svelte';
  let { data } = $props();

  const academicDestinations = [
    { href: '/consultations', title: 'Consultations', copy: 'Verified faculty consultation hours.' },
    { href: '/services/math-clinic', title: 'Math Clinic', copy: 'MB 209 location and service information.' },
    { href: '/people', title: 'Faculty & people', copy: 'Offices, teaching, and research metadata.' },
    { href: '/research', title: 'Research', copy: 'Published research areas and related faculty.' },
    { href: '/academics/forms', title: 'Forms & resources', copy: 'Source-tracked official links and files.' },
    { href: '/academics/calendar', title: 'Academic dates', copy: 'Published dates with authoritative sources.' },
    { href: '/academics/help', title: 'Who do I ask?', copy: 'Route a concern to the right person or service.' },
    { href: '/events', title: 'Academic events', copy: 'Seminars and activities connected to spaces.' },
    { href: '/search', title: 'Search everything', copy: 'Rooms, courses, faculty, and services together.' }
  ];
</script>

<svelte:head>
  <title>Academics · IMS Academic Hub</title>
  <meta name="description" content="Browse published IMS courses and academic information." />
</svelte:head>

<div class="page academics-page">
  <header class="academics-heading">
    <span class="eyebrow">Academic knowledge</span>
    <h1>Verified academic information, connected to place.</h1>
    <p>
      Courses, people, schedules, services, resources, and dates are published only through the
      verified data layer. The hub remains useful even when those records are intentionally empty.
    </p>
  </header>

  <form class="course-search" method="GET" role="search">
    <label class="visually-hidden" for="course-search-input">Search published courses</label>
    <input
      id="course-search-input"
      type="search"
      name="q"
      value={data.query}
      maxlength="80"
      placeholder="Search a course code or title"
      autocomplete="off"
      enterkeyhint="search"
    />
    <button type="submit">Search courses</button>
  </form>

  <section class="academic-nav" aria-labelledby="academic-nav-title">
    <div class="section-header academic-nav__heading">
      <div>
        <span class="kicker">Explore</span>
        <h2 id="academic-nav-title">Academic hub</h2>
      </div>
    </div>

    <div class="academic-nav-list">
      {#each academicDestinations as destination, index}
        <a href={destination.href}>
          <span class="nav-index identifier">{String(index + 1).padStart(2, '0')}</span>
          <span class="nav-copy">
            <strong>{destination.title}</strong>
            <small>{destination.copy}</small>
          </span>
          <span class="nav-arrow" aria-hidden="true">→</span>
        </a>
      {/each}
    </div>
  </section>

  <section class="course-section" aria-labelledby="course-list-title">
    <div class="section-header course-heading">
      <div>
        <span class="kicker">Published data</span>
        <h2 id="course-list-title">{data.query ? `Results for “${data.query}”` : 'Courses'}</h2>
      </div>
      {#if data.courses.length}
        <span class="result-count identifier">{data.courses.length} result{data.courses.length === 1 ? '' : 's'}</span>
      {/if}
    </div>

    {#if !data.repositoryStatus.configured}
      <AcademicEmptyState
        title="Academic data is not connected yet"
        message="The public academic repository has not been configured in this deployment. The building map and private grade tools remain available."
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
    display: grid;
    gap: clamp(38px, 6vw, 62px);
    padding-top: clamp(28px, 5vw, 48px);
  }

  .academics-heading {
    max-width: 800px;
    display: grid;
    gap: 7px;
  }

  .academics-heading h1 {
    max-width: 19ch;
    margin: 0;
    color: var(--ink-strong);
    font-size: clamp(2rem, 5vw, 3.2rem);
    line-height: 1;
    letter-spacing: -0.045em;
  }

  .academics-heading p {
    max-width: 68ch;
    margin: 0;
    color: var(--muted-strong);
    line-height: 1.6;
  }

  .course-search {
    width: min(760px, 100%);
    min-height: 52px;
    padding: 4px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 5px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-lg);
    background: var(--surface);
  }

  .course-search:focus-within {
    border-color: var(--brand-blue-deep);
    box-shadow: var(--focus-ring);
  }

  .course-search input {
    min-width: 0;
    min-height: 44px;
    padding: 0 11px;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ink-strong);
    font-size: 14px;
  }

  .course-search button {
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--brand-blue-deep);
    border-radius: var(--radius-md);
    background: var(--brand-blue-deep);
    color: #fff;
    font-size: 12.5px;
    font-weight: 760;
  }

  .academic-nav,
  .course-section {
    min-width: 0;
    display: grid;
    gap: 14px;
  }

  .academic-nav__heading,
  .course-heading {
    padding-bottom: 9px;
    border-bottom: 1px solid var(--line-strong);
  }

  .academic-nav-list {
    display: grid;
  }

  .academic-nav-list a {
    min-height: 70px;
    padding: 11px 2px;
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--line);
    color: inherit;
    text-decoration: none;
  }

  .academic-nav-list a:hover,
  .academic-nav-list a:focus-visible {
    background: var(--surface-soft);
  }

  .nav-index {
    color: var(--muted);
    font-size: 10px;
  }

  .nav-copy {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  .nav-copy strong {
    color: var(--ink-strong);
    font-size: 13.5px;
  }

  .nav-copy small {
    color: var(--muted);
    font-size: 11.5px;
    line-height: 1.4;
  }

  .nav-arrow {
    color: var(--brand-blue-ink);
    font-size: 17px;
  }

  .result-count {
    color: var(--muted);
    font-size: 10.5px;
  }

  .course-list {
    display: grid;
    border-top: 1px solid var(--line);
  }

  @media (max-width: 540px) {
    .course-search {
      grid-template-columns: minmax(0, 1fr);
    }

    .course-search button {
      width: 100%;
    }
  }

  @media (min-width: 720px) {
    .academic-nav-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .academic-nav-list a:nth-child(2n) {
      padding-left: 18px;
      border-left: 1px solid var(--line);
    }
  }
</style>
