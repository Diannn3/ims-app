<script lang="ts">
  let { name }: { name: 'home' | 'map' | 'academics' | 'people' | 'tools' | 'search' | 'route' | 'calendar' } = $props();
</script>

<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  {#if name === 'home'}
    <path d="M3.5 10.7 12 3.8l8.5 6.9" />
    <path d="M5.7 9.8v10h12.6v-10M9.5 19.8v-5.7h5v5.7" />
  {:else if name === 'map'}
    <path d="m3.5 5 5-2 7 2 5-2v16l-5 2-7-2-5 2Z" />
    <path d="M8.5 3v16M15.5 5v16" />
  {:else if name === 'academics'}
    <path d="m3 8.2 9-4.5 9 4.5-9 4.5Z" />
    <path d="M6.5 10.2v5.1c2.7 2.1 8.3 2.1 11 0v-5.1M20 9v6" />
  {:else if name === 'people'}
    <circle cx="8.2" cy="8.1" r="3.1" />
    <path d="M2.8 19.5c.6-4 2.5-6.1 5.4-6.1s4.8 2.1 5.4 6.1" />
    <path d="M14.6 5.3a3 3 0 0 1 0 5.7M15.3 13.6c3.3.2 5.2 2.1 5.8 5.9" />
  {:else if name === 'tools'}
    <path d="M4 6.2h9.6M4 11.8h16M4 17.4h12" />
    <circle cx="16.8" cy="6.2" r="2.1" />
    <circle cx="8.2" cy="11.8" r="2.1" />
    <circle cx="18.3" cy="17.4" r="2.1" />
  {:else if name === 'search'}
    <circle cx="10.6" cy="10.6" r="6.3" />
    <path d="m15.2 15.2 5 5" />
  {:else if name === 'route'}
    <circle cx="6" cy="18" r="2.2" />
    <circle cx="18" cy="6" r="2.2" />
    <path d="M7.8 16.5c2.3-2 1.2-5.2 4.2-6.5 1.4-.7 2.7-.8 4.1-2.2" />
  {:else if name === 'calendar'}
    <rect x="3.7" y="5.2" width="16.6" height="15" rx="2.2" />
    <path d="M7.5 3.7v3M16.5 3.7v3M3.7 9.4h16.6" />
  {/if}
</svg>
