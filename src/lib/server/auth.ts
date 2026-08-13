import { error, redirect, type RequestEvent } from '@sveltejs/kit';

export type AppRole = NonNullable<App.Locals['profile']>['role'];

export function hasRole(profile: App.Locals['profile'], roles: readonly AppRole[]) {
  return Boolean(profile && roles.includes(profile.role));
}

export function requireRole(event: RequestEvent, roles: readonly AppRole[]) {
  if (!event.locals.supabaseConfigured) {
    throw error(503, 'Academic administration is not configured yet.');
  }

  if (!event.locals.claims) {
    const next = encodeURIComponent(event.url.pathname + event.url.search);
    throw redirect(303, `/staff/sign-in?next=${next}`);
  }

  if (!hasRole(event.locals.profile, roles)) {
    throw error(403, 'You do not have permission to access this area.');
  }

  return event.locals.profile;
}
