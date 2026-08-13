<script lang="ts">
  let {
    label,
    url = null,
    lastVerifiedAt = null,
    freshnessLabel = 'Verified'
  }: {
    label: string | null;
    url?: string | null;
    lastVerifiedAt?: string | null;
    freshnessLabel?: string;
  } = $props();

  const formatted = $derived(
    lastVerifiedAt
      ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(new Date(lastVerifiedAt))
      : null
  );
</script>

<div class="source-row">
  {#if label}
    {#if url}
      <a class="badge badge--blue" href={url} target="_blank" rel="noopener noreferrer">Source: {label}</a>
    {:else}
      <span class="badge badge--blue">Source: {label}</span>
    {/if}
  {:else}
    <span class="badge">Source pending</span>
  {/if}
  {#if formatted}
    <span class="freshness">{freshnessLabel} {formatted}</span>
  {/if}
</div>

<style>
  .source-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  a.badge {
    text-decoration: none;
  }

  .freshness {
    color: var(--muted);
    font-size: 11px;
    font-weight: 720;
  }
</style>
