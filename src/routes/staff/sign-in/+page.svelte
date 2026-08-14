<script lang="ts">
  import InlineAlert from '$lib/components/ui/InlineAlert.svelte';
  let { data, form } = $props();
</script>

<svelte:head><title>Staff Sign In · IMS Academic Hub</title><meta name="description" content="Restricted staff access for IMS Academic Hub data review and administration." /></svelte:head>

<div class="mx-auto grid min-h-[calc(100svh-10rem)] w-full max-w-[1180px] place-items-center px-4 py-8 sm:px-6">
  <section class="grid w-full max-w-3xl overflow-hidden border border-line-strong bg-white shadow-[0_18px_52px_rgb(4_40_67/0.1)] md:grid-cols-[0.85fr_1.15fr]" aria-labelledby="staff-sign-in-title">
    <header class="grid content-between gap-8 bg-ink-strong p-6 text-white sm:p-8"><div><img class="size-14" src="/brand/ims-mark.png" alt="" width="56" height="56" /><p class="mt-8 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-sky-300">Restricted workspace</p><h1 class="mt-2 text-4xl font-semibold leading-none tracking-[-0.05em]" id="staff-sign-in-title">Staff sign in</h1><p class="mt-3 leading-relaxed text-slate-300">Review staged data, resolve validation issues, and manage publication controls.</p></div><p class="border-l-2 border-ims-yellow pl-3 text-sm leading-relaxed text-slate-300">Public student features never require this account.</p></header>
    <div class="grid content-center gap-5 p-6 sm:p-8">
      {#if !data.configured}<InlineAlert title="Authentication is not configured" message="Add the Supabase public environment values before staff access can be used." />{/if}
      {#if form?.message}<InlineAlert tone="danger" title="Sign in failed" message={form.message} />{/if}
      <form method="POST" class="grid gap-4"><input type="hidden" name="next" value={data.next} />
        <label class="grid gap-1.5 text-sm font-extrabold text-muted-strong"><span>Staff email</span><input class="min-h-12 rounded-xl border border-line-strong bg-white px-3.5 text-base outline-none hover:border-sky-300 focus:border-ims-blue-deep focus-visible:ring-3 focus-visible:ring-ims-blue/25" name="email" type="email" autocomplete="username" inputmode="email" spellcheck="false" value={form && 'email' in form ? form.email ?? '' : ''} required /></label>
        <label class="grid gap-1.5 text-sm font-extrabold text-muted-strong"><span>Password</span><input class="min-h-12 rounded-xl border border-line-strong bg-white px-3.5 text-base outline-none hover:border-sky-300 focus:border-ims-blue-deep focus-visible:ring-3 focus-visible:ring-ims-blue/25" name="password" type="password" autocomplete="current-password" required /></label>
        <button class="min-h-12 rounded-xl bg-ims-blue-deep px-4 font-extrabold text-white hover:bg-ims-blue-ink focus-visible:ring-3 focus-visible:ring-ims-blue/30 disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!data.configured}>Sign In to Staff Workspace</button>
      </form>
    </div>
  </section>
</div>
