-- 011_schedule_child_integrity.sql
-- A published section is a reviewed composition of meetings + instructor assignments.
-- Any material child mutation must therefore withdraw the parent section until it is
-- reviewed again. This also prevents a stable source_record_key that moves to a new
-- section from leaving its old section published with stale/removed children.

create or replace function private.invalidate_schedule_section(p_section_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_section_id is null then
    return;
  end if;

  -- During an ON DELETE CASCADE, the parent section may already be gone. Do not
  -- touch sibling child rows that are themselves being cascaded away.
  if not exists (select 1 from public.sections where id = p_section_id) then
    return;
  end if;

  update public.sections
  set
    review_status = 'needs_verification'::public.review_status,
    publication_status = 'needs_verification'::public.publication_status,
    updated_at = now()
  where id = p_section_id
    and (
      review_status <> 'needs_verification'::public.review_status
      or publication_status <> 'needs_verification'::public.publication_status
    );

  -- Status-only updates do not re-enter the material-update trigger below.
  update public.section_meetings
  set
    review_status = 'needs_verification'::public.review_status,
    publication_status = 'needs_verification'::public.publication_status
  where section_id = p_section_id
    and (
      review_status <> 'needs_verification'::public.review_status
      or publication_status <> 'needs_verification'::public.publication_status
    );
end;
$$;

revoke execute on function private.invalidate_schedule_section(uuid) from public, anon, authenticated;

create or replace function private.invalidate_schedule_from_child_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform private.invalidate_schedule_section(old.section_id);
    return old;
  end if;

  if tg_op = 'INSERT' then
    perform private.invalidate_schedule_section(new.section_id);
    return new;
  end if;

  -- UPDATE can move a child between sections. Invalidate both compositions.
  perform private.invalidate_schedule_section(old.section_id);
  if new.section_id is distinct from old.section_id then
    perform private.invalidate_schedule_section(new.section_id);
  end if;
  return new;
end;
$$;

revoke execute on function private.invalidate_schedule_from_child_mutation() from public, anon, authenticated;

-- Only material meeting fields trigger invalidation. Review/publication RPCs update
-- status columns only and therefore do not recursively invalidate their own work.
drop trigger if exists section_meeting_insert_invalidate on public.section_meetings;
drop trigger if exists section_meeting_material_update_invalidate on public.section_meetings;
drop trigger if exists section_meeting_delete_invalidate on public.section_meetings;

create trigger section_meeting_insert_invalidate
after insert on public.section_meetings
for each row execute function private.invalidate_schedule_from_child_mutation();

create trigger section_meeting_material_update_invalidate
after update of section_id, weekday, starts_at, ends_at, space_id, notes, source_id, source_record_id
on public.section_meetings
for each row execute function private.invalidate_schedule_from_child_mutation();

create trigger section_meeting_delete_invalidate
after delete on public.section_meetings
for each row execute function private.invalidate_schedule_from_child_mutation();

-- Instructor assignment changes are part of the reviewed schedule composition too.
drop trigger if exists faculty_assignment_insert_invalidate on public.faculty_section_assignments;
drop trigger if exists faculty_assignment_update_invalidate on public.faculty_section_assignments;
drop trigger if exists faculty_assignment_delete_invalidate on public.faculty_section_assignments;

create trigger faculty_assignment_insert_invalidate
after insert on public.faculty_section_assignments
for each row execute function private.invalidate_schedule_from_child_mutation();

create trigger faculty_assignment_update_invalidate
after update of faculty_id, section_id, assignment_role, source_id, source_record_id
on public.faculty_section_assignments
for each row execute function private.invalidate_schedule_from_child_mutation();

create trigger faculty_assignment_delete_invalidate
after delete on public.faculty_section_assignments
for each row execute function private.invalidate_schedule_from_child_mutation();
