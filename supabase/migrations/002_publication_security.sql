-- 002_publication_security.sql

-- 1. Drop all the old insecure public read policies first so we can alter the columns
DROP POLICY IF EXISTS "public read buildings" ON public.buildings;
DROP POLICY IF EXISTS "public read public spaces" ON public.spaces;
DROP POLICY IF EXISTS "public read aliases" ON public.space_aliases;
DROP POLICY IF EXISTS "public read anchors" ON public.location_anchors;
DROP POLICY IF EXISTS "public read courses" ON public.courses;
DROP POLICY IF EXISTS "public read course aliases" ON public.course_aliases;
DROP POLICY IF EXISTS "public read prerequisites" ON public.course_prerequisites;
DROP POLICY IF EXISTS "public read faculty" ON public.faculty;
DROP POLICY IF EXISTS "public read faculty offices" ON public.faculty_offices;
DROP POLICY IF EXISTS "public read sections" ON public.sections;
DROP POLICY IF EXISTS "public read section meetings" ON public.section_meetings;
DROP POLICY IF EXISTS "public read assignments" ON public.faculty_section_assignments;
DROP POLICY IF EXISTS "public read consultations" ON public.consultation_hours;
DROP POLICY IF EXISTS "public read faculty research" ON public.faculty_research_areas;
DROP POLICY IF EXISTS "public read services" ON public.academic_services;
DROP POLICY IF EXISTS "public read resources" ON public.academic_resources;
DROP POLICY IF EXISTS "public read events" ON public.academic_events;
DROP POLICY IF EXISTS "public read dates" ON public.academic_dates;


-- 2. Create the new Enum
CREATE TYPE public.publication_status AS ENUM ('draft', 'needs_verification', 'verified', 'published', 'archived');


-- 3. Alter columns to use the new type and rename them
-- buildings
ALTER TABLE public.buildings ALTER COLUMN verification_status DROP DEFAULT;
ALTER TABLE public.buildings ALTER COLUMN verification_status TYPE public.publication_status USING verification_status::text::public.publication_status;
ALTER TABLE public.buildings ALTER COLUMN verification_status SET DEFAULT 'needs_verification'::public.publication_status;
ALTER TABLE public.buildings RENAME COLUMN verification_status TO publication_status;

-- spaces
ALTER TABLE public.spaces ALTER COLUMN verification_status DROP DEFAULT;
ALTER TABLE public.spaces ALTER COLUMN verification_status TYPE public.publication_status USING verification_status::text::public.publication_status;
ALTER TABLE public.spaces ALTER COLUMN verification_status SET DEFAULT 'needs_verification'::public.publication_status;
ALTER TABLE public.spaces RENAME COLUMN verification_status TO publication_status;

-- location_anchors
ALTER TABLE public.location_anchors ALTER COLUMN verification_status DROP DEFAULT;
ALTER TABLE public.location_anchors ALTER COLUMN verification_status TYPE public.publication_status USING verification_status::text::public.publication_status;
ALTER TABLE public.location_anchors ALTER COLUMN verification_status SET DEFAULT 'needs_verification'::public.publication_status;
ALTER TABLE public.location_anchors RENAME COLUMN verification_status TO publication_status;

-- courses
ALTER TABLE public.courses ALTER COLUMN verification_status DROP DEFAULT;
ALTER TABLE public.courses ALTER COLUMN verification_status TYPE public.publication_status USING verification_status::text::public.publication_status;
ALTER TABLE public.courses ALTER COLUMN verification_status SET DEFAULT 'draft'::public.publication_status;
ALTER TABLE public.courses RENAME COLUMN verification_status TO publication_status;

-- faculty
ALTER TABLE public.faculty ALTER COLUMN verification_status DROP DEFAULT;
ALTER TABLE public.faculty ALTER COLUMN verification_status TYPE public.publication_status USING verification_status::text::public.publication_status;
ALTER TABLE public.faculty ALTER COLUMN verification_status SET DEFAULT 'draft'::public.publication_status;
ALTER TABLE public.faculty RENAME COLUMN verification_status TO publication_status;

