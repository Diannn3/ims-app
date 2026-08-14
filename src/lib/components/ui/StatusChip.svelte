<script lang="ts">
  import AppIcon from './AppIcon.svelte';
  import type { IconName, StatusTone } from '$lib/ui/design-system';
  let { tone = 'neutral', label }: { tone?: StatusTone; label: string } = $props();
  const icon = $derived<IconName>(tone === 'success' ? 'success' : tone === 'warning' || tone === 'danger' ? 'warning' : 'info');
  const toneClass: Record<StatusTone, string> = {
    neutral: 'border-line bg-white/80 text-muted-strong',
    info: 'border-ims-blue/25 bg-sky-50 text-ims-blue-ink',
    success: 'border-ims-green/25 bg-green-50 text-ims-green-deep',
    warning: 'border-amber-500/30 bg-yellow-50 text-amber-800',
    danger: 'border-red-500/25 bg-red-50 text-red-800'
  };
</script>

<span class={`inline-flex min-h-7 w-fit items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-bold ${toneClass[tone]}`}><AppIcon name={icon} size={14} />{label}</span>
