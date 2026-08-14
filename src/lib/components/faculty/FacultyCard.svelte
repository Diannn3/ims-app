<script lang="ts">
  import SourceBadge from '$lib/components/academic/SourceBadge.svelte';
  import AppIcon from '$lib/components/ui/AppIcon.svelte';
  import type { FacultySummary } from '$lib/domain/academic/types';
  let { faculty }: { faculty: FacultySummary } = $props();
</script>

<article class="grid min-h-24 grid-cols-[3rem_minmax(0,1fr)_2.75rem] items-center gap-3 bg-white px-4 py-4">
  <div class="grid size-12 place-items-center border border-line bg-slate-50 text-ims-blue-ink" aria-hidden="true"><AppIcon name="people" size={22} /></div>
  <div class="grid min-w-0 gap-1.5"><h2 class="text-base font-bold text-ink-strong"><a class="rounded no-underline focus-visible:ring-3 focus-visible:ring-ims-blue/30" href={`/faculty/${faculty.slug}`}>{faculty.displayName}</a></h2><p class="text-sm text-muted">{faculty.title ?? 'Faculty member'}</p><SourceBadge label={faculty.meta.sourceLabel} url={faculty.meta.sourceUrl} lastVerifiedAt={faculty.meta.lastVerifiedAt} /></div>
  <a class="grid size-11 place-items-center rounded-xl text-ims-blue-ink no-underline hover:bg-sky-50 focus-visible:ring-3 focus-visible:ring-ims-blue/30" href={`/faculty/${faculty.slug}`} aria-label={`Open ${faculty.displayName}`}><AppIcon name="next" size={18} /></a>
</article>
