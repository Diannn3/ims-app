begin;
create extension if not exists pgtap with schema extensions;
select plan(38);

-- The public Data API is composed of explicit, column-curated views.
select has_view('public', 'public_spaces', 'public spaces projection exists');
select has_view('public', 'public_courses', 'public courses projection exists');
select has_view('public', 'public_sections', 'public sections projection exists');
select has_view('public', 'public_section_meetings', 'public meetings projection exists');
select has_view('public', 'public_faculty_offices', 'public faculty-office projection exists');
select has_view('public', 'public_faculty_section_assignments', 'public assignment projection exists');
select has_view('public', 'public_consultation_hours', 'public consultation projection exists');
select has_view('public', 'public_research_areas', 'public research projection exists');
select has_view('public', 'public_academic_services', 'public services projection exists');
select has_view('public', 'public_academic_resources', 'public resources projection exists');
select has_view('public', 'public_academic_events', 'public events projection exists');
select has_view('public', 'public_academic_dates', 'public dates projection exists');

-- These are deliberately owner-executed API views with explicit fail-closed predicates.
-- `security_barrier` prevents caller predicates from being pushed through the view in a
-- way that could expose data via leaky functions; `security_invoker` must remain off
-- because anonymous callers intentionally have no base-table SELECT privilege.
select results_eq(
  $$select count(*)::bigint
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'public_spaces','public_courses','public_sections','public_section_meetings',
        'public_faculty_offices','public_faculty_section_assignments',
        'public_consultation_hours','public_research_areas','public_academic_services',
        'public_academic_resources','public_academic_events','public_academic_dates'
      )
      and not coalesce(c.reloptions, '{}'::text[]) @> array['security_barrier=true']::text[]$$,
  array[0::bigint],
  'curated public views retain security_barrier=true'
);
select results_eq(
  $$select count(*)::bigint
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'public_spaces','public_courses','public_sections','public_section_meetings',
        'public_faculty_offices','public_faculty_section_assignments',
        'public_consultation_hours','public_research_areas','public_academic_services',
        'public_academic_resources','public_academic_events','public_academic_dates'
      )
      and coalesce(c.reloptions, '{}'::text[]) @> array['security_invoker=true']::text[]$$,
  array[0::bigint],
  'curated public views remain owner-executed by design'
);

-- High-risk moderation/provenance columns never exist on the public projections.
select results_eq(
  $$select count(*)::bigint from information_schema.columns where table_schema='public' and table_name='public_spaces' and column_name='metadata'$$,
  array[0::bigint],
  'public spaces do not expose arbitrary internal metadata'
);
select results_eq(
  $$select count(*)::bigint from information_schema.columns where table_schema='public' and table_name='public_sections' and column_name in ('review_status','publication_status','source_record_id')$$,
  array[0::bigint],
  'public sections omit moderation and source-record internals'
);
select results_eq(
  $$select count(*)::bigint from information_schema.columns where table_schema='public' and table_name='public_section_meetings' and column_name in ('review_status','publication_status','source_record_id','source_id')$$,
  array[0::bigint],
  'public meetings omit moderation/provenance internals'
);
select results_eq(
  $$select count(*)::bigint from information_schema.columns where table_schema='public' and table_name='public_faculty_section_assignments' and column_name in ('source_id','source_record_id','import_managed')$$,
  array[0::bigint],
  'public assignments omit import ownership internals'
);
select results_eq(
  $$select count(*)::bigint from information_schema.columns where table_schema='public' and table_name='public_faculty_offices' and column_name in ('source_id','source_record_id','review_status','publication_status')$$,
  array[0::bigint],
  'public faculty offices omit moderation/provenance internals'
);

