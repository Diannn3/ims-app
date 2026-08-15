<script lang="ts">
  let { message = 'This academic information could not be loaded right now.' } = $props();
</script>

<section class="academic-state academic-state--error" role="alert">
  <span class="state-marker" aria-hidden="true">!</span>
  <div class="state-copy">
    <span class="state-label">Load problem</span>
    <h2>Academic data is temporarily unavailable.</h2>
    <p>{message}</p>
    <a href="">Try again →</a>
  </div>
</section>

<style>
  .academic-state {
    min-width: 0;
    padding: 18px 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }

  .state-marker {
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    border: 1px solid var(--danger);
    border-radius: 50%;
    background: var(--danger-soft);
    color: var(--danger);
    font-size: 11px;
    font-weight: 850;
  }

  .state-copy {
    min-width: 0;
    display: grid;
    justify-items: start;
    gap: 5px;
  }

  .state-label {
    color: var(--danger);
    font-size: 10px;
    font-weight: 780;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h2 {
    margin: 0;
    color: var(--ink-strong);
    font-size: 1rem;
    letter-spacing: -0.015em;
  }

  p {
    max-width: 66ch;
    margin: 0;
    color: var(--muted);
    font-size: 12.5px;
    line-height: 1.52;
  }

  a {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    color: var(--brand-blue-ink);
    font-size: 12px;
    font-weight: 730;
    text-underline-offset: 4px;
  }
</style>
