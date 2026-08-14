<script lang="ts">
  import { prefersReducedMotion } from 'svelte/motion';
  import { fade, fly } from 'svelte/transition';
  import AppIcon from '$lib/components/ui/AppIcon.svelte';
  import StatusChip from '$lib/components/ui/StatusChip.svelte';
  import type { IconName } from '$lib/ui/design-system';

  const wayfinding: Array<{ href: string; title: string; copy: string }> = [
    { href: '/map', title: 'Building map', copy: 'Rooms and routes' },
    { href: '/academics', title: 'Academics', copy: 'Courses and schedules' },
    { href: '/people', title: 'People', copy: 'Faculty and consultations' }
  ];

  const tasks: Array<{ href: string; title: string; copy: string; detail: string; icon: IconName }> = [
    { href: '/map', title: 'Find a room', copy: 'Open the floor map and route from a building anchor.', detail: '3 floors', icon: 'map' },
    { href: '/academics', title: 'Browse academics', copy: 'Find published courses, sections, and room schedules.', detail: 'Verified only', icon: 'academics' },
    { href: '/consultations', title: 'Check consultations', copy: 'See faculty availability when a schedule is published.', detail: 'By faculty', icon: 'calendar' },
    { href: '/tools/grades', title: 'Plan your grades', copy: 'Model scores locally without uploading student data.', detail: 'On-device', icon: 'tools' }
  ];

  const motionDuration = $derived(prefersReducedMotion.current ? 0 : 240);
</script>

<svelte:head>
  <title>IMS Academic Hub · UPLB Math Building</title>
  <meta name="description" content="Indoor navigation, verified academic information, faculty consultations, and private student tools for the UPLB Institute of Mathematical Sciences." />
</svelte:head>

