<script lang="ts">
  import FacultyCard from '$lib/components/faculty/FacultyCard.svelte';
  import AcademicEmptyState from '$lib/components/academic/AcademicEmptyState.svelte';
  import AcademicErrorState from '$lib/components/academic/AcademicErrorState.svelte';
  import PageHeader from '$lib/components/shell/PageHeader.svelte';
  let { data } = $props();
</script>

<svelte:head><title>Faculty · IMS Academic Hub</title><meta name="description" content="Browse published faculty profiles and office information." /></svelte:head>

<div class="mx-auto grid w-full max-w-[1180px] gap-7 px-4 py-7 sm:px-6 sm:py-9">
  <PageHeader eyebrow="People" title="Faculty, offices & consultations." description="Find verified faculty information and scheduled consultations without implying live presence." />
  <form class="grid gap-2 border border-line-strong bg-white p-2 shadow-sm sm:grid-cols-[1fr_auto]" method="GET" role="search">
    <label><span class="sr-only">Search faculty</span><input class="min-h-14 w-full border-0 bg-transparent px-3 text-base outline-none placeholder:text-slate-400" type="search" name="q" value={data.query} placeholder="Search by name or title…" autocomplete="off" /></label>
    <button class="min-h-12 bg-ims-blue-deep px-6 font-extrabold text-white hover:bg-ims-blue-ink focus-visible:ring-3 focus-visible:ring-ims-blue/30 sm:min-h-14" type="submit">Search Faculty</button>
  </form>
  <section class="grid gap-4" aria-labelledby="faculty-list-title">
    <header class="flex items-end justify-between gap-3 border-b border-line pb-3"><div><p class="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ims-blue-ink">Published directory</p><h2 class="mt-1 text-2xl font-semibold tracking-tight" id="faculty-list-title">{data.query ? `Results for “${data.query}”` : 'Faculty'}</h2></div><a class="min-h-11 rounded-lg px-3 py-2 font-bold text-ims-blue-ink no-underline hover:bg-sky-50" href="/consultations">Consultations →</a></header>
    {#if !data.repositoryStatus.configured}<AcademicEmptyState title="Faculty data is not connected yet" message="Verified faculty profiles will appear here after an official source is configured." />{:else if !data.repositoryStatus.available}<AcademicErrorState message={data.repositoryStatus.message} />{:else if data.faculty.length === 0}<AcademicEmptyState title={data.query ? 'No published faculty matched that search' : 'No published faculty profiles yet'} message="Unverified or draft faculty records are intentionally excluded from the public directory." />{:else}<div class="divide-y divide-line border-y border-line bg-white">{#each data.faculty as faculty}<FacultyCard {faculty} />{/each}</div>{/if}
  </section>
</div>
