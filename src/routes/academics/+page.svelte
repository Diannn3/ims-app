<script lang="ts">
  import CourseCard from '$lib/components/academic/CourseCard.svelte';
  import AcademicEmptyState from '$lib/components/academic/AcademicEmptyState.svelte';
  import AcademicErrorState from '$lib/components/academic/AcademicErrorState.svelte';
  import AppIcon from '$lib/components/ui/AppIcon.svelte';
  import PageHeader from '$lib/components/shell/PageHeader.svelte';
  import type { IconName } from '$lib/ui/design-system';
  let { data } = $props();
  const destinations: { href: string; icon: IconName; title: string; description: string }[] = [
    { href: '/consultations', icon: 'calendar', title: 'Consultations', description: 'Scheduled faculty hours' },
    { href: '/services/math-clinic', icon: 'building', title: 'Math Clinic', description: 'MB 209 & service details' },
    { href: '/people', icon: 'people', title: 'Faculty', description: 'Offices, teaching & research' },
    { href: '/research', icon: 'research', title: 'Research', description: 'Published areas & faculty' },
    { href: '/academics/forms', icon: 'document', title: 'Forms & links', description: 'Official academic resources' },
    { href: '/academics/calendar', icon: 'calendar', title: 'Academic dates', description: 'Source-tracked deadlines' },
    { href: '/academics/help', icon: 'info', title: 'Who do I ask?', description: 'Find the right person or service' },
    { href: '/events', icon: 'calendar', title: 'Events', description: 'Seminars & building activities' }
  ];
</script>

<svelte:head><title>Academics · IMS Academic Hub</title><meta name="description" content="Browse published IMS courses and academic information." /></svelte:head>

<div class="mx-auto grid w-full max-w-[1180px] gap-8 px-4 py-7 sm:px-6 sm:py-9">
  <PageHeader eyebrow="Academic knowledge" title="Courses & academic information." description="Published records are source-tracked and term-aware. Draft information never appears as official." />
  <form class="grid gap-2 border border-line-strong bg-white p-2 shadow-sm sm:grid-cols-[1fr_auto]" method="GET" role="search"><label><span class="sr-only">Search courses</span><input class="min-h-14 w-full border-0 bg-transparent px-3 font-mono text-base outline-none placeholder:font-sans placeholder:text-slate-400" type="search" name="q" value={data.query} placeholder="Try MATH 38 or a course title…" autocomplete="off" /></label><button class="min-h-12 bg-ims-blue-deep px-6 font-extrabold text-white hover:bg-ims-blue-ink focus-visible:ring-3 focus-visible:ring-ims-blue/30 sm:min-h-14" type="submit">Search Courses</button></form>

  <section class="grid gap-3" aria-labelledby="academic-nav-title"><header class="border-b border-line pb-3"><p class="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ims-blue-ink">Index</p><h2 class="mt-1 text-2xl font-semibold tracking-tight" id="academic-nav-title">Academic hub</h2></header><nav class="grid border-y border-line bg-white sm:grid-cols-2 lg:grid-cols-4" aria-label="Academic resources">{#each destinations as item}<a class="group grid min-h-28 grid-cols-[2.75rem_1fr] content-center gap-3 border-b border-line p-4 no-underline transition-colors hover:bg-sky-50/60 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ims-blue/30 sm:border-r lg:[&:nth-child(4n)]:border-r-0" href={item.href}><span class="grid size-11 place-items-center bg-slate-50 text-ims-blue-ink"><AppIcon name={item.icon} /></span><span class="min-w-0"><strong class="block text-ink-strong">{item.title}</strong><small class="mt-1 block leading-snug text-muted">{item.description}</small></span></a>{/each}</nav></section>

  <section class="grid gap-4" aria-labelledby="course-list-title"><header class="flex items-end justify-between gap-3 border-b border-line pb-3"><div><p class="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ims-blue-ink">Published data</p><h2 class="mt-1 text-2xl font-semibold tracking-tight" id="course-list-title">{data.query ? `Results for “${data.query}”` : 'Courses'}</h2></div>{#if data.courses.length}<span class="font-mono text-xs font-semibold text-muted">{data.courses.length} result{data.courses.length === 1 ? '' : 's'}</span>{/if}</header>
    {#if !data.repositoryStatus.configured}<AcademicEmptyState title="Academic data is not connected yet" message="The public repository has not been configured. Building maps and local grade tools remain available." actionHref="/map" actionLabel="Use the Building Map" />{:else if !data.repositoryStatus.available}<AcademicErrorState message={data.repositoryStatus.message} />{:else if data.courses.length === 0}<AcademicEmptyState title={data.query ? 'No published course matched that search' : 'No published courses yet'} message="Production shows no academic claims until verified course records are published." />{:else}<div class="divide-y divide-line border-y border-line bg-white lg:grid lg:grid-cols-2 lg:divide-x">{#each data.courses as course}<CourseCard {course} />{/each}</div>{/if}
  </section>
</div>
