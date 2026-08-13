begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

select has_table('public', 'source_records', 'source_records provenance table exists');
select has_table('public', 'schedule_review_events', 'schedule review audit table exists');
select has_column('public', 'courses', 'review_status', 'courses have a separate review status');
select has_column('public', 'research_areas', 'publication_status', 'research areas have publication lifecycle');
select has_index('public', 'academic_terms', 'academic_terms_one_current_idx', 'only-one-current-term index exists');
select has_view('public', 'public_data_sources', 'public-safe provenance view exists');
select has_function('public', 'apply_import_batch', array['uuid','text'], 'transactional import apply function exists');
select has_function('public', 'set_current_academic_term', array['text'], 'atomic current-term function exists');
select has_function('public', 'set_schedule_section_review', array['uuid','review_status','text'], 'schedule review function exists');
select has_function('public', 'set_schedule_section_publication', array['uuid','boolean','text'], 'schedule publication function exists');

insert into public.courses (id, code, normalized_code, title, publication_status, review_status)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PRIVATE 1', 'private1', 'Unpublished fixture', 'draft', 'draft');

set local role anon;
select results_eq(
  $$select count(*)::bigint from public.courses where code = 'PRIVATE 1'$$,
  array[0::bigint],
  'anonymous users cannot read unpublished courses'
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

select * from finish();
rollback;
