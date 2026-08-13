begin;
create extension if not exists pgtap with schema extensions;
select plan(35);

select has_table('public', 'source_records', 'source_records provenance table exists');
select has_table('public', 'schedule_review_events', 'schedule review audit table exists');
select has_column('public', 'courses', 'review_status', 'courses have a separate review status');
select has_column('public', 'research_areas', 'publication_status', 'research areas have publication lifecycle');
select has_index('public', 'academic_terms', 'academic_terms_one_current_idx', 'only-one-current-term index exists');
select has_view('public', 'public_data_sources', 'public-safe provenance view exists');
select has_column('public', 'data_sources', 'public_metadata', 'data sources have an explicit public-metadata switch');
select has_function('public', 'apply_import_batch', array['uuid','text'], 'transactional import apply function exists');
select has_function('public', 'set_current_academic_term', array['text'], 'atomic current-term function exists');
select has_function('public', 'set_schedule_section_review', array['uuid','review_status','text'], 'schedule review function exists');
select has_function('public', 'set_schedule_section_publication', array['uuid','boolean','text'], 'schedule publication function exists');

-- Privacy-safe public projections added by migration 009.
select has_view('public', 'public_faculty', 'public faculty projection exists');
select has_view('public', 'public_faculty_notices', 'public faculty notice projection exists');
select has_view('public', 'public_route_restrictions', 'public route restriction projection exists');
select results_eq(
  $$select count(*)::bigint from information_schema.columns where table_schema = 'public' and table_name = 'public_faculty' and column_name = 'user_id'$$,
  array[0::bigint],
  'public faculty projection does not expose auth user_id'
);
select results_eq(
  $$select count(*)::bigint from information_schema.columns where table_schema = 'public' and table_name = 'public_faculty_notices' and column_name = 'created_by'$$,
  array[0::bigint],
  'public faculty notices do not expose creator profile UUIDs'
);
select results_eq(
  $$select count(*)::bigint from information_schema.columns where table_schema = 'public' and table_name = 'public_route_restrictions' and column_name = 'created_by'$$,
  array[0::bigint],
  'public route restrictions do not expose creator profile UUIDs'
);
select results_eq(
  $$select count(*)::bigint from information_schema.columns where table_schema = 'public' and table_name = 'public_route_restrictions' and column_name = 'source_id'$$,
  array[0::bigint],
  'public route restrictions omit internal source IDs'
);
select has_index('public', 'source_records', 'source_records_identity_uidx', 'source record identity uses hardened unique index');
select has_trigger('public', 'consultation_hours', 'consultation_status_transition_guard', 'consultation edits are guarded');
select has_trigger('public', 'section_meetings', 'section_meeting_material_update_invalidate', 'material meeting edits invalidate reviewed schedules');
select has_trigger('public', 'faculty_section_assignments', 'faculty_assignment_update_invalidate', 'instructor assignment edits invalidate reviewed schedules');

-- A material meeting correction must withdraw the entire section composition.
update public.section_meetings
set starts_at = '10:05', ends_at = '11:05'
where id = (
  select id from public.section_meetings
  where section_id = '22222222-2222-2222-2222-222222222221'
  order by weekday
  limit 1
);
select results_eq(
  $$select review_status::text || ':' || publication_status::text from public.sections where id = '22222222-2222-2222-2222-222222222221'::uuid$$,
  array['needs_verification:needs_verification'::text],
  'material meeting edits withdraw the parent section'
);

-- Instructor changes are equally material to the student-facing schedule.
update public.faculty_section_assignments
set assignment_role = 'co_instructor'
where faculty_id = '33333333-3333-3333-3333-333333333334'::uuid
  and section_id = '22222222-2222-2222-2222-222222222222'::uuid
  and assignment_role = 'instructor';
select results_eq(
  $$select review_status::text || ':' || publication_status::text from public.sections where id = '22222222-2222-2222-2222-222222222222'::uuid$$,
  array['needs_verification:needs_verification'::text],
  'instructor assignment edits withdraw the parent section'
);

insert into public.courses (id, code, normalized_code, title, publication_status, review_status)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PRIVATE 1', 'private1', 'Unpublished fixture', 'draft', 'draft');

insert into public.data_sources (id, label, source_type, source_url, public_metadata)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Private test sheet', 'official_sheet', 'https://example.invalid/private-sheet', false);

set local role anon;
select results_eq(
  $$select count(*)::bigint from public.public_data_sources where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid$$,
  array[0::bigint],
  'anonymous provenance view omits internal-only data sources'
);
select results_eq(
  $$select count(*)::bigint from public.public_data_sources where id = '00000000-0000-0000-0000-000000000000'::uuid$$,
  array[1::bigint],
  'explicitly public source metadata remains available through the safe projection'
);
select throws_ok(
  $$select count(*) from public.data_sources$$,
  '42501',
  null,
  'anonymous users cannot query the base data-sources table'
);
select results_eq(
  $$select count(*)::bigint from public.public_courses where code = 'PRIVATE 1'$$,
  array[0::bigint],
  'anonymous public course surface omits unpublished courses'
);
select throws_ok(
  $$select count(*) from public.courses$$,
  '42501',
  null,
  'anonymous users cannot query the base courses table'
);
select throws_ok(
  $$select count(*) from public.faculty$$,
  '42501',
  null,
  'anonymous users cannot query the base faculty table'
);
select results_eq(
  $$select count(*)::bigint from public.public_faculty where slug = 'demo-alpha'$$,
  array[1::bigint],
  'anonymous users can read published faculty through the safe projection'
);
reset role;

select throws_ok(
  $$insert into public.academic_terms (id, academic_year, term_name, is_current) values ('another-current', '2099-2100', 'Test', true)$$,
  '23505',
  null,
  'database rejects a second current academic term'
);

set local role anon;
select throws_ok(
  $$select public.apply_import_batch('00000000-0000-0000-0000-000000000001'::uuid, 'x')$$,
  '42501',
  null,
  'anonymous users cannot execute the import apply function'
);
reset role;

-- A content edit must automatically invalidate prior verification/publication even
-- when the SQL statement itself does not touch status columns.
update public.consultation_hours
set notes = 'Integrity-test material edit', last_verified_at = now()
where id = (
  select id from public.consultation_hours
  where faculty_id = '33333333-3333-3333-3333-333333333333'
  order by weekday
  limit 1
);
select results_eq(
  $$select (review_status::text || ':' || publication_status::text || ':' || (last_verified_at is null)::text) from public.consultation_hours where notes = 'Integrity-test material edit'$$,
  array['needs_verification:needs_verification:true'::text],
  'material consultation edits fail closed and clear verification freshness'
);

-- NULL term IDs still participate in source identity uniqueness.
insert into public.source_records (
  source_id, term_id, entity_type, source_record_key, content_hash
) values (
  '00000000-0000-0000-0000-000000000000', null, 'test', 'null-term-identity-test', 'hash-a'
);
select throws_ok(
  $$insert into public.source_records (source_id, term_id, entity_type, source_record_key, content_hash) values ('00000000-0000-0000-0000-000000000000', null, 'test', 'null-term-identity-test', 'hash-b')$$,
  '23505',
  null,
  'source identity treats NULL term IDs as equal'
);

select * from finish();
rollback;
