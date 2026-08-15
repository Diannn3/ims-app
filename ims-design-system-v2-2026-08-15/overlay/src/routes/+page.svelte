<script lang="ts">
  import NavIcon from '$lib/components/ui/NavIcon.svelte';

  const quickActions = [
    {
      href: '/map',
      title: 'Find a room',
      copy: 'Search the Math Building, open the right floor, and start directions.',
      icon: 'map' as const
    },
    {
      href: '/consultations',
      title: 'Consultations',
      copy: 'Check verified faculty consultation information when it becomes available.',
      icon: 'calendar' as const
    },
    {
      href: '/services/math-clinic',
      title: 'Math Clinic',
      copy: 'Locate MB 209 now; verified service schedules stay clearly separated.',
      icon: 'people' as const
    },
    {
      href: '/tools/grades',
      title: 'Grade workspace',
      copy: 'Calculate your standing privately. Your scores stay on this device.',
      icon: 'tools' as const
    }
  ];

  const systemStates = [
    { label: 'Indoor map', value: 'Available', tone: 'green' },
    { label: 'Academic records', value: 'Awaiting verified source', tone: 'yellow' },
    { label: 'Grade workspace', value: 'Local only', tone: 'blue' }
  ];
</script>

<svelte:head>
  <title>IMS Academic Hub · UPLB Math Building</title>
  <meta
    name="description"
    content="Indoor navigation, verified academic information, faculty consultations, and private student tools for the UPLB Institute of Mathematical Sciences."
  />
</svelte:head>