-- Anonymous users receive the curated views, never the institutional base tables.
select ok(has_table_privilege('anon', 'public.public_courses', 'SELECT'), 'anon can select public courses view');
select ok(has_table_privilege('anon', 'public.public_spaces', 'SELECT'), 'anon can select public spaces view');
select ok(not has_table_privilege('anon', 'public.courses', 'SELECT'), 'anon has no base courses SELECT privilege');
select ok(not has_table_privilege('anon', 'public.spaces', 'SELECT'), 'anon has no base spaces SELECT privilege');
select ok(not has_table_privilege('anon', 'public.sections', 'SELECT'), 'anon has no base sections SELECT privilege');
select ok(not has_table_privilege('anon', 'public.consultation_hours', 'SELECT'), 'anon has no base consultations SELECT privilege');

select ok(not has_table_privilege('anon', 'public.public_courses', 'INSERT'), 'anon cannot insert through public course view');
select ok(not has_table_privilege('anon', 'public.public_courses', 'UPDATE'), 'anon cannot update through public course view');
select ok(not has_table_privilege('anon', 'public.public_courses', 'DELETE'), 'anon cannot delete through public course view');
select ok(not has_table_privilege('authenticated', 'public.public_courses', 'INSERT'), 'authenticated clients cannot insert through public course view');
select ok(not has_table_privilege('authenticated', 'public.public_courses', 'UPDATE'), 'authenticated clients cannot update through public course view');
select ok(not has_table_privilege('authenticated', 'public.public_courses', 'DELETE'), 'authenticated clients cannot delete through public course view');

-- Internal provenance can back a public record without leaking the internal source UUID.
insert into public.data_sources (id, label, source_type, source_url, public_metadata)
values ('d0000000-0000-0000-0000-000000000001', 'Internal-only source', 'official_sheet', 'https://example.invalid/internal', false);
insert into public.courses (
  id, code, normalized_code, title, publication_status, review_status, source_id
) values (
  'd0000000-0000-0000-0000-000000000002', 'SAFE 1', 'safe1', 'Safe public projection test',
  'published', 'verified', 'd0000000-0000-0000-0000-000000000001'
);

set local role anon;
select results_eq(
  $$select code from public.public_courses where code = 'SAFE 1'$$,
  array['SAFE 1'::text],
  'anon can read a published verified course through the safe view'
);
select results_eq(
  $$select (source_id is null)::text from public.public_courses where code = 'SAFE 1'$$,
  array['true'::text],
  'internal source UUID is masked on public course projection'
);
select throws_ok(
  $$select count(*) from public.courses$$,
  '42501', null,
  'anon cannot query base courses even when published rows exist'
);
reset role;

-- Authenticated students use the same public projection. Table privilege exists for
-- staff workflows, but RLS returns no canonical base rows to a student role.
insert into auth.users (id, email)
values ('d0000000-0000-0000-0000-000000000003', 'surface-student@example.test');

set local role authenticated;
set local request.jwt.claim.sub = 'd0000000-0000-0000-0000-000000000003';
select results_eq(
  $$select count(*)::bigint from public.public_courses where code = 'DEMO 101'$$,
  array[1::bigint],
  'authenticated student reads published course through safe view'
);
select results_eq(
  $$select count(*)::bigint from public.courses where code = 'DEMO 101'$$,
  array[0::bigint],
  'authenticated student has no RLS path to canonical course rows'
);
reset role;

-- Staff retain canonical-table read access for moderation/import workflows.
insert into auth.users (id, email)
values ('d0000000-0000-0000-0000-000000000004', 'surface-editor@example.test');
update public.profiles set role = 'content_editor'
where user_id = 'd0000000-0000-0000-0000-000000000004';

set local role authenticated;
set local request.jwt.claim.sub = 'd0000000-0000-0000-0000-000000000004';
select results_eq(
  $$select count(*)::bigint from public.courses where code = 'DEMO 101'$$,
  array[1::bigint],
  'content editor retains canonical course read through staff RLS'
);
reset role;

-- Public term surface is intentionally current-term-only.
insert into public.academic_terms (id, academic_year, term_name, is_current)
values ('surface-old-term', '2000-2001', 'Archived Test Term', false);
set local role anon;
select results_eq(
  $$select count(*)::bigint from public.public_academic_terms where is_current = false$$,
  array[0::bigint],
  'public academic term surface never exposes non-current terms'
);
reset role;

select * from finish();
rollback;
