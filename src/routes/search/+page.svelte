<script lang="ts">
  import AcademicErrorState from '$lib/components/academic/AcademicErrorState.svelte';
  import AcademicEmptyState from '$lib/components/academic/AcademicEmptyState.svelte';
  import AppIcon from '$lib/components/ui/AppIcon.svelte';
  import PageHeader from '$lib/components/shell/PageHeader.svelte';
  import type { IconName, SearchResultKind } from '$lib/ui/design-system';
  let { data } = $props();
  const kindLabel: Record<SearchResultKind, string> = { room: 'Room / facility', course: 'Course', faculty: 'Faculty', service: 'Academic service', research: 'Research area', resource: 'Academic resource' };
  const kindIcon: Record<SearchResultKind, IconName> = { room: 'building', course: 'book', faculty: 'people', service: 'tools', research: 'research', resource: 'document' };
  const kindRail: Record<SearchResultKind, string> = { room: 'border-ims-blue-deep', course: 'border-ims-yellow', faculty: 'border-ims-green', service: 'border-sky-400', research: 'border-green-500', resource: 'border-violet-500' };
</script>

<svelte:head><title>{data.query ? `Search: ${data.query} · IMS Academic Hub` : 'Search · IMS Academic Hub'}</title></svelte:head>

<div class="mx-auto grid w-full max-w-[1180px] gap-7 px-4 py-7 sm:px-6 sm:py-9">
  <PageHeader eyebrow="Universal search" title="Search the building & academics." description="One index for rooms, courses, faculty, services, and research. Published academic records always keep their source context." />

  <form class="group grid gap-2 border border-line-strong bg-white p-2 shadow-[0_10px_35px_rgb(4_40_67/0.08)] focus-within:border-ims-blue-deep focus-within:ring-3 focus-within:ring-ims-blue/15 sm:grid-cols-[1fr_auto]" method="GET" role="search">
    <label class="relative min-w-0">
      <span class="sr-only">Search rooms and academics</span>
      <AppIcon name="search" size={22} />
      <input class="min-h-14 w-full border-0 bg-transparent pl-10 pr-3 text-lg text-ink outline-none placeholder:text-slate-400" type="search" name="q" value={data.query} placeholder="Try MB 304, MATH 38, or a faculty name…" autocomplete="off" enterkeyhint="search" maxlength="80" />
    </label>
    <button class="min-h-12 cursor-pointer bg-ims-blue-deep px-6 font-extrabold text-white transition-colors hover:bg-ims-blue-ink focus-visible:ring-3 focus-visible:ring-ims-blue/30 sm:min-h-14" type="submit">Search</button>
  </form>

  {#if data.query}
    <section class="grid gap-4" aria-labelledby="search-results-title">
      <header class="flex items-end justify-between gap-4 border-b border-line pb-3">
        <div><p class="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ims-blue-ink">Results</p><h2 class="mt-1 text-2xl font-semibold tracking-tight text-ink-strong" id="search-results-title">“{data.query}”</h2></div>
        <span class="font-mono text-xs font-semibold text-muted">{data.results.length} result{data.results.length === 1 ? '' : 's'}</span>
      </header>
      {#if data.repositoryStatus.configured && !data.repositoryStatus.available}<AcademicErrorState message="Room and facility results are still available, but academic search could not be loaded right now." />{/if}
      {#if data.results.length === 0}
        <AcademicEmptyState title={data.repositoryStatus.available ? 'Nothing published matched that search' : 'No building result matched that search'} message={data.repositoryStatus.available ? 'Try a room code such as “MB 304,” “Math Clinic,” or a shorter academic search term.' : 'Academic search is unavailable in this deployment, but room codes and facilities remain searchable.'} />
      {:else}
        <div class="divide-y divide-line border-y border-line bg-white">
          {#each data.results as result}
            <a class={`group grid min-h-20 grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 border-l-4 px-3 py-3 no-underline transition-[background-color,border-color] hover:bg-sky-50/50 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ims-blue/30 ${kindRail[result.kind as SearchResultKind]}`} href={result.href}>
              <span class="grid size-11 place-items-center bg-slate-50 text-ims-blue-ink"><AppIcon name={kindIcon[result.kind as SearchResultKind] ?? 'search'} size={21} /></span>
              <span class="grid min-w-0 gap-0.5"><span class="font-mono text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-muted">{kindLabel[result.kind as SearchResultKind]}</span><strong class="break-words text-base text-ink-strong">{result.title}</strong><small class="break-words leading-snug text-muted">{result.subtitle}</small></span>
              <span class="grid size-11 place-items-center text-ims-blue-ink transition-transform group-hover:translate-x-0.5"><AppIcon name="next" size={18} /></span>
            </a>
          {/each}
        </div>
      {/if}
      {#if !data.repositoryStatus.configured}<p class="border-l-2 border-ims-yellow pl-3 text-sm leading-relaxed text-muted">Academic database not connected. Room and facility search remains active.</p>{/if}
    </section>
  {:else}
    <section class="grid gap-3"><p class="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ims-blue-ink">Frequent searches</p><div class="grid divide-y divide-line border-y border-line bg-white sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
      {#each [['MB 304','Room'],['Math Clinic','Service'],['CR','Facility alias'],['MB 102','Math Lab']] as prompt}
        <a class="grid min-h-24 content-end gap-1 p-4 no-underline transition-colors hover:bg-sky-50 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ims-blue/30" href={`/search?q=${encodeURIComponent(prompt[0])}`}><strong class="font-mono text-ink-strong">{prompt[0]}</strong><small class="text-muted">{prompt[1]}</small></a>
      {/each}
    </div></section>
  {/if}
</div>
