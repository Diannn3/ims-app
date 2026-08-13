begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select has_trigger(
  'public', 'import_rows', 'schedule_import_row_integrity_guard',
  'staged schedule rows pass through database-side semantic validation'
);
select has_trigger(
  'public', 'import_batches', 'import_batch_apply_integrity_guard',
  'batch apply transitions revalidate immutable staging evidence'
);

insert into public.import_batches (
  id, source_id, term_id, status, filename, preview_hash,
  row_count, valid_row_count, error_count, warning_count
) values (
  'e0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'AY2627-1', 'staged', 'integrity-course.csv', 'preview-course',
  1, 1, 0, 0
);

select throws_ok(
  $$insert into public.import_rows (
      batch_id, row_number, raw_payload, normalized_payload, status,
      source_record_key, content_hash, entity_type
    ) values (
      'e0000000-0000-0000-0000-000000000001', 2, '{}'::jsonb,
      '{
        "schemaVersion":1,"rowNumber":2,"courseCode":"DEMO 201","sectionCode":"BAD-COURSE",
        "facultyName":null,"facultyEmail":null,"weekdays":[1],"startsAt":"08:00","endsAt":"09:00",
        "roomId":"mb304","sourceRecordKey":"integrity-bad-course",
        "courseId":"11111111-1111-1111-1111-111111111111","facultyId":null
      }'::jsonb,
      'valid', 'integrity-bad-course', 'hash-course', 'schedule_v1'
    )$$,
  '23503', null,
  'staging rejects courseId/courseCode pairs that do not identify the same course'
);

insert into public.import_batches (
  id, source_id, term_id, status, filename, preview_hash,
  row_count, valid_row_count, error_count, warning_count
) values (
  'e0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'AY2627-1', 'staged', 'integrity-unchanged.csv', 'preview-unchanged',
  1, 1, 0, 0
);

select throws_ok(
  $$insert into public.import_rows (
      batch_id, row_number, raw_payload, normalized_payload, status,
      source_record_key, content_hash, entity_type
    ) values (
      'e0000000-0000-0000-0000-000000000002', 2, '{}'::jsonb,
      '{
        "schemaVersion":1,"rowNumber":2,"courseCode":"DEMO 101","sectionCode":"BAD-UNCHANGED",
        "facultyName":null,"facultyEmail":null,"weekdays":[1],"startsAt":"08:00","endsAt":"09:00",
        "roomId":"mb304","sourceRecordKey":"integrity-never-seen",
        "courseId":"11111111-1111-1111-1111-111111111111","facultyId":null
      }'::jsonb,
      'unchanged', 'integrity-never-seen', 'never-seen-hash', 'schedule_v1'
    )$$,
  '23514', null,
  'staging rejects unchanged status when no prior source identity exists'
);

insert into public.import_batches (
  id, source_id, term_id, status, filename, preview_hash,
  row_count, valid_row_count, error_count, warning_count
) values (
  'e0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'AY2627-1', 'staged', 'integrity-duplicate-pattern.csv', 'preview-duplicate-pattern',
  2, 2, 0, 0
);

insert into public.import_rows (
  batch_id, row_number, raw_payload, normalized_payload, status,
  source_record_key, content_hash, entity_type
) values (
  'e0000000-0000-0000-0000-000000000003', 2, '{}'::jsonb,
  '{
    "schemaVersion":1,"rowNumber":2,"courseCode":"DEMO 101","sectionCode":"DUP-PATTERN",
    "facultyName":null,"facultyEmail":null,"weekdays":[2,4],"startsAt":"10:00","endsAt":"11:00",
    "roomId":"mb304","sourceRecordKey":"integrity-pattern-a",
    "courseId":"11111111-1111-1111-1111-111111111111","facultyId":null
  }'::jsonb,
  'valid', 'integrity-pattern-a', 'pattern-a-hash', 'schedule_v1'
);

