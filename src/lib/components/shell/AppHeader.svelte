<script lang="ts">
  import AppIcon from '$lib/components/ui/AppIcon.svelte';
  import { navigationItems, isNavigationItemActive } from '$lib/ui/design-system';

  let { pathname }: { pathname: string } = $props();
</script>

<header class="sticky top-0 z-50 border-b border-line/80 bg-white/80 shadow-[0_1px_0_rgb(7_23_40/0.03)] backdrop-blur-xl supports-[backdrop-filter:blur(0)]:bg-white/70">
  <div class="mx-auto flex min-h-16 w-full max-w-[1180px] items-center gap-3 px-4 sm:px-6 min-[940px]:min-h-[74px]">
    <a class="flex min-w-0 items-center gap-2.5 rounded-xl outline-none transition-[opacity] duration-200 hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ims-blue/30" href="/" aria-label="IMS Academic Hub home" translate="no">
      <img class="size-10 shrink-0" src="/brand/ims-mark.png" alt="" width="40" height="40" fetchpriority="high" />
      <span class="grid min-w-0 leading-none">
        <strong class="truncate text-[0.98rem] font-extrabold tracking-[-0.025em] text-ink">IMS Academic Hub</strong>
        <span class="mt-1 truncate text-[0.68rem] font-bold tracking-[0.01em] text-muted">Math Building · UPLB</span>
      </span>
    </a>

    <nav class="ml-auto hidden items-center gap-1 min-[940px]:flex" aria-label="Primary">
      {#each navigationItems as item}
        <a
          class={`flex min-h-12 items-center rounded-xl px-3.5 text-sm font-bold no-underline transition-[background-color,color,box-shadow] duration-200 ease-out hover:bg-sky-50 hover:text-ims-blue-ink focus-visible:ring-3 focus-visible:ring-ims-blue/30 ${isNavigationItemActive(item, pathname) ? 'bg-sky-50 text-ims-blue-ink shadow-[inset_0_0_0_1px_rgb(0_119_184/0.1)]' : 'text-muted'}`}
          href={item.href}
          aria-current={isNavigationItemActive(item, pathname) ? 'page' : undefined}
        >{item.label}</a>
      {/each}
    </nav>

    <a class="ml-auto inline-flex min-h-12 items-center gap-2 rounded-xl border border-line-strong bg-white/80 px-3.5 font-bold text-ink no-underline shadow-sm backdrop-blur-md transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-ims-blue/40 hover:bg-white hover:shadow-md focus-visible:ring-3 focus-visible:ring-ims-blue/30 min-[940px]:ml-3" href="/search" aria-label="Search the IMS Academic Hub">
      <AppIcon name="search" size={18} />
      <span>Search</span>
    </a>
  </div>
</header>
