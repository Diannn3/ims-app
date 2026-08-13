-- seed.sql
-- Synthetic academic fixtures for development and UI/RLS testing only.
-- This file intentionally contains no claims about real UPLB course offerings,
-- faculty assignments, or consultation schedules.

-- -----------------------------------------------------------------------------
-- 0. Synthetic source + spatial records needed by academic foreign keys.
-- Every published record is also review_status='verified' after migration 004.
-- -----------------------------------------------------------------------------

insert into public.data_sources (id, label, source_type, authority, notes)
values (
  '00000000-0000-0000-0000-000000000000',
  'Synthetic Demo Seed',
  'other',
  'Development fixture only',
  'Never treat these academic records as real UPLB data.'
)
on conflict (id) do update set
  label = excluded.label,
  authority = excluded.authority,
  notes = excluded.notes;

insert into public.buildings (
  id, name, short_name, publication_status, review_status, source_id
)
values (
  'mb', 'Math Building', 'MB', 'published', 'verified',
  '00000000-0000-0000-0000-000000000000'
)
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  publication_status = excluded.publication_status,
  review_status = excluded.review_status;

insert into public.floors (id, building_id, level, name, display_order)
values
  ('mb-gf', 'mb', 1, 'Ground Floor', 1),
  ('mb-2f', 'mb', 2, 'Second Floor', 2),
  ('mb-3f', 'mb', 3, 'Third Floor', 3)
on conflict (id) do update set
  name = excluded.name,
  display_order = excluded.display_order;

insert into public.spaces (
  id, building_id, floor_id, name, kind, publication_status, review_status, source_id
)
values
  ('mb201', 'mb', 'mb-2f', 'MB 201', 'classroom', 'published', 'verified', '00000000-0000-0000-0000-000000000000'),
  ('mb205', 'mb', 'mb-2f', 'MB 205', 'faculty_office', 'published', 'verified', '00000000-0000-0000-0000-000000000000'),
  ('mb209', 'mb', 'mb-2f', 'MB 209 (Math Clinic)', 'facility', 'published', 'verified', '00000000-0000-0000-0000-000000000000'),
  ('mb304', 'mb', 'mb-3f', 'MB 304', 'classroom', 'published', 'verified', '00000000-0000-0000-0000-000000000000')
on conflict (id) do update set
  name = excluded.name,
  kind = excluded.kind,
  publication_status = excluded.publication_status,
  review_status = excluded.review_status;

insert into public.space_aliases (space_id, alias, normalized_alias)
values
  ('mb201', '201', '201'),
  ('mb205', '205', '205'),
  ('mb209', 'Math Clinic', 'mathclinic'),
  ('mb209', '209', '209'),
  ('mb304', '304', '304')
on conflict (space_id, normalized_alias) do nothing;

-- -----------------------------------------------------------------------------
-- 1. Current synthetic academic term.
-- -----------------------------------------------------------------------------

insert into public.academic_terms (
  id, academic_year, term_name, starts_on, ends_on, is_current, source_id
)
values (
  'AY2627-1', '2026-2027', 'First Semester', '2026-08-01', '2026-12-15', true,
  '00000000-0000-0000-0000-000000000000'
)
on conflict (id) do update set
  academic_year = excluded.academic_year,
  term_name = excluded.term_name,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  is_current = true;

-- -----------------------------------------------------------------------------
-- 2. Synthetic courses. DEMO 999 remains unpublished for RLS/empty-state tests.
-- -----------------------------------------------------------------------------

