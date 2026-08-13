-- 008_schedule_review_queue.sql
-- Human review and publication boundary for imported/current-term schedule data.
-- Editors may verify/return schedule records; only admins may publish/withdraw them.

create table if not exists public.schedule_review_events (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  action text not null check (action in ('verified', 'returned', 'published', 'withdrawn')),
  actor_id uuid references public.profiles(user_id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.schedule_review_events enable row level security;

create policy "staff read schedule review events"
on public.schedule_review_events for select to authenticated
using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));

revoke insert, update, delete on public.schedule_review_events from anon, authenticated;
grant select on public.schedule_review_events to authenticated;

create index if not exists schedule_review_events_section_created_idx
  on public.schedule_review_events(section_id, created_at desc);

-- Review changes are intentionally separate from publication changes. A review
-- transition can withdraw a public section when it is returned for verification,
-- but it can never publish one.
create or replace function public.set_schedule_section_review(
  p_section_id uuid,
  p_status public.review_status,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_section public.sections%rowtype;
  v_action text;
begin
  if not private.has_any_role(array['content_editor','admin']::public.app_role[]) then
    raise exception 'reviewer role required' using errcode = '42501';
  end if;

  if p_status not in ('needs_verification'::public.review_status, 'verified'::public.review_status) then
    raise exception 'schedule review status must be needs_verification or verified';
  end if;

  select * into v_section
  from public.sections
  where id = p_section_id
  for update;

  if not found then
    raise exception 'section not found';
  end if;

  if not exists (
    select 1 from public.academic_terms t
    where t.id = v_section.term_id and t.is_current = true
  ) then
    raise exception 'only the current academic term can be reviewed';
  end if;

  if p_status = 'verified'::public.review_status then
    update public.sections
      set review_status = 'verified',
          publication_status = case
            when publication_status = 'published' then 'published'::public.publication_status
            else 'verified'::public.publication_status
          end,
          updated_at = now()
      where id = p_section_id;

    update public.section_meetings
      set review_status = 'verified',
          publication_status = case
            when publication_status = 'published' then 'published'::public.publication_status
            else 'verified'::public.publication_status
          end
      where section_id = p_section_id;

    v_action := 'verified';
  else
    -- Returning a section for review always withdraws it from public visibility.
    update public.sections
      set review_status = 'needs_verification',
          publication_status = 'needs_verification',
          updated_at = now()
      where id = p_section_id;

    update public.section_meetings
      set review_status = 'needs_verification',
          publication_status = 'needs_verification'
      where section_id = p_section_id;

    v_action := 'returned';
  end if;

  insert into public.schedule_review_events(section_id, action, actor_id, note)
  values (p_section_id, v_action, auth.uid(), nullif(btrim(p_note), ''));
end;
$$;

revoke execute on function public.set_schedule_section_review(uuid, public.review_status, text) from public, anon;
grant execute on function public.set_schedule_section_review(uuid, public.review_status, text) to authenticated;

create or replace function public.set_schedule_section_publication(
  p_section_id uuid,
  p_publish boolean,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_section public.sections%rowtype;
  v_action text;
begin
  if not private.has_any_role(array['admin']::public.app_role[]) then
    raise exception 'admin role required' using errcode = '42501';
  end if;

  select * into v_section
  from public.sections
  where id = p_section_id
  for update;

  if not found then
    raise exception 'section not found';
  end if;

  if not exists (
    select 1 from public.academic_terms t
    where t.id = v_section.term_id and t.is_current = true
  ) then
    raise exception 'only the current academic term can be published';
  end if;

  if p_publish then
    if v_section.review_status <> 'verified'::public.review_status then
      raise exception 'section must be verified before publication';
    end if;
    if exists (
      select 1 from public.section_meetings m
      where m.section_id = p_section_id
        and m.review_status <> 'verified'::public.review_status
    ) then
      raise exception 'all section meetings must be verified before publication';
    end if;
    if not exists (
      select 1 from public.courses c
      where c.id = v_section.course_id
        and c.review_status = 'verified'::public.review_status
        and c.publication_status = 'published'::public.publication_status
    ) then
      raise exception 'course must be verified and published before its section can be published';
    end if;
    if exists (
      select 1
      from public.section_meetings m
      join public.spaces s on s.id = m.space_id
      where m.section_id = p_section_id
        and m.space_id is not null
        and (s.review_status <> 'verified'::public.review_status or s.publication_status <> 'published'::public.publication_status)
    ) then
      raise exception 'all referenced rooms must be verified and published before section publication';
    end if;

    update public.sections
      set publication_status = 'published', updated_at = now()
      where id = p_section_id;
    update public.section_meetings
      set publication_status = 'published'
      where section_id = p_section_id;
    v_action := 'published';
  else
    update public.sections
      set publication_status = case
            when review_status = 'verified' then 'verified'::public.publication_status
            else 'needs_verification'::public.publication_status
          end,
          updated_at = now()
      where id = p_section_id;
    update public.section_meetings
      set publication_status = case
            when review_status = 'verified' then 'verified'::public.publication_status
            else 'needs_verification'::public.publication_status
          end
      where section_id = p_section_id;
    v_action := 'withdrawn';
  end if;

  insert into public.schedule_review_events(section_id, action, actor_id, note)
  values (p_section_id, v_action, auth.uid(), nullif(btrim(p_note), ''));
end;
$$;

revoke execute on function public.set_schedule_section_publication(uuid, boolean, text) from public, anon;
grant execute on function public.set_schedule_section_publication(uuid, boolean, text) to authenticated;
