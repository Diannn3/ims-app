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

<section class="empty-state card card--flat" aria-live="polite">
  <span class="badge badge--yellow">Data pending</span>
  <h2>{title}</h2>
  <p>{message}</p>
  {#if actionHref && actionLabel}
    <a class="button button--secondary" href={actionHref}>{actionLabel}</a>
  {/if}
</section>
