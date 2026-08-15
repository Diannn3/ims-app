<script lang="ts">
  import SourceBadge from './SourceBadge.svelte';
  import type { CourseSummary } from '$lib/domain/academic/types';

  let { course }: { course: CourseSummary } = $props();
</script>

<article class="course-row">
  <div class="course-code identifier">{course.code}</div>
  <div class="course-copy">
    <h2><a href={`/course/${encodeURIComponent(course.code)}`}>{course.title ?? 'Course title pending'}</a></h2>
    <div class="course-meta">
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
  <a class="open-link" href={`/course/${encodeURIComponent(course.code)}`} aria-label={`Open ${course.code}`}>
    <span aria-hidden="true">→</span>
  </a>
</article>

<style>
  .course-row {
    min-width: 0;
    min-height: 104px;
    padding: 14px 1px;
    display: grid;
    grid-template-columns: minmax(82px, auto) minmax(0, 1fr) auto;
    gap: 15px;
    align-items: start;
    border-bottom: 1px solid var(--line);
    container-type: inline-size;
  }

  .course-code {
    padding-top: 2px;
    color: var(--brand-blue-ink);
    font-size: 13px;
    font-weight: 800;
  }

  .course-copy {
    min-width: 0;
    display: grid;
    gap: 7px;
  }

  h2 {
    margin: 0;
    color: var(--ink-strong);
    font-size: 1rem;
    line-height: 1.25;
  }

  h2 a {
    text-decoration: none;
  }

  h2 a:hover {
    color: var(--brand-blue-ink);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .course-meta {
    display: flex;
    gap: 8px;
    color: var(--muted);
    font-size: 11px;
    font-weight: 680;
  }

  .open-link {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: var(--radius-md);
    color: var(--brand-blue-ink);
    text-decoration: none;
  }

  .open-link:hover {
    background: var(--surface-blue);
  }

  @container (max-width: 420px) {
    .course-row {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .course-code {
      grid-column: 1;
    }

    .course-copy {
      grid-column: 1 / -1;
      grid-row: 2;
    }

    .open-link {
      grid-column: 2;
      grid-row: 1;
    }
  }
</style>
