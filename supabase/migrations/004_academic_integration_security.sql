-- 004_academic_integration_security.sql
-- Security/integration gate for the Academic Core.
-- This migration intentionally builds on the existing 001-003 history rather than rewriting it.

-- -----------------------------------------------------------------------------
-- Review state is separate from public visibility.
-- 002 already introduced publication_status as the historical public lifecycle.
-- We retain it for migration compatibility and add review_status for data quality.
-- Public exposure still requires publication_status = 'published'.
-- -----------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_type
    where typname = 'review_status' and typnamespace = 'public'::regnamespace
  ) then
    create type public.review_status as enum ('draft', 'needs_verification', 'verified');
  end if;
end
$$;

alter table public.buildings add column if not exists review_status public.review_status not null default 'needs_verification';
alter table public.spaces add column if not exists review_status public.review_status not null default 'needs_verification';
alter table public.location_anchors add column if not exists review_status public.review_status not null default 'needs_verification';
alter table public.courses add column if not exists review_status public.review_status not null default 'draft';
alter table public.faculty add column if not exists review_status public.review_status not null default 'draft';
alter table public.faculty_offices add column if not exists review_status public.review_status not null default 'draft';
alter table public.sections add column if not exists review_status public.review_status not null default 'draft';
alter table public.section_meetings add column if not exists review_status public.review_status not null default 'draft';
alter table public.consultation_hours add column if not exists review_status public.review_status not null default 'draft';
alter table public.academic_services add column if not exists review_status public.review_status not null default 'draft';
alter table public.academic_resources add column if not exists review_status public.review_status not null default 'draft';
alter table public.academic_events add column if not exists review_status public.review_status not null default 'draft';
alter table public.academic_dates add column if not exists review_status public.review_status not null default 'draft';

-- Entities that had no lifecycle in 001/002 receive both review and publication fields now.
alter table public.faculty_notices add column if not exists review_status public.review_status not null default 'draft';
alter table public.faculty_notices add column if not exists publication_status public.publication_status not null default 'draft';
alter table public.research_areas add column if not exists review_status public.review_status not null default 'draft';
alter table public.research_areas add column if not exists publication_status public.publication_status not null default 'draft';

-- Existing records that were already published by migration 002 were implicitly approved.
update public.buildings set review_status = 'verified' where publication_status = 'published';
update public.spaces set review_status = 'verified' where publication_status = 'published';
update public.location_anchors set review_status = 'verified' where publication_status = 'published';
update public.courses set review_status = 'verified' where publication_status = 'published';
update public.faculty set review_status = 'verified' where publication_status = 'published';
update public.faculty_offices set review_status = 'verified' where publication_status = 'published';
update public.sections set review_status = 'verified' where publication_status = 'published';
update public.section_meetings set review_status = 'verified' where publication_status = 'published';
update public.consultation_hours set review_status = 'verified' where publication_status = 'published';
update public.academic_services set review_status = 'verified' where publication_status = 'published';
update public.academic_resources set review_status = 'verified' where publication_status = 'published';
update public.academic_events set review_status = 'verified' where publication_status = 'published';
update public.academic_dates set review_status = 'verified' where publication_status = 'published';

-- Publishing requires verification. These checks protect direct SQL/API writes too.
alter table public.buildings add constraint buildings_publish_requires_verified check (publication_status <> 'published' or review_status = 'verified');
alter table public.spaces add constraint spaces_publish_requires_verified check (publication_status <> 'published' or review_status = 'verified');
alter table public.location_anchors add constraint anchors_publish_requires_verified check (publication_status <> 'published' or review_status = 'verified');
alter table public.courses add constraint courses_publish_requires_verified check (publication_status <> 'published' or review_status = 'verified');
alter table public.faculty add constraint faculty_publish_requires_verified check (publication_status <> 'published' or review_status = 'verified');
alter table public.faculty_offices add constraint faculty_offices_publish_requires_verified check (publication_status <> 'published' or review_status = 'verified');
alter table public.sections add constraint sections_publish_requires_verified check (publication_status <> 'published' or review_status = 'verified');
alter table public.section_meetings add constraint section_meetings_publish_requires_verified check (publication_status <> 'published' or review_status = 'verified');
alter table public.consultation_hours add constraint consultations_publish_requires_verified check (publication_status <> 'published' or review_status = 'verified');
alter table public.academic_services add constraint services_publish_requires_verified check (publication_status <> 'published' or review_status = 'verified');
alter table public.academic_resources add constraint resources_publish_requires_verified check (publication_status <> 'published' or review_status = 'verified');
alter table public.academic_events add constraint events_publish_requires_verified check (publication_status <> 'published' or review_status = 'verified');
alter table public.academic_dates add constraint dates_publish_requires_verified check (publication_status <> 'published' or review_status = 'verified');
alter table public.faculty_notices add constraint notices_publish_requires_verified check (publication_status <> 'published' or review_status = 'verified');
alter table public.research_areas add constraint research_publish_requires_verified check (publication_status <> 'published' or review_status = 'verified');

