-- 009_integrity_privacy_hardening.sql
-- Close public column-leak paths, make consultation edits fail closed, and harden
-- import source identity. This migration is additive over 001-008.

-- -----------------------------------------------------------------------------
-- Public-safe faculty projection.
--
-- Row Level Security filters rows, not columns. The base faculty table contains
-- user_id, which links an institutional faculty profile to an Auth identity and is
-- not public application data. Public consumers therefore read this curated view.
-- The migration owner executes the view; only the explicitly selected, published,
-- verified columns below are exposed.
-- -----------------------------------------------------------------------------

create or replace view public.public_faculty
with (security_barrier = true)
as
select
  f.id,
  f.slug,
  f.display_name,
  f.title,
  f.official_email,
  f.bio,
  f.photo_url,
  f.official_profile_url,
  f.publications_url,
  f.source_id,
  f.last_verified_at,
  f.created_at,
  f.updated_at
from public.faculty f
where f.publication_status = 'published'::public.publication_status
  and f.review_status = 'verified'::public.review_status;

revoke all on public.public_faculty from public;
grant select on public.public_faculty to anon, authenticated;

-- Anonymous users must not query the base faculty table, because SELECT on a table
-- exposes every granted column even when RLS restricts which rows are visible.
drop policy if exists "public read faculty" on public.faculty;
revoke select on table public.faculty from anon;

-- Authenticated faculty need their own base row for ownership checks/self-service.
-- Editors/admins retain the staff read policy created in migration 004.
drop policy if exists "faculty read own profile row" on public.faculty;
create policy "faculty read own profile row"
  on public.faculty for select to authenticated
  using (user_id = (select auth.uid()));
grant select on table public.faculty to authenticated;

-- Public child policies use the safe faculty projection instead of depending on a
-- public base-table faculty policy.
drop policy if exists "public read faculty offices" on public.faculty_offices;
create policy "public read faculty offices"
  on public.faculty_offices for select to anon, authenticated
  using (
    publication_status = 'published'::public.publication_status
    and review_status = 'verified'::public.review_status
    and exists (select 1 from public.public_faculty f where f.id = faculty_id)
    and (
      term_id is null
      or exists (
        select 1 from public.academic_terms t
        where t.id = term_id and t.is_current = true
      )
    )
  );

drop policy if exists "public read assignments" on public.faculty_section_assignments;
create policy "public read assignments"
  on public.faculty_section_assignments for select to anon, authenticated
  using (
    exists (select 1 from public.public_faculty f where f.id = faculty_id)
    and exists (
      select 1 from public.sections s
      where s.id = section_id
        and s.publication_status = 'published'::public.publication_status
        and s.review_status = 'verified'::public.review_status
        and exists (
          select 1 from public.academic_terms t
          where t.id = s.term_id and t.is_current = true
        )
    )
  );

drop policy if exists "public read consultations" on public.consultation_hours;
create policy "public read consultations"
  on public.consultation_hours for select to anon, authenticated
  using (
    publication_status = 'published'::public.publication_status
    and review_status = 'verified'::public.review_status
    and exists (select 1 from public.public_faculty f where f.id = faculty_id)
    and exists (
      select 1 from public.academic_terms t
      where t.id = term_id and t.is_current = true
    )
  );

drop policy if exists "public read faculty research" on public.faculty_research_areas;
create policy "public read faculty research"
  on public.faculty_research_areas for select to anon, authenticated
  using (
    exists (select 1 from public.public_faculty f where f.id = faculty_id)
    and exists (
      select 1 from public.research_areas r
      where r.id = research_area_id
        and r.publication_status = 'published'::public.publication_status
        and r.review_status = 'verified'::public.review_status
    )
  );

-- -----------------------------------------------------------------------------
-- Public-safe faculty notices.
-- created_by is an internal Auth/profile UUID and is intentionally omitted.
-- -----------------------------------------------------------------------------

create or replace view public.public_faculty_notices
with (security_barrier = true)
as
select
  n.id,
  n.faculty_id,
  n.title,
  n.body,
  n.starts_at,
  n.ends_at,
  n.created_at
from public.faculty_notices n
join public.faculty f on f.id = n.faculty_id
where n.publication_status = 'published'::public.publication_status
  and n.review_status = 'verified'::public.review_status
  and n.starts_at <= now()
  and (n.ends_at is null or n.ends_at > now())
  and f.publication_status = 'published'::public.publication_status
  and f.review_status = 'verified'::public.review_status;

revoke all on public.public_faculty_notices from public;
grant select on public.public_faculty_notices to anon, authenticated;

drop policy if exists "public read active faculty notices" on public.faculty_notices;
revoke select on table public.faculty_notices from anon;

-- Faculty can inspect notices attached to their own profile; editors/admins can
-- inspect all notices for moderation. Public consumers use the safe view above.
drop policy if exists "faculty read own notices" on public.faculty_notices;
create policy "faculty read own notices"
  on public.faculty_notices for select to authenticated
  using (
    exists (
      select 1 from public.faculty f
      where f.id = faculty_id and f.user_id = (select auth.uid())
    )
  );

