-- 017_public_read_surfaces.sql
-- Make public academic reads explicit, column-curated API surfaces.
--
-- RLS protects rows, not columns. The original schema exposed published rows from
-- many base tables directly, which meant a caller with SELECT could request
-- moderation/provenance columns that the student-facing product never needs.
--
-- This migration moves anonymous + ordinary authenticated readers to deliberately
-- owner-executed, security-barrier views. Each view contains its own fail-closed
-- publication/current-term predicates and only public-safe columns. Base-table
-- SELECT remains available to authenticated staff where an explicit RLS policy
-- authorizes it; ordinary authenticated students have no matching base-table policy.

-- A source UUID is only useful publicly when its source metadata was explicitly
-- approved for public provenance. Hide internal source identifiers otherwise.
create or replace view public.public_buildings
with (security_barrier = true)
as
select
  b.id,
  b.name,
  b.short_name,
  b.last_verified_at
from public.buildings b
where b.publication_status = 'published'::public.publication_status
  and b.review_status = 'verified'::public.review_status;

create or replace view public.public_floors
with (security_barrier = true)
as
select
  f.id,
  f.building_id,
  f.level,
  f.name,
  f.display_order
from public.floors f
join public.buildings b on b.id = f.building_id
where b.publication_status = 'published'::public.publication_status
  and b.review_status = 'verified'::public.review_status;

create or replace view public.public_spaces
with (security_barrier = true)
as
select
  s.id,
  s.building_id,
  s.floor_id,
  s.name,
  s.subtitle,
  s.kind,
  s.is_public,
  case when exists (select 1 from public.public_data_sources ds where ds.id = s.source_id)
    then s.source_id else null end as source_id,
  s.last_verified_at
from public.spaces s
join public.buildings b on b.id = s.building_id
where s.is_public = true
  and s.publication_status = 'published'::public.publication_status
  and s.review_status = 'verified'::public.review_status
  and b.publication_status = 'published'::public.publication_status
  and b.review_status = 'verified'::public.review_status;

create or replace view public.public_space_aliases
with (security_barrier = true)
as
select a.id, a.space_id, a.alias, a.normalized_alias
from public.space_aliases a
join public.spaces s on s.id = a.space_id
join public.buildings b on b.id = s.building_id
where s.is_public = true
  and s.publication_status = 'published'::public.publication_status
  and s.review_status = 'verified'::public.review_status
  and b.publication_status = 'published'::public.publication_status
  and b.review_status = 'verified'::public.review_status;

create or replace view public.public_location_anchors
with (security_barrier = true)
as
select
  a.id,
  a.building_id,
  a.floor_id,
  a.space_id,
  a.label,
  a.qr_slug,
  a.graph_node_id,
  a.last_verified_at
from public.location_anchors a
join public.buildings b on b.id = a.building_id
where a.publication_status = 'published'::public.publication_status
  and a.review_status = 'verified'::public.review_status
  and b.publication_status = 'published'::public.publication_status
  and b.review_status = 'verified'::public.review_status;

create or replace view public.public_academic_terms
with (security_barrier = true)
as
select t.id, t.academic_year, t.term_name, t.starts_on, t.ends_on, t.is_current
from public.academic_terms t
where t.is_current = true;

create or replace view public.public_courses
with (security_barrier = true)
as
select
  c.id,
  c.code,
  c.normalized_code,
  c.title,
  c.description,
  c.units,
  case when exists (select 1 from public.public_data_sources ds where ds.id = c.source_id)
    then c.source_id else null end as source_id,
  c.last_verified_at
from public.courses c
where c.publication_status = 'published'::public.publication_status
  and c.review_status = 'verified'::public.review_status;

create or replace view public.public_course_aliases
with (security_barrier = true)
as
select a.id, a.course_id, a.alias, a.normalized_alias
from public.course_aliases a
join public.courses c on c.id = a.course_id
where c.publication_status = 'published'::public.publication_status
  and c.review_status = 'verified'::public.review_status;

create or replace view public.public_course_prerequisites
with (security_barrier = true)
as
select
  p.course_id,
  p.prerequisite_course_id,
  p.relationship_type,
  p.notes,
  case when exists (select 1 from public.public_data_sources ds where ds.id = p.source_id)
    then p.source_id else null end as source_id