-- faculty_offices
ALTER TABLE public.faculty_offices ALTER COLUMN verification_status DROP DEFAULT;
ALTER TABLE public.faculty_offices ALTER COLUMN verification_status TYPE public.publication_status USING verification_status::text::public.publication_status;
ALTER TABLE public.faculty_offices ALTER COLUMN verification_status SET DEFAULT 'draft'::public.publication_status;
ALTER TABLE public.faculty_offices RENAME COLUMN verification_status TO publication_status;

-- sections
ALTER TABLE public.sections ALTER COLUMN verification_status DROP DEFAULT;
ALTER TABLE public.sections ALTER COLUMN verification_status TYPE public.publication_status USING verification_status::text::public.publication_status;
ALTER TABLE public.sections ALTER COLUMN verification_status SET DEFAULT 'draft'::public.publication_status;
ALTER TABLE public.sections RENAME COLUMN verification_status TO publication_status;

-- section_meetings
ALTER TABLE public.section_meetings ALTER COLUMN verification_status DROP DEFAULT;
ALTER TABLE public.section_meetings ALTER COLUMN verification_status TYPE public.publication_status USING verification_status::text::public.publication_status;
ALTER TABLE public.section_meetings ALTER COLUMN verification_status SET DEFAULT 'draft'::public.publication_status;
ALTER TABLE public.section_meetings RENAME COLUMN verification_status TO publication_status;

-- consultation_hours
ALTER TABLE public.consultation_hours ALTER COLUMN verification_status DROP DEFAULT;
ALTER TABLE public.consultation_hours ALTER COLUMN verification_status TYPE public.publication_status USING verification_status::text::public.publication_status;
ALTER TABLE public.consultation_hours ALTER COLUMN verification_status SET DEFAULT 'draft'::public.publication_status;
ALTER TABLE public.consultation_hours RENAME COLUMN verification_status TO publication_status;

-- academic_services
ALTER TABLE public.academic_services ALTER COLUMN verification_status DROP DEFAULT;
ALTER TABLE public.academic_services ALTER COLUMN verification_status TYPE public.publication_status USING verification_status::text::public.publication_status;
ALTER TABLE public.academic_services ALTER COLUMN verification_status SET DEFAULT 'draft'::public.publication_status;
ALTER TABLE public.academic_services RENAME COLUMN verification_status TO publication_status;

-- academic_resources
ALTER TABLE public.academic_resources ALTER COLUMN verification_status DROP DEFAULT;
ALTER TABLE public.academic_resources ALTER COLUMN verification_status TYPE public.publication_status USING verification_status::text::public.publication_status;
ALTER TABLE public.academic_resources ALTER COLUMN verification_status SET DEFAULT 'draft'::public.publication_status;
ALTER TABLE public.academic_resources RENAME COLUMN verification_status TO publication_status;

-- academic_events
ALTER TABLE public.academic_events ALTER COLUMN verification_status DROP DEFAULT;
ALTER TABLE public.academic_events ALTER COLUMN verification_status TYPE public.publication_status USING verification_status::text::public.publication_status;
ALTER TABLE public.academic_events ALTER COLUMN verification_status SET DEFAULT 'draft'::public.publication_status;
ALTER TABLE public.academic_events RENAME COLUMN verification_status TO publication_status;

-- academic_dates
ALTER TABLE public.academic_dates ALTER COLUMN verification_status DROP DEFAULT;
ALTER TABLE public.academic_dates ALTER COLUMN verification_status TYPE public.publication_status USING verification_status::text::public.publication_status;
ALTER TABLE public.academic_dates ALTER COLUMN verification_status SET DEFAULT 'draft'::public.publication_status;
ALTER TABLE public.academic_dates RENAME COLUMN verification_status TO publication_status;


-- 4. Drop old type
DROP TYPE public.verification_status;


-- 5. Recreate strict public read policies requiring 'published'