insert into public.courses (
  id, code, normalized_code, title, description, units,
  publication_status, review_status, source_id
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'DEMO 101', 'demo101', 'Demo Mathematical Analysis',
    'Synthetic course used to exercise academic read models and UI.', 3.0,
    'published', 'verified', '00000000-0000-0000-0000-000000000000'
  ),
  (
    '11111111-1111-1111-1111-111111111112',
    'DEMO 201', 'demo201', 'Demo Applied Mathematics',
    'Second synthetic course used for multi-course views.', 3.0,
    'published', 'verified', '00000000-0000-0000-0000-000000000000'
  ),
  (
    '11111111-1111-1111-1111-111111111199',
    'DEMO 999', 'demo999', 'Unpublished Demo Course',
    'Must never be returned to anonymous public queries.', 3.0,
    'draft', 'draft', '00000000-0000-0000-0000-000000000000'
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  units = excluded.units,
  publication_status = excluded.publication_status,
  review_status = excluded.review_status;

insert into public.course_aliases (course_id, alias, normalized_alias)
values
  ('11111111-1111-1111-1111-111111111111', 'DEMO101', 'demo101'),
  ('11111111-1111-1111-1111-111111111112', 'DEMO201', 'demo201')
on conflict (course_id, normalized_alias) do nothing;

insert into public.course_prerequisites (course_id, prerequisite_course_id, relationship_type, source_id)
values (
  '11111111-1111-1111-1111-111111111112',
  '11111111-1111-1111-1111-111111111111',
  'prerequisite',
  '00000000-0000-0000-0000-000000000000'
)
on conflict (course_id, prerequisite_course_id, relationship_type) do update set source_id = excluded.source_id;

-- -----------------------------------------------------------------------------
-- 3. Synthetic faculty. These names/emails are intentionally fictional.
-- -----------------------------------------------------------------------------

insert into public.faculty (
  id, slug, display_name, title, official_email, bio,
  publication_status, review_status, source_id
)
values
  (
    '33333333-3333-3333-3333-333333333333',
    'demo-alpha', 'Prof. Demo Alpha', 'Associate Professor',
    'demo.alpha@example.edu',
    'Synthetic faculty record for development and accessibility testing.',
    'published', 'verified', '00000000-0000-0000-0000-000000000000'
  ),
  (
    '33333333-3333-3333-3333-333333333334',
    'demo-beta', 'Prof. Demo Beta', 'Assistant Professor',
    'demo.beta@example.edu',
    'Synthetic second faculty record for grouped consultation and section views.',
    'published', 'verified', '00000000-0000-0000-0000-000000000000'
  )
on conflict (id) do update set
  display_name = excluded.display_name,
  title = excluded.title,
  official_email = excluded.official_email,
  publication_status = excluded.publication_status,
  review_status = excluded.review_status;

insert into public.faculty_offices (
  id, faculty_id, term_id, space_id, is_primary, source_id,
  publication_status, review_status
)
values
  (
    '55555555-5555-5555-5555-555555555551',
    '33333333-3333-3333-3333-333333333333',
    'AY2627-1', 'mb205', true,
    '00000000-0000-0000-0000-000000000000',
    'published', 'verified'
  )
on conflict (faculty_id, term_id, space_id) do update set
  is_primary = excluded.is_primary,
  publication_status = excluded.publication_status,
  review_status = excluded.review_status;

-- -----------------------------------------------------------------------------
-- 4. Sections and meeting patterns.
-- DEMO 101 has two sections so components exercise a real multi-section shape.
-- -----------------------------------------------------------------------------

insert into public.sections (
  id, course_id, term_id, section_code, source_id,
  publication_status, review_status
)
values
  (
    '22222222-2222-2222-2222-222222222221',
    '11111111-1111-1111-1111-111111111111', 'AY2627-1', 'A',
    '00000000-0000-0000-0000-000000000000', 'published', 'verified'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111', 'AY2627-1', 'B',
    '00000000-0000-0000-0000-000000000000', 'published', 'verified'
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    '11111111-1111-1111-1111-111111111112', 'AY2627-1', 'A',
    '00000000-0000-0000-0000-000000000000', 'published', 'verified'
  )
on conflict (id) do update set
  section_code = excluded.section_code,
  publication_status = excluded.publication_status,
  review_status = excluded.review_status;

-- Keep the seed idempotent even though section_meetings has no natural unique key.
delete from public.section_meetings
where section_id in (
  '22222222-2222-2222-2222-222222222221',
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222223'
)
and source_id = '00000000-0000-0000-0000-000000000000';

insert into public.section_meetings (
  section_id, weekday, starts_at, ends_at, space_id, source_id,
  publication_status, review_status
)
values
  ('22222222-2222-2222-2222-222222222221', 1, '10:00', '11:00', 'mb304', '00000000-0000-0000-0000-000000000000', 'published', 'verified'),
  ('22222222-2222-2222-2222-222222222221', 3, '10:00', '11:00', 'mb304', '00000000-0000-0000-0000-000000000000', 'published', 'verified'),
  ('22222222-2222-2222-2222-222222222221', 5, '10:00', '11:00', 'mb304', '00000000-0000-0000-0000-000000000000', 'published', 'verified'),
  ('22222222-2222-2222-2222-222222222222', 2, '13:00', '14:30', 'mb201', '00000000-0000-0000-0000-000000000000', 'published', 'verified'),
  ('22222222-2222-2222-2222-222222222222', 4, '13:00', '14:30', 'mb201', '00000000-0000-0000-0000-000000000000', 'published', 'verified'),
  ('22222222-2222-2222-2222-222222222223', 2, '09:00', '10:30', 'mb304', '00000000-0000-0000-0000-000000000000', 'published', 'verified'),
  ('22222222-2222-2222-2222-222222222223', 4, '09:00', '10:30', 'mb304', '00000000-0000-0000-0000-000000000000', 'published', 'verified');

insert into public.faculty_section_assignments (
  faculty_id, section_id, assignment_role, source_id
)
values
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222221', 'instructor', '00000000-0000-0000-0000-000000000000'),
  ('33333333-3333-3333-3333-333333333334', '22222222-2222-2222-2222-222222222222', 'instructor', '00000000-0000-0000-0000-000000000000'),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222223', 'instructor', '00000000-0000-0000-0000-000000000000')
on conflict (faculty_id, section_id, assignment_role) do update set source_id = excluded.source_id;

-- -----------------------------------------------------------------------------
-- 5. Consultation UI matrix: in-person, online, and by-appointment.
-- These are scheduled demo records, never live-presence indicators.
-- -----------------------------------------------------------------------------

delete from public.consultation_hours
where faculty_id in (
  '33333333-3333-3333-3333-333333333333',
  '33333333-3333-3333-3333-333333333334'
)
and source_id = '00000000-0000-0000-0000-000000000000';

insert into public.consultation_hours (
  faculty_id, term_id, weekday, starts_at, ends_at, mode, space_id,
  appointment_url, notes, source_id, publication_status, review_status
)
values
  (
    '33333333-3333-3333-3333-333333333333', 'AY2627-1', 2,
    '13:00', '15:00', 'in_person', 'mb205', null,
    'Synthetic in-person schedule.', '00000000-0000-0000-0000-000000000000',
    'published', 'verified'
  ),
  (
    '33333333-3333-3333-3333-333333333333', 'AY2627-1', 4,
    null, null, 'by_appointment', null, 'https://example.com/demo-booking',
    'Synthetic by-appointment schedule.', '00000000-0000-0000-0000-000000000000',
    'published', 'verified'
  ),
  (
    '33333333-3333-3333-3333-333333333334', 'AY2627-1', 3,
    '14:00', '16:00', 'online', null, 'https://example.com/demo-online',
    'Synthetic online schedule.', '00000000-0000-0000-0000-000000000000',
    'published', 'verified'
  );

-- -----------------------------------------------------------------------------
-- 6. Academic service, research, resources, date, and event fixtures.
-- -----------------------------------------------------------------------------

insert into public.academic_services (
  slug, name, description, space_id, source_id, publication_status, review_status
)
values (
  'math-clinic', 'Math Clinic',
  'Synthetic development description for the Math Clinic service page.',
  'mb209', '00000000-0000-0000-0000-000000000000', 'published', 'verified'
)
on conflict (slug) do update set
  description = excluded.description,
  publication_status = excluded.publication_status,
  review_status = excluded.review_status;

insert into public.research_areas (
  id, slug, name, description, source_id, publication_status, review_status
)
values
  (
    '44444444-4444-4444-4444-444444444441',
    'demo-operations-research', 'Operations Research (Demo)',
    'Synthetic published research area for UI testing.',
    '00000000-0000-0000-0000-000000000000', 'published', 'verified'
  ),
  (
    '44444444-4444-4444-4444-444444444499',
    'demo-hidden-research', 'Hidden Research (Demo)',
    'Synthetic unpublished research area used by RLS tests.',
    '00000000-0000-0000-0000-000000000000', 'draft', 'draft'
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  publication_status = excluded.publication_status,
  review_status = excluded.review_status;

insert into public.faculty_research_areas (faculty_id, research_area_id, source_id)
values (
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444441',
  '00000000-0000-0000-0000-000000000000'
)
on conflict (faculty_id, research_area_id) do update set source_id = excluded.source_id;

insert into public.academic_resources (
  id, slug, title, category, description, official_url, source_id,
  publication_status, review_status
)
values (
  '66666666-6666-6666-6666-666666666661',
  'demo-academic-resource', 'Demo Academic Resource', 'demo',
  'Synthetic resource used to test linked-resource presentation.',
  'https://example.com/demo-resource',
  '00000000-0000-0000-0000-000000000000', 'published', 'verified'
)
on conflict (id) do update set
  title = excluded.title,
  publication_status = excluded.publication_status,
  review_status = excluded.review_status;

insert into public.academic_dates (
  id, term_id, title, category, starts_on, source_id,
  publication_status, review_status
)
values (
  '77777777-7777-7777-7777-777777777771',
  'AY2627-1', 'Demo Academic Date', 'demo', '2026-09-01',
  '00000000-0000-0000-0000-000000000000', 'published', 'verified'
)
on conflict (id) do update set
  title = excluded.title,
  starts_on = excluded.starts_on,
  publication_status = excluded.publication_status,
  review_status = excluded.review_status;

insert into public.academic_events (
  id, slug, title, description, starts_at, ends_at, space_id, organizer, source_id,
  publication_status, review_status
)
values (
  '88888888-8888-8888-8888-888888888881',
  'demo-colloquium', 'Demo IMS Colloquium',
  'Synthetic academic event for event-to-room integration testing.',
  '2026-09-10 08:00:00+08', '2026-09-10 09:00:00+08', 'mb304',
  'Development fixture', '00000000-0000-0000-0000-000000000000',
  'published', 'verified'
)
on conflict (id) do update set
  title = excluded.title,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  publication_status = excluded.publication_status,
  review_status = excluded.review_status;