from public.course_prerequisites p
join public.courses c on c.id = p.course_id
join public.courses prerequisite on prerequisite.id = p.prerequisite_course_id
where c.publication_status = 'published'::public.publication_status
  and c.review_status = 'verified'::public.review_status
  and prerequisite.publication_status = 'published'::public.publication_status
  and prerequisite.review_status = 'verified'::public.review_status;

-- Replace the earlier safe faculty view so internal source UUIDs are also hidden
-- unless the source itself was approved for public provenance.
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
  case when exists (select 1 from public.public_data_sources ds where ds.id = f.source_id)
    then f.source_id else null end as source_id,
  f.last_verified_at,
  f.created_at,
  f.updated_at
from public.faculty f
where f.publication_status = 'published'::public.publication_status
  and f.review_status = 'verified'::public.review_status;

create or replace view public.public_faculty_offices
with (security_barrier = true)
as
select o.id, o.faculty_id, o.space_id, o.term_id, o.is_primary
from public.faculty_offices o
join public.faculty f on f.id = o.faculty_id
join public.spaces s on s.id = o.space_id
join public.buildings b on b.id = s.building_id
where o.publication_status = 'published'::public.publication_status
  and o.review_status = 'verified'::public.review_status
  and f.publication_status = 'published'::public.publication_status
  and f.review_status = 'verified'::public.review_status
  and s.is_public = true
  and s.publication_status = 'published'::public.publication_status
  and s.review_status = 'verified'::public.review_status
  and b.publication_status = 'published'::public.publication_status
  and b.review_status = 'verified'::public.review_status
  and (
    o.term_id is null
    or exists (select 1 from public.academic_terms t where t.id = o.term_id and t.is_current = true)
  );

create or replace view public.public_sections
with (security_barrier = true)
as
select
  s.id,
  s.course_id,
  s.term_id,
  s.section_code,
  case when exists (select 1 from public.public_data_sources ds where ds.id = s.source_id)
    then s.source_id else null end as source_id
from public.sections s
join public.courses c on c.id = s.course_id
join public.academic_terms t on t.id = s.term_id
where s.publication_status = 'published'::public.publication_status
  and s.review_status = 'verified'::public.review_status
  and c.publication_status = 'published'::public.publication_status
  and c.review_status = 'verified'::public.review_status
  and t.is_current = true;

create or replace view public.public_section_meetings
with (security_barrier = true)
as
select m.id, m.section_id, m.weekday, m.starts_at, m.ends_at, m.space_id, m.notes
from public.section_meetings m
join public.sections s on s.id = m.section_id
join public.courses c on c.id = s.course_id
join public.academic_terms t on t.id = s.term_id
left join public.spaces space on space.id = m.space_id
left join public.buildings space_building on space_building.id = space.building_id
where m.publication_status = 'published'::public.publication_status
  and m.review_status = 'verified'::public.review_status
  and s.publication_status = 'published'::public.publication_status
  and s.review_status = 'verified'::public.review_status
  and c.publication_status = 'published'::public.publication_status
  and c.review_status = 'verified'::public.review_status
  and t.is_current = true
  and (
    m.space_id is null
    or (
      space.is_public = true
      and space.publication_status = 'published'::public.publication_status
      and space.review_status = 'verified'::public.review_status
      and space_building.publication_status = 'published'::public.publication_status
      and space_building.review_status = 'verified'::public.review_status
    )
  );

create or replace view public.public_faculty_section_assignments
with (security_barrier = true)
as
select a.faculty_id, a.section_id, a.assignment_role
from public.faculty_section_assignments a
join public.faculty f on f.id = a.faculty_id
join public.sections s on s.id = a.section_id
join public.courses c on c.id = s.course_id
join public.academic_terms t on t.id = s.term_id
where f.publication_status = 'published'::public.publication_status
  and f.review_status = 'verified'::public.review_status
  and s.publication_status = 'published'::public.publication_status
  and s.review_status = 'verified'::public.review_status
  and c.publication_status = 'published'::public.publication_status
  and c.review_status = 'verified'::public.review_status
  and t.is_current = true;

create or replace view public.public_consultation_hours
with (security_barrier = true)
as
select
  h.id,
  h.faculty_id,
  h.term_id,
  h.weekday,
  h.starts_at,
  h.ends_at,
  h.mode,
  h.space_id,
  h.appointment_url,
  h.notes,
  case when exists (select 1 from public.public_data_sources ds where ds.id = h.source_id)
    then h.source_id else null end as source_id,
  h.last_verified_at
