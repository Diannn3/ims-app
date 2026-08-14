<script lang="ts">
  import { page } from '$app/state';
  let { data, children } = $props();
  const links = [
    { href: '/admin', label: 'Data health', exact: true },
    { href: '/admin/imports', label: 'Imports', exact: false },
    { href: '/admin/review', label: 'Review queue', exact: false },
    { href: '/admin/sources', label: 'Data sources', exact: false },
    { href: '/admin/terms', label: 'Academic terms', exact: false }
  ];
</script>

<div class="mx-auto grid w-full max-w-[1180px] items-start gap-4 px-4 py-6 sm:px-6 min-[900px]:grid-cols-[14.5rem_minmax(0,1fr)]">
  <aside class="border border-line-strong bg-white p-4 min-[900px]:sticky min-[900px]:top-[5.5rem]" aria-label="Administration">
    <p class="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ims-blue-ink">Academic operations</p>
    <h1 class="mt-1 text-2xl font-semibold tracking-tight">Control room</h1>
    <p class="mt-1 text-sm capitalize text-muted">Signed in as {data.adminProfile?.role?.replace('_', ' ')}</p>
    <nav class="mt-4 grid border-y border-line" aria-label="Admin sections">{#each links as link}<a class="flex min-h-12 items-center border-b border-line px-3 font-bold text-muted no-underline last:border-b-0 hover:bg-sky-50 hover:text-ims-blue-ink aria-[current=page]:border-l-4 aria-[current=page]:border-ims-blue-deep aria-[current=page]:bg-sky-50 aria-[current=page]:text-ims-blue-ink" href={link.href} aria-current={(link.exact ? page.url.pathname === link.href : page.url.pathname === link.href || page.url.pathname.startsWith(`${link.href}/`)) ? 'page' : undefined}>{link.label}</a>{/each}</nav>
    <div class="mt-4 border-l-2 border-ims-yellow pl-3"><strong class="block">Fail closed</strong><span class="mt-1 block text-xs leading-relaxed text-muted">Imported records stay unpublished until explicitly reviewed.</span></div>
    <form method="POST" action="/staff/sign-out" class="mt-4"><button type="submit" class="min-h-11 w-full border border-line bg-white px-3 text-left font-bold text-muted hover:bg-slate-50 hover:text-ink">Sign Out</button></form>
  </aside>
  <section class="min-w-0">{@render children()}</section>
</div>
