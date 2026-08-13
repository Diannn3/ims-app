<script lang="ts">
  let { data, form } = $props();
</script>

<svelte:head>
  <title>Staff sign in · IMS Academic Hub</title>
  <meta
    name="description"
    content="Restricted staff access for IMS Academic Hub data review and administration."
  />
</svelte:head>

<div class="page auth-page">
  <section class="auth-shell surface-panel" aria-labelledby="staff-sign-in-title">
    <div class="auth-brand">
      <img src="/brand/ims-mark.png" alt="" width="64" height="64" />
      <div>
        <span class="eyebrow">Restricted workspace</span>
        <h1 id="staff-sign-in-title">Staff sign in</h1>
        <p>Access schedule staging, data review, and publication controls.</p>
      </div>
    </div>

    {#if !data.configured}
      <div class="auth-alert" role="status">
        <strong>Authentication is not configured.</strong>
        <span>Add the Supabase public environment values before staff access can be used.</span>
      </div>
    {/if}

    {#if form?.message}
      <div class="auth-alert auth-alert--error" role="alert">{form.message}</div>
    {/if}

    <form method="POST" class="auth-form">
      <input type="hidden" name="next" value={data.next} />

      <label class="field">
        <span>Staff email</span>
        <input
          class="input"
          name="email"
          type="email"
          autocomplete="username"
          inputmode="email"
          value={form?.email ?? ''}
          required
        />
      </label>

      <label class="field">
        <span>Password</span>
        <input
          class="input"
          name="password"
          type="password"
          autocomplete="current-password"
          required
        />
      </label>

      <button class="button button--primary" type="submit" disabled={!data.configured}>
        Sign in to staff workspace
      </button>
    </form>

    <div class="auth-footnote">
      <strong>Public student features never require this account.</strong>
      <span>Map, courses, faculty pages, consultations, and local grade tools remain separate from staff administration.</span>
    </div>
  </section>
</div>

<style>
  .auth-page {
    min-height: calc(100svh - 120px);
    display: grid;
    place-items: center;
  }

  .auth-shell {
    width: min(620px, 100%);
    padding: clamp(1.1rem, 4vw, 1.65rem);
    display: grid;
    gap: 1.2rem;
    overflow: hidden;
    position: relative;
  }

  .auth-shell::after {
    content: '';
    position: absolute;
    width: 190px;
    height: 190px;
    right: -95px;
    top: -95px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--ims-blue) 9%, transparent);
    pointer-events: none;
  }

  .auth-brand {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 1rem;
    align-items: center;
  }

  .auth-brand img {
    width: 58px;
    height: 58px;
    border-radius: 16px;
    box-shadow: var(--shadow-sm);
  }

  h1 {
    margin: .25rem 0 .2rem;
    font-size: clamp(1.85rem, 7vw, 2.8rem);
    letter-spacing: -.05em;
  }

  .auth-brand p,
  .auth-footnote span {
    color: var(--text-muted);
    line-height: 1.55;
  }

  .auth-brand p {
    margin: 0;
  }

  .auth-form {
    display: grid;
    gap: .85rem;
  }

  .auth-alert {
    display: grid;
    gap: .2rem;
    padding: .8rem .9rem;
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-md);
    background: var(--surface-subtle);
    color: var(--text-secondary);
  }

  .auth-alert--error {
    border-color: #efb7b7;
    background: var(--danger-soft);
    color: var(--danger);
  }

  .auth-footnote {
    display: grid;
    gap: .25rem;
    padding-top: 1rem;
    border-top: 1px solid var(--line-soft);
    font-size: .86rem;
  }

  @media (max-width: 480px) {
    .auth-brand {
      grid-template-columns: 1fr;
    }
  }
</style>
