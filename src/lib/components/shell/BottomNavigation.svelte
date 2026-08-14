<script lang="ts">
  import AppIcon from '$lib/components/ui/AppIcon.svelte';
  import { navigationItems, isNavigationItemActive } from '$lib/ui/design-system';

  let { pathname }: { pathname: string } = $props();
</script>

<nav class="fixed bottom-[max(0.625rem,env(safe-area-inset-bottom))] left-1/2 z-50 grid min-h-[76px] w-[min(570px,calc(100%-1rem))] -translate-x-1/2 grid-cols-5 rounded-[1.4rem] border border-white/70 bg-white/80 p-1.5 shadow-[0_22px_70px_rgb(0_88_146/0.18)] backdrop-blur-xl supports-[backdrop-filter:blur(0)]:bg-white/75 min-[940px]:hidden" aria-label="Primary">
  {#each navigationItems as item}
    <a
      class={`relative grid min-h-16 min-w-12 place-items-center content-center gap-1 rounded-2xl px-1 py-2 text-[0.68rem] font-extrabold no-underline transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] focus-visible:ring-3 focus-visible:ring-ims-blue/30 ${isNavigationItemActive(item, pathname) ? 'bg-sky-50/90 text-ims-blue-ink shadow-[inset_0_0_0_1px_rgb(0_119_184/0.1)]' : 'text-slate-500 hover:bg-white/70 hover:text-ink'}`}
      href={item.href}
      aria-current={isNavigationItemActive(item, pathname) ? 'page' : undefined}
    >
      <AppIcon name={item.icon} size={21} />
      <span>{item.label}</span>
      {#if isNavigationItemActive(item, pathname)}
        <span class="absolute bottom-1 h-0.5 w-4 rounded-full bg-ims-green" aria-hidden="true"></span>
      {/if}
    </a>
  {/each}
</nav>
