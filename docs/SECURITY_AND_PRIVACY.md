# Security and Privacy Baseline

## Public data
Rooms, public course information, public faculty profiles, consultation schedules, official resources, and public events can be readable anonymously when sourced/approved for publication.

## Editing roles
- faculty: only their own editable profile fields, consultations, booking link, and notices
- content editor: approved academic content/imports
- map editor: spatial metadata and verified routing restrictions
- admin: role management and approvals

Frontend button visibility is not authorization. Database Row Level Security must enforce access.

## Sensitive/private student data
Personal gradebook contents are local-first. Do not send raw scores to analytics. Do not create individual movement histories for indoor navigation.

## Location privacy
QR anchors establish a start node for the current navigation session. They do not require storing a historical trail of where a user has been.

## Analytics
Prefer aggregate events such as:
- search_no_results
- route_failed
- room_search_count
- feature usage

Avoid linking routine map movement to named users unless a future feature has a clear user-facing need and explicit consent.

## Public application key safety
The SvelteKit request client accepts only a browser-safe Supabase publishable/legacy anon key. Runtime configuration rejects:
- new-format `sb_secret_*` keys;
- legacy JWTs carrying `service_role` or `supabase_admin` roles;
- non-HTTPS hosted Supabase URLs (loopback HTTP remains allowed for local development).

This is a second guardrail, not a replacement for secret-management discipline. A secret key must never be placed in a `PUBLIC_*` environment variable.

## HTTP response hardening
Document responses set a conservative baseline:
- `X-Content-Type-Options: nosniff`;
- strict-origin referrer behavior;
- framing denied by both `X-Frame-Options` and CSP `frame-ancestors`;
- `base-uri 'self'` and `object-src 'none'`;
- camera, microphone, geolocation, payment, USB, serial, and HID permissions disabled until a reviewed feature explicitly requires them.

Staff/auth routes are `private, no-store`. Dynamic public academic SSR routes are also `no-store` during beta so stale institutional information is not silently reused. A dedicated sanitized/versioned offline academic snapshot will be the only supported cached academic-data surface later.

## Public database surfaces
Anonymous/ordinary-student academic reads use curated `public_*` views, while canonical tables remain staff-only behind table grants plus RLS. The views are intentionally column-curated and use explicit published/verified/current-term predicates. See `docs/PUBLIC_DATA_API.md`.

The dependency-light gate also validates application `.from()` / `.rpc()` names against objects created by migrations and rejects public repositories that query canonical institutional tables or interpolate input into raw PostgREST `.or()` syntax.
