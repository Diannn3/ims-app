import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function safeNext(value: string | null) {
  if (!value) return '/admin';

  // Staff sign-in is only an entry point for the administration workspace.
  // Restrict redirects to that subtree so crafted `next` values cannot turn
  // this endpoint into an internal/open redirect trampoline.
  if (value === '/admin' || value.startsWith('/admin/')) return value;
  return '/admin';
}

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.profile && ['content_editor', 'admin'].includes(locals.profile.role)) {
    throw redirect(303, safeNext(url.searchParams.get('next')));
  }

  return {
    configured: locals.supabaseConfigured,
    next: safeNext(url.searchParams.get('next'))
  };
};

export const actions: Actions = {
  default: async ({ request, locals, url }) => {
    if (!locals.supabase) {
      return fail(503, {
        message: 'Staff authentication is not configured for this deployment.'
      });
    }

    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '');
    const next = safeNext(String(form.get('next') ?? url.searchParams.get('next') ?? '/admin'));

    if (!email || !password) {
      return fail(400, { message: 'Enter both your staff email and password.', email });
    }

    const { data: authData, error } = await locals.supabase.auth.signInWithPassword({ email, password });
    if (error || !authData.user) {
      return fail(400, {
        message: 'Sign-in failed. Check your credentials or ask an administrator to verify your staff account.',
        email
      });
    }

    const { data: profile, error: profileError } = await locals.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (profileError || !profile || !['content_editor', 'admin'].includes(profile.role)) {
      await locals.supabase.auth.signOut();
      return fail(403, {
        message: 'This account is not approved for the IMS administration workspace.',
        email
      });
    }

    throw redirect(303, next);
  }
};
