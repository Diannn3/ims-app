begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

select has_function(
  'public',
  'stage_schedule_import_batch',
  array['uuid','text','text','text','jsonb','integer','boolean'],
  'atomic schedule staging RPC exists'
);

select ok(
  not has_table_privilege('authenticated', 'public.import_batches', 'INSERT'),
  'authenticated role has no direct INSERT privilege on import batches'
);
select ok(
  not has_table_privilege('authenticated', 'public.import_rows', 'UPDATE'),
  'authenticated role cannot rewrite staged rows'
);
select ok(
  has_column_privilege('authenticated', 'public.import_batches', 'status', 'UPDATE'),
  'authenticated role has the narrow batch-status UPDATE grant used by admin rejection'
);
select ok(
  not has_column_privilege('authenticated', 'public.import_batches', 'preview_hash', 'UPDATE'),
  'authenticated role cannot rewrite the reviewed preview hash'
);
select ok(
  has_column_privilege('authenticated', 'public.import_issues', 'acknowledged_at', 'UPDATE'),
  'authenticated role can update the warning acknowledgement timestamp subject to RLS/trigger checks'
);
select ok(
  not has_column_privilege('authenticated', 'public.import_issues', 'message', 'UPDATE'),
  'authenticated role cannot rewrite validation issue content'
);
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'role', 'SELECT'),
  'authenticated role can read its own profile row for sign-in role resolution'
);
select ok(
  has_column_privilege('authenticated', 'public.import_batches', 'id', 'SELECT'),
  'authenticated staff can read import batch metadata subject to RLS'
);
select ok(
  has_column_privilege('authenticated', 'public.import_rows', 'id', 'SELECT'),
  'authenticated staff can read staged import rows subject to RLS'
);
select ok(
  has_column_privilege('authenticated', 'public.import_issues', 'id', 'SELECT'),
  'authenticated staff can read validation issues subject to RLS'
);

-- Use ordinary auth.users rows exactly as Supabase documents for RLS testing. The
-- project auth trigger creates student profiles; test setup then promotes the roles
-- under the database owner before switching into authenticated request contexts.
insert into auth.users (id, email) values
  ('10000000-0000-0000-0000-000000000001', 'student-rbac@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'editor-rbac@example.test'),
  ('10000000-0000-0000-0000-000000000003', 'admin-rbac@example.test'),
  ('10000000-0000-0000-0000-000000000004', 'faculty-rbac@example.test');

update public.profiles set role = 'content_editor' where user_id = '10000000-0000-0000-0000-000000000002';
update public.profiles set role = 'admin' where user_id = '10000000-0000-0000-0000-000000000003';
update public.profiles set role = 'faculty' where user_id = '10000000-0000-0000-0000-000000000004';

-- Student: cannot see internal sources, cannot directly stage, cannot call staging RPC.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
select results_eq(
  $$select count(*)::bigint from public.data_sources$$,
  array[0::bigint],
  'student cannot inspect internal data sources'
);
select throws_ok(
  $$insert into public.import_batches (source_id, term_id, imported_by, status) values ('00000000-0000-0000-0000-000000000000', 'AY2627-1', '10000000-0000-0000-0000-000000000001', 'ready')$$,
  '42501', null,
  'student cannot insert import batches directly'
);
select throws_ok(
  $$select public.stage_schedule_import_batch(
    '00000000-0000-0000-0000-000000000000', 'AY2627-1', 'student.csv', 'student-hash', '[]'::jsonb, 1, false
  )$$,
  '42501', null,
  'student cannot stage schedule imports through the RPC'
);
reset role;

-- Faculty ownership of consultation content does not imply import authority.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000004';
select throws_ok(
  $$select public.stage_schedule_import_batch(
    '00000000-0000-0000-0000-000000000000', 'AY2627-1', 'faculty.csv', 'faculty-hash', '[]'::jsonb, 1, false
  )$$,
  '42501', null,
  'faculty cannot stage academic schedule imports'
);
reset role;

-- Content editor: can read source setup and stage atomically, but cannot bypass the
-- RPC with table inserts and cannot apply the resulting batch.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000002';
select results_eq(
  $$select count(*)::bigint from public.data_sources where id = '00000000-0000-0000-0000-000000000000'::uuid$$,
  array[1::bigint],
  'content editor can read internal source setup'
);
select lives_ok(
  $$select public.stage_schedule_import_batch(
    '00000000-0000-0000-0000-000000000000',
    'AY2627-1',
    'editor-rbac.csv',
    'editor-preview-hash',
    '[{
      "rowNumber": 2,
      "rawPayload": {"course_code":"DEMO 101","section_code":"RBAC-EDITOR"},
      "normalizedPayload": {
        "schemaVersion":1,
        "rowNumber":2,
        "courseCode":"DEMO 101",
        "sectionCode":"RBAC-EDITOR",
        "facultyName":null,
        "facultyEmail":null,
        "weekdays":[1],
        "startsAt":"08:00",
        "endsAt":"09:00",
        "roomId":"mb304",
        "sourceRecordKey":"rbac-editor-source-row",
        "courseId":"11111111-1111-1111-1111-111111111111",
        "facultyId":null
      },
      "status":"valid",
      "sourceRecordKey":"rbac-editor-source-row",
      "contentHash":"rbac-editor-content-hash",
      "issues":[]
    }]'::jsonb,
    1,
    false
  )$$,
  'content editor can stage a validated import through the atomic RPC'
);
reset role;
select set_config(
  'ims.test.editor_batch_id',
  (select id::text from public.import_batches where filename = 'editor-rbac.csv'),
  true
);
select results_eq(
  $$select status from public.import_batches where filename = 'editor-rbac.csv'$$,
  array['ready'::text],
  'editor staged batch becomes ready only after atomic staging completes'
);
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000002';
select throws_ok(
  $$insert into public.import_rows (batch_id, row_number, raw_payload) values (current_setting('ims.test.editor_batch_id')::uuid, 99, '{}'::jsonb)$$,
  '42501', null,
  'content editor cannot insert staging rows directly'
);
select throws_ok(
  $$select public.apply_import_batch(current_setting('ims.test.editor_batch_id')::uuid, 'editor-preview-hash')$$,
  '42501', null,
  'content editor cannot apply an import batch'
);
reset role;

