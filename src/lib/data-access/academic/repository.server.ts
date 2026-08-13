import type { SupabaseClient } from '@supabase/supabase-js';
import type { AcademicRepository } from '$lib/domain/academic/repository';
import type {
  AcademicDateSummary,
  AcademicEventSummary,
  AcademicResourceSummary,
  AcademicTermSummary,
  ConsultationSummary,
  CourseDetail,
  CourseSummary,
  FacultyDetail,
  FacultySummary,
  PublicationMeta,
  ResearchAreaSummary,
  RoomSchedule,
  ServiceSummary
} from '$lib/domain/academic/types';
import { normalizeCourseCode, normalizeHumanQuery } from '$lib/domain/academic/formatters';

type SourceRow = {
  id: string;
  label: string;
  source_url: string | null;
};

function unavailableRepository(): AcademicRepository {
  const status = { configured: false, message: 'Academic data source is not configured.' } as const;
  return {
    status: () => status,
    listCourses: async () => [],
    getCourseByCode: async () => null,
    listFaculty: async () => [],
    getFacultyBySlug: async () => null,
    listConsultations: async () => [],
    getRoomSchedule: async (spaceId) => ({ spaceId, currentTerm: null, meetings: [] }),
    listServices: async () => [],
    listResearchAreas: async () => [],
    listAcademicResources: async () => [],
    listAcademicDates: async () => [],
    listEvents: async () => []
  };
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function safeExternalUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeEmail(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

async function getSourceMap(supabase: SupabaseClient, ids: Array<string | null | undefined>) {
  const clean = unique(ids.filter((id): id is string => Boolean(id)));
  if (!clean.length) return new Map<string, SourceRow>();

  const { data } = await supabase
    .from('public_data_sources')
    .select('id, label, source_url')
    .in('id', clean);

  return new Map<string, SourceRow>(
    ((data ?? []) as SourceRow[]).map((row) => [row.id, row])
  );
}

function metaFor(
  sourceId: string | null | undefined,
  lastVerifiedAt: string | null | undefined,
  sources: Map<string, SourceRow>
): PublicationMeta {
  const source = sourceId ? sources.get(sourceId) : null;
  return {
    sourceId: sourceId ?? null,
    sourceLabel: source?.label ?? null,
    sourceUrl: safeExternalUrl(source?.source_url),
    lastVerifiedAt: lastVerifiedAt ?? null
  };
}

async function getCurrentTerm(supabase: SupabaseClient): Promise<AcademicTermSummary | null> {
  const { data } = await supabase
    .from('academic_terms')
    .select('id, academic_year, term_name')
    .eq('is_current', true)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    academicYear: data.academic_year,
    termName: data.term_name
  };
}

function safeLikeQuery(value: string) {
  return normalizeHumanQuery(value).replace(/[%,()]/g, '');
}

export function createAcademicRepository(supabase: SupabaseClient | null): AcademicRepository {
  if (!supabase) return unavailableRepository();

  return {
    status() {
      return { configured: true };
    },

    async listCourses(input = {}): Promise<CourseSummary[]> {
      let query = supabase
        .from('courses')
        .select('id, code, title, units, source_id, last_verified_at')
        .eq('publication_status', 'published')
        .order('normalized_code');

      const text = input.query ? safeLikeQuery(input.query) : '';
      if (text) {
        const normalized = normalizeCourseCode(text);
        query = query.or(
          `code.ilike.%${text}%,normalized_code.ilike.%${normalized}%,title.ilike.%${text}%`
        );
      }

      const { data } = await query.limit(80);
      const rows = data ?? [];
      const sources = await getSourceMap(supabase, rows.map((row) => row.source_id));

      return rows.map((row) => ({
        id: row.id,
        code: row.code,
        title: row.title,
        units: row.units === null ? null : Number(row.units),
        meta: metaFor(row.source_id, row.last_verified_at, sources)
      }));
    },

    async getCourseByCode(code: string): Promise<CourseDetail | null> {
      const normalizedCode = normalizeCourseCode(code);
      const { data: course } = await supabase
        .from('courses')
        .select('id, code, title, description, units, source_id, last_verified_at')
        .eq('normalized_code', normalizedCode)
        .eq('publication_status', 'published')
        .maybeSingle();

      if (!course) return null;

      const currentTerm = await getCurrentTerm(supabase);
      const { data: sectionRows } = currentTerm
        ? await supabase
            .from('sections')
            .select('id, section_code, source_id')
            .eq('course_id', course.id)
            .eq('term_id', currentTerm.id)
            .eq('publication_status', 'published')
            .order('section_code')
        : { data: [] as Array<{ id: string; section_code: string; source_id: string | null }> };

      const sections = sectionRows ?? [];
      const sectionIds = sections.map((section) => section.id);

      const { data: meetingRows } = sectionIds.length
        ? await supabase
            .from('section_meetings')
            .select('id, section_id, weekday, starts_at, ends_at, space_id')
            .in('section_id', sectionIds)
            .eq('publication_status', 'published')
            .order('weekday')
            .order('starts_at')
        : { data: [] as any[] };

      const { data: assignmentRows } = sectionIds.length
        ? await supabase
            .from('faculty_section_assignments')
            .select('section_id, faculty_id')
            .in('section_id', sectionIds)
        : { data: [] as any[] };

      const facultyIds = unique((assignmentRows ?? []).map((row) => row.faculty_id));
      const { data: facultyRows } = facultyIds.length
        ? await supabase
            .from('faculty')
            .select('id, slug, display_name, title')
            .in('id', facultyIds)
            .eq('publication_status', 'published')
        : { data: [] as any[] };

      const facultyMap = new Map((facultyRows ?? []).map((row) => [row.id, row]));

      const { data: prerequisiteLinks } = await supabase
        .from('course_prerequisites')
        .select('prerequisite_course_id, relationship_type')
        .eq('course_id', course.id);
      const prerequisiteIds = unique((prerequisiteLinks ?? []).map((row) => row.prerequisite_course_id));
      const { data: prerequisiteCourses } = prerequisiteIds.length
        ? await supabase
            .from('courses')
            .select('id, code, title')
            .in('id', prerequisiteIds)
            .eq('publication_status', 'published')
        : { data: [] as any[] };
      const prerequisiteMap = new Map((prerequisiteCourses ?? []).map((row: any) => [row.id, row]));

      const sourceIds = [course.source_id, ...sections.map((row) => row.source_id)];
      const sources = await getSourceMap(supabase, sourceIds);

      return {
        id: course.id,
        code: course.code,
        title: course.title,
        description: course.description,
        units: course.units === null ? null : Number(course.units),
        meta: metaFor(course.source_id, course.last_verified_at, sources),
        currentTerm,
        prerequisites: (prerequisiteLinks ?? [])
          .map((link: any) => {
            const prerequisite: any = prerequisiteMap.get(link.prerequisite_course_id);
            if (!prerequisite) return null;
            return {
              code: prerequisite.code,
              title: prerequisite.title,
              relationshipType: link.relationship_type
            };
          })
          .filter((value): value is { code: string; title: string | null; relationshipType: string } => Boolean(value)),
        sections: sections.map((section) => ({
          id: section.id,
          sectionCode: section.section_code,
          meetings: (meetingRows ?? [])
            .filter((meeting) => meeting.section_id === section.id)
            .map((meeting) => ({
              id: meeting.id,
              weekday: meeting.weekday,
              startsAt: meeting.starts_at,
              endsAt: meeting.ends_at,
              spaceId: meeting.space_id
            })),
          instructors: (assignmentRows ?? [])
            .filter((assignment) => assignment.section_id === section.id)
            .map((assignment) => facultyMap.get(assignment.faculty_id))
            .filter(Boolean)
            .map((faculty: any) => ({
              id: faculty.id,
              slug: faculty.slug,
              displayName: faculty.display_name,
              title: faculty.title
            }))
        }))
      };
    },

    async listFaculty(input = {}): Promise<FacultySummary[]> {
      let query = supabase
        .from('faculty')
        .select('id, slug, display_name, title, official_email, official_profile_url, source_id, last_verified_at')
        .eq('publication_status', 'published')
        .order('display_name');

      const text = input.query ? safeLikeQuery(input.query) : '';
      if (text) {
        query = query.or(`display_name.ilike.%${text}%,title.ilike.%${text}%`);
      }

      const { data } = await query.limit(100);
      const rows = data ?? [];
      const sources = await getSourceMap(supabase, rows.map((row) => row.source_id));

      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        displayName: row.display_name,
        title: row.title,
        officialEmail: safeEmail(row.official_email),
        officialProfileUrl: safeExternalUrl(row.official_profile_url),
        meta: metaFor(row.source_id, row.last_verified_at, sources)
      }));
    },

    async getFacultyBySlug(slug: string): Promise<FacultyDetail | null> {
      const { data: faculty } = await supabase
        .from('faculty')
        .select(
          'id, slug, display_name, title, official_email, bio, official_profile_url, publications_url, source_id, last_verified_at'
        )
        .eq('slug', slug)
        .eq('publication_status', 'published')
        .maybeSingle();

      if (!faculty) return null;

      const currentTerm = await getCurrentTerm(supabase);
      const [{ data: officeRows }, { data: consultations }, { data: assignments }, { data: areaLinks }] =
        await Promise.all([
          supabase
            .from('faculty_offices')
            .select('space_id')
            .eq('faculty_id', faculty.id)
            .eq('is_primary', true)
            .eq('publication_status', 'published')
            .limit(1),
          currentTerm
            ? supabase
                .from('consultation_hours')
                .select(
                  'id, faculty_id, weekday, starts_at, ends_at, mode, space_id, appointment_url, notes, source_id, last_verified_at'
                )
                .eq('faculty_id', faculty.id)
                .eq('term_id', currentTerm.id)
                .eq('publication_status', 'published')
                .order('weekday')
                .order('starts_at')
            : Promise.resolve({ data: [] as any[] } as any),
          currentTerm
            ? supabase
                .from('faculty_section_assignments')
                .select('section_id')
                .eq('faculty_id', faculty.id)
            : Promise.resolve({ data: [] as any[] } as any),
          supabase
            .from('faculty_research_areas')
            .select('research_area_id')
            .eq('faculty_id', faculty.id)
        ]);

      const sectionIds = unique((assignments ?? []).map((row: any) => row.section_id));
      const { data: sectionRows } = sectionIds.length && currentTerm
        ? await supabase
            .from('sections')
            .select('id, section_code, course_id')
            .in('id', sectionIds)
            .eq('term_id', currentTerm.id)
            .eq('publication_status', 'published')
        : { data: [] as any[] };

      const courseIds = unique((sectionRows ?? []).map((row: any) => row.course_id));
      const { data: courseRows } = courseIds.length
        ? await supabase
            .from('courses')
            .select('id, code, title')
            .in('id', courseIds)
            .eq('publication_status', 'published')
        : { data: [] as any[] };

      const courseMap = new Map((courseRows ?? []).map((row: any) => [row.id, row]));

      const areaIds = unique((areaLinks ?? []).map((row: any) => row.research_area_id));
      const { data: areaRows } = areaIds.length
        ? await supabase
            .from('research_areas')
            .select('id, slug, name')
            .in('id', areaIds)
            .eq('publication_status', 'published')
        : { data: [] as any[] };

      const sources = await getSourceMap(
        supabase,
        [faculty.source_id, ...(consultations ?? []).map((row: any) => row.source_id)]
      );

      const consultationModels: ConsultationSummary[] = (consultations ?? []).map((row: any) => ({
        id: row.id,
        facultyId: faculty.id,
        facultySlug: faculty.slug,
        facultyName: faculty.display_name,
        weekday: row.weekday,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        mode: row.mode,
        spaceId: row.space_id,
        appointmentUrl: safeExternalUrl(row.appointment_url),
        notes: row.notes,
        meta: metaFor(row.source_id, row.last_verified_at, sources)
      }));

      return {
        id: faculty.id,
        slug: faculty.slug,
        displayName: faculty.display_name,
        title: faculty.title,
        officialEmail: safeEmail(faculty.official_email),
        officialProfileUrl: safeExternalUrl(faculty.official_profile_url),
        bio: faculty.bio,
        publicationsUrl: safeExternalUrl(faculty.publications_url),
        officeSpaceId: officeRows?.[0]?.space_id ?? null,
        consultations: consultationModels,
        currentSections: (sectionRows ?? []).map((section: any) => {
          const course: any = courseMap.get(section.course_id);
          return {
            sectionId: section.id,
            sectionCode: section.section_code,
            courseCode: course?.code ?? 'Course',
            courseTitle: course?.title ?? null
          };
        }),
        researchAreas: (areaRows ?? []).map((area: any) => ({ slug: area.slug, name: area.name })),
        meta: metaFor(faculty.source_id, faculty.last_verified_at, sources)
      };
    },

    async listConsultations(input = {}): Promise<ConsultationSummary[]> {
      const currentTerm = await getCurrentTerm(supabase);
      if (!currentTerm) return [];

      let query = supabase
        .from('consultation_hours')
        .select(
          'id, faculty_id, weekday, starts_at, ends_at, mode, space_id, appointment_url, notes, source_id, last_verified_at'
        )
        .eq('term_id', currentTerm.id)
        .eq('publication_status', 'published')
        .order('weekday')
        .order('starts_at');

      if (input.weekday) query = query.eq('weekday', input.weekday);
      if (input.facultyId) query = query.eq('faculty_id', input.facultyId);

      const { data } = await query.limit(100);
      const rows = data ?? [];
      const facultyIds = unique(rows.map((row) => row.faculty_id));
      const { data: facultyRows } = facultyIds.length
        ? await supabase
            .from('faculty')
            .select('id, slug, display_name')
            .in('id', facultyIds)
            .eq('publication_status', 'published')
        : { data: [] as any[] };

      const facultyMap = new Map((facultyRows ?? []).map((row: any) => [row.id, row]));
      const sources = await getSourceMap(supabase, rows.map((row) => row.source_id));

      return rows
        .map((row) => {
          const faculty: any = facultyMap.get(row.faculty_id);
          if (!faculty) return null;
          return {
            id: row.id,
            facultyId: row.faculty_id,
            facultySlug: faculty.slug,
            facultyName: faculty.display_name,
            weekday: row.weekday,
            startsAt: row.starts_at,
            endsAt: row.ends_at,
            mode: row.mode,
            spaceId: row.space_id,
            appointmentUrl: safeExternalUrl(row.appointment_url),
            notes: row.notes,
            meta: metaFor(row.source_id, row.last_verified_at, sources)
          } satisfies ConsultationSummary;
        })
        .filter((value): value is ConsultationSummary => Boolean(value));
    },

    async getRoomSchedule(spaceId: string): Promise<RoomSchedule> {
      const currentTerm = await getCurrentTerm(supabase);
      if (!currentTerm) return { spaceId, currentTerm: null, meetings: [] };

      const { data: sectionRows } = await supabase
        .from('sections')
        .select('id, section_code, course_id')
        .eq('term_id', currentTerm.id)
        .eq('publication_status', 'published');

      const sections = sectionRows ?? [];
      const sectionIds = sections.map((row) => row.id);
      if (!sectionIds.length) return { spaceId, currentTerm, meetings: [] };

      const { data: meetingRows } = await supabase
        .from('section_meetings')
        .select('id, section_id, weekday, starts_at, ends_at')
        .in('section_id', sectionIds)
        .eq('space_id', spaceId)
        .eq('publication_status', 'published')
        .order('weekday')
        .order('starts_at');

      const courseIds = unique(sections.map((row) => row.course_id));
      const { data: courseRows } = courseIds.length
        ? await supabase
            .from('courses')
            .select('id, code, title')
            .in('id', courseIds)
            .eq('publication_status', 'published')
        : { data: [] as any[] };

      const sectionMap = new Map(sections.map((row: any) => [row.id, row]));
      const courseMap = new Map((courseRows ?? []).map((row: any) => [row.id, row]));

      return {
        spaceId,
        currentTerm,
        meetings: (meetingRows ?? []).map((meeting: any) => {
          const section: any = sectionMap.get(meeting.section_id);
          const course: any = section ? courseMap.get(section.course_id) : null;
          return {
            id: meeting.id,
            weekday: meeting.weekday,
            startsAt: meeting.starts_at,
            endsAt: meeting.ends_at,
            courseCode: course?.code ?? 'Course',
            courseTitle: course?.title ?? null,
            sectionCode: section?.section_code ?? '—'
          };
        })
      };
    },

    async listServices(): Promise<ServiceSummary[]> {
      const { data } = await supabase
        .from('academic_services')
        .select(
          'id, slug, name, description, space_id, official_url, source_id, last_verified_at'
        )
        .eq('publication_status', 'published')
        .order('name');

      const rows = data ?? [];
      const sources = await getSourceMap(supabase, rows.map((row) => row.source_id));

      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        spaceId: row.space_id,
        officialUrl: safeExternalUrl(row.official_url),
        meta: metaFor(row.source_id, row.last_verified_at, sources)
      }));
    },

    async listResearchAreas(): Promise<ResearchAreaSummary[]> {
      const { data: areas } = await supabase
        .from('research_areas')
        .select('id, slug, name, description, source_id')
        .eq('publication_status', 'published')
        .order('name');

      const rows = areas ?? [];
      const areaIds = rows.map((row) => row.id);
      const { data: links } = areaIds.length
        ? await supabase
            .from('faculty_research_areas')
            .select('research_area_id, faculty_id')
            .in('research_area_id', areaIds)
        : { data: [] as any[] };
      const facultyIds = unique((links ?? []).map((row: any) => row.faculty_id));
      const { data: facultyRows } = facultyIds.length
        ? await supabase
            .from('faculty')
            .select('id, slug, display_name, title')
            .in('id', facultyIds)
            .eq('publication_status', 'published')
        : { data: [] as any[] };
      const facultyMap = new Map((facultyRows ?? []).map((row: any) => [row.id, row]));
      const sources = await getSourceMap(supabase, rows.map((row) => row.source_id));

      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        faculty: (links ?? [])
          .filter((link: any) => link.research_area_id === row.id)
          .map((link: any) => facultyMap.get(link.faculty_id))
          .filter(Boolean)
          .map((faculty: any) => ({
            id: faculty.id,
            slug: faculty.slug,
            displayName: faculty.display_name,
            title: faculty.title
          })),
        meta: metaFor(row.source_id, null, sources)
      }));
    },

    async listAcademicResources(): Promise<AcademicResourceSummary[]> {
      const { data } = await supabase
        .from('academic_resources')
        .select('id, slug, title, category, description, official_url, source_id, last_checked_at')
        .eq('publication_status', 'published')
        .order('category')
        .order('title');
      const rows = data ?? [];
      const sources = await getSourceMap(supabase, rows.map((row) => row.source_id));
      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        category: row.category,
        description: row.description,
        officialUrl: safeExternalUrl(row.official_url),
        lastCheckedAt: row.last_checked_at,
        meta: metaFor(row.source_id, row.last_checked_at, sources)
      }));
    },

    async listAcademicDates(): Promise<AcademicDateSummary[]> {
      const { data } = await supabase
        .from('academic_dates')
        .select('id, title, category, starts_on, ends_on, official_url, source_id')
        .eq('publication_status', 'published')
        .order('starts_on');
      const rows = data ?? [];
      const sources = await getSourceMap(supabase, rows.map((row) => row.source_id));
      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        startsOn: row.starts_on,
        endsOn: row.ends_on,
        officialUrl: safeExternalUrl(row.official_url),
        meta: metaFor(row.source_id, null, sources)
      }));
    },

    async listEvents(): Promise<AcademicEventSummary[]> {
      const { data } = await supabase
        .from('academic_events')
        .select('id, slug, title, description, starts_at, ends_at, space_id, organizer, official_url, source_id')
        .eq('publication_status', 'published')
        .order('starts_at');
      const rows = data ?? [];
      const sources = await getSourceMap(supabase, rows.map((row) => row.source_id));
      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        spaceId: row.space_id,
        organizer: row.organizer,
        officialUrl: safeExternalUrl(row.official_url),
        meta: metaFor(row.source_id, null, sources)
      }));
    }
  };
}
