<svelte:head><title>Academic help · IMS Academic Hub</title></svelte:head>

<div class="page page-stack help-page">
  <section class="page-heading">
    <span class="eyebrow">Who do I ask?</span>
    <h1>Start with the kind of help you need.</h1>
    <p>This guide routes students to published people, services, and official resources. It does not replace academic advising decisions.</p>
  </section>

  <section class="help-grid" aria-label="Academic help paths">
    <article class="help-card card card--blue">
      <span class="badge badge--blue">Course concern</span>
      <h2>I need help with a class.</h2>
      <p>Open the course, find its published instructor, then view scheduled consultation hours.</p>
      <div class="cluster"><a class="button button--primary" href="/academics">Browse courses</a><a class="button button--secondary" href="/consultations">Consultations</a></div>
    </article>
    <article class="help-card card card--green">
      <span class="badge badge--green">Math help</span>
      <h2>I need help understanding a topic.</h2>
      <p>Start with the Math Clinic service page and its published location or service information.</p>
      <a class="button button--primary" href="/services/math-clinic">Open Math Clinic</a>
    </article>
    <article class="help-card card">
      <span class="badge">Process / form</span>
      <h2>I need an academic form or template.</h2>
      <p>Use source-tracked official resource links rather than old copies shared in group chats.</p>
      <a class="button button--secondary" href="/academics/forms">Academic resources</a>
    </article>
    <article class="help-card card card--yellow">
      <span class="badge badge--yellow">Research</span>
      <h2>I want to explore research areas.</h2>
      <p>Browse published research areas and faculty whose public profiles are associated with them.</p>
      <a class="button button--secondary" href="/research">Research explorer</a>
    </article>
  </section>
</div>

<style>
  .help-grid { display:grid; gap:12px; }
  .help-card { min-height:240px; padding:20px; display:flex; flex-direction:column; align-items:flex-start; gap:10px; }
  .help-card h2 { margin:auto 0 0; color:var(--ink-strong); font-size:1.35rem; letter-spacing:-.035em; }
  .help-card p { margin:0; color:var(--muted); line-height:1.55; }
  .help-card > .button,.help-card > .cluster { margin-top:4px; }
  @media (min-width:720px){ .help-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
</style>
