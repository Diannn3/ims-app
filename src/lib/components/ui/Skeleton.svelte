<script lang="ts">
  let { lines = 3, label = 'Loading content' }: { lines?: number; label?: string } = $props();
</script>

<div class="grid gap-2.5 border border-line bg-white p-4" role="status" aria-label={label}>
  <span class="h-5 w-1/2 animate-pulse rounded bg-slate-200 motion-reduce:animate-none"></span>
  {#each Array(lines) as _, index}<span class={`h-3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none ${index === lines - 1 ? 'w-2/3' : 'w-full'}`}></span>{/each}
</div>
