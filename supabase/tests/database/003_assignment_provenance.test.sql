begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

select has_table(
  'public',
  'faculty_section_assignment_sources',
  'faculty assignments have many-to-many source ownership'
);
select has_column(
  'public',
  'faculty_section_assignments',
  'import_managed',
  'faculty assignments distinguish import-managed rows from manual rows'
);

insert into auth.users (id, email) values
  ('10000000-0000-0000-0000-000000000013', 'admin-provenance@example.test');
update public.profiles
set role = 'admin'
where user_id = '10000000-0000-0000-0000-000000000013';

-- Two independent source rows for one section corroborate the same instructor.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000013';
select lives_ok(
  $$select public.stage_schedule_import_batch(
    '00000000-0000-0000-0000-000000000000',
    'AY2627-1',
    'assignment-provenance-initial.csv',
    'assignment-provenance-preview-1',
    '[
      {
        "rowNumber":2,
        "rawPayload":{"course_code":"DEMO 101","section_code":"PROVENANCE-MULTI","record_id":"prov-row-a"},
        "normalizedPayload":{
          "schemaVersion":1,
          "rowNumber":2,
          "courseCode":"DEMO 101",
          "sectionCode":"PROVENANCE-MULTI",
          "facultyName":"Prof. Demo Alpha",
          "facultyEmail":"dalpha@up.edu.ph",
          "weekdays":[1],
          "startsAt":"08:00",
          "endsAt":"09:00",
          "roomId":"mb304",
          "sourceRecordKey":"prov-row-a",
          "courseId":"11111111-1111-1111-1111-111111111111",
          "facultyId":"33333333-3333-3333-3333-333333333333"
        },
        "status":"valid",
        "sourceRecordKey":"prov-row-a",
        "contentHash":"prov-hash-a1",
        "issues":[]
      },
      {
        "rowNumber":3,
        "rawPayload":{"course_code":"DEMO 101","section_code":"PROVENANCE-MULTI","record_id":"prov-row-b"},
        "normalizedPayload":{
          "schemaVersion":1,
          "rowNumber":3,
          "courseCode":"DEMO 101",
          "sectionCode":"PROVENANCE-MULTI",
          "facultyName":"Prof. Demo Alpha",
          "facultyEmail":"dalpha@up.edu.ph",
          "weekdays":[3],
          "startsAt":"08:00",
          "endsAt":"09:00",
          "roomId":"mb304",
          "sourceRecordKey":"prov-row-b",
          "courseId":"11111111-1111-1111-1111-111111111111",
          "facultyId":"33333333-3333-3333-3333-333333333333"
        },
        "status":"valid",
        "sourceRecordKey":"prov-row-b",
        "contentHash":"prov-hash-b1",
        "issues":[]
      }
    ]'::jsonb,
    1,
    false
  )$$,
  'admin can stage two source rows that corroborate one instructor assignment'
);
select lives_ok(
  $$select public.apply_import_batch(
    (select id from public.import_batches where filename = 'assignment-provenance-initial.csv'),
    'assignment-provenance-preview-1'
  )$$,
  'initial multi-source assignment batch applies'
);
reset role;

select results_eq(
  $$select count(*)::bigint
    from public.faculty_section_assignments a
    join public.sections s on s.id = a.section_id
    where s.section_code = 'PROVENANCE-MULTI'
      and s.term_id = 'AY2627-1'
      and a.faculty_id = '33333333-3333-3333-3333-333333333333'::uuid$$,
  array[1::bigint],
  'two supporting source rows produce one canonical faculty assignment'
);
select results_eq(
  $$select count(*)::bigint
    from public.faculty_section_assignment_sources owner
    join public.sections s on s.id = owner.section_id
    where s.section_code = 'PROVENANCE-MULTI'
      and s.term_id = 'AY2627-1'
      and owner.faculty_id = '33333333-3333-3333-3333-333333333333'::uuid$$,
  array[2::bigint],
  'canonical assignment remembers both independent source owners'
);

