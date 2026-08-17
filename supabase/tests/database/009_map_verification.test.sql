begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

select has_table('public', 'map_verification_sessions', 'map verification sessions table exists');
select has_table('public', 'map_verification_changes', 'map verification changes table exists');
select has_table('public', 'map_verification_evidence', 'map verification evidence table exists');
select has_table('public', 'map_publish_snapshots', 'immutable map snapshots table exists');
select has_function('public', 'create_map_verification_session', array['text','text','text','text'], 'session creation RPC exists');
select has_function('public', 'submit_map_verification_session', array['uuid'], 'session submission RPC exists');
select has_function('public', 'approve_map_verification_session', array['uuid','text','jsonb'], 'admin approval RPC exists');
select has_function('public', 'rebase_map_verification_session', array['uuid','text','jsonb'], 'safe rebase RPC exists');
select has_function('public', 'upsert_map_verification_change', array['uuid','text','text','text','jsonb','jsonb'], 'change RPC exists');
select ok(not has_table_privilege('authenticated', 'public.map_verification_sessions', 'INSERT'), 'authenticated clients cannot insert drafts directly');
select ok(not has_table_privilege('authenticated', 'public.map_verification_sessions', 'UPDATE'), 'authenticated clients cannot rewrite session status directly');
select ok(not has_table_privilege('authenticated', 'public.map_publish_snapshots', 'DELETE'), 'authenticated clients cannot delete snapshots directly');
select ok(not has_table_privilege('authenticated', 'public.map_publish_snapshots', 'UPDATE'), 'authenticated clients cannot rewrite snapshots directly');

insert into auth.users (id, email) values
  ('10000000-0000-0000-0000-000000000005', 'map-student@example.test'),
  ('10000000-0000-0000-0000-000000000006', 'map-editor@example.test'),
  ('10000000-0000-0000-0000-000000000007', 'map-admin@example.test');
update public.profiles set role = 'map_editor' where user_id = '10000000-0000-0000-0000-000000000006';
update public.profiles set role = 'admin' where user_id = '10000000-0000-0000-0000-000000000007';

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000005';
select results_eq(
  $$select count(*)::bigint from public.map_verification_sessions$$,
  array[0::bigint],
  'students cannot inspect map verification drafts'
);
select throws_ok(
  $$select public.create_map_verification_session('mb', 'map-v3-guided-wayfinding', 'space', 'student')$$,
  '42501', null,
  'students cannot create verification sessions'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000006';
select lives_ok(
  $$select public.create_map_verification_session('mb', 'map-v3-guided-wayfinding', 'space', 'field walk')$$,
  'map editors can create private drafts'
);
reset role;
select set_config('ims.test.map_session_id', (select id::text from public.map_verification_sessions where title = 'field walk'), true);

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000006';
select throws_ok(
  $$select public.approve_map_verification_session(current_setting('ims.test.map_session_id')::uuid, 'map-v3-guided-wayfinding', '{"sealed":true}'::jsonb)$$,
  '42501', null,
  'map editors cannot approve snapshots'
);
select lives_ok(
  $$select public.upsert_map_verification_change(current_setting('ims.test.map_session_id')::uuid, 'space', 'mb304', 'update', '{"x":1}'::jsonb, '{"x":2}'::jsonb)$$,
  'map editors can record a draft delta'
);
select throws_ok(
  $$select public.rebase_map_verification_session(current_setting('ims.test.map_session_id')::uuid, 'new-revision', '{"space:mb304":{"x":9}}'::jsonb)$$,
  '40001', null,
  'rebase blocks a canonical geometry conflict'
);
select throws_ok(
  $$select public.submit_map_verification_session(current_setting('ims.test.map_session_id')::uuid)$$,
  '23514', null,
  'incomplete physical checklist blocks submission'
);
select lives_ok(
  $$select public.save_map_verification_session(current_setting('ims.test.map_session_id')::uuid, 'space', 'field walk', '{"signage_name":true,"doorway_location":true,"corridor_connection":true,"nearby_context":true}'::jsonb)$$,
  'map editor can save physical checklist observations'
);
select lives_ok(
  $$select public.submit_map_verification_session(current_setting('ims.test.map_session_id')::uuid)$$,
  'complete physical checklist permits submission'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000007';
select lives_ok(
  $$select public.approve_map_verification_session(current_setting('ims.test.map_session_id')::uuid, 'map-v3-guided-wayfinding', '{"sealed":true}'::jsonb)$$,
  'admin can seal an approved snapshot'
);
reset role;

select throws_ok(
  $$update public.map_publish_snapshots set payload = '{"tampered":true}'::jsonb where session_id = current_setting('ims.test.map_session_id')::uuid$$,
  '55000', null,
  'approved snapshots are immutable even for owner-level SQL paths'
);

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000006';
select throws_ok(
  $$select public.rebase_map_verification_session(current_setting('ims.test.map_session_id')::uuid, 'new-revision', '{"space:mb304":{"x":9}}'::jsonb)$$,
  '42501', null,
  'approved sessions cannot be silently rebased'
);
reset role;

select * from finish();
rollback;
