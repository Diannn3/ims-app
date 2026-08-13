<script lang="ts">
  import NavIcon from '$lib/components/ui/NavIcon.svelte';

  const quickActions = [
    {
      href: '/map',
      title: 'Find a room',
      copy: 'Search the Math Building and open the right floor instantly.',
      icon: 'map' as const,
      tone: 'blue'
    },
    {
      href: '/consultations',
      title: 'Consultations',
      copy: 'Faculty consultation schedules will appear here once verified.',
      icon: 'calendar' as const,
      tone: 'green'
    },
    {
      href: '/services/math-clinic',
      title: 'Math Clinic',
      copy: 'Locate MB 209 and open verified academic-help information.',
      icon: 'people' as const,
      tone: 'yellow'
    },
    {
      href: '/tools/grades',
      title: 'Grade calculator',
      copy: 'Compute weighted standing without uploading your scores.',
      icon: 'tools' as const,
      tone: 'blue'
    }
  ];
</script>

<svelte:head>
  <title>IMS Academic Hub · UPLB Math Building</title>
  <meta
    name="description"
    content="Indoor navigation, academic information, faculty consultations, and private student tools for the UPLB Institute of Mathematical Sciences."
  />
</svelte:head>

<div class="page home-page">
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-copy">
      <span class="hero-kicker">UPLB · Institute of Mathematical Sciences</span>
      <h1 id="hero-title">The Math Building, made easier to navigate.</h1>
      <p>
        Find rooms, understand where academic services are, and eventually connect courses,
        faculty, consultation hours, and verified resources to the places where they happen.
      </p>

      <form class="hero-search" method="GET" action="/search" role="search">
        <label class="visually-hidden" for="home-search">Search the IMS Academic Hub</label>
        <NavIcon name="search" />
        <input
          id="home-search"
          name="q"
          type="search"
          placeholder="Try “MB 304”, “Math Clinic”, or a course code"
          autocomplete="off"
          enterkeyhint="search"
        />
        <button type="submit">Search</button>
      </form>

      <div class="hero-actions">
        <a class="button button--primary" href="/map">
          <NavIcon name="route" />
          Explore the building
        </a>
        <a class="button button--secondary" href="/academics">Browse academics</a>
      </div>
    </div>

    <div class="hero-visual" aria-label="Project status">
      <div class="brand-orbit card">
        <div class="logo-stage">
          <img src="/brand/ims-mark.png" alt="IMS logo" width="132" height="132" />
        </div>
        <div class="status-panel">
          <span class="badge badge--yellow">Data-ready build</span>
          <strong>Navigation works with structured map data.</strong>
          <p>Academic records remain unpublished until a verified source is connected.</p>
        </div>
        <div class="orbit-dot orbit-blue"></div>
        <div class="orbit-dot orbit-green"></div>
        <div class="orbit-dot orbit-yellow"></div>
      </div>
    </div>
  </section>

  <section class="quick-section" aria-labelledby="quick-title">
    <div class="section-header">
      <div>
        <span class="eyebrow">Quick actions</span>
        <h2 id="quick-title">Start with what you need.</h2>
      </div>
      <a class="button button--quiet" href="/search">Search everything →</a>
    </div>

    <div class="quick-grid">
      {#each quickActions as action}
        <a class:blue={action.tone === 'blue'} class:green={action.tone === 'green'} class:yellow={action.tone === 'yellow'} class="quick-card card" href={action.href}>
          <span class="quick-icon"><NavIcon name={action.icon} /></span>
          <span>
            <strong>{action.title}</strong>
            <small>{action.copy}</small>
          </span>
          <span class="arrow" aria-hidden="true">↗</span>
        </a>
      {/each}
    </div>
  </section>

  <section class="capability-grid" aria-label="Project capabilities">
    <article class="capability card card--blue">
      <span class="kicker">Navigation engine</span>
      <h2>Three floors, one connected route graph.</h2>
      <p>
        Semantic room geometry and client-side A* routing stay separate, so the map can improve
        visually without breaking route data.
      </p>
      <a href="/map">Open indoor explorer →</a>
    </article>

    <article class="capability card card--green">
      <span class="kicker">Academic knowledge</span>
      <h2>Built to connect courses, people, rooms, and consultations.</h2>
      <p>
        Production academic pages fail closed: if verified data does not exist yet, the app says
        so instead of inventing a schedule.
      </p>
      <a href="/academics">See academic hub →</a>
    </article>

    <article class="capability card card--yellow">
      <span class="kicker">Private tools</span>
      <h2>Your grade calculator stays on your device.</h2>
      <p>
        Student-entered scores are intentionally separate from the institutional database and are
        never required for building navigation.
      </p>
      <a href="/tools/grades">Open calculator →</a>
    </article>
  </section>

  <aside class="verification-note card" aria-label="Map verification notice">
    <div class="verification-symbol" aria-hidden="true">!</div>
    <div>
      <strong>Physical verification is still required before public wayfinding.</strong>
      <p>
        The current floor geometry was reconstructed from orientation posters. Doors, stairs,
        corridors, and accessibility details must be checked in the actual building before the
        routing system is treated as production navigation.
      </p>
    </div>
  </aside>
</div>

<style>
  .home-page {
    display: grid;
    gap: 36px;
  }

  .hero {
    min-height: min(690px, calc(100svh - 100px));
    padding: clamp(20px, 5vw, 64px) 0 22px;
    display: grid;
    align-items: center;
    gap: 38px;
  }

  .hero-copy {
    max-width: 760px;
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  .hero h1 {
    max-width: 880px;
    font-size: clamp(3rem, 10vw, 6.7rem);
    line-height: 0.88;
  }

  .hero p {
    font-size: clamp(1rem, 2.2vw, 1.18rem);
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .hero-actions :global(svg) {
    width: 18px;
    height: 18px;
  }

  .hero-search {
    width: min(680px, 100%);
    min-height: 58px;
    padding: 6px 6px 6px 16px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 9px;
    border: 1px solid var(--line-strong);
    border-radius: 19px;
    background: rgb(255 255 255 / 0.95);
    box-shadow: 0 18px 52px rgb(0 72 118 / 0.09);
  }

  .hero-search:focus-within {
    border-color: var(--brand-blue-deep);
    box-shadow: var(--focus-ring), 0 18px 52px rgb(0 72 118 / 0.09);
  }

  .hero-search :global(svg) {
    width: 21px;
    height: 21px;
    color: var(--brand-blue-ink);
  }

  .hero-search input {
    min-width: 0;
    height: 44px;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ink-strong);
  }

  .hero-search input::placeholder {
    color: #7b8b9d;
  }

  .hero-search button {
    min-height: 44px;
    padding: 0 16px;
    border: 0;
    border-radius: 14px;
    background: var(--ink-strong);
    color: #fff;
    font-weight: 820;
  }

  .hero-visual {
    display: none;
  }

  .brand-orbit {
    position: relative;
    min-height: 410px;
    padding: 30px;
    overflow: hidden;
    display: grid;
    align-content: center;
    justify-items: center;
    background:
      radial-gradient(circle at 50% 35%, rgb(0 155 255 / 0.2), transparent 12rem),
      linear-gradient(145deg, #ffffff, #eef8ff);
  }

  .brand-orbit::before,
  .brand-orbit::after {
    content: "";
    position: absolute;
    inset: 44px;
    border: 1px solid rgb(0 119 184 / 0.13);
    border-radius: 50%;
    rotate: -12deg;
  }

  .brand-orbit::after {
    inset: 80px 22px;
    rotate: 42deg;
    border-color: rgb(23 150 14 / 0.12);
  }

  .logo-stage {
    z-index: 2;
    width: 170px;
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border-radius: 42px;
    background: #fff;
    box-shadow: 0 24px 70px rgb(0 91 145 / 0.18);
  }

  .logo-stage img {
    width: 132px;
    height: 132px;
    object-fit: contain;
    background: var(--brand-blue);
    border-radius: 22px;
  }

  .status-panel {
    z-index: 2;
    width: min(330px, 100%);
    margin-top: 28px;
    display: grid;
    justify-items: center;
    gap: 8px;
    text-align: center;
  }

  .status-panel strong {
    color: var(--ink-strong);
    font-size: 1.05rem;
  }

  .status-panel p {
    margin: 0;
    color: var(--muted);
    font-size: 0.86rem;
    line-height: 1.5;
  }

  .orbit-dot {
    position: absolute;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    box-shadow: 0 0 0 8px rgb(255 255 255 / 0.7);
  }

  .orbit-blue { top: 74px; right: 52px; background: var(--brand-blue); }
  .orbit-green { bottom: 64px; left: 48px; background: var(--brand-green); }
  .orbit-yellow { top: 47%; left: 35px; background: var(--brand-yellow); }

  .quick-section {
    display: grid;
    gap: 16px;
  }

  .quick-grid {
    display: grid;
    gap: 10px;
  }

  .quick-card {
    position: relative;
    min-height: 100px;
    padding: 17px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 14px;
    text-decoration: none;
    transition: translate 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }

  .quick-card:hover {
    translate: 0 -2px;
    box-shadow: var(--shadow-md);
  }

  .quick-card.blue:hover { border-color: rgb(0 119 184 / 0.35); }
  .quick-card.green:hover { border-color: rgb(23 150 14 / 0.32); }
  .quick-card.yellow:hover { border-color: rgb(122 98 0 / 0.3); }

  .quick-icon {
    width: 45px;
    height: 45px;
    display: grid;
    place-items: center;
    border-radius: 15px;
    color: var(--brand-blue-ink);
    background: var(--surface-blue);
  }

  .green .quick-icon {
    color: var(--brand-green-deep);
    background: var(--surface-green);
  }

  .yellow .quick-icon {
    color: #675400;
    background: var(--surface-yellow);
  }

  .quick-icon :global(svg) {
    width: 22px;
    height: 22px;
  }

  .quick-card > span:nth-child(2) {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .quick-card strong {
    color: var(--ink-strong);
  }

  .quick-card small {
    color: var(--muted);
    line-height: 1.4;
  }

  .arrow {
    color: var(--muted);
    font-size: 1.1rem;
  }

  .capability-grid {
    display: grid;
    gap: 12px;
  }

  .capability {
    min-height: 260px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .capability h2 {
    margin: 12px 0 9px;
    color: var(--ink-strong);
    font-size: clamp(1.5rem, 4vw, 2.25rem);
    letter-spacing: -0.045em;
    line-height: 1;
  }

  .capability p {
    margin: 0;
    color: var(--muted);
    line-height: 1.6;
  }

  .capability a {
    margin-top: auto;
    padding-top: 22px;
    color: var(--brand-blue-ink);
    font-weight: 820;
    text-decoration: none;
  }

  .verification-note {
    padding: 18px;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 14px;
    border-style: dashed;
    background: rgb(255 255 255 / 0.7);
  }

  .verification-symbol {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: var(--surface-yellow);
    color: #5f4d00;
    font-weight: 900;
  }

  .verification-note strong {
    color: var(--ink-strong);
  }

  .verification-note p {
    margin: 4px 0 0;
    color: var(--muted);
    line-height: 1.55;
  }

  @media (min-width: 640px) {
    .quick-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 920px) {
    .hero {
      min-height: 650px;
      grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.72fr);
    }

    .hero-visual {
      display: block;
    }

    .quick-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    .quick-card {
      min-height: 180px;
      grid-template-columns: 1fr auto;
      align-content: start;
    }

    .quick-icon {
      grid-column: 1;
    }

    .quick-card > span:nth-child(2) {
      grid-column: 1 / -1;
      align-self: end;
    }

    .quick-card .arrow {
      grid-column: 2;
      grid-row: 1;
    }

    .capability-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
