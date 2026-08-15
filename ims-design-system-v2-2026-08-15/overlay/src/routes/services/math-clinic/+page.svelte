<svelte:head>
  <title>Math Clinic · IMS Academic Hub</title>
  <meta name="description" content="Math Clinic location and verified academic service information." />
</svelte:head>

<div class="page service-page">
  <header class="service-heading">
    <a class="back-link" href="/academics">← Academics</a>
    <div class="service-identity">
      <span>Academic service</span>
      <strong class="identifier">MB 209</strong>
    </div>
    <div class="page-heading">
      <span class="eyebrow">Second Floor</span>
      <h1>Math Clinic</h1>
      <p>
        The Math Clinic is mapped to MB 209. Schedule-specific help information stays unpublished
        until it is connected to a verified IMS source.
      </p>
    </div>

    <div class="service-actions">
      <a class="button button--primary" href="/map?room=mb209">View on map</a>
      <a class="button button--secondary" href="/room/mb209">Room details</a>
    </div>
  </header>

  <div class="service-record" aria-label="Math Clinic information">
    <section aria-labelledby="clinic-location-title">
      <span class="record-label">Location</span>
      <h2 id="clinic-location-title" class="identifier">MB 209</h2>
      <p>Second Floor · Mapped academic service</p>
      <a href="/map?room=mb209">Navigate in the building →</a>
    </section>

    <section aria-labelledby="clinic-schedule-title">
      <span class="record-label">Schedule</span>
      <h2 id="clinic-schedule-title">No verified schedule loaded.</h2>
      <p>
        The app does not infer tutoring topics, hours, staffing, or availability from unrelated
        records. Verified service hours will appear here when an official source is connected.
      </p>
    </section>

    <section aria-labelledby="clinic-policy-title">
      <span class="record-label">Publication rule</span>
      <h2 id="clinic-policy-title">Official information only.</h2>
      <p>
        Published service records will carry source and freshness information so students can tell
        whether details are current and verified.
      </p>
    </section>
  </div>

  <aside class="service-note" aria-label="Current Math Clinic data status">
    <span aria-hidden="true"></span>
    <div>
      <strong>Location is usable now; schedule data is intentionally absent.</strong>
      <p>You can still open MB 209 on the indoor map or view the room record.</p>
    </div>
  </aside>
</div>

<style>
  .service-page {
    display: grid;
    gap: clamp(38px, 6vw, 64px);
    padding-top: clamp(26px, 5vw, 46px);
  }

  .service-heading {
    max-width: 860px;
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

  .service-identity {
    min-height: 42px;
    padding-bottom: 8px;
    display: inline-flex;
    align-items: end;
    gap: 12px;
    border-bottom: 2px solid var(--brand-green-deep);
  }

  .service-identity span {
    color: var(--brand-green-deep);
    font-size: 10.5px;
    font-weight: 780;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .service-identity strong {
    color: var(--ink-strong);
    font-size: 1rem;
  }

  .service-actions {
    margin-top: 4px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .service-record {
    display: grid;
    border-top: 2px solid var(--ink-strong);
  }

  .service-record section {
    min-width: 0;
    padding: 18px 1px 22px;
    border-bottom: 1px solid var(--line-strong);
  }

  .record-label {
    color: var(--muted);
    font-size: 10.5px;
    font-weight: 760;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .service-record h2 {
    max-width: 24ch;
    margin: 10px 0 7px;
    color: var(--ink-strong);
    font-size: clamp(1.3rem, 3vw, 1.75rem);
    line-height: 1.08;
    letter-spacing: -0.03em;
  }

  .service-record p {
    max-width: 58ch;
    margin: 0;
    color: var(--muted-strong);
    font-size: 12.5px;
    line-height: 1.58;
  }

  .service-record a {
    min-height: 44px;
    margin-top: 12px;
    display: inline-flex;
    align-items: center;
    color: var(--brand-blue-ink);
    font-size: 12.5px;
    font-weight: 730;
    text-underline-offset: 4px;
  }

  .service-note {
    padding: 14px 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 11px;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }

  .service-note > span {
    width: 9px;
    height: 9px;
    margin-top: 3px;
    border-radius: 50%;
    background: #d3b100;
  }

  .service-note strong {
    color: var(--ink-strong);
    font-size: 12.5px;
  }

  .service-note p {
    margin: 3px 0 0;
    color: var(--muted);
    font-size: 11.5px;
    line-height: 1.5;
  }

  @media (min-width: 820px) {
    .service-record {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .service-record section {
      padding: 20px 24px;
      border-right: 1px solid var(--line);
    }

    .service-record section:first-child {
      padding-left: 1px;
    }

    .service-record section:last-child {
      padding-right: 1px;
      border-right: 0;
    }
  }
</style>
