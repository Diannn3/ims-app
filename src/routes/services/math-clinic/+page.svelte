<svelte:head>
  <title>Math Clinic · IMS Academic Hub</title>
  <meta name="description" content="Math Clinic location and verified academic service information." />
</svelte:head>

<div class="page page-stack service-page">
  <section class="service-hero">
    <a class="back-link" href="/academics">← Academics</a>
    <span class="badge badge--green">Academic service</span>
    <div class="page-heading">
      <span class="eyebrow">MB 209 · Second Floor</span>
      <h1>Math Clinic</h1>
      <p>
        The service is mapped to MB 209. Schedule-specific help information remains unpublished
        until a verified IMS source is connected.
      </p>
    </div>

    <div class="cluster">
      <a class="button button--primary" href="/map?room=mb209">View on map</a>
      <a class="button button--secondary" href="/room/mb209">Room details</a>
    </div>
  </section>

  <section class="service-grid">
    <article class="card service-card card--green">
      <span class="kicker">Location</span>
      <h2>MB 209</h2>
      <p>Second Floor · Academic service</p>
      <a href="/map?room=mb209">Navigate in the building →</a>
    </article>

    <article class="card service-card">
      <span class="kicker">Schedule</span>
      <h2>No verified schedule loaded.</h2>
      <p>
        The app does not infer tutoring topics, hours, or staff availability from unrelated data.
      </p>
    </article>

    <article class="card service-card card--yellow">
      <span class="kicker">Data policy</span>
      <h2>Official information only.</h2>
      <p>
        When a public IMS source is connected, source and freshness details will be shown with the
        published service record.
      </p>
    </article>
  </section>
</div>

<style>
  .service-page { gap: 30px; }

  .service-hero {
    max-width: 850px;
    display: grid;
    justify-items: start;
    gap: 13px;
  }

  .back-link {
    color: var(--muted-strong);
    font-weight: 760;
    text-decoration: none;
  }

  .service-grid {
    display: grid;
    gap: 12px;
  }

  .service-card {
    min-height: 220px;
    padding: 21px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .service-card h2 {
    margin: 12px 0 7px;
    color: var(--ink-strong);
    font-size: 1.35rem;
    letter-spacing: -0.035em;
  }

  .service-card p {
    margin: 0;
    color: var(--muted);
    line-height: 1.55;
  }

  .service-card a {
    margin-top: auto;
    padding-top: 18px;
    color: var(--brand-blue-ink);
    font-weight: 820;
  }

  @media (min-width: 860px) {
    .service-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