<div class="mx-auto grid w-full max-w-[1180px] gap-16 px-4 pb-20 sm:px-6 lg:gap-24">
  <section class="grid min-h-[min(620px,calc(100svh-92px))] items-center gap-10 border-b border-line py-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)] lg:py-24" aria-labelledby="hero-title">
    <div class="grid max-w-3xl justify-items-start gap-5" in:fly={{ y: prefersReducedMotion.current ? 0 : 18, duration: motionDuration }}>
      <p class="m-0 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-ims-blue-ink">
        <span class="h-0.5 w-4 rounded-full bg-ims-green" aria-hidden="true"></span>
        UPLB · Institute of Mathematical Sciences
      </p>
      <h1 id="hero-title" class="m-0 max-w-[13ch] text-5xl font-semibold leading-[0.94] tracking-[-0.055em] text-ink-strong sm:text-6xl lg:text-7xl">Where do you need to go?</h1>
      <p class="m-0 max-w-[62ch] text-lg leading-relaxed text-muted">Find a room, course, faculty member, consultation schedule, or student tool from one verified academic hub.</p>

      <form class="mt-2 grid w-full max-w-3xl gap-2" method="GET" action="/search" role="search">
        <label class="text-sm font-bold text-muted-strong" for="home-search">Search the Math Building and academic hub</label>
        <div class="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-white/80 bg-white/80 p-1.5 pl-4 shadow-[0_18px_52px_rgb(4_40_67/0.1)] backdrop-blur-xl transition-[border-color,box-shadow,background-color] duration-200 ease-out focus-within:border-ims-blue/50 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgb(0_155_255/0.15),0_18px_52px_rgb(4_40_67/0.1)]">
          <span class="text-ims-blue-ink"><AppIcon name="search" size={22} /></span>
          <input class="h-12 min-w-0 border-0 bg-transparent text-base text-ink-strong outline-none placeholder:text-slate-500" id="home-search" name="q" type="search" placeholder="Try “MB 304”, “Math Clinic”, or a course code…" autocomplete="off" enterkeyhint="search" />
          <button class="min-h-12 rounded-xl bg-ink-strong px-4 font-extrabold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-ims-blue-ink hover:shadow-md active:translate-y-0 focus-visible:ring-3 focus-visible:ring-ims-blue/30 sm:px-5" type="submit">Search</button>
        </div>
      </form>
    </div>

    <aside class="overflow-hidden rounded-2xl border border-white/80 border-t-4 border-t-ims-blue-ink bg-white/80 shadow-[0_18px_52px_rgb(4_40_67/0.11)] backdrop-blur-xl" aria-label="Building wayfinding shortcuts" in:fade={{ duration: motionDuration }}>
      <div class="flex min-h-14 items-center justify-between gap-4 bg-ink-strong px-4 text-xs font-bold text-white"><span class="font-mono">IMS / MB</span><span>Academic Hub</span></div>
      {#each wayfinding as item}
        <a class="group grid min-h-[76px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-4 py-3 text-ink no-underline transition-[background-color,color,padding] duration-200 ease-out last:border-b-0 hover:bg-sky-50/80 hover:px-5 hover:text-ims-blue-ink focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ims-blue/30" href={item.href}>
          <span class="grid min-w-0 gap-0.5"><strong class="text-base">{item.title}</strong><small class="text-sm text-muted">{item.copy}</small></span>
          <span class="transition-transform duration-200 ease-out group-hover:translate-x-0.5"><AppIcon name="next" /></span>
        </a>
      {/each}
    </aside>
  </section>

  <section class="grid gap-4" aria-labelledby="task-title" in:fly={{ y: prefersReducedMotion.current ? 0 : 14, duration: motionDuration, delay: prefersReducedMotion.current ? 0 : 60 }}>
    <div class="flex items-end justify-between gap-4">
      <div>
        <p class="m-0 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-ims-blue-ink"><span class="h-0.5 w-4 rounded-full bg-ims-green" aria-hidden="true"></span>Student shortcuts</p>
        <h2 id="task-title" class="mt-1 mb-0 text-3xl font-semibold tracking-[-0.04em] text-ink-strong">Start with the task.</h2>
      </div>
      <a class="inline-flex min-h-12 items-center gap-1 font-extrabold text-ims-blue-ink no-underline transition-[color,transform] duration-200 hover:translate-x-0.5 hover:text-ink-strong" href="/search">Search everything <AppIcon name="next" size={16} /></a>
    </div>

    <div class="grid border-y border-line-strong">
      {#each tasks as task}
        <a class="group grid min-h-[88px] grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-1 py-3 text-ink no-underline transition-[background-color,padding] duration-200 ease-out last:border-b-0 hover:bg-white/70 hover:px-3 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ims-blue/30 sm:grid-cols-[3rem_minmax(0,1fr)_auto_auto]" href={task.href}>
          <span class="grid size-11 place-items-center rounded-xl border border-line bg-white/90 text-ims-blue-ink shadow-sm transition-[border-color,box-shadow,transform] duration-200 group-hover:-translate-y-0.5 group-hover:border-ims-blue/30 group-hover:shadow-md"><AppIcon name={task.icon} size={22} /></span>
          <span class="grid min-w-0 gap-0.5"><strong class="text-base text-ink-strong">{task.title}</strong><small class="leading-snug text-muted">{task.copy}</small></span>
          <span class="hidden font-mono text-[0.68rem] uppercase tracking-[0.04em] text-muted sm:inline">{task.detail}</span>
          <span class="transition-transform duration-200 group-hover:translate-x-0.5"><AppIcon name="next" size={18} /></span>
        </a>
      {/each}
    </div>
  </section>

  <section class="grid gap-8 rounded-2xl border border-white/80 border-l-4 border-l-ims-yellow bg-white/80 p-6 shadow-sm backdrop-blur-xl lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:p-8" aria-labelledby="trust-title" in:fade={{ duration: motionDuration }}>
    <div class="grid content-start justify-items-start gap-3">
      <StatusChip tone="warning" label="Publication gate active" />
      <h2 id="trust-title" class="m-0 max-w-[24ch] text-2xl font-semibold tracking-[-0.035em] text-ink-strong sm:text-3xl">Academic records appear only after verification.</h2>
      <p class="m-0 max-w-[65ch] leading-relaxed text-muted">Rooms and navigation geometry stay separate from changing course and faculty schedules. Missing data is shown as missing—never guessed.</p>
    </div>
    <div class="grid gap-4" aria-label="Data principles">
      <div class="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2.5 text-ims-blue-ink"><AppIcon name="shield" /><span class="grid gap-0.5 text-ink"><strong>Source-aware</strong><small class="leading-snug text-muted">Every published record retains provenance.</small></span></div>
      <div class="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2.5 text-ims-blue-ink"><AppIcon name="tools" /><span class="grid gap-0.5 text-ink"><strong>Private by default</strong><small class="leading-snug text-muted">Gradebooks stay in this browser.</small></span></div>
      <div class="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2.5 text-ims-blue-ink"><AppIcon name="route" /><span class="grid gap-0.5 text-ink"><strong>Site verification pending</strong><small class="leading-snug text-muted">Use the current map as a structured prototype.</small></span></div>
    </div>
  </section>
</div>
