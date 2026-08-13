# Public Data API Boundary

## Purpose

The student-facing IMS Academic Hub must not depend on direct anonymous reads of canonical institutional tables. Canonical tables contain moderation, review, provenance, and other internal fields that are useful to staff but unnecessary for public clients.

The public contract is therefore a set of **column-curated `public_*` views**. These views are the only database read surfaces intended for anonymous users and ordinary authenticated students.

## Why views are used

Row Level Security controls which **rows** a role may access. It does not by itself define a narrow public column contract. A published row can still contain internal fields that the student-facing application should never request or expose.

The public views provide two independent protections:

1. **Explicit row predicates** — published + verified entities, current-term rules, verified parent relationships, and public-space checks are encoded in the view query.
2. **Explicit columns** — moderation fields, import ownership, internal metadata, private source IDs, and Auth/profile identifiers are omitted.

## Deliberate owner-executed view model

These views are intentionally **not `security_invoker` views**. Anonymous users are denied `SELECT` on the canonical institutional tables, so an invoker view would have no underlying table access to use.

Instead, the public views are owner-executed, marked `security_barrier`, and treated as security-sensitive API code. Their SQL must therefore remain fail-closed and covered by database tests. This is a deliberate exception to the general preference for `security_invoker` views.

If this model changes later, migrate the views and grants as one reviewed security change; do not flip `security_invoker` casually.

## Allowed public surfaces

The current public academic/spatial contract includes:

- `public_buildings`
- `public_floors`
- `public_spaces`
- `public_space_aliases`
- `public_location_anchors`
- `public_academic_terms` (current term only)
- `public_courses`
- `public_course_aliases`
- `public_course_prerequisites`
- `public_faculty`
- `public_faculty_offices`
- `public_faculty_section_assignments`
- `public_sections`
- `public_section_meetings`
- `public_consultation_hours`
- `public_research_areas`
- `public_faculty_research_areas`
- `public_academic_services`
- `public_academic_resources`
- `public_academic_events`
- `public_academic_dates`
- `public_data_sources`
- `public_faculty_notices`
- `public_route_restrictions`

Before adding a new public view, document:

- the exact columns exposed;
- the publication/review/parent predicates;
- whether the data is term-scoped;
- whether any source identifier must be masked;
- whether optional room/building relationships require verified public parents;
- the pgTAP assertions proving anonymous and ordinary-student behavior.

## Canonical base tables

Anonymous clients must not have direct `SELECT` on canonical institutional tables such as `courses`, `faculty`, `sections`, `section_meetings`, `consultation_hours`, or `spaces`.

Authenticated staff retain explicit base-table privileges **plus RLS policies** needed for moderation/import workflows. An ordinary authenticated student may technically share the Postgres `authenticated` role, but must have no matching RLS path to staff-only canonical rows.

The application repository follows the same boundary: public academic reads query `public_*` views, while staff/admin repositories may query canonical tables only in protected server routes.

## Provenance

A public entity may originate from an internal source. The public view must expose `source_id` only when that source has been explicitly approved for public metadata. Otherwise the public entity remains readable but its internal source UUID is returned as `NULL`.

Public source metadata itself is exposed only through `public_data_sources`; internal notes remain canonical/staff-only data.

## Default grants

Future objects in the exposed `public` schema must not inherit blanket Data API privileges. Migrations set least-privilege default grants and new objects must receive explicit grants only after their public/staff contract is reviewed.

Functions deserve separate scrutiny because RLS is not an authorization boundary for function execution. Privileged functions must use explicit `REVOKE`/`GRANT`; `SECURITY DEFINER` functions must set an empty `search_path` and schema-qualify referenced objects.

## Test requirements

`supabase/tests/database/005_public_read_surfaces.test.sql` is the primary public-surface regression suite. Security-sensitive additions should prove at least:

- the safe view exists;
- anonymous `SELECT` on the safe view succeeds where appropriate;
- anonymous base-table `SELECT` is denied;
- ordinary authenticated students can use the safe projection but cannot traverse staff RLS on the base table;
- staff retain required canonical access;
- internal-only fields and source identifiers are not exposed;
- current-term/public-parent predicates fail closed.

The dependency-light verifier also rejects public academic repository queries against canonical institutional tables.
