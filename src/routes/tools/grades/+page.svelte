<script lang="ts">
  import GradeCalculator from '$lib/components/grades/GradeCalculator.svelte';
</script>

<svelte:head><title>Grade Calculator · Math Building Hub</title></svelte:head>

<main class="page grade-page">
  <section class="intro">
    <span>ACADEMIC TOOLS</span>
    <h1>Grade Calculator</h1>
    <p>Prototype weighted-grade engine. Scores are currently kept only in page state; IndexedDB persistence is the next implementation step.</p>
  </section>
  <GradeCalculator />
</main>

<style>
  .grade-page { display: grid; gap: 16px; }
  .intro span { color: #9b6b00; font-size: 11px; font-weight: 900; letter-spacing: .14em; }
  .intro h1 { color: var(--navy); font-size: clamp(34px,7vw,54px); margin: 5px 0 4px; letter-spacing: -.045em; }
  .intro p { margin: 0; color: var(--muted); max-width: 700px; line-height: 1.5; }
</style>
