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

<div class="admin-shell">
  <aside class="admin-rail surface-panel" aria-label="Administration">
    <div class="admin-kicker">Academic operations</div>
    <h1>Control room</h1>
    <p class="admin-role">Signed in as {data.adminProfile?.role?.replace('_', ' ')}</p>
    <nav class="admin-nav">
      {#each links as link}
        <a
          href={link.href}
          aria-current={(link.exact ? page.url.pathname === link.href : page.url.pathname === link.href || page.url.pathname.startsWith(`${link.href}/`)) ? 'page' : undefined}
        >
          {link.label}
        </a>
      {/each}
    </nav>
    <div class="admin-note">
      <strong>Fail closed</strong>
      <span>Imported records stay unpublished until they are explicitly reviewed.</span>
    </div>
    <form method="POST" action="/staff/sign-out" class="sign-out-form">
      <button type="submit" class="admin-sign-out">Sign out</button>
    </form>
  </aside>

  <section class="admin-content">
    {@render children()}
  </section>
</div>

<style>
  .admin-shell { display:grid; gap:1rem; align-items:start; }
  .admin-rail { padding:1.15rem; position:relative; overflow:hidden; }
  .admin-rail::before { content:''; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(var(--ims-blue),var(--ims-green)); }
  .admin-kicker { color:var(--ims-blue-deep); font-size:.75rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
  .admin-rail h1 { margin:.35rem 0 0; font-size:clamp(1.35rem,3vw,1.8rem); }
  .admin-role { margin:.25rem 0 1rem; color:var(--text-muted); font-size:.9rem; text-transform:capitalize; }
  .admin-nav { display:grid; gap:.35rem; }
  .admin-nav a { min-height:44px; display:flex; align-items:center; padding:.65rem .75rem; border-radius:var(--radius-md); color:var(--text-secondary); font-weight:700; }
  .admin-nav a[aria-current='page'] { background:var(--ims-blue-soft); color:var(--ims-blue-ink); }
  .admin-note { margin-top:1rem; padding:.85rem; display:grid; gap:.2rem; border:1px solid var(--line-soft); border-radius:var(--radius-md); background:var(--surface-subtle); }
  .admin-note span { color:var(--text-muted); font-size:.82rem; line-height:1.45; }
  .sign-out-form { margin-top:.7rem; }
  .admin-sign-out { width:100%; min-height:44px; padding:.65rem .75rem; border:1px solid var(--line-soft); border-radius:var(--radius-md); background:transparent; color:var(--text-secondary); font-weight:750; text-align:left; }
  .admin-sign-out:hover { background:var(--surface-subtle); color:var(--text-primary); }
  .admin-content { min-width:0; }
  @media (min-width: 900px) {
    .admin-shell { grid-template-columns:230px minmax(0,1fr); }
    .admin-rail { position:sticky; top:calc(var(--header-height) + 1rem); }
  }
</style>