-- -----------------------------------------------------------------------------
-- Role helper. Keep it outside exposed public schema and lock down EXECUTE.
-- -----------------------------------------------------------------------------

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.has_any_role(required_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.role = any(required_roles)
  );
$$;

revoke execute on function private.has_any_role(public.app_role[]) from public, anon;
grant execute on function private.has_any_role(public.app_role[]) to authenticated;

-- Prevent a normal authenticated account from changing its own role.
-- The existing RLS policy can still permit display-name updates, but Postgres grants
-- prevent role mutation through the Data API.
revoke update on table public.profiles from authenticated;
grant update (display_name) on table public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- One and only one current term at a time.
-- -----------------------------------------------------------------------------

create unique index if not exists academic_terms_one_current_idx
  on public.academic_terms ((is_current))
  where is_current = true;

-- -----------------------------------------------------------------------------
-- Public-safe provenance. Base data_sources remains internal because it has notes.
-- -----------------------------------------------------------------------------

create or replace view public.public_data_sources
as
select
  id,
  label,
  source_type,
  source_url,
  authority,
  created_at
from public.data_sources;

-- Public users may resolve provenance only through the safe view. The base table
-- contains private notes, so direct SELECT is revoked from API roles. The view is
-- intentionally owner-executed and exposes only the audited safe column list above.
drop policy if exists "public read source metadata" on public.data_sources;
revoke select on table public.data_sources from anon, authenticated;
grant select on public.public_data_sources to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Close residual public-policy gaps left intentionally untouched by migration 002.
-- -----------------------------------------------------------------------------

drop policy if exists "public read floors" on public.floors;
create policy "public read floors"
  on public.floors for select to anon, authenticated
  using (
    exists (
      select 1 from public.buildings b
      where b.id = building_id and b.publication_status = 'published'
    )
  );

drop policy if exists "public read terms" on public.academic_terms;
create policy "public read current term"
  on public.academic_terms for select to anon, authenticated
  using (is_current = true);

-- Route restrictions are operational public data, but only while active and only for
-- a published building. No private creator/source notes are surfaced by the app DTO.
drop policy if exists "public read active restrictions" on public.route_restrictions;
create policy "public read active restrictions"
  on public.route_restrictions for select to anon, authenticated
  using (
    active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
    and exists (
      select 1 from public.buildings b
      where b.id = building_id and b.publication_status = 'published'
    )
  );

drop policy if exists "public read active faculty notices" on public.faculty_notices;
create policy "public read active faculty notices"
  on public.faculty_notices for select to anon, authenticated
  using (
    publication_status = 'published'
    and review_status = 'verified'
    and starts_at <= now()
    and (ends_at is null or ends_at > now())
    and exists (
      select 1 from public.faculty f
      where f.id = faculty_id and f.publication_status = 'published'
    )
  );

drop policy if exists "public read research areas" on public.research_areas;
create policy "public read research areas"
  on public.research_areas for select to anon, authenticated
  using (publication_status = 'published' and review_status = 'verified');

drop policy if exists "public read faculty research" on public.faculty_research_areas;
create policy "public read faculty research"
  on public.faculty_research_areas for select to anon, authenticated
  using (
    exists (
      select 1 from public.faculty f
      where f.id = faculty_id and f.publication_status = 'published'
    )
    and exists (
      select 1 from public.research_areas r
      where r.id = research_area_id and r.publication_status = 'published'
    )
  );

-- -----------------------------------------------------------------------------
-- Consultation ownership and publication authority are separate.
-- Faculty may maintain only their own non-public records. Editors/admins review;
-- only admins publish in the first release.
-- -----------------------------------------------------------------------------

drop policy if exists "faculty insert own consultations" on public.consultation_hours;
drop policy if exists "faculty update own consultations" on public.consultation_hours;
drop policy if exists "faculty delete own consultations" on public.consultation_hours;

create policy "faculty insert own draft consultations"
  on public.consultation_hours
  for insert to authenticated
  with check (
    publication_status in ('draft', 'needs_verification')
    and exists (
      select 1 from public.faculty f
      where f.id = faculty_id and f.user_id = (select auth.uid())
    )
  );

create policy "faculty update own unpublished consultations"
  on public.consultation_hours
  for update to authenticated
  using (
    publication_status in ('draft', 'needs_verification', 'verified')
    and exists (
      select 1 from public.faculty f
      where f.id = faculty_id and f.user_id = (select auth.uid())
    )
  )
  with check (
    publication_status in ('draft', 'needs_verification', 'verified')
    and exists (
      select 1 from public.faculty f
      where f.id = faculty_id and f.user_id = (select auth.uid())
    )
  );