from public.consultation_hours h
join public.faculty f on f.id = h.faculty_id
join public.academic_terms t on t.id = h.term_id
left join public.spaces s on s.id = h.space_id
left join public.buildings space_building on space_building.id = s.building_id
where h.publication_status = 'published'::public.publication_status
  and h.review_status = 'verified'::public.review_status
  and f.publication_status = 'published'::public.publication_status
  and f.review_status = 'verified'::public.review_status
  and t.is_current = true
  and (
    h.space_id is null
    or (
      s.is_public = true
      and s.publication_status = 'published'::public.publication_status
      and s.review_status = 'verified'::public.review_status
      and space_building.publication_status = 'published'::public.publication_status
      and space_building.review_status = 'verified'::public.review_status
    )
  );

create or replace view public.public_research_areas
with (security_barrier = true)
as
select
  r.id,
  r.slug,
  r.name,
  r.description,
  case when exists (select 1 from public.public_data_sources ds where ds.id = r.source_id)
    then r.source_id else null end as source_id
from public.research_areas r
where r.publication_status = 'published'::public.publication_status
  and r.review_status = 'verified'::public.review_status;

create or replace view public.public_faculty_research_areas
with (security_barrier = true)
as
select link.faculty_id, link.research_area_id
from public.faculty_research_areas link
join public.faculty f on f.id = link.faculty_id
join public.research_areas r on r.id = link.research_area_id
where f.publication_status = 'published'::public.publication_status
  and f.review_status = 'verified'::public.review_status
  and r.publication_status = 'published'::public.publication_status
  and r.review_status = 'verified'::public.review_status;

create or replace view public.public_academic_services
with (security_barrier = true)
as
select
  service.id,
  service.slug,
  service.name,
  service.description,
  service.space_id,
  service.official_url,
  case when exists (select 1 from public.public_data_sources ds where ds.id = service.source_id)
    then service.source_id else null end as source_id,
  service.last_verified_at
from public.academic_services service
left join public.spaces s on s.id = service.space_id
left join public.buildings space_building on space_building.id = s.building_id
where service.publication_status = 'published'::public.publication_status
  and service.review_status = 'verified'::public.review_status
  and (
    service.space_id is null
    or (
      s.is_public = true
      and s.publication_status = 'published'::public.publication_status
      and s.review_status = 'verified'::public.review_status
      and space_building.publication_status = 'published'::public.publication_status
      and space_building.review_status = 'verified'::public.review_status
    )
  );

create or replace view public.public_academic_resources
with (security_barrier = true)
as
select
  resource.id,
  resource.slug,
  resource.title,
  resource.category,
  resource.description,
  resource.official_url,
  case when exists (select 1 from public.public_data_sources ds where ds.id = resource.source_id)
    then resource.source_id else null end as source_id,
  resource.last_checked_at
from public.academic_resources resource
where resource.publication_status = 'published'::public.publication_status
  and resource.review_status = 'verified'::public.review_status;

create or replace view public.public_academic_events
with (security_barrier = true)
as
select
  event.id,
  event.slug,
  event.title,
  event.description,
  event.starts_at,
  event.ends_at,
  event.space_id,
  event.organizer,
  event.official_url,
  case when exists (select 1 from public.public_data_sources ds where ds.id = event.source_id)
    then event.source_id else null end as source_id
from public.academic_events event
left join public.spaces s on s.id = event.space_id
left join public.buildings space_building on space_building.id = s.building_id
where event.publication_status = 'published'::public.publication_status
  and event.review_status = 'verified'::public.review_status
  and (
    event.space_id is null
    or (
      s.is_public = true
      and s.publication_status = 'published'::public.publication_status
      and s.review_status = 'verified'::public.review_status
      and space_building.publication_status = 'published'::public.publication_status
      and space_building.review_status = 'verified'::public.review_status
    )
  );

create or replace view public.public_academic_dates
with (security_barrier = true)
as
select
  d.id,
  d.term_id,
  d.title,
  d.category,
  d.starts_on,
  d.ends_on,
  d.official_url,
  case when exists (select 1 from public.public_data_sources ds where ds.id = d.source_id)
    then d.source_id else null end as source_id
from public.academic_dates d
join public.academic_terms t on t.id = d.term_id
where d.publication_status = 'published'::public.publication_status
  and d.review_status = 'verified'::public.review_status
  and t.is_current = true;

