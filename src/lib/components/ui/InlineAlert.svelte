<script lang="ts">
  import AppIcon from './AppIcon.svelte';
  import type { StatusTone } from '$lib/ui/design-system';
  let { tone = 'info', title, message }: { tone?: StatusTone; title: string; message: string } = $props();
  const classes = { neutral: 'border-line bg-slate-50 text-ink', info: 'border-sky-200 bg-sky-50 text-ims-blue-ink', success: 'border-green-200 bg-green-50 text-green-900', warning: 'border-yellow-300 bg-yellow-50 text-amber-950', danger: 'border-red-200 bg-red-50 text-red-900' } as const;
</script>

<aside class={`grid grid-cols-[auto_1fr] gap-3 border-l-4 p-4 ${classes[tone]}`} aria-live="polite">
  <AppIcon name={tone === 'danger' || tone === 'warning' ? 'warning' : tone === 'success' ? 'success' : 'info'} size={20} />
  <div class="min-w-0"><strong class="block">{title}</strong><p class="mt-1 leading-relaxed text-current/80">{message}</p></div>
</aside>