create policy "faculty delete own unpublished consultations"
  on public.consultation_hours
  for delete to authenticated
  using (
    publication_status <> 'published'
    and exists (
      select 1 from public.faculty f
      where f.id = faculty_id and f.user_id = (select auth.uid())
    )
  );

-- Explicit transition guard: content ownership is not review/publication authority.
-- Editors/admins may move review_status; only admins may change public visibility.
-- The function stays in the private schema; only the trigger invokes it.
create or replace function private.guard_consultation_status_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.review_status is distinct from old.review_status then
    if not private.has_any_role(array['content_editor','admin']::public.app_role[]) then
      raise exception 'review_status transition requires reviewer role' using errcode = '42501';
    end if;
  end if;

  if new.publication_status is distinct from old.publication_status then
    if not private.has_any_role(array['admin']::public.app_role[]) then
      raise exception 'publication_status transition requires admin role' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function private.guard_consultation_status_transition() from public, anon, authenticated;

drop trigger if exists consultation_publication_transition_guard on public.consultation_hours;
drop trigger if exists consultation_status_transition_guard on public.consultation_hours;
create trigger consultation_status_transition_guard
before update of publication_status, review_status on public.consultation_hours
for each row execute function private.guard_consultation_status_transition();

-- -----------------------------------------------------------------------------
-- Staff visibility for review screens. RLS remains the source of truth.
-- -----------------------------------------------------------------------------

create policy "staff read all academic terms" on public.academic_terms for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));
create policy "staff read all courses" on public.courses for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));
create policy "staff read all faculty" on public.faculty for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));
create policy "staff read all sections" on public.sections for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));
create policy "staff read all meetings" on public.section_meetings for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));
create policy "staff read all consultations" on public.consultation_hours for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));
create policy "staff update consultations" on public.consultation_hours for update to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])))
  with check ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));

-- -----------------------------------------------------------------------------
-- Import staging authorization: remove migration-003's intentionally broad policies.
-- -----------------------------------------------------------------------------

drop policy if exists "authenticated access import_rows" on public.import_rows;
drop policy if exists "authenticated access import_issues" on public.import_issues;

create policy "staff read import batches" on public.import_batches for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));
create policy "staff create import batches" on public.import_batches for insert to authenticated
  with check (
    (select private.has_any_role(array['content_editor','admin']::public.app_role[]))
    and imported_by = (select auth.uid())
    and status in ('staged','validation_failed','ready')
  );
-- Editors stage/review; only admins mutate batch state after creation.
create policy "admin update import batches" on public.import_batches for update to authenticated
  using ((select private.has_any_role(array['admin']::public.app_role[])))
  with check ((select private.has_any_role(array['admin']::public.app_role[])));

create policy "staff read import rows" on public.import_rows for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));
create policy "stager insert import rows" on public.import_rows for insert to authenticated
  with check (
    (select private.has_any_role(array['admin']::public.app_role[]))
    or exists (
      select 1 from public.import_batches b
      where b.id = batch_id and b.imported_by = (select auth.uid())
    )
  );
create policy "admin update import rows" on public.import_rows for update to authenticated
  using ((select private.has_any_role(array['admin']::public.app_role[])))
  with check ((select private.has_any_role(array['admin']::public.app_role[])));
create policy "admin delete import rows" on public.import_rows for delete to authenticated
  using ((select private.has_any_role(array['admin']::public.app_role[])));

create policy "staff read import issues" on public.import_issues for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));
create policy "stager insert import issues" on public.import_issues for insert to authenticated
  with check (
    (select private.has_any_role(array['admin']::public.app_role[]))
    or exists (
      select 1
      from public.import_rows r
      join public.import_batches b on b.id = r.batch_id
      where r.id = import_row_id and b.imported_by = (select auth.uid())
    )
  );
-- 005 adds reviewer acknowledgement columns and a guarded editor update policy.
-- Until then, only admins may mutate issue rows.
create policy "admin update import issues" on public.import_issues for update to authenticated
  using ((select private.has_any_role(array['admin']::public.app_role[])))
  with check ((select private.has_any_role(array['admin']::public.app_role[])));
create policy "admin delete import issues" on public.import_issues for delete to authenticated
  using ((select private.has_any_role(array['admin']::public.app_role[])));

-- Supporting indexes used by public queries/RLS and admin staging.
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists courses_normalized_code_idx on public.courses(normalized_code);
create index if not exists faculty_slug_idx on public.faculty(slug);
create index if not exists faculty_display_name_lower_idx on public.faculty(lower(display_name));
create index if not exists sections_term_course_idx on public.sections(term_id, course_id);
create index if not exists meetings_section_space_idx on public.section_meetings(section_id, space_id, weekday, starts_at);
create index if not exists import_batches_status_created_idx on public.import_batches(status, created_at desc);
create index if not exists import_rows_batch_status_idx on public.import_rows(batch_id, status);
create index if not exists import_issues_row_idx on public.import_issues(import_row_id);
