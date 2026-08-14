<script lang="ts">
  let { eyebrow, title, description }: { eyebrow: string; title: string; description?: string } = $props();
</script>

<header class="grid max-w-3xl gap-2">
  <p class="flex items-center gap-2 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ims-blue-ink before:h-0.5 before:w-4 before:bg-ims-green">{eyebrow}</p>
  <h1 class="text-balance text-[clamp(2rem,7vw,4rem)] font-semibold leading-[0.96] tracking-[-0.055em] text-ink-strong">{title}</h1>
  {#if description}<p class="max-w-[68ch] text-pretty text-[1.05rem] leading-relaxed text-muted">{description}</p>{/if}
</header>