select throws_ok(
  $$insert into public.import_rows (
      batch_id, row_number, raw_payload, normalized_payload, status,
      source_record_key, content_hash, entity_type
    ) values (
      'e0000000-0000-0000-0000-000000000003', 3, '{}'::jsonb,
      '{
        "schemaVersion":1,"rowNumber":3,"courseCode":"DEMO 101","sectionCode":"DUP-PATTERN",
        "facultyName":null,"facultyEmail":null,"weekdays":[2,4],"startsAt":"10:00","endsAt":"11:00",
        "roomId":"mb304","sourceRecordKey":"integrity-pattern-b",
        "courseId":"11111111-1111-1111-1111-111111111111","facultyId":null
      }'::jsonb,
      'valid', 'integrity-pattern-b', 'pattern-b-hash', 'schedule_v1'
    )$$,
  '23505', null,
  'database rejects two actionable source identities for the same V1 meeting pattern'
);

select results_eq(
  $$select staging_integrity_version from public.import_batches where id = 'e0000000-0000-0000-0000-000000000003'::uuid$$,
  array[2::integer],
  'a successfully validated actionable row upgrades its batch integrity version'
);

insert into public.import_batches (
  id, source_id, term_id, status, filename, preview_hash,
  row_count, valid_row_count, error_count, warning_count, staging_integrity_version
) values (
  'e0000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'AY2627-1', 'ready', 'legacy-ready.csv', 'legacy-preview',
  0, 0, 0, 0, 1
);

select throws_ok(
  $$update public.import_batches set status = 'applying' where id = 'e0000000-0000-0000-0000-000000000004'::uuid$$,
  '23514', null,
  'legacy ready batches predating database staging integrity cannot enter applying state'
);


insert into public.import_batches (
  id, source_id, term_id, status, filename, preview_hash,
  row_count, valid_row_count, error_count, warning_count
) values (
  'e0000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'AY2627-1', 'staged', 'integrity-weekdays.csv', 'preview-weekdays',
  1, 1, 0, 0
);

select throws_ok(
  $$insert into public.import_rows (
      batch_id, row_number, raw_payload, normalized_payload, status,
      source_record_key, content_hash, entity_type
    ) values (
      'e0000000-0000-0000-0000-000000000005', 2, '{}'::jsonb,
      '{
        "schemaVersion":1,"rowNumber":2,"courseCode":"DEMO 101","sectionCode":"BAD-DUP-DAYS",
        "facultyName":null,"facultyEmail":null,"weekdays":[2,2],"startsAt":"08:00","endsAt":"09:00",
        "roomId":"mb304","sourceRecordKey":"integrity-duplicate-weekdays",
        "courseId":"11111111-1111-1111-1111-111111111111","facultyId":null
      }'::jsonb,
      'valid', 'integrity-duplicate-weekdays', 'duplicate-weekdays-hash', 'schedule_v1'
    )$$,
  '23514', null,
  'database rejects duplicate weekdays even when every weekday token is individually valid'
);

insert into public.import_batches (
  id, source_id, term_id, status, filename, preview_hash,
  row_count, valid_row_count, error_count, warning_count
) values (
  'e0000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'AY2627-1', 'staged', 'integrity-weekday-order.csv', 'preview-weekday-order',
  1, 1, 0, 0
);

select throws_ok(
  $$insert into public.import_rows (
      batch_id, row_number, raw_payload, normalized_payload, status,
      source_record_key, content_hash, entity_type
    ) values (
      'e0000000-0000-0000-0000-000000000006', 2, '{}'::jsonb,
      '{
        "schemaVersion":1,"rowNumber":2,"courseCode":"DEMO 101","sectionCode":"BAD-DAY-ORDER",
        "facultyName":null,"facultyEmail":null,"weekdays":[4,2],"startsAt":"08:00","endsAt":"09:00",
        "roomId":"mb304","sourceRecordKey":"integrity-unsorted-weekdays",
        "courseId":"11111111-1111-1111-1111-111111111111","facultyId":null
      }'::jsonb,
      'valid', 'integrity-unsorted-weekdays', 'unsorted-weekdays-hash', 'schedule_v1'
    )$$,
  '23514', null,
  'database requires schedule V1 weekdays in sorted canonical order'
);

select * from finish();
rollback;
