<script lang="ts">
  import SourceBadge from '$lib/components/academic/SourceBadge.svelte';
  import type { FacultySummary } from '$lib/domain/academic/types';

  let { faculty }: { faculty: FacultySummary } = $props();

  const initials = $derived(
    faculty.displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
  );
</script>

<article class="faculty-card card">
  <div class="avatar" aria-hidden="true">{initials}</div>
  <div class="copy">
    <h2><a href={`/faculty/${faculty.slug}`}>{faculty.displayName}</a></h2>
    <p>{faculty.title ?? 'Faculty member'}</p>
    <SourceBadge
      label={faculty.meta.sourceLabel}
      url={faculty.meta.sourceUrl}
      lastVerifiedAt={faculty.meta.lastVerifiedAt}
    />
  </div>
  <a class="open" href={`/faculty/${faculty.slug}`} aria-label={`Open ${faculty.displayName}`}>→</a>
</article>

<style>
  .faculty-card {
    padding: 16px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 13px;
    align-items: center;
  }

  .avatar {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    background:
      linear-gradient(145deg, rgb(0 155 255 / 0.14), rgb(23 150 14 / 0.12)),
      #fff;
    color: var(--brand-blue-ink);
    font-weight: 900;
  }

  .copy {
    min-width: 0;
    display: grid;
    gap: 6px;
  }

  h2 {
    margin: 0;
    color: var(--ink-strong);
    font-size: 1rem;
  }

  h2 a {
    text-decoration: none;
  }

  p {
    margin: 0;
    color: var(--muted);
    font-size: 0.82rem;
  }

  .open {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: var(--brand-blue-ink);
    text-decoration: none;
  }

  .open:hover {
    background: var(--surface-blue);
  }
</style>
