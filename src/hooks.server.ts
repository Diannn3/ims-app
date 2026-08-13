import type { Handle } from '@sveltejs/kit';
import { createRequestSupabaseClient } from '$lib/server/supabase';

const PRIVATE_ROUTE_PREFIXES = ['/admin', '/staff', '/auth', '/api/admin', '/api/auth'];
const DYNAMIC_PUBLIC_ROUTE_PREFIXES = [
  '/academics',
  '/consultations',
  '/course',
  '/events',
  '/faculty',
  '/people',
  '/research',
  '/room',
  '/search',
  '/services'
];

function hasRoutePrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPrivateRoute(pathname: string) {
  return hasRoutePrefix(pathname, PRIVATE_ROUTE_PREFIXES);
}

function isDynamicPublicRoute(pathname: string) {
  return hasRoutePrefix(pathname, DYNAMIC_PUBLIC_ROUTE_PREFIXES);
}

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

  const response = await resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });

  // Low-risk baseline headers that do not depend on adapter-specific CSP behavior.
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Content-Security-Policy', "frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=()'
  );

  // Staff/auth responses can contain account-specific UI state. Keep them out of
  // shared/proxy/browser caches independently of the service-worker exclusion.
  if (isPrivateRoute(event.url.pathname)) {
    response.headers.set('Cache-Control', 'private, no-store');
  } else if (isDynamicPublicRoute(event.url.pathname)) {
    // Academic SSR remains network-owned until the dedicated, sanitized offline
    // snapshot contract exists. Avoid proxy/browser freshness ambiguity meanwhile.
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
};
