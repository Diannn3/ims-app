<script lang="ts">
  import GradeWorkspace from '$lib/components/grades/GradeWorkspace.svelte';
</script>

<svelte:head>
  <title>Grade Calculator · IMS Academic Hub</title>
  <meta
    name="description"
    content="Private local-first weighted grade calculator with what-if and target-grade tools."
  />
</svelte:head>

<div class="page page-stack grade-page">
  <section class="page-heading">
    <span class="eyebrow">Academic tools</span>
    <h1>Grade calculator</h1>
    <p>
      Build your grading structure from the syllabus, enter raw scores, run what-if scenarios, and
      calculate target averages. Your gradebooks stay in this browser by default.
    </p>
  </section>

  <aside class="privacy-banner card card--green">
    <div class="privacy-icon" aria-hidden="true">✓</div>
    <div>
      <strong>Local-first by design</strong>
      <p>
        Gradebook content is stored in IndexedDB on your device. It is intentionally excluded from
        the institutional academic database, admin imports, and universal search.
      </p>
    </div>
  </aside>

  <GradeWorkspace />
</div>

<style>
  .grade-page {
    gap: 22px;
  }

  .privacy-banner {
    padding: 16px;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
    align-items: center;
  }

  .privacy-icon {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    background: #fff;
    color: var(--brand-green-deep);
    font-weight: 900;
  }

  .privacy-banner strong {
    color: var(--ink-strong);
  }

  .privacy-banner p {
    margin: 3px 0 0;
    color: var(--muted);
    line-height: 1.5;
  }
</style>
