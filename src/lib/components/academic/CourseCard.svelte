<script lang="ts">
  import SourceBadge from './SourceBadge.svelte';
  import AppIcon from '$lib/components/ui/AppIcon.svelte';
  import type { CourseSummary } from '$lib/domain/academic/types';

  let { course }: { course: CourseSummary } = $props();
</script>

<article class="grid min-h-28 grid-cols-[5.75rem_minmax(0,1fr)_2.75rem] items-start gap-3 border-b border-line bg-white px-4 py-4 transition-[background-color] hover:bg-sky-50/40 sm:items-center">
  <div class="grid min-h-14 place-items-center border-l-4 border-ims-blue-deep bg-sky-50 px-2 font-mono font-semibold tracking-tight text-ims-blue-ink" translate="no">{course.code}</div>
  <div class="grid min-w-0 gap-2">
    <h2 class="text-pretty text-[1.05rem] font-bold leading-tight text-ink-strong sm:text-lg"><a class="rounded no-underline focus-visible:ring-3 focus-visible:ring-ims-blue/30" href={`/course/${encodeURIComponent(course.code)}`}>{course.title ?? 'Course title pending'}</a></h2>
    <div class="flex gap-2 text-xs font-bold text-muted">
      {#if course.units !== null}
        <span>{course.units} unit{course.units === 1 ? '' : 's'}</span>
      {/if}
    </div>
    <SourceBadge
      label={course.meta.sourceLabel}
      url={course.meta.sourceUrl}
      lastVerifiedAt={course.meta.lastVerifiedAt}
    />
  </div>
  <a class="grid size-11 place-items-center rounded-xl text-ims-blue-ink no-underline transition-colors hover:bg-sky-100 focus-visible:ring-3 focus-visible:ring-ims-blue/30" href={`/course/${encodeURIComponent(course.code)}`} aria-label={`Open ${course.code}`}>
    <AppIcon name="next" size={18} />
  </a>
</article>
