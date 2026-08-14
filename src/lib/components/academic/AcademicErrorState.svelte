<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import StatusChip from '$lib/components/ui/StatusChip.svelte';
  let { message = 'This academic information could not be loaded right now.' } = $props();
</script>

<section class="grid gap-3 border-l-4 border-danger bg-white p-5" role="alert">
  <StatusChip tone="danger" label="Load problem" />
  <h2 class="text-xl font-semibold tracking-tight text-ink-strong">Academic data is temporarily unavailable.</h2>
  <p class="max-w-prose leading-relaxed text-muted">{message}</p>
  <Button label="Try again" tone="neutral" onclick={() => location.reload()} />
</section>
