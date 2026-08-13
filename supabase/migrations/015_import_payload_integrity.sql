-- 015_import_payload_integrity.sql
-- Treat the staging database as a second validation boundary, not merely storage for
-- client/server parser output. A content editor can call the staging RPC directly, so
-- actionable schedule rows must be semantically self-consistent before they can ever
-- become a ready batch. Apply also refuses any legacy batch that predates this gate.

alter table public.import_batches
  add column if not exists staging_integrity_version integer not null default 1;

alter table public.import_batches
  drop constraint if exists import_batches_staging_integrity_version_check;
alter table public.import_batches
  add constraint import_batches_staging_integrity_version_check
  check (staging_integrity_version >= 1);

-- One actionable source identity per batch. Exact duplicate CSV rows may still be
-- retained as status=skipped for audit evidence, but two independently actionable
-- rows cannot race/overwrite each other during apply.
create unique index if not exists import_rows_batch_actionable_source_key_uidx
  on public.import_rows(batch_id, source_record_key)
  where source_record_key is not null
    and status in ('valid','changed','unchanged');

create or replace function private.guard_schedule_import_row_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source_id uuid;
  v_term_id text;
  v_payload jsonb;
  v_course_id uuid;
  v_faculty_id uuid;
  v_existing_hash text;
  v_existing boolean := false;
  v_starts_at time;
  v_ends_at time;
  v_weekday jsonb;
  v_payload_row_number integer;
  v_schema_version integer;
