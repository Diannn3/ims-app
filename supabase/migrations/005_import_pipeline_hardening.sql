-- 005_import_pipeline_hardening.sql
-- Versioned, fail-closed CSV staging + normalized source identity + transactional apply.

-- -----------------------------------------------------------------------------
-- Batch lifecycle and audit metadata.
-- -----------------------------------------------------------------------------

alter table public.import_batches drop constraint if exists import_batches_status_check;
alter table public.import_batches
  add constraint import_batches_status_check
  check (status in ('staged','validating','validation_failed','ready','applying','applied','rejected'));

alter table public.import_batches add column if not exists filename text;
alter table public.import_batches add column if not exists warning_count integer not null default 0;
alter table public.import_batches add column if not exists preview_hash text;
alter table public.import_batches add column if not exists schema_version integer not null default 1;
alter table public.import_batches add column if not exists authoritative_snapshot boolean not null default false;
alter table public.import_batches add column if not exists updated_at timestamptz not null default now();

-- -----------------------------------------------------------------------------
-- Enrich migration-003 staging rows/issues without dropping audit history.
-- -----------------------------------------------------------------------------

alter table public.import_rows add column if not exists entity_type text not null default 'schedule_v1';

alter table public.import_rows drop constraint if exists import_rows_status_check;
alter table public.import_rows
  add constraint import_rows_status_check
  check (status in ('pending','valid','invalid','unchanged','changed','applied','skipped'));

alter table public.import_issues add column if not exists error_code text;
alter table public.import_issues add column if not exists original_value text;
alter table public.import_issues add column if not exists normalized_value text;
alter table public.import_issues add column if not exists suggested_value text;
alter table public.import_issues add column if not exists acknowledged_at timestamptz;
alter table public.import_issues add column if not exists acknowledged_by uuid references public.profiles(user_id) on delete set null;

-- Backfill a stable code so application code never needs to infer it from prose.
update public.import_issues
set error_code = coalesce(error_code, upper(issue_type) || '_LEGACY')
where error_code is null;

alter table public.import_issues alter column error_code set not null;

-- Editor issue updates are acknowledgement-only. The content of a validation issue
-- is part of the audit trail and cannot be rewritten by a reviewer. Admins retain
-- correction authority for exceptional recovery.
create or replace function private.guard_import_issue_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch_status text;
begin
  if private.has_any_role(array['admin']::public.app_role[]) then
    return new;
  end if;

  if not private.has_any_role(array['content_editor']::public.app_role[]) then
    raise exception 'reviewer role required' using errcode = '42501';
  end if;

  if new.import_row_id is distinct from old.import_row_id
     or new.issue_type is distinct from old.issue_type
     or new.message is distinct from old.message
     or new.field is distinct from old.field
     or new.error_code is distinct from old.error_code
     or new.original_value is distinct from old.original_value
     or new.normalized_value is distinct from old.normalized_value
     or new.suggested_value is distinct from old.suggested_value
     or new.created_at is distinct from old.created_at then
    raise exception 'content editors may only acknowledge import warnings' using errcode = '42501';
  end if;

  select b.status into v_batch_status
  from public.import_rows r
  join public.import_batches b on b.id = r.batch_id
  where r.id = old.import_row_id;

  if v_batch_status <> 'ready' then
    raise exception 'warnings may only be acknowledged on ready batches' using errcode = '23514';
  end if;

  if old.issue_type <> 'warning' then
    raise exception 'only warnings can be acknowledged' using errcode = '23514';
  end if;

  if old.acknowledged_at is not null then
    raise exception 'warning acknowledgement is immutable' using errcode = '23514';
  end if;

  if new.acknowledged_at is null or new.acknowledged_by is distinct from (select auth.uid()) then
    raise exception 'warning acknowledgement must record the current reviewer' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function private.guard_import_issue_update() from public, anon, authenticated;

drop trigger if exists import_issue_update_guard on public.import_issues;
create trigger import_issue_update_guard
before update on public.import_issues
for each row execute function private.guard_import_issue_update();

-- Migration 004 keeps issue updates admin-only until this trigger exists. Once the
-- guard is installed, reviewers may acknowledge warnings while all other edits stay
-- admin-only through the trigger.
drop policy if exists "admin update import issues" on public.import_issues;
create policy "staff update import issues"
  on public.import_issues for update to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])))
  with check ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));

