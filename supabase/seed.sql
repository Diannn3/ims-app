-- seed.sql
-- Synthetic academic fixtures for development and UI testing.

-- 0. Seed basic building & space data required by FKs
INSERT INTO public.data_sources (id, label, source_type) VALUES ('00000000-0000-0000-0000-000000000000', 'Demo Seed', 'other') ON CONFLICT DO NOTHING;

INSERT INTO public.buildings (id, name, short_name, publication_status, source_id)
VALUES ('mb', 'Math Building', 'MB', 'published', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.floors (id, building_id, level, name, display_order)
VALUES 
  ('mb-gf', 'mb', 1, 'Ground Floor', 1),
  ('mb-2f', 'mb', 2, 'Second Floor', 2),
  ('mb-3f', 'mb', 3, 'Third Floor', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.spaces (id, building_id, floor_id, name, kind, publication_status)
VALUES 
  ('mb304', 'mb', 'mb-3f', 'MB 304', 'classroom', 'published'),
  ('mb209', 'mb', 'mb-2f', 'MB 209 (Math Clinic)', 'facility', 'published')
ON CONFLICT (id) DO NOTHING;

-- 1. Demo Academic Term
INSERT INTO public.academic_terms (id, academic_year, term_name, starts_on, ends_on, is_current)
VALUES ('AY2627-1', '2026-2027', 'First Semester', '2026-08-01', '2026-12-15', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Demo Course
INSERT INTO public.courses (id, code, normalized_code, title, description, units, publication_status)
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  'DEMO 101', 
  'demo101', 
  'Demo Mathematical Analysis', 
  'A synthetic course for testing the Math Building Hub.', 
  3.0, 
  'published'
) ON CONFLICT (id) DO NOTHING;

-- 3. Demo Faculty
INSERT INTO public.faculty (id, slug, display_name, title, official_email, bio, publication_status)
VALUES (
  '33333333-3333-3333-3333-333333333333', 
  'demo-alpha', 
  'Prof. Demo Alpha', 
  'Associate Professor', 
  'dalpha@up.edu.ph', 
  'Demo faculty member for testing UI.', 
  'published'
) ON CONFLICT (id) DO NOTHING;

-- 4. Demo Section
INSERT INTO public.sections (id, course_id, term_id, section_code, publication_status)
VALUES (
  '22222222-2222-2222-2222-222222222222', 
  '11111111-1111-1111-1111-111111111111', 
  'AY2627-1', 
  'A', 
  'published'
) ON CONFLICT (id) DO NOTHING;

-- 5. Demo Section Meetings
-- MWF 10:00 - 11:00 at MB 304
INSERT INTO public.section_meetings (section_id, weekday, starts_at, ends_at, space_id, publication_status)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 1, '10:00:00', '11:00:00', 'mb304', 'published'),
  ('22222222-2222-2222-2222-222222222222', 3, '10:00:00', '11:00:00', 'mb304', 'published'),
  ('22222222-2222-2222-2222-222222222222', 5, '10:00:00', '11:00:00', 'mb304', 'published');

-- 6. Faculty Assignment to Section
INSERT INTO public.faculty_section_assignments (faculty_id, section_id, assignment_role)
VALUES ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'instructor')
ON CONFLICT DO NOTHING;

-- 7. Consultation Hours
-- TTh 13:00 - 15:00 at MB 209 (Math Clinic)
INSERT INTO public.consultation_hours (faculty_id, term_id, weekday, starts_at, ends_at, mode, space_id, publication_status)
VALUES 
  ('33333333-3333-3333-3333-333333333333', 'AY2627-1', 2, '13:00:00', '15:00:00', 'in_person', 'mb209', 'published'),
  ('33333333-3333-3333-3333-333333333333', 'AY2627-1', 4, '13:00:00', '15:00:00', 'in_person', 'mb209', 'published');

-- 8. Academic Services (Math Clinic)
INSERT INTO public.academic_services (slug, name, description, space_id, publication_status)
VALUES (
  'math-clinic',
  'Math Clinic',
  'Free tutoring and consultation services for Math students.',
  'mb209',
  'published'
) ON CONFLICT (slug) DO NOTHING;

-- 9. Research Areas
INSERT INTO public.research_areas (id, slug, name, description)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'demo-operations-research',
  'Operations Research (Demo)',
  'Synthetic research area for UI testing.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.faculty_research_areas (faculty_id, research_area_id)
VALUES ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;
