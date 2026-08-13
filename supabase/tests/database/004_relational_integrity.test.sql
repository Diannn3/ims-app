begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select has_index(
  'public',
  'faculty_offices',
  'faculty_offices_identity_uidx',
  'faculty office identity treats a NULL term as one permanent scope'
);
select has_index(
  'public',
  'faculty_offices',
  'faculty_offices_one_primary_uidx',
  'faculty has at most one primary office per term/permanent scope'
);

insert into public.faculty_offices (
  faculty_id, term_id, space_id, is_primary, source_id, publication_status, review_status
) values (
  '33333333-3333-3333-3333-333333333334', null, 'mb201', true,
  '00000000-0000-0000-0000-000000000000', 'verified', 'verified'
);

select throws_ok(
  $$insert into public.faculty_offices (
      faculty_id, term_id, space_id, is_primary, source_id, publication_status, review_status
    ) values (
      '33333333-3333-3333-3333-333333333334', null, 'mb201', false,
      '00000000-0000-0000-0000-000000000000', 'verified', 'verified'
    )$$,
  '23505', null,
  'duplicate permanent office identity is rejected even when term_id is NULL'
);

select throws_ok(
  $$insert into public.faculty_offices (
      faculty_id, term_id, space_id, is_primary, source_id, publication_status, review_status
    ) values (
      '33333333-3333-3333-3333-333333333334', null, 'mb304', true,
      '00000000-0000-0000-0000-000000000000', 'verified', 'verified'
    )$$,
  '23505', null,
  'second primary permanent office is rejected'
);

select * from finish();
rollback;