-- Final batch states are immutable audit records.
create or replace function private.guard_terminal_import_batch()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status in ('applied','rejected') then
    raise exception 'terminal import batches are immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function private.guard_terminal_import_batch() from public, anon, authenticated;

drop trigger if exists terminal_import_batch_guard on public.import_batches;
create trigger terminal_import_batch_guard
before update on public.import_batches
for each row execute function private.guard_terminal_import_batch();

-- -----------------------------------------------------------------------------
-- Normalized source-record identity.
-- One source row may expand into several meeting rows (e.g. M/W/F), so production
-- children point many-to-one at the source record.
-- -----------------------------------------------------------------------------

create table if not exists public.source_records (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.data_sources(id) on delete restrict,
  term_id text references public.academic_terms(id) on delete cascade,
  entity_type text not null,
  source_record_key text not null,
  content_hash text not null,
  import_batch_id uuid references public.import_batches(id) on delete set null,
  source_updated_at timestamptz,
  last_applied_at timestamptz not null default now(),
  unique (source_id, term_id, entity_type, source_record_key)
);

alter table public.source_records enable row level security;

alter table public.section_meetings
  add column if not exists source_record_id uuid references public.source_records(id) on delete set null;
alter table public.faculty_section_assignments
  add column if not exists source_record_id uuid references public.source_records(id) on delete set null;
alter table public.faculty_offices
  add column if not exists source_record_id uuid references public.source_records(id) on delete set null;
alter table public.consultation_hours
  add column if not exists source_record_id uuid references public.source_records(id) on delete set null;

create index if not exists source_records_lookup_idx
  on public.source_records(source_id, term_id, entity_type, source_record_key);
create index if not exists source_records_batch_idx on public.source_records(import_batch_id);
create index if not exists section_meetings_source_record_idx on public.section_meetings(source_record_id);
create index if not exists faculty_assignments_source_record_idx on public.faculty_section_assignments(source_record_id);
create index if not exists import_rows_batch_key_idx on public.import_rows(batch_id, source_record_key);
create index if not exists import_issues_row_type_idx on public.import_issues(import_row_id, issue_type);

-- Source-record provenance is staff-only internal metadata.
create policy "staff read source records"
  on public.source_records for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));
create policy "admin mutate source records"
  on public.source_records for all to authenticated
  using ((select private.has_any_role(array['admin']::public.app_role[])))
  with check ((select private.has_any_role(array['admin']::public.app_role[])));

-- -----------------------------------------------------------------------------
-- Transactional apply. Browser code never performs the multi-table mutation.
-- The function is SECURITY DEFINER only because it must apply a reviewed batch as
-- one transaction; it performs its own admin check and uses an empty search_path.
-- -----------------------------------------------------------------------------