begin
  select b.source_id, b.term_id
  into v_source_id, v_term_id
  from public.import_batches b
  where b.id = new.batch_id;

  if not found or v_source_id is null or v_term_id is null then
    raise exception 'staged row requires a batch with source and term' using errcode = '23503';
  end if;

  if new.status in ('valid','changed','unchanged') then
    if new.entity_type <> 'schedule_v1' then
      raise exception 'unsupported actionable import entity type: %', new.entity_type using errcode = '22023';
    end if;
    if jsonb_typeof(new.normalized_payload) is distinct from 'object' then
      raise exception 'actionable row % requires normalizedPayload', new.row_number using errcode = '23514';
    end if;
    if nullif(new.source_record_key, '') is null or nullif(new.content_hash, '') is null then
      raise exception 'actionable row % requires source identity and content hash', new.row_number using errcode = '23514';
    end if;

    v_payload := new.normalized_payload;

    begin
      v_payload_row_number := (v_payload->>'rowNumber')::integer;
      v_schema_version := (v_payload->>'schemaVersion')::integer;
    exception when others then
      raise exception 'row % has invalid normalized rowNumber/schemaVersion', new.row_number using errcode = '22023';
    end;

    if v_payload_row_number is distinct from new.row_number then
      raise exception 'normalized rowNumber does not match staged row %', new.row_number using errcode = '23514';
    end if;
    if v_schema_version <> 1 then
      raise exception 'row % has unsupported normalized schema version %', new.row_number, v_schema_version using errcode = '22023';
    end if;
    if nullif(v_payload->>'sourceRecordKey', '') is distinct from new.source_record_key then
      raise exception 'normalized sourceRecordKey does not match staged row %', new.row_number using errcode = '23514';
    end if;
    if nullif(btrim(v_payload->>'sectionCode'), '') is null then
      raise exception 'row % requires a section code', new.row_number using errcode = '23514';
    end if;

    begin
      v_course_id := nullif(v_payload->>'courseId', '')::uuid;
    exception when others then
      raise exception 'row % has invalid courseId', new.row_number using errcode = '22023';
    end;
    if v_course_id is null then
      raise exception 'row % requires a resolved courseId', new.row_number using errcode = '23514';
    end if;
    if not exists (
      select 1
      from public.courses c
      where c.id = v_course_id
        and c.code = v_payload->>'courseCode'
    ) then
      raise exception 'row % courseId/courseCode do not resolve to the same course', new.row_number using errcode = '23503';
    end if;

    if nullif(v_payload->>'facultyId', '') is not null then
      begin
        v_faculty_id := (v_payload->>'facultyId')::uuid;
      exception when others then
        raise exception 'row % has invalid facultyId', new.row_number using errcode = '22023';
      end;
      if not exists (select 1 from public.faculty f where f.id = v_faculty_id) then
        raise exception 'row % references unknown facultyId', new.row_number using errcode = '23503';
      end if;
    end if;

    if nullif(v_payload->>'roomId', '') is not null
       and not exists (select 1 from public.spaces s where s.id = v_payload->>'roomId') then
      raise exception 'row % references unknown roomId', new.row_number using errcode = '23503';
    end if;

    if jsonb_typeof(v_payload->'weekdays') is distinct from 'array'
       or jsonb_array_length(v_payload->'weekdays') = 0 then
      raise exception 'row % requires at least one meeting weekday', new.row_number using errcode = '23514';
    end if;

    for v_weekday in select value from jsonb_array_elements(v_payload->'weekdays')
    loop
      if jsonb_typeof(v_weekday) <> 'number'
         or (v_weekday #>> '{}') !~ '^[1-7]$' then
        raise exception 'row % contains an invalid weekday', new.row_number using errcode = '23514';
      end if;
    end loop;

    begin
      v_starts_at := (v_payload->>'startsAt')::time;
      v_ends_at := (v_payload->>'endsAt')::time;
    exception when others then
      raise exception 'row % contains an invalid meeting time', new.row_number using errcode = '22023';
    end;
    if v_ends_at <= v_starts_at then
      raise exception 'row % meeting end time must be after start time', new.row_number using errcode = '23514';
    end if;

    -- Schedule V1 intentionally models one independent source row per meeting pattern.
    -- Distinct source keys describing the same course/section/day/time/room would
    -- otherwise duplicate meeting rows (and make team-teaching provenance ambiguous).
    -- Fail closed until a normalized meeting-ownership model is introduced.
    if exists (
      select 1
      from public.import_rows prior
      where prior.batch_id = new.batch_id
        and prior.status in ('valid','changed','unchanged')
        and prior.source_record_key is distinct from new.source_record_key
        and prior.normalized_payload->>'courseId' = v_payload->>'courseId'
        and btrim(prior.normalized_payload->>'sectionCode') = btrim(v_payload->>'sectionCode')
        and prior.normalized_payload->'weekdays' = v_payload->'weekdays'
        and prior.normalized_payload->>'startsAt' = v_payload->>'startsAt'
        and prior.normalized_payload->>'endsAt' = v_payload->>'endsAt'
        and coalesce(prior.normalized_payload->>'roomId', '') = coalesce(v_payload->>'roomId', '')
    ) then
      raise exception 'row % duplicates a meeting pattern already staged under a different source identity', new.row_number using errcode = '23505';
    end if;

    select sr.content_hash
    into v_existing_hash
    from public.source_records sr
    where sr.source_id = v_source_id
      and sr.term_id is not distinct from v_term_id
      and sr.entity_type = new.entity_type
      and sr.source_record_key = new.source_record_key;
    v_existing := found;

    if new.status = 'valid' and v_existing then
      raise exception 'row % is marked valid but source identity already exists', new.row_number using errcode = '23514';
    elsif new.status = 'changed' and (not v_existing or v_existing_hash is not distinct from new.content_hash) then
      raise exception 'row % changed status does not match existing source state', new.row_number using errcode = '23514';
    elsif new.status = 'unchanged' and (not v_existing or v_existing_hash is distinct from new.content_hash) then
      raise exception 'row % unchanged status does not match existing source state', new.row_number using errcode = '23514';
    end if;
  end if;

  -- The row passed the database-side staging contract. Because stage_schedule_import_batch
  -- is transactional, a later row/issue failure rolls this marker back with the batch.
  update public.import_batches
  set staging_integrity_version = greatest(staging_integrity_version, 2)
  where id = new.batch_id;

  return new;
end;
$$;

revoke execute on function private.guard_schedule_import_row_integrity() from public, anon, authenticated;

drop trigger if exists schedule_import_row_integrity_guard on public.import_rows;
create trigger schedule_import_row_integrity_guard
before insert on public.import_rows
for each row execute function private.guard_schedule_import_row_integrity();

-- Apply-time defense in depth. Counts/statuses are recomputed from immutable staging
-- evidence, so a malformed legacy batch or direct metadata mutation cannot be applied.
create or replace function private.guard_import_batch_apply_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row_count integer;
  v_valid_count integer;
  v_error_count integer;
  v_warning_count integer;
  v_invalid_count integer;
begin
  if new.status = 'applying' and old.status is distinct from new.status then
    if old.status <> 'ready' then
      raise exception 'only a ready batch can enter applying state' using errcode = '23514';
    end if;
    if old.staging_integrity_version < 2 then
      raise exception 'batch predates database-side staging integrity; restage before apply' using errcode = '23514';
    end if;
    if nullif(old.preview_hash, '') is null then
      raise exception 'ready batch requires a preview hash' using errcode = '23514';
    end if;

    select
      count(*)::integer,
      count(*) filter (where r.status in ('valid','changed','unchanged'))::integer,
      count(*) filter (where r.status = 'invalid')::integer
    into v_row_count, v_valid_count, v_invalid_count
    from public.import_rows r
    where r.batch_id = old.id;

    select
      count(*) filter (where i.issue_type = 'error')::integer,
      count(*) filter (where i.issue_type = 'warning')::integer
    into v_error_count, v_warning_count
    from public.import_issues i
    join public.import_rows r on r.id = i.import_row_id
    where r.batch_id = old.id;

    if old.row_count <> v_row_count
       or old.valid_row_count <> v_valid_count
       or old.error_count <> v_error_count
       or old.warning_count <> v_warning_count then
      raise exception 'batch aggregate metadata does not match immutable staging evidence' using errcode = '23514';
    end if;
    if v_error_count <> 0 or v_invalid_count <> 0 then
      raise exception 'ready batch contains invalid/error rows' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function private.guard_import_batch_apply_integrity() from public, anon, authenticated;

drop trigger if exists import_batch_apply_integrity_guard on public.import_batches;
create trigger import_batch_apply_integrity_guard
before update of status on public.import_batches
for each row execute function private.guard_import_batch_apply_integrity();
