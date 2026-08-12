<svelte:head>
  <title>Math Building Academic Hub</title>
  <meta name="description" content="Prototype indoor navigation and academic companion for the Math Building." />
</svelte:head>

<main class="page home">
  <section class="hero">
    <span class="eyebrow">MATH BUILDING</span>
    <h1>Find the room. Find the prof. Find the academic info.</h1>
    <p>Phase 0/1 prototype: semantic floor maps, indoor routing data, and a privacy-first grade calculator foundation.</p>
    <div class="actions">
      <a class="primary" href="/map">Explore the building</a>
      <a class="secondary" href="/tools/grades">Open grade calculator</a>
    </div>
  </section>

  <section class="grid" aria-label="Prototype modules">
    <a class="card module" href="/map">
      <span class="kicker">NAVIGATION</span>
      <h2>Interactive floor explorer</h2>
      <p>Ground, second, and third-floor semantic maps with searchable rooms and a prototype route engine.</p>
    </a>
    <div class="card module">
      <span class="kicker">ACADEMICS</span>
      <h2>Academic graph ready</h2>
      <p>The database schema already connects courses, sections, faculty, offices, consultations, resources, and rooms.</p>
    </div>
    <a class="card module" href="/tools/grades">
      <span class="kicker">TOOLS</span>
      <h2>Weighted grade calculator</h2>
      <p>Enter category weights and raw scores. The calculation engine is isolated from the UI so what-if and target tools can build on it.</p>
    </a>
  </section>

  <section class="notice card">
    <strong>Map status:</strong> the floor geometry is a schematic reconstruction from the three supplied orientation posters. It is intentionally marked <em>needs site verification</em> before production wayfinding.
  </section>
</main>

<style>
  .home { display: grid; gap: 26px; }
  .hero { padding: 28px 0 8px; max-width: 760px; }
  .eyebrow, .kicker { color: #9b6b00; font-size: 12px; font-weight: 900; letter-spacing: .14em; }
  h1 { color: var(--navy); font-size: clamp(36px, 7vw, 68px); line-height: .98; margin: 12px 0 16px; letter-spacing: -.055em; }
  .hero p { max-width: 650px; font-size: 18px; color: var(--muted); line-height: 1.55; }
  .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 24px; }
  .actions a { padding: 13px 17px; border-radius: 14px; font-weight: 800; text-decoration: none; }
  .primary { background: var(--navy); color: white; }
  .secondary { border: 1px solid var(--line); background: var(--surface); }
  .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(230px,1fr)); gap: 14px; }
  .module { padding: 22px; text-decoration: none; transition: transform .18s ease; }
  a.module:hover { transform: translateY(-3px); }
  .module h2 { color: var(--navy); margin: 8px 0; font-size: 22px; }
  .module p { color: var(--muted); line-height: 1.5; margin-bottom: 0; }
  .notice { padding: 18px 20px; line-height: 1.5; }
</style>