-- Source row B stops naming the instructor. Row A still corroborates them, so the
-- canonical assignment must survive with one remaining owner.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000013';
select public.stage_schedule_import_batch(
  '00000000-0000-0000-0000-000000000000',
  'AY2627-1',
  'assignment-provenance-b-null.csv',
  'assignment-provenance-preview-2',
  '[{
    "rowNumber":2,
    "rawPayload":{"course_code":"DEMO 101","section_code":"PROVENANCE-MULTI","record_id":"prov-row-b"},
    "normalizedPayload":{
      "schemaVersion":1,
      "rowNumber":2,
      "courseCode":"DEMO 101",
      "sectionCode":"PROVENANCE-MULTI",
      "facultyName":null,
      "facultyEmail":null,
      "weekdays":[3],
      "startsAt":"08:00",
      "endsAt":"09:00",
      "roomId":"mb304",
      "sourceRecordKey":"prov-row-b",
      "courseId":"11111111-1111-1111-1111-111111111111",
      "facultyId":null
    },
    "status":"changed",
    "sourceRecordKey":"prov-row-b",
    "contentHash":"prov-hash-b2",
    "issues":[]
  }]'::jsonb,
  1,
  false
);
select public.apply_import_batch(
  (select id from public.import_batches where filename = 'assignment-provenance-b-null.csv'),
  'assignment-provenance-preview-2'
);
reset role;

select results_eq(
  $$select
      (select count(*) from public.faculty_section_assignments a join public.sections s on s.id = a.section_id
       where s.section_code = 'PROVENANCE-MULTI' and s.term_id = 'AY2627-1'
         and a.faculty_id = '33333333-3333-3333-3333-333333333333'::uuid)::text
      || ':' ||
      (select count(*) from public.faculty_section_assignment_sources owner join public.sections s on s.id = owner.section_id
       where s.section_code = 'PROVENANCE-MULTI' and s.term_id = 'AY2627-1'
         and owner.faculty_id = '33333333-3333-3333-3333-333333333333'::uuid)::text$$,
  array['1:1'::text],
  'removing one source owner preserves an assignment still supported by another source row'
);

-- Row A also removes the instructor. Only now should the import-managed canonical
-- assignment be garbage-collected.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000013';
select public.stage_schedule_import_batch(
  '00000000-0000-0000-0000-000000000000',
  'AY2627-1',
  'assignment-provenance-a-null.csv',
  'assignment-provenance-preview-3',
  '[{
    "rowNumber":2,
    "rawPayload":{"course_code":"DEMO 101","section_code":"PROVENANCE-MULTI","record_id":"prov-row-a"},
    "normalizedPayload":{
      "schemaVersion":1,
      "rowNumber":2,
      "courseCode":"DEMO 101",
      "sectionCode":"PROVENANCE-MULTI",
      "facultyName":null,
      "facultyEmail":null,
      "weekdays":[1],
      "startsAt":"08:00",
      "endsAt":"09:00",
      "roomId":"mb304",
      "sourceRecordKey":"prov-row-a",
      "courseId":"11111111-1111-1111-1111-111111111111",
      "facultyId":null
    },
    "status":"changed",
    "sourceRecordKey":"prov-row-a",
    "contentHash":"prov-hash-a2",
    "issues":[]
  }]'::jsonb,
  1,
  false
);
select public.apply_import_batch(
  (select id from public.import_batches where filename = 'assignment-provenance-a-null.csv'),
  'assignment-provenance-preview-3'
);
reset role;

select results_eq(
  $$select
      (select count(*) from public.faculty_section_assignments a join public.sections s on s.id = a.section_id
       where s.section_code = 'PROVENANCE-MULTI' and s.term_id = 'AY2627-1'
         and a.faculty_id = '33333333-3333-3333-3333-333333333333'::uuid)::text
      || ':' ||
      (select count(*) from public.faculty_section_assignment_sources owner join public.sections s on s.id = owner.section_id
       where s.section_code = 'PROVENANCE-MULTI' and s.term_id = 'AY2627-1'
         and owner.faculty_id = '33333333-3333-3333-3333-333333333333'::uuid)::text$$,
  array['0:0'::text],
  'import-managed assignment is removed only after its final source owner disappears'
);

select * from finish();
rollback;
