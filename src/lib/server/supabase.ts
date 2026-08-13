import { env } from '$env/dynamic/public';
import { createServerClient } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';

export function getSupabaseConfig() {
  const url = env.PUBLIC_SUPABASE_URL;
  const publishableKey =
    env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

export function createRequestSupabaseClient(cookies: Cookies, fetchFn: typeof fetch) {
  const config = getSupabaseConfig();
  if (!config) return null;

  return createServerClient(config.url, config.publishableKey, {
    global: { fetch: fetchFn },
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          cookies.set(name, value, { ...options, path: options.path ?? '/' });
        }
      }
    }
  });
}