-- The safe views are the public Data API. They are intentionally owner-executed:
-- their explicit predicates are the security boundary and allow us to revoke base
-- SELECT from anon entirely. Never replace an explicit predicate with SELECT *.
revoke all on public.public_buildings from public;
revoke all on public.public_floors from public;
revoke all on public.public_spaces from public;
revoke all on public.public_space_aliases from public;
revoke all on public.public_location_anchors from public;
revoke all on public.public_academic_terms from public;
revoke all on public.public_courses from public;
revoke all on public.public_course_aliases from public;
revoke all on public.public_course_prerequisites from public;
revoke all on public.public_faculty from public;
revoke all on public.public_faculty_offices from public;
revoke all on public.public_sections from public;
revoke all on public.public_section_meetings from public;
revoke all on public.public_faculty_section_assignments from public;
revoke all on public.public_consultation_hours from public;
revoke all on public.public_research_areas from public;
revoke all on public.public_faculty_research_areas from public;
revoke all on public.public_academic_services from public;
revoke all on public.public_academic_resources from public;
revoke all on public.public_academic_events from public;
revoke all on public.public_academic_dates from public;

grant select on public.public_buildings to anon, authenticated;
grant select on public.public_floors to anon, authenticated;
grant select on public.public_spaces to anon, authenticated;
grant select on public.public_space_aliases to anon, authenticated;
grant select on public.public_location_anchors to anon, authenticated;
grant select on public.public_academic_terms to anon, authenticated;
grant select on public.public_courses to anon, authenticated;
grant select on public.public_course_aliases to anon, authenticated;
grant select on public.public_course_prerequisites to anon, authenticated;
grant select on public.public_faculty to anon, authenticated;
grant select on public.public_faculty_offices to anon, authenticated;
grant select on public.public_sections to anon, authenticated;
grant select on public.public_section_meetings to anon, authenticated;
grant select on public.public_faculty_section_assignments to anon, authenticated;
grant select on public.public_consultation_hours to anon, authenticated;
grant select on public.public_research_areas to anon, authenticated;
grant select on public.public_faculty_research_areas to anon, authenticated;
grant select on public.public_academic_services to anon, authenticated;
grant select on public.public_academic_resources to anon, authenticated;
grant select on public.public_academic_events to anon, authenticated;
grant select on public.public_academic_dates to anon, authenticated;

-- Remove all old base-table public read policies. Public callers use the views above.
drop policy if exists "public read buildings" on public.buildings;
drop policy if exists "public read floors" on public.floors;
drop policy if exists "public read public spaces" on public.spaces;
drop policy if exists "public read aliases" on public.space_aliases;
drop policy if exists "public read anchors" on public.location_anchors;
drop policy if exists "public read terms" on public.academic_terms;
drop policy if exists "public read courses" on public.courses;
drop policy if exists "public read course aliases" on public.course_aliases;
drop policy if exists "public read prerequisites" on public.course_prerequisites;
drop policy if exists "public read faculty" on public.faculty;
drop policy if exists "public read faculty offices" on public.faculty_offices;
drop policy if exists "public read sections" on public.sections;
drop policy if exists "public read section meetings" on public.section_meetings;
drop policy if exists "public read assignments" on public.faculty_section_assignments;
drop policy if exists "public read consultations" on public.consultation_hours;
drop policy if exists "public read research areas" on public.research_areas;
drop policy if exists "public read faculty research" on public.faculty_research_areas;
drop policy if exists "public read services" on public.academic_services;
drop policy if exists "public read resources" on public.academic_resources;
drop policy if exists "public read events" on public.academic_events;
drop policy if exists "public read dates" on public.academic_dates;

-- Anonymous users have no reason to query the institutional base tables directly.
revoke select on table public.buildings from anon;
revoke select on table public.floors from anon;
revoke select on table public.spaces from anon;
revoke select on table public.space_aliases from anon;
revoke select on table public.location_anchors from anon;
revoke select on table public.academic_terms from anon;
revoke select on table public.courses from anon;
revoke select on table public.course_aliases from anon;
revoke select on table public.course_prerequisites from anon;
revoke select on table public.faculty from anon;
revoke select on table public.faculty_offices from anon;
revoke select on table public.sections from anon;
revoke select on table public.section_meetings from anon;
revoke select on table public.faculty_section_assignments from anon;
revoke select on table public.consultation_hours from anon;
revoke select on table public.research_areas from anon;
revoke select on table public.faculty_research_areas from anon;
revoke select on table public.academic_services from anon;
revoke select on table public.academic_resources from anon;
revoke select on table public.academic_events from anon;
revoke select on table public.academic_dates from anon;