-- Admin: stage and apply through the guarded RPCs.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';
select lives_ok(
  $$select public.stage_schedule_import_batch(
    '00000000-0000-0000-0000-000000000000',
    'AY2627-1',
    'admin-rbac.csv',
    'admin-preview-hash',
    '[{
      "rowNumber": 2,
      "rawPayload": {"course_code":"DEMO 101","section_code":"RBAC-A"},
      "normalizedPayload": {
        "schemaVersion":1,
        "rowNumber":2,
        "courseCode":"DEMO 101",
        "sectionCode":"RBAC-A",
        "facultyName":null,
        "facultyEmail":null,
        "weekdays":[2],
        "startsAt":"09:00",
        "endsAt":"10:00",
        "roomId":"mb304",
        "sourceRecordKey":"rbac-admin-source-row",
        "courseId":"11111111-1111-1111-1111-111111111111",
        "facultyId":null
      },
      "status":"valid",
      "sourceRecordKey":"rbac-admin-source-row",
      "contentHash":"rbac-admin-content-hash",
      "issues":[]
    }]'::jsonb,
    1,
    false
  )$$,
  'admin can stage a validated import'
);
reset role;
select set_config(
  'ims.test.admin_batch_id',
  (select id::text from public.import_batches where filename = 'admin-rbac.csv'),
  true
);
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';
select lives_ok(
  $$select public.apply_import_batch(current_setting('ims.test.admin_batch_id')::uuid, 'admin-preview-hash')$$,
  'admin can atomically apply a ready batch'
);
reset role;

-- Editor may review the applied section but cannot publish it.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000002';
select lives_ok(
  $$select public.set_schedule_section_review((select id from public.sections where section_code = 'RBAC-A' and term_id = 'AY2627-1'), 'verified'::public.review_status, 'RBAC test review')$$,
  'content editor can verify an applied schedule section'
);
select throws_ok(
  $$select public.set_schedule_section_publication((select id from public.sections where section_code = 'RBAC-A' and term_id = 'AY2627-1'), true, 'must fail')$$,
  '42501', null,
  'content editor cannot publish a verified schedule section'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';
select lives_ok(
  $$select public.set_schedule_section_publication((select id from public.sections where section_code = 'RBAC-A' and term_id = 'AY2627-1'), true, 'RBAC test publish')$$,
  'admin can publish a verified schedule section'
);
reset role;

set local role anon;
select results_eq(
  $$select count(*)::bigint from public.public_sections where section_code = 'RBAC-A' and term_id = 'AY2627-1'$$,
  array[1::bigint],
  'anonymous readers see the section only after verified admin publication'
);
reset role;

-- Force a failure after the batch row is created: duplicate staged row numbers violate
-- the per-batch UNIQUE constraint. The function call must roll back the batch itself.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';
select throws_ok(
  $$select public.stage_schedule_import_batch(
    '00000000-0000-0000-0000-000000000000',
    'AY2627-1',
    'atomic-rollback.csv',
    'atomic-rollback-hash',
    '[
      {"rowNumber":2,"rawPayload":{},"normalizedPayload":{"schemaVersion":1,"rowNumber":2,"courseCode":"DEMO 101","sectionCode":"ATOMIC-A","facultyName":null,"facultyEmail":null,"weekdays":[1],"startsAt":"08:00","endsAt":"09:00","roomId":"mb304","sourceRecordKey":"atomic-a","courseId":"11111111-1111-1111-1111-111111111111","facultyId":null},"status":"valid","sourceRecordKey":"atomic-a","contentHash":"hash-a","issues":[]},
      {"rowNumber":2,"rawPayload":{},"normalizedPayload":{"schemaVersion":1,"rowNumber":2,"courseCode":"DEMO 101","sectionCode":"ATOMIC-B","facultyName":null,"facultyEmail":null,"weekdays":[2],"startsAt":"09:00","endsAt":"10:00","roomId":"mb304","sourceRecordKey":"atomic-b","courseId":"11111111-1111-1111-1111-111111111111","facultyId":null},"status":"valid","sourceRecordKey":"atomic-b","contentHash":"hash-b","issues":[]}
    ]'::jsonb,
    1,
    false
  )$$,
  '23505', null,
  'staging failure rolls back instead of leaving a partial batch'
);
reset role;
select results_eq(
  $$select count(*)::bigint from public.import_batches where filename = 'atomic-rollback.csv'$$,
  array[0::bigint],
  'failed atomic staging leaves no batch row behind'
);

select * from finish();
rollback;
