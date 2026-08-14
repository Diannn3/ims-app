<script lang="ts">
  let { current = 1 }: { current?: 1 | 2 | 3 | 4 } = $props();
  const steps = ['Upload', 'Validate', 'Review', 'Apply'];
</script>

<ol class="mb-4 grid grid-cols-4 overflow-hidden border border-line bg-white" aria-label="Import progress">
  {#each steps as label, index}
    <li class={`grid min-h-16 min-w-0 place-items-center gap-1 border-r border-line p-2 text-center text-xs text-muted last:border-r-0 sm:flex sm:justify-center ${index + 1 === current ? 'bg-sky-50 text-ims-blue-ink' : ''} ${index + 1 < current ? 'text-ims-green-deep' : ''}`} aria-current={index + 1 === current ? 'step' : undefined}>
      <span class={`grid size-6 place-items-center rounded-full border font-mono text-[0.65rem] ${index + 1 === current ? 'border-ims-blue-deep bg-ims-blue-deep text-white' : 'border-line-strong'}`}>{index + 1}</span><strong>{label}</strong>
    </li>
  {/each}
</ol>
