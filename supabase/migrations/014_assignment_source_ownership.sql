-- 014_assignment_source_ownership.sql
-- A faculty assignment can be corroborated by more than one schedule source row.
-- The earlier single source_record_id column could only remember the last supporting
-- row. If that row later removed/changed its faculty while another source row still
-- supported the same assignment, the assignment could be deleted incorrectly.
--
-- Canonical import provenance is therefore many-to-many:
--   source_record -> faculty_section_assignment_sources -> faculty assignment
-- The assignment remains present until its final import owner disappears.

alter table public.faculty_section_assignments
  add column if not exists import_managed boolean not null default false;

create table if not exists public.faculty_section_assignment_sources (
  source_record_id uuid not null references public.source_records(id) on delete cascade,
  faculty_id uuid not null,
  section_id uuid not null,
  assignment_role text not null,
  created_at timestamptz not null default now(),
  primary key (source_record_id, faculty_id, section_id, assignment_role),
  foreign key (faculty_id, section_id, assignment_role)
    references public.faculty_section_assignments(faculty_id, section_id, assignment_role)
    on delete cascade
);

alter table public.faculty_section_assignment_sources enable row level security;

create index if not exists faculty_assignment_sources_assignment_idx
  on public.faculty_section_assignment_sources(faculty_id, section_id, assignment_role);
create index if not exists faculty_assignment_sources_record_idx
  on public.faculty_section_assignment_sources(source_record_id);

-- Provenance ownership is internal review data. Direct writes are reserved for the
-- transactional apply RPC; reviewers/admins may inspect it for diagnostics.
revoke all on table public.faculty_section_assignment_sources from anon, authenticated;
grant select on table public.faculty_section_assignment_sources to authenticated;

create policy "staff read faculty assignment sources"
  on public.faculty_section_assignment_sources for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));

-- -----------------------------------------------------------------------------
-- Backfill ownership from prior imports.
--
-- First restore any assignment that is still implied by the latest applied row for a
-- source record. This repairs the edge case where single-owner provenance may already
-- have removed an assignment supported by another source row.
-- -----------------------------------------------------------------------------

with recovered as (
  select distinct
    sr.id as source_record_id,
    sr.source_id,
    nullif(r.normalized_payload->>'facultyId', '')::uuid as faculty_id,
    s.id as section_id,
    'instructor'::text as assignment_role
  from public.source_records sr
  join public.import_rows r
    on r.batch_id = sr.import_batch_id
   and r.source_record_key = sr.source_record_key
  join public.sections s
    on s.term_id is not distinct from sr.term_id
   and s.course_id = nullif(r.normalized_payload->>'courseId', '')::uuid
   and s.section_code = r.normalized_payload->>'sectionCode'
  where sr.entity_type = 'schedule_v1'
    and jsonb_typeof(r.normalized_payload) = 'object'
    and nullif(r.normalized_payload->>'facultyId', '') is not null
)
insert into public.faculty_section_assignments (
  faculty_id,
  section_id,
  assignment_role,
  source_id,
  import_managed
)
select
  recovered.faculty_id,
  recovered.section_id,
  recovered.assignment_role,
  recovered.source_id,
  true
from recovered
on conflict (faculty_id, section_id, assignment_role) do nothing;

-- Preserve direct ownership remembered by the previous model.
insert into public.faculty_section_assignment_sources (
  source_record_id,
  faculty_id,
  section_id,
  assignment_role
)
select
  a.source_record_id,
  a.faculty_id,
  a.section_id,
  a.assignment_role
from public.faculty_section_assignments a
where a.source_record_id is not null
on conflict do nothing;

