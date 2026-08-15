<script lang="ts">
  let {
    title = 'No published data yet',
    message,
    actionHref = null,
    actionLabel = null
  }: {
    title?: string;
    message: string;
    actionHref?: string | null;
    actionLabel?: string | null;
  } = $props();
</script>

<section class="academic-state academic-state--pending" aria-live="polite">
  <span class="state-marker" aria-hidden="true"></span>
  <div class="state-copy">
    <span class="state-label">Data pending</span>
    <h2>{title}</h2>
    <p>{message}</p>
    {#if actionHref && actionLabel}
      <a href={actionHref}>{actionLabel} →</a>
    {/if}
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
    width: 10px;
    height: 10px;
    margin-top: 4px;
    border: 2px solid #a28a00;
    border-radius: 50%;
    background: var(--brand-yellow);
  }

  .state-copy {
    min-width: 0;
    display: grid;
    justify-items: start;
    gap: 5px;
  }

  .state-label {
    color: var(--warning);
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