-- Authenticated staff can inspect canonical/internal rows through RLS. Granting the
-- table privilege does not make rows visible to ordinary students: the staff/own-row
-- RLS policies below remain mandatory.
grant select on table public.buildings to authenticated;
grant select on table public.floors to authenticated;
grant select on table public.spaces to authenticated;
grant select on table public.space_aliases to authenticated;
grant select on table public.location_anchors to authenticated;
grant select on table public.academic_terms to authenticated;
grant select on table public.courses to authenticated;
grant select on table public.course_aliases to authenticated;
grant select on table public.course_prerequisites to authenticated;
grant select on table public.faculty to authenticated;
grant select on table public.faculty_offices to authenticated;
grant select on table public.sections to authenticated;
grant select on table public.section_meetings to authenticated;
grant select on table public.faculty_section_assignments to authenticated;
grant select on table public.consultation_hours to authenticated;
grant select on table public.research_areas to authenticated;
grant select on table public.faculty_research_areas to authenticated;
grant select on table public.academic_services to authenticated;
grant select on table public.academic_resources to authenticated;
grant select on table public.academic_events to authenticated;
grant select on table public.academic_dates to authenticated;

-- Fill the internal-read policy gaps. Existing staff policies on terms/courses/faculty/
-- sections/meetings/consultations remain in force from migrations 004/009/010.
drop policy if exists "staff read all buildings" on public.buildings;
create policy "staff read all buildings" on public.buildings for select to authenticated
  using ((select private.has_any_role(array['content_editor','map_editor','admin']::public.app_role[])));

drop policy if exists "staff read all floors" on public.floors;
create policy "staff read all floors" on public.floors for select to authenticated
  using ((select private.has_any_role(array['content_editor','map_editor','admin']::public.app_role[])));

drop policy if exists "staff read all spaces" on public.spaces;
create policy "staff read all spaces" on public.spaces for select to authenticated
  using ((select private.has_any_role(array['content_editor','map_editor','admin']::public.app_role[])));

drop policy if exists "staff read all space aliases" on public.space_aliases;
create policy "staff read all space aliases" on public.space_aliases for select to authenticated
  using ((select private.has_any_role(array['content_editor','map_editor','admin']::public.app_role[])));

drop policy if exists "staff read all anchors" on public.location_anchors;
create policy "staff read all anchors" on public.location_anchors for select to authenticated
  using ((select private.has_any_role(array['content_editor','map_editor','admin']::public.app_role[])));

drop policy if exists "staff read all course aliases" on public.course_aliases;
create policy "staff read all course aliases" on public.course_aliases for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));

drop policy if exists "staff read all prerequisites" on public.course_prerequisites;
create policy "staff read all prerequisites" on public.course_prerequisites for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));

drop policy if exists "staff read all faculty offices" on public.faculty_offices;
create policy "staff read all faculty offices" on public.faculty_offices for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));

drop policy if exists "staff read all assignments" on public.faculty_section_assignments;
create policy "staff read all assignments" on public.faculty_section_assignments for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));

drop policy if exists "staff read all research areas" on public.research_areas;
create policy "staff read all research areas" on public.research_areas for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));

drop policy if exists "staff read all faculty research" on public.faculty_research_areas;
create policy "staff read all faculty research" on public.faculty_research_areas for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));

drop policy if exists "staff read all academic services" on public.academic_services;
create policy "staff read all academic services" on public.academic_services for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));

drop policy if exists "staff read all academic resources" on public.academic_resources;
create policy "staff read all academic resources" on public.academic_resources for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));

drop policy if exists "staff read all academic events" on public.academic_events;
create policy "staff read all academic events" on public.academic_events for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));

drop policy if exists "staff read all academic dates" on public.academic_dates;
create policy "staff read all academic dates" on public.academic_dates for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));


-- Opt into least-privilege defaults for future public-schema objects. Supabase's
-- current Data API guidance requires explicit grants for new tables/functions rather
-- than relying on historical blanket defaults. Existing objects are unaffected by
-- ALTER DEFAULT PRIVILEGES, so every current public surface above is still granted
-- explicitly.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