-- Recover every source row's latest known ownership, not only whichever one happened
-- to be stored in faculty_section_assignments.source_record_id.
with recovered as (
  select distinct
    sr.id as source_record_id,
    nullif(r.normalized_payload->>'facultyId', '')::uuid as faculty_id,
    s.id as section_id,
    'instructor'::text as assignment_role
  from public.source_records sr
  join public.import_rows r
    on r.batch_id = sr.import_batch_id
   and r.source_record_key = sr.source_record_key
  join public.sections s
    on s.term_id is not distinct from sr.term_id
   and s.course_id = nullif(r.normalized_payload->>'courseId', '')::uuid
   and s.section_code = r.normalized_payload->>'sectionCode'
  where sr.entity_type = 'schedule_v1'
    and jsonb_typeof(r.normalized_payload) = 'object'
    and nullif(r.normalized_payload->>'facultyId', '') is not null
)
insert into public.faculty_section_assignment_sources (
  source_record_id,
  faculty_id,
  section_id,
  assignment_role
)
select
  recovered.source_record_id,
  recovered.faculty_id,
  recovered.section_id,
  recovered.assignment_role
from recovered
on conflict do nothing;

update public.faculty_section_assignments a
set import_managed = true
where exists (
  select 1
  from public.faculty_section_assignment_sources owner
  where owner.faculty_id = a.faculty_id
    and owner.section_id = a.section_id
    and owner.assignment_role = a.assignment_role
);

-- source_record_id is retained only for migration compatibility. New writes use the
-- ownership table above; clearing it prevents code from treating one row as the sole
-- provenance owner. The constraint makes accidental reuse fail closed.
update public.faculty_section_assignments
set source_record_id = null
where source_record_id is not null;

alter table public.faculty_section_assignments
  drop constraint if exists faculty_assignments_source_record_deprecated;
alter table public.faculty_section_assignments
  add constraint faculty_assignments_source_record_deprecated
  check (source_record_id is null);

-- -----------------------------------------------------------------------------
-- Replace transactional apply with many-to-many assignment ownership.
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

    v_course_id := nullif(v_row.normalized_payload->>'courseId','')::uuid;
    v_faculty_id := nullif(v_row.normalized_payload->>'facultyId','')::uuid;

    if v_course_id is null then
      raise exception 'row % has no resolved course', v_row.row_number;
    end if;
    if v_row.source_record_key is null or v_row.content_hash is null then
      raise exception 'row % lacks source identity', v_row.row_number;
    end if;
    if nullif(btrim(v_row.normalized_payload->>'sectionCode'), '') is null then
      raise exception 'row % has no section code', v_row.row_number using errcode = '23514';
    end if;
    if jsonb_typeof(v_row.normalized_payload->'weekdays') is distinct from 'array'
       or jsonb_array_length(v_row.normalized_payload->'weekdays') = 0 then
      raise exception 'row % has no meeting weekdays', v_row.row_number using errcode = '23514';
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

    insert into public.sections (
      course_id, term_id, section_code, source_id, publication_status, review_status
    ) values (
      v_course_id,
      v_batch.term_id,
      btrim(v_row.normalized_payload->>'sectionCode'),
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

    -- Meeting rows remain one-to-many children of a single source row.
    delete from public.section_meetings where source_record_id = v_source_record_id;

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

    -- Remove only this source record's support. The assignment itself survives while
    -- any other source record still corroborates the same instructor/section/role.
    delete from public.faculty_section_assignment_sources
    where source_record_id = v_source_record_id;

    if v_faculty_id is not null then
      insert into public.faculty_section_assignments as assignment (
        faculty_id, section_id, assignment_role, source_id, source_record_id, import_managed
      ) values (
        v_faculty_id, v_section_id, 'instructor', v_batch.source_id, null, true
      )
      on conflict (faculty_id, section_id, assignment_role)
      do update set
        source_id = case
          when assignment.import_managed then excluded.source_id
          else assignment.source_id
        end;

      insert into public.faculty_section_assignment_sources (
        source_record_id, faculty_id, section_id, assignment_role
      ) values (
        v_source_record_id, v_faculty_id, v_section_id, 'instructor'
      )
      on conflict do nothing;
    end if;

    -- Import-created assignments are garbage-collected only after their final source
    -- owner disappears. Manually managed assignments are never deleted here.
    delete from public.faculty_section_assignments a
    where a.import_managed = true
      and not exists (
        select 1
        from public.faculty_section_assignment_sources owner
        where owner.faculty_id = a.faculty_id
          and owner.section_id = a.section_id
          and owner.assignment_role = a.assignment_role
      );

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
