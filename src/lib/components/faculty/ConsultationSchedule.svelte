<script lang="ts">
  import type { ConsultationSummary } from '$lib/domain/academic/types';
  import { formatConsultationWindow, weekdayName } from '$lib/domain/academic/formatters';
  let { items }: { items: ConsultationSummary[] } = $props();
  const modeLabel: Record<ConsultationSummary['mode'], string> = { in_person: 'In person', online: 'Online', hybrid: 'Hybrid', by_appointment: 'By appointment' };
</script>

<div class="divide-y divide-line border-y border-line bg-white">
  {#each items as item}
    <article class="grid gap-3 border-l-4 border-ims-green px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div class="grid gap-1"><span class="font-bold text-ink-strong">{weekdayName(item.weekday)}</span><strong class="font-mono text-ims-blue-ink">{formatConsultationWindow(item.startsAt, item.endsAt)}</strong>{#if item.notes}<p class="text-sm leading-relaxed text-muted">{item.notes}</p>{/if}</div>
      <div class="flex flex-wrap items-center gap-2"><span class="inline-flex min-h-7 items-center border border-green-200 bg-green-50 px-2 text-xs font-bold text-green-800">{modeLabel[item.mode]}</span>{#if item.spaceId}<a class="min-h-11 px-2 py-3 text-sm font-bold text-ims-blue-ink" href={`/room/${item.spaceId}`}>{item.spaceName ?? item.spaceId.toUpperCase()}</a>{/if}{#if item.appointmentUrl}<a class="inline-flex min-h-11 items-center border border-line-strong px-3 font-bold no-underline hover:bg-slate-50" href={item.appointmentUrl} target="_blank" rel="noopener noreferrer">Booking Link</a>{/if}</div>
    </article>
  {/each}
</div>