create or replace function public.apply_import_batch(p_batch_id uuid, p_preview_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch public.import_batches%rowtype;
  v_row public.import_rows%rowtype;
  v_source_record_id uuid;
  v_section_id uuid;
  v_course_id uuid;
  v_faculty_id uuid;
  v_weekday jsonb;
  v_applied integer := 0;
  v_unchanged integer := 0;
begin
  if not private.has_any_role(array['admin']::public.app_role[]) then
    raise exception 'admin role required' using errcode = '42501';
  end if;

  select * into v_batch
  from public.import_batches
  where id = p_batch_id
  for update;

  if not found then
    raise exception 'import batch not found';
  end if;
  if v_batch.status <> 'ready' then
    raise exception 'import batch must be ready';
  end if;
  if v_batch.error_count <> 0 then
    raise exception 'import batch contains validation errors';
  end if;
  if v_batch.source_id is null or v_batch.term_id is null then
    raise exception 'source and term are required before apply';
  end if;
  if v_batch.preview_hash is null or p_preview_hash is distinct from v_batch.preview_hash then
    raise exception 'preview changed; validate again before applying';
  end if;
  if exists (
    select 1 from public.import_issues i
    join public.import_rows r on r.id = i.import_row_id
    where r.batch_id = p_batch_id
      and i.issue_type = 'warning'
      and i.acknowledged_at is null
  ) then
    raise exception 'all warnings must be acknowledged before apply';
  end if;

  update public.import_batches
  set status = 'applying', updated_at = now()
  where id = p_batch_id;

  for v_row in
    select * from public.import_rows
    where batch_id = p_batch_id
      and status in ('valid','changed','unchanged')
    order by row_number
  loop
    if v_row.status = 'unchanged' then
      v_unchanged := v_unchanged + 1;
      update public.import_rows set status = 'skipped', updated_at = now() where id = v_row.id;
      continue;
    end if;

    if v_row.entity_type <> 'schedule_v1' then
      raise exception 'unsupported import entity type: %', v_row.entity_type;
    end if;

    -- Validator stores resolved UUIDs/IDs in normalized_payload. The apply RPC does
    -- not guess identities or fuzzy-match anything.
    v_course_id := nullif(v_row.normalized_payload->>'courseId','')::uuid;
    v_faculty_id := nullif(v_row.normalized_payload->>'facultyId','')::uuid;

    if v_course_id is null then
      raise exception 'row % has no resolved course', v_row.row_number;
    end if;
    if v_row.source_record_key is null or v_row.content_hash is null then
      raise exception 'row % lacks source identity', v_row.row_number;
    end if;

    insert into public.source_records (
      source_id, term_id, entity_type, source_record_key, content_hash, import_batch_id, last_applied_at
    ) values (
      v_batch.source_id, v_batch.term_id, v_row.entity_type,
      v_row.source_record_key, v_row.content_hash, p_batch_id, now()
    )
    on conflict (source_id, term_id, entity_type, source_record_key)
    do update set
      content_hash = excluded.content_hash,
      import_batch_id = excluded.import_batch_id,
      last_applied_at = now()
    returning id into v_source_record_id;

    -- Fail closed: imported schedule changes are never auto-published. If a section
    -- was public, importing a changed source withdraws it until an admin verifies and
    -- republishes the new schedule.
    insert into public.sections (
      course_id, term_id, section_code, source_id, publication_status, review_status
    ) values (
      v_course_id,
      v_batch.term_id,
      v_row.normalized_payload->>'sectionCode',
      v_batch.source_id,
      'needs_verification',
      'needs_verification'
    )
    on conflict (course_id, term_id, section_code)
    do update set
      source_id = excluded.source_id,
      publication_status = 'needs_verification',
      review_status = 'needs_verification',
      updated_at = now()
    returning id into v_section_id;

    -- Replace only children owned by this exact source row. M/W/F rows therefore
    -- update atomically without touching other rows for the same section.
    delete from public.section_meetings where source_record_id = v_source_record_id;
    delete from public.faculty_section_assignments where source_record_id = v_source_record_id;

    for v_weekday in select * from jsonb_array_elements(v_row.normalized_payload->'weekdays')
    loop
      insert into public.section_meetings (
        section_id, weekday, starts_at, ends_at, space_id, source_id,
        publication_status, review_status, source_record_id
      ) values (
        v_section_id,
        (v_weekday #>> '{}')::smallint,
        (v_row.normalized_payload->>'startsAt')::time,
        (v_row.normalized_payload->>'endsAt')::time,
        nullif(v_row.normalized_payload->>'roomId',''),
        v_batch.source_id,
        'needs_verification',
        'needs_verification',
        v_source_record_id
      );
    end loop;

    if v_faculty_id is not null then
      insert into public.faculty_section_assignments (
        faculty_id, section_id, assignment_role, source_id, source_record_id
      ) values (
        v_faculty_id, v_section_id, 'instructor', v_batch.source_id, v_source_record_id
      )
      on conflict (faculty_id, section_id, assignment_role)
      do update set source_id = excluded.source_id, source_record_id = excluded.source_record_id;
    end if;

    update public.import_rows set status = 'applied', updated_at = now() where id = v_row.id;
    v_applied := v_applied + 1;
  end loop;

  update public.import_batches
  set
    status = 'applied',
    applied_at = now(),
    updated_at = now(),
    summary = coalesce(summary, '{}'::jsonb) || jsonb_build_object(
      'applied_rows', v_applied,
      'unchanged_rows', v_unchanged,
      'applied_by', auth.uid()
    )
  where id = p_batch_id;

  return jsonb_build_object(
    'batch_id', p_batch_id,
    'status', 'applied',
    'applied_rows', v_applied,
    'unchanged_rows', v_unchanged
  );
end;
$$;

revoke execute on function public.apply_import_batch(uuid, text) from public, anon;
grant execute on function public.apply_import_batch(uuid, text) to authenticated;
