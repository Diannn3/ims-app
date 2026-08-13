import type { Handle } from '@sveltejs/kit';
import { createRequestSupabaseClient } from '$lib/server/supabase';

export const handle: Handle = async ({ event, resolve }) => {
  const supabase = createRequestSupabaseClient(event.cookies, event.fetch);

  event.locals.supabase = supabase;
  event.locals.supabaseConfigured = Boolean(supabase);
  event.locals.claims = null;
  event.locals.profile = null;

  if (supabase) {
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const claims = claimsError ? null : (claimsData?.claims as Record<string, unknown> | undefined) ?? null;
    event.locals.claims = claims;

    const subject = typeof claims?.sub === 'string' ? claims.sub : null;
    if (subject) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, display_name, role')
        .eq('user_id', subject)
        .maybeSingle();

      if (profile) {
        event.locals.profile = profile as App.Locals['profile'];
      }
    }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};
