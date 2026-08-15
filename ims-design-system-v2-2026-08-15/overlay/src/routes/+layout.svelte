<script lang="ts">
  import '../app.css';
  import '../design-system-v2.css';
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
    if (href === '/people') {
      return path.startsWith('/people') || path.startsWith('/faculty') || path.startsWith('/consultations');
    }
    return path.startsWith(href);
  }
</script>

<a class="skip-link" href="#main-content">Skip to main content</a>

<div class="app-shell">
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand-lockup" href="/" aria-label="IMS Academic Hub home">
        <img class="brand-mark" src="/brand/ims-mark.png" alt="" width="32" height="32" />
        <span class="brand-copy">
          <strong>IMS Academic Hub</strong>
          <span>UP Los Baños · Math Building</span>
        </span>
      </a>

      <form class="header-search" method="GET" action="/search" role="search">
        <label class="visually-hidden" for="global-search">Search rooms, courses, people, and services</label>
        <NavIcon name="search" />
        <input
          id="global-search"
          name="q"
          type="search"
          maxlength="80"
          placeholder="Room, course, person, service…"
          autocomplete="off"
          enterkeyhint="search"
        />
        <button type="submit">Go</button>
      </form>

      <nav class="desktop-nav" aria-label="Primary">
        {#each navItems as item}
          <a href={item.href} aria-current={active(item.href) ? 'page' : undefined}>{item.label}</a>
        {/each}
      </nav>

      <a class="header-search-link" href="/search" aria-label="Search IMS Academic Hub">
        <NavIcon name="search" />
      </a>
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
