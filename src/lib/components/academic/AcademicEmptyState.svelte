<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import StatusChip from '$lib/components/ui/StatusChip.svelte';
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

<section class="grid gap-3 border-l-4 border-ims-yellow bg-white p-5" aria-live="polite">
  <StatusChip tone="warning" label="Data pending" />
  <h2 class="text-xl font-semibold tracking-tight text-ink-strong">{title}</h2>
  <p class="max-w-prose leading-relaxed text-muted">{message}</p>
  {#if actionHref && actionLabel}
    <Button href={actionHref} label={actionLabel} tone="neutral" />
  {/if}
</section>
