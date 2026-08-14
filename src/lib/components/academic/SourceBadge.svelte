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

<div class="flex flex-wrap items-center gap-2 text-xs">
  {#if label}
    {#if url}
      <a class="inline-flex min-h-7 items-center border border-sky-200 bg-sky-50 px-2 font-bold text-ims-blue-ink no-underline hover:border-ims-blue/40" href={url} target="_blank" rel="noopener noreferrer">Source: {label}</a>
    {:else}
      <span class="inline-flex min-h-7 items-center border border-sky-200 bg-sky-50 px-2 font-bold text-ims-blue-ink">Source: {label}</span>
    {/if}
  {:else}
    <span class="inline-flex min-h-7 items-center border border-line bg-slate-50 px-2 font-bold text-muted">Source pending</span>
  {/if}
  {#if formatted}
    <span class="font-semibold text-muted">{freshnessLabel} {formatted}</span>
  {/if}
</div>
