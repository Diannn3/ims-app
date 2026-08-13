import { env } from '$env/dynamic/public';
import { createServerClient } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';

function isLoopbackHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function assertSafePublicUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('PUBLIC_SUPABASE_URL is not a valid URL.');
  }

  if (url.protocol === 'https:') return;
  if (url.protocol === 'http:' && isLoopbackHost(url.hostname)) return;
  throw new Error('PUBLIC_SUPABASE_URL must use HTTPS outside loopback development.');
}

function legacyJwtRole(value: string) {
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded)) as { role?: unknown };
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

function assertBrowserSafeKey(value: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Supabase publishable key is empty.');

  // New Supabase secret keys are intentionally obvious. Never let one enter a
  // PUBLIC_* environment variable or browser-adjacent request client.
  if (/^sb_secret_/i.test(trimmed)) {
    throw new Error('A Supabase secret key cannot be used as a public application key.');
  }

  // Legacy anon/service-role keys are JWTs. Reject elevated roles if someone
  // accidentally pastes a service-role token into PUBLIC_SUPABASE_ANON_KEY.
  const role = legacyJwtRole(trimmed);
  if (role === 'service_role' || role === 'supabase_admin') {
    throw new Error('An elevated Supabase JWT cannot be used as a public application key.');
  }
}

export function getSupabaseConfig() {
  const url = env.PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = (
    env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !publishableKey) return null;

  assertSafePublicUrl(url);
  assertBrowserSafeKey(publishableKey);
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