-- Buildings and Spaces
CREATE POLICY "public read buildings" ON public.buildings FOR SELECT USING (publication_status = 'published');
CREATE POLICY "public read public spaces" ON public.spaces FOR SELECT USING (is_public AND publication_status = 'published' AND EXISTS (SELECT 1 FROM public.buildings b WHERE b.id = building_id AND b.publication_status = 'published'));
CREATE POLICY "public read aliases" ON public.space_aliases FOR SELECT USING (EXISTS (SELECT 1 FROM public.spaces s WHERE s.id = space_id AND s.publication_status = 'published'));
CREATE POLICY "public read anchors" ON public.location_anchors FOR SELECT USING (publication_status = 'published');

-- Courses
CREATE POLICY "public read courses" ON public.courses FOR SELECT USING (publication_status = 'published');
CREATE POLICY "public read course aliases" ON public.course_aliases FOR SELECT USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.publication_status = 'published'));
CREATE POLICY "public read prerequisites" ON public.course_prerequisites FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.publication_status = 'published') AND
  EXISTS (SELECT 1 FROM public.courses c2 WHERE c2.id = prerequisite_course_id AND c2.publication_status = 'published')
);

-- Faculty
CREATE POLICY "public read faculty" ON public.faculty FOR SELECT USING (publication_status = 'published');
CREATE POLICY "public read faculty offices" ON public.faculty_offices FOR SELECT USING (
  publication_status = 'published' AND 
  EXISTS (SELECT 1 FROM public.faculty f WHERE f.id = faculty_id AND f.publication_status = 'published') AND
  EXISTS (SELECT 1 FROM public.academic_terms t WHERE t.id = term_id AND t.is_current = true)
);

-- Sections & Meetings (Must respect term is_current)
CREATE POLICY "public read sections" ON public.sections FOR SELECT USING (
  publication_status = 'published' AND
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.publication_status = 'published') AND
  EXISTS (SELECT 1 FROM public.academic_terms t WHERE t.id = term_id AND t.is_current = true)
);
CREATE POLICY "public read section meetings" ON public.section_meetings FOR SELECT USING (
  publication_status = 'published' AND
  EXISTS (SELECT 1 FROM public.sections s WHERE s.id = section_id AND s.publication_status = 'published' AND EXISTS (
    SELECT 1 FROM public.academic_terms t WHERE t.id = s.term_id AND t.is_current = true
  ))
);
CREATE POLICY "public read assignments" ON public.faculty_section_assignments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.faculty f WHERE f.id = faculty_id AND f.publication_status = 'published') AND
  EXISTS (SELECT 1 FROM public.sections s WHERE s.id = section_id AND s.publication_status = 'published' AND EXISTS (
    SELECT 1 FROM public.academic_terms t WHERE t.id = s.term_id AND t.is_current = true
  ))
);

-- Consultations (Must respect term is_current and parent faculty)
CREATE POLICY "public read consultations" ON public.consultation_hours FOR SELECT USING (
  publication_status = 'published' AND
  EXISTS (SELECT 1 FROM public.faculty f WHERE f.id = faculty_id AND f.publication_status = 'published') AND
  EXISTS (SELECT 1 FROM public.academic_terms t WHERE t.id = term_id AND t.is_current = true)
);

-- Research
CREATE POLICY "public read faculty research" ON public.faculty_research_areas FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.faculty f WHERE f.id = faculty_id AND f.publication_status = 'published')
);

-- Services and Events
CREATE POLICY "public read services" ON public.academic_services FOR SELECT USING (publication_status = 'published');
CREATE POLICY "public read resources" ON public.academic_resources FOR SELECT USING (publication_status = 'published');
CREATE POLICY "public read events" ON public.academic_events FOR SELECT USING (publication_status = 'published');
CREATE POLICY "public read dates" ON public.academic_dates FOR SELECT USING (
  publication_status = 'published' AND 
  EXISTS (SELECT 1 FROM public.academic_terms t WHERE t.id = term_id AND t.is_current = true)
);
