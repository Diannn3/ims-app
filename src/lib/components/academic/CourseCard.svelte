<script lang="ts">
  import SourceBadge from './SourceBadge.svelte';
  import type { CourseSummary } from '$lib/domain/academic/types';

  let { course }: { course: CourseSummary } = $props();
</script>

<article class="course-card card">
  <div class="course-code">{course.code}</div>
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
  .course-card {
    min-height: 128px;
    padding: 16px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 14px;
    align-items: start;
    container-type: inline-size;
  }

  .course-code {
    min-width: 74px;
    min-height: 58px;
    padding: 10px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    background: var(--surface-blue);
    color: var(--brand-blue-ink);
    font-weight: 900;
    letter-spacing: -0.025em;
  }

  .course-copy {
    min-width: 0;
    display: grid;
    gap: 8px;
  }

  h2 {
    margin: 1px 0 0;
    color: var(--ink-strong);
    font-size: 1.05rem;
    line-height: 1.2;
  }

  h2 a {
    text-decoration: none;
  }

  .course-meta {
    display: flex;
    gap: 8px;
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .open-link {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: var(--brand-blue-ink);
    text-decoration: none;
  }

  .open-link:hover {
    background: var(--surface-blue);
  }

  @container (min-width: 520px) {
    .course-card {
      align-items: center;
    }

    h2 {
      font-size: 1.18rem;
    }
  }
</style>
