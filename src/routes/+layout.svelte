<script lang="ts">
  import '../app.css';
  import { onNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import AppHeader from '$lib/components/shell/AppHeader.svelte';
  import BottomNavigation from '$lib/components/shell/BottomNavigation.svelte';

  let { children } = $props();

  onMount(() => {
    document.documentElement.dataset.hydrated = 'true';
    return () => delete document.documentElement.dataset.hydrated;
  });

  onNavigate((navigation) => {
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    return new Promise<void>((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<a class="fixed -left-[9999px] top-3 z-[100] rounded-lg bg-ink px-4 py-3 font-bold text-white shadow-xl focus:left-3" href="#main-content">Skip to main content</a>

<div data-app-shell class={`min-h-screen bg-canvas text-ink ${page.url.pathname.startsWith('/admin') || page.url.pathname.startsWith('/staff') ? '' : 'pb-[calc(6rem+env(safe-area-inset-bottom))] min-[940px]:pb-0'}`}>
  <AppHeader pathname={page.url.pathname} />
  <main id="main-content" class="min-h-[65svh]" tabindex="-1">{@render children()}</main>
  {#if !page.url.pathname.startsWith('/admin') && !page.url.pathname.startsWith('/staff')}
    <BottomNavigation pathname={page.url.pathname} />
  {/if}
</div>
