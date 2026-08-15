begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint constraint_row
    join pg_catalog.pg_class relation_row
      on relation_row.oid = constraint_row.conrelid
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = relation_row.relnamespace
    where namespace_row.nspname = 'public'
      and relation_row.relname = 'consultation_hours'
      and constraint_row.contype = 'c'
      and constraint_row.conname = 'consultation_time_requires_weekday'
  ),
  'scheduled consultation clock windows require a weekday'
);

select lives_ok(
  $$insert into public.consultation_hours (
      faculty_id, term_id, weekday, starts_at, ends_at, mode, notes
    ) values (
      '33333333-3333-3333-3333-333333333333', 'AY2627-1', null,
      null, null, 'by_appointment', 'Flexible by-arrangement consultation test.'
    )$$,
  'fully flexible by-arrangement consultation is valid'
);

select lives_ok(
  $$insert into public.consultation_hours (
      faculty_id, term_id, weekday, starts_at, ends_at, mode, notes
    ) values (
      '33333333-3333-3333-3333-333333333333', 'AY2627-1', 4,
      null, null, 'by_appointment', 'Thursday by-appointment consultation test.'
    )$$,
  'day-specific by-appointment consultation without fixed times is valid'
);

select throws_ok(
  $$insert into public.consultation_hours (
      faculty_id, term_id, weekday, starts_at, ends_at, mode, notes
    ) values (
      '33333333-3333-3333-3333-333333333333', 'AY2627-1', null,
      '13:00', '15:00', 'online', 'Invalid clock window without weekday.'
    )$$,
  '23514', null,
  'fixed consultation time without weekday is rejected'
);

select lives_ok(
  $$insert into public.consultation_hours (
      faculty_id, term_id, weekday, starts_at, ends_at, mode, notes
    ) values (
      '33333333-3333-3333-3333-333333333333', 'AY2627-1', 2,
      '13:00', '15:00', 'online', 'Valid scheduled online consultation test.'
    )$$,
  'scheduled consultation with weekday and ordered time window is valid'
);

select * from finish();
rollback;
