<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import NavIcon from '$lib/components/ui/NavIcon.svelte';

  let { children } = $props();

  const navItems = [
    { href: '/', label: 'Home', icon: 'home' as const },
    { href: '/map', label: 'Map', icon: 'map' as const },
    { href: '/academics', label: 'Academics', icon: 'academics' as const },
    { href: '/people', label: 'People', icon: 'people' as const },
    { href: '/tools/grades', label: 'Tools', icon: 'tools' as const }
  ];

  function active(href: string) {
    const path = page.url.pathname;
    if (href === '/') return path === '/';
    if (href === '/academics') return path.startsWith('/academics') || path.startsWith('/course');
    if (href === '/people') return path.startsWith('/people') || path.startsWith('/faculty') || path.startsWith('/consultations');
    return path.startsWith(href);
  }
</script>

<a class="skip-link" href="#main-content">Skip to main content</a>

<div class="app-shell">
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand-lockup" href="/" aria-label="IMS Academic Hub home">
        <img class="brand-mark" src="/brand/ims-mark.png" alt="" width="38" height="38" />
        <span class="brand-copy">
          <strong>IMS Academic Hub</strong>
          <span>Math Building · UPLB</span>
        </span>
      </a>

      <nav class="desktop-nav" aria-label="Primary">
        {#each navItems as item}
          <a href={item.href} aria-current={active(item.href) ? 'page' : undefined}>{item.label}</a>
        {/each}
      </nav>

      <span class="header-status" title="Academic data is still in development">
        <span class="status-dot" aria-hidden="true"></span>
        Build phase
      </span>
    </div>
  </header>

  <main id="main-content" tabindex="-1">
    {@render children()}
  </main>

  <nav class="mobile-nav" aria-label="Primary">
    {#each navItems as item}
      <a href={item.href} aria-current={active(item.href) ? 'page' : undefined}>
        <NavIcon name={item.icon} />
        <span>{item.label}</span>
      </a>
    {/each}
  </nav>
</div>