drop policy if exists "staff read all faculty notices" on public.faculty_notices;
create policy "staff read all faculty notices"
  on public.faculty_notices for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));
grant select on table public.faculty_notices to authenticated;

-- -----------------------------------------------------------------------------
-- Public-safe route restrictions.
-- created_by/source_id are moderation/provenance internals and are not required by
-- the public routing engine.
-- -----------------------------------------------------------------------------

create or replace view public.public_route_restrictions
with (security_barrier = true)
as
select
  r.id,
  r.building_id,
  r.edge_from,
  r.edge_to,
  r.reason,
  r.starts_at,
  r.ends_at,
  r.active,
  r.created_at
from public.route_restrictions r
join public.buildings b on b.id = r.building_id
where r.active = true
  and (r.starts_at is null or r.starts_at <= now())
  and (r.ends_at is null or r.ends_at > now())
  and b.publication_status = 'published'::public.publication_status
  and b.review_status = 'verified'::public.review_status;

revoke all on public.public_route_restrictions from public;
grant select on public.public_route_restrictions to anon, authenticated;

drop policy if exists "public read active restrictions" on public.route_restrictions;
revoke select on table public.route_restrictions from anon;

drop policy if exists "staff read route restrictions" on public.route_restrictions;
create policy "staff read route restrictions"
  on public.route_restrictions for select to authenticated
  using ((select private.has_any_role(array['map_editor','admin']::public.app_role[])));
grant select on table public.route_restrictions to authenticated;

-- -----------------------------------------------------------------------------
-- Consultation integrity.
--
-- Content ownership must never preserve a stale verification/publication state.
-- Any material edit automatically withdraws the row to needs_verification and clears
-- its verification timestamp. Review/publication transitions remain role-gated.
-- -----------------------------------------------------------------------------

create or replace function private.guard_consultation_status_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_material_changed boolean;
  v_requested_review_change boolean;
  v_requested_publication_change boolean;
begin
  v_requested_review_change := new.review_status is distinct from old.review_status;
  v_requested_publication_change := new.publication_status is distinct from old.publication_status;

  -- Gate explicit status transitions before any automatic demotion below.
  if v_requested_review_change then
    if not private.has_any_role(array['content_editor','admin']::public.app_role[]) then
      raise exception 'review_status transition requires reviewer role' using errcode = '42501';
    end if;
  end if;

  if v_requested_publication_change then
    if not private.has_any_role(array['admin']::public.app_role[]) then
      raise exception 'publication_status transition requires admin role' using errcode = '42501';
    end if;
  end if;

  v_material_changed :=
       new.faculty_id is distinct from old.faculty_id
    or new.term_id is distinct from old.term_id
    or new.weekday is distinct from old.weekday
    or new.starts_at is distinct from old.starts_at
    or new.ends_at is distinct from old.ends_at
    or new.mode is distinct from old.mode
    or new.space_id is distinct from old.space_id
    or new.appointment_url is distinct from old.appointment_url
    or new.notes is distinct from old.notes
    or new.source_id is distinct from old.source_id
    or new.source_record_id is distinct from old.source_record_id;

  if v_material_changed then
    -- Force a second, explicit review/publication action after any content mutation.
    new.review_status := 'needs_verification'::public.review_status;
    new.publication_status := 'needs_verification'::public.publication_status;
    new.last_verified_at := null;
  end if;

  return new;
end;
$$;

revoke execute on function private.guard_consultation_status_transition() from public, anon, authenticated;

drop trigger if exists consultation_status_transition_guard on public.consultation_hours;
create trigger consultation_status_transition_guard
before update on public.consultation_hours
for each row execute function private.guard_consultation_status_transition();

-- -----------------------------------------------------------------------------
-- Source identity uniqueness. PostgreSQL normally treats NULL values as distinct in
-- a UNIQUE constraint. Source records can legitimately be non-term-specific later,
-- so NULL term IDs must still participate in uniqueness.
-- -----------------------------------------------------------------------------

do $$
declare
  v_constraint name;
begin
  select c.conname into v_constraint
  from pg_constraint c
  where c.conrelid = 'public.source_records'::regclass
    and c.contype = 'u'
    and pg_get_constraintdef(c.oid) like 'UNIQUE (source_id, term_id, entity_type, source_record_key)%'
  limit 1;

  if v_constraint is not null then
    execute format('alter table public.source_records drop constraint %I', v_constraint);
  end if;
end
$$;

drop index if exists public.source_records_identity_uidx;
create unique index source_records_identity_uidx
  on public.source_records(source_id, term_id, entity_type, source_record_key)
  nulls not distinct;

-- Existing lookup index is now redundant with the unique identity index.
drop index if exists public.source_records_lookup_idx;