<div class="page home-page">
  <section class="home-intro" aria-labelledby="home-title">
    <div class="home-intro__main">
      <span class="eyebrow">UPLB · Institute of Mathematical Sciences</span>
      <h1 id="home-title">Find what you need in IMS.</h1>
      <p class="home-lead">
        Search rooms and building services now. Courses, faculty schedules, consultations, and
        other academic records appear only after they come from a verified source.
      </p>

      <form class="home-search" method="GET" action="/search" role="search">
        <label class="visually-hidden" for="home-search">Search the IMS Academic Hub</label>
        <NavIcon name="search" />
        <input
          id="home-search"
          name="q"
          type="search"
          maxlength="80"
          placeholder="Search MB 304, Math Clinic, a course, or a faculty member"
          autocomplete="off"
          enterkeyhint="search"
        />
        <button type="submit">Search</button>
      </form>

      <p class="search-examples">
        <span>Try</span>
        <a href="/search?q=MB+304">MB 304</a>
        <a href="/services/math-clinic">Math Clinic</a>
        <a href="/consultations">Consultations</a>
      </p>
    </div>

    <aside class="system-state" aria-labelledby="system-state-title">
      <div class="system-state__heading">
        <span class="eyebrow">Current state</span>
        <h2 id="system-state-title">What works now</h2>
      </div>

      <dl>
        {#each systemStates as state}
          <div class="state-row">
            <dt>{state.label}</dt>
            <dd>
              <span class:green={state.tone === 'green'} class:yellow={state.tone === 'yellow'} class:blue={state.tone === 'blue'} class="state-dot" aria-hidden="true"></span>
              {state.value}
            </dd>
          </div>
        {/each}
      </dl>
    </aside>
  </section>

  <section class="task-section" aria-labelledby="tasks-title">
    <div class="section-header">
      <div>
        <span class="eyebrow">Common tasks</span>
        <h2 id="tasks-title">Start with the task, not the dashboard.</h2>
      </div>
      <a class="section-link" href="/search">Search everything</a>
    </div>

    <div class="task-list">
      {#each quickActions as action}
        <a class="task-row" href={action.href}>
          <span class="task-icon" aria-hidden="true"><NavIcon name={action.icon} /></span>
          <span class="task-copy">
            <strong>{action.title}</strong>
            <small>{action.copy}</small>
          </span>
          <span class="task-arrow" aria-hidden="true">→</span>
        </a>
      {/each}
    </div>
  </section>

  <div class="home-modules">
    <section class="home-module" aria-labelledby="navigation-title">
      <span class="eyebrow">Building navigation</span>
      <h2 id="navigation-title">The map is already useful without academic data.</h2>
      <p>
        Search a room, switch floors, open a room page, or start a route from a known building
        anchor. Map geometry is still being physically verified before public wayfinding claims are
        treated as final.
      </p>
      <div class="module-actions">
        <a class="button button--primary" href="/map">
          <NavIcon name="route" />
          Open indoor map
        </a>
        <a class="button button--secondary" href="/search?q=MB+304">Find MB 304</a>
      </div>
    </section>

    <section class="home-module" aria-labelledby="academic-title">
      <span class="eyebrow">Academic information</span>
      <h2 id="academic-title">Empty by design until the source is trustworthy.</h2>
      <p>
        Current-term course sections, faculty assignments, consultations, events, and resources are
        published only after verification. Until then, the interface tells you what is missing
        instead of filling the screen with sample institutional data.
      </p>
      <div class="module-links" aria-label="Academic destinations">
        <a href="/academics"><span>Academic hub</span><span aria-hidden="true">→</span></a>
        <a href="/people"><span>Faculty & people</span><span aria-hidden="true">→</span></a>
        <a href="/academics/forms"><span>Forms & resources</span><span aria-hidden="true">→</span></a>
      </div>
    </section>
  </div>

  <aside class="verification-note" aria-labelledby="verification-title">
    <span class="verification-bar" aria-hidden="true"></span>
    <div>
      <strong id="verification-title">Site verification is still required before public wayfinding.</strong>
      <p>
        The current floor geometry was reconstructed from orientation references. Doors, stairs,
        corridors, entrances, restrictions, and accessibility details still need an in-building
        walkthrough before they are presented as authoritative.
      </p>
    </div>
    <a href="/map">Review the map</a>
  </aside>
</div>

<style>
  .home-page {
    display: grid;
    gap: clamp(42px, 7vw, 72px);
    padding-top: clamp(28px, 5vw, 54px);
  }

  .home-intro {
    display: grid;
    gap: 34px;
    align-items: start;
  }

  .home-intro__main {
    max-width: 760px;
    display: grid;
    justify-items: start;
    gap: 14px;
  }

  .home-intro h1 {
    max-width: 760px;
    margin: 0;
    color: var(--ink-strong);
    font-size: clamp(2.45rem, 7.5vw, 4.5rem);
    line-height: 0.98;
    letter-spacing: -0.05em;
  }

  .home-lead {
    max-width: 66ch;
    margin: 0;
    color: var(--muted-strong);
    font-size: clamp(1rem, 2vw, 1.08rem);
    line-height: 1.65;
  }

  .home-search {
    width: min(720px, 100%);
    min-height: 54px;
    margin-top: 8px;
    padding: 5px 5px 5px 14px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 9px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-lg);
    background: var(--surface);
  }

  .home-search:focus-within {
    border-color: var(--brand-blue-deep);
    box-shadow: var(--focus-ring);
  }

  .home-search :global(svg) {
    width: 20px;
    height: 20px;
    color: var(--brand-blue-ink);
  }

  .home-search input {
    min-width: 0;
    height: 44px;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ink-strong);
    font-size: 15px;
  }

  .home-search input::placeholder {
    color: #748493;
  }

  .home-search button {
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid var(--brand-blue-deep);
    border-radius: var(--radius-md);
    background: var(--brand-blue-deep);
    color: #fff;
    font-size: 13px;
    font-weight: 780;
  }

  .home-search button:hover {
    background: var(--brand-blue-ink);
  }

  .search-examples {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 7px 12px;
    color: var(--muted);
    font-size: 12px;
  }

  .search-examples span {
    color: var(--muted-strong);
    font-weight: 700;
  }

  .search-examples a {
    color: var(--brand-blue-ink);
    text-underline-offset: 3px;
  }

  .system-state {
    padding-top: 18px;
    border-top: 1px solid var(--line-strong);
  }

  .system-state__heading {
    display: grid;
    gap: 6px;
  }

  .system-state h2 {
    margin: 0;
    font-size: 1.12rem;
    letter-spacing: -0.02em;
  }

  .system-state dl {
    margin: 18px 0 0;
    border-top: 1px solid var(--line);
  }

  .state-row {
    min-height: 48px;
    padding: 10px 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 16px;
    border-bottom: 1px solid var(--line);
  }

  .state-row dt {
    color: var(--ink-strong);
    font-size: 13px;
    font-weight: 700;
  }

  .state-row dd {
    margin: 0;
    display: inline-flex;
    align-items: center;
    justify-content: end;
    gap: 7px;
    color: var(--muted-strong);
    font-size: 11.5px;
    font-weight: 650;
    text-align: right;
  }

  .state-dot {
    width: 8px;
    height: 8px;
    flex: none;
    border: 1px solid currentColor;
    border-radius: 50%;
  }

  .state-dot.green {
    color: var(--brand-green-deep);
    background: var(--brand-green);
  }

  .state-dot.yellow {
    color: #867000;
    background: #e1be00;
  }

  .state-dot.blue {
    color: var(--brand-blue-ink);
    background: var(--brand-blue-deep);
  }

  .task-section {
    display: grid;
    gap: 16px;
  }

  .section-link {
    min-height: 44px;
    padding: 0 2px;
    display: inline-flex;
    align-items: center;
    color: var(--brand-blue-ink);
    font-size: 12.5px;
    font-weight: 730;
    text-decoration-thickness: 1px;
    text-underline-offset: 4px;
  }

  .task-list {
    display: grid;
    border-top: 1px solid var(--line-strong);
    border-bottom: 1px solid var(--line-strong);
  }

  .task-row {
    min-height: 96px;
    padding: 15px 2px;
    display: grid;
    grid-template-columns: 30px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    border-top: 1px solid var(--line);
    color: inherit;
    text-decoration: none;
  }

  .task-row:first-child {
    border-top: 0;
  }

  .task-row:hover .task-copy strong,
  .task-row:focus-visible .task-copy strong {
    color: var(--brand-blue-ink);
  }

  .task-icon {
    align-self: start;
    padding-top: 2px;
    color: var(--brand-blue-ink);
  }

  .task-icon :global(svg) {
    width: 22px;
    height: 22px;
  }

  .task-copy {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .task-copy strong {
    color: var(--ink-strong);
    font-size: 14px;
    letter-spacing: -0.01em;
  }

  .task-copy small {
    max-width: 56ch;
    color: var(--muted);
    font-size: 12.5px;
    line-height: 1.45;
  }

  .task-arrow {
    color: var(--muted);
    font-size: 18px;
  }

  .home-modules {
    display: grid;
    gap: 36px;
  }

  .home-module {
    padding-top: 18px;
    border-top: 2px solid var(--ink-strong);
  }

  .home-module h2 {
    max-width: 22ch;
    margin: 10px 0 9px;
    font-size: clamp(1.55rem, 4vw, 2.15rem);
    line-height: 1.07;
    letter-spacing: -0.035em;
  }

  .home-module > p {
    max-width: 62ch;
    margin: 0;
    color: var(--muted-strong);
    line-height: 1.62;
  }

  .module-actions {
    margin-top: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
  }

  .module-actions :global(svg) {
    width: 17px;
    height: 17px;
  }

  .module-links {
    margin-top: 22px;
    border-top: 1px solid var(--line);
  }

  .module-links a {
    min-height: 48px;
    padding: 10px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    border-bottom: 1px solid var(--line);
    color: var(--ink-strong);
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
  }

  .module-links a:hover {
    color: var(--brand-blue-ink);
  }

  .verification-note {
    position: relative;
    padding: 16px 0 16px 17px;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }

  .verification-bar {
    position: absolute;
    left: 0;
    top: 16px;
    bottom: 16px;
    width: 3px;
    background: #d3b100;
  }

  .verification-note strong {
    color: var(--ink-strong);
    font-size: 13px;
  }

  .verification-note p {
    max-width: 76ch;
    margin: 4px 0 0;
    color: var(--muted);
    font-size: 12.5px;
    line-height: 1.55;
  }

  .verification-note a {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-self: start;
    color: var(--brand-blue-ink);
    font-size: 12.5px;
    font-weight: 730;
    text-underline-offset: 4px;
  }

  @media (min-width: 680px) {
    .task-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .task-row {
      padding: 17px 18px 17px 0;
    }

    .task-row:nth-child(2n) {
      padding-left: 18px;
      border-left: 1px solid var(--line);
    }

    .task-row:nth-child(-n + 2) {
      border-top: 0;
    }

    .verification-note {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 24px;
    }
  }

  @media (min-width: 900px) {
    .home-intro {
      grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.65fr);
      gap: clamp(48px, 7vw, 84px);
    }

    .system-state {
      margin-top: 25px;
    }

    .home-modules {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: clamp(42px, 6vw, 72px);
    }
  }

  @media (max-width: 520px) {
    .home-intro h1 {
      max-width: 12ch;
    }

    .home-search {
      grid-template-columns: auto minmax(0, 1fr);
      padding-right: 12px;
    }

    .home-search button {
      grid-column: 1 / -1;
      width: 100%;
    }

    .section-header {
      align-items: start;
      flex-direction: column;
      gap: 4px;
    }
  }
</style>
