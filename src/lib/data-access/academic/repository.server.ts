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
import { normalizeCourseCode, normalizeSearchQuery } from '$lib/domain/academic/formatters';

type SourceRow = {
  id: string;
  label: string;
  source_url: string | null;
};

type SpaceRow = {
  id: string;
  name: string;
};

function unavailableRepository(): AcademicRepository {
  const status = { configured: false, available: false, message: 'Academic data source is not configured.' } as const;
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

async function getSourceMap(
  supabase: SupabaseClient,
  ids: Array<string | null | undefined>,
  onError?: (context: string, error: unknown) => void
) {
  const clean = unique(ids.filter((id): id is string => Boolean(id)));
  if (!clean.length) return new Map<string, SourceRow>();

  const { data, error } = await supabase
    .from('public_data_sources')
    .select('id, label, source_url')
    .in('id', clean);

  if (error) {
    onError?.('source metadata', error);
    return new Map<string, SourceRow>();
  }

  return new Map<string, SourceRow>(
    ((data ?? []) as SourceRow[]).map((row) => [row.id, row])
  );
}

async function getSpaceMap(
  supabase: SupabaseClient,
  ids: Array<string | null | undefined>,
  onError?: (context: string, error: unknown) => void
) {
  const clean = unique(ids.filter((id): id is string => Boolean(id)));
  if (!clean.length) return new Map<string, SpaceRow>();

  const { data, error } = await supabase
    .from('public_spaces')
    .select('id, name')
    .in('id', clean);

  if (error) {
    onError?.('space labels', error);
    return new Map<string, SpaceRow>();
  }

  return new Map<string, SpaceRow>(((data ?? []) as SpaceRow[]).map((row) => [row.id, row]));
}

function metaFor(
  sourceId: string | null | undefined,
  lastVerifiedAt: string | null | undefined,
  sources: Map<string, SourceRow>
): PublicationMeta {
  const source = sourceId ? sources.get(sourceId) : null;
  return {
    sourceLabel: source?.label ?? null,
    sourceUrl: safeExternalUrl(source?.source_url),
    lastVerifiedAt: lastVerifiedAt ?? null
  };
}

async function getCurrentTerm(
  supabase: SupabaseClient,
  onError?: (context: string, error: unknown) => void
): Promise<AcademicTermSummary | null> {
  const { data, error } = await supabase
    .from('public_academic_terms')
    .select('id, academic_year, term_name')
    .eq('is_current', true)
    .maybeSingle();

  if (error) {
    onError?.('current academic term', error);
    return null;
  }
  if (!data) return null;
  return {
    id: data.id,
    academicYear: data.academic_year,
    termName: data.term_name
  };
}

function mergeRowsById<T extends { id: string }>(groups: Array<T[] | null | undefined>) {
  const byId = new Map<string, T>();
  for (const group of groups) {
    for (const row of group ?? []) byId.set(row.id, row);
  }
  return [...byId.values()];
}

export function createAcademicRepository(supabase: SupabaseClient | null): AcademicRepository {
  if (!supabase) return unavailableRepository();

  let lastReadError: string | null = null;

  function markReadError(context: string, error: unknown) {
    lastReadError = 'Published academic information could not be loaded right now. Please try again.';
    const detail = error && typeof error === 'object'
      ? {
          code: 'code' in error ? String((error as { code?: unknown }).code ?? '') : '',
          message: 'message' in error ? String((error as { message?: unknown }).message ?? '') : ''
        }
      : { code: '', message: String(error ?? '') };
    console.error(`[academic-repository:${context}]`, detail);
  }

  async function readQuery<T = any>(context: string, query: PromiseLike<any>): Promise<T | null> {
    const result = await query;
    if (result?.error) {
      markReadError(context, result.error);
      return null;
    }
    return (result?.data ?? null) as T | null;
  }

  return {
    status() {
      return lastReadError
        ? { configured: true, available: false, message: lastReadError }
        : { configured: true, available: true };
    },

    async listCourses(input = {}): Promise<CourseSummary[]> {
      const columns = 'id, code, normalized_code, title, units, source_id, last_verified_at';
      const text = input.query ? normalizeSearchQuery(input.query) : '';

      let rows: any[] = [];
      if (!text) {
        rows = (await readQuery<any[]>(
          'list courses',
          supabase.from('public_courses').select(columns).order('normalized_code').limit(80)
        )) ?? [];
      } else {
        const normalized = normalizeCourseCode(text);
        const pattern = `%${text}%`;
        const normalizedPattern = `%${normalized}%`;
        const [codeRows, normalizedRows, titleRows] = await Promise.all([
          readQuery<any[]>(
            'search courses by code',
            supabase.from('public_courses').select(columns).ilike('code', pattern).limit(40)
          ),
          readQuery<any[]>(
            'search courses by normalized code',
            supabase.from('public_courses').select(columns).ilike('normalized_code', normalizedPattern).limit(40)
          ),
          readQuery<any[]>(
            'search courses by title',
            supabase.from('public_courses').select(columns).ilike('title', pattern).limit(40)
          )
        ]);
        rows = mergeRowsById<any>([codeRows, normalizedRows, titleRows])
          .sort((a, b) => String(a.normalized_code).localeCompare(String(b.normalized_code)))
          .slice(0, 80);
      }

      const sources = await getSourceMap(supabase, rows.map((row) => row.source_id), markReadError);

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
      const course = await readQuery<any>(
        'course detail',
        supabase
          .from('public_courses')
          .select('id, code, title, description, units, source_id, last_verified_at')
          .eq('normalized_code', normalizedCode)
          .maybeSingle()
      );

      if (!course) return null;

      const currentTerm = await getCurrentTerm(supabase, markReadError);
      const sectionRows = currentTerm
        ? await readQuery<any[]>(
            'course sections',
            supabase
              .from('public_sections')
              .select('id, section_code, source_id')
              .eq('course_id', course.id)
              .eq('term_id', currentTerm.id)
              .order('section_code')
          )
        : [];

      const sections = sectionRows ?? [];
      const sectionIds = sections.map((section) => section.id);

      const meetingRows = sectionIds.length
        ? await readQuery<any[]>(
            'course section meetings',
            supabase
              .from('public_section_meetings')
              .select('id, section_id, weekday, starts_at, ends_at, space_id')
              .in('section_id', sectionIds)
              .order('weekday')
              .order('starts_at')
          )
        : [];

      const assignmentRows = sectionIds.length
        ? await readQuery<any[]>(
            'course faculty assignments',
            supabase
              .from('public_faculty_section_assignments')
              .select('section_id, faculty_id')
              .in('section_id', sectionIds)
          )
        : [];

      const facultyIds = unique((assignmentRows ?? []).map((row) => row.faculty_id));
      const facultyRows = facultyIds.length
        ? await readQuery<any[]>(
            'course faculty profiles',
            supabase
              .from('public_faculty')
              .select('id, slug, display_name, title')
              .in('id', facultyIds)
          )
        : [];

      const facultyMap = new Map((facultyRows ?? []).map((row) => [row.id, row]));
      const meetingSpaceMap = await getSpaceMap(
        supabase,
        (meetingRows ?? []).map((row) => row.space_id),
        markReadError
      );

      const prerequisiteLinks = await readQuery<any[]>(
        'course prerequisites',
        supabase
          .from('public_course_prerequisites')
          .select('prerequisite_course_id, relationship_type')
          .eq('course_id', course.id)
      );
      const prerequisiteIds = unique((prerequisiteLinks ?? []).map((row) => row.prerequisite_course_id));
      const prerequisiteCourses = prerequisiteIds.length
        ? await readQuery<any[]>(
            'prerequisite course details',
            supabase
              .from('public_courses')
              .select('id, code, title')
              .in('id', prerequisiteIds)
          )
        : [];
      const prerequisiteMap = new Map((prerequisiteCourses ?? []).map((row: any) => [row.id, row]));

      const sourceIds = [course.source_id, ...sections.map((row) => row.source_id)];
      const sources = await getSourceMap(supabase, sourceIds, markReadError);

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
              spaceId: meeting.space_id,
              spaceName: meeting.space_id ? meetingSpaceMap.get(meeting.space_id)?.name ?? null : null
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
      const columns = 'id, slug, display_name, title, official_email, official_profile_url, source_id, last_verified_at';
      const text = input.query ? normalizeSearchQuery(input.query) : '';

      let rows: any[] = [];
      if (!text) {
        rows = (await readQuery<any[]>(
          'list faculty',
          supabase.from('public_faculty').select(columns).order('display_name').limit(100)
        )) ?? [];
      } else {
        const pattern = `%${text}%`;
        const [nameRows, titleRows] = await Promise.all([
          readQuery<any[]>(
            'search faculty by name',
            supabase.from('public_faculty').select(columns).ilike('display_name', pattern).limit(60)
          ),
          readQuery<any[]>(
            'search faculty by title',
            supabase.from('public_faculty').select(columns).ilike('title', pattern).limit(60)
          )
        ]);
        rows = mergeRowsById<any>([nameRows, titleRows])
          .sort((a, b) => String(a.display_name).localeCompare(String(b.display_name)))
          .slice(0, 100);
      }

      const sources = await getSourceMap(supabase, rows.map((row) => row.source_id), markReadError);

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
      const faculty = await readQuery<any>(
        'faculty detail',
        supabase
          .from('public_faculty')
          .select(
            'id, slug, display_name, title, official_email, bio, official_profile_url, publications_url, source_id, last_verified_at'
          )
          .eq('slug', slug)
          .maybeSingle()
      );

      if (!faculty) return null;

      const currentTerm = await getCurrentTerm(supabase, markReadError);
      const [officeRows, consultations, assignments, areaLinks] = await Promise.all([
        readQuery<any[]>(
          'faculty office',
          supabase
            .from('public_faculty_offices')
            .select('space_id, term_id')
            .eq('faculty_id', faculty.id)
            .eq('is_primary', true)
            .limit(2)
        ),
        currentTerm
          ? readQuery<any[]>(
              'faculty consultations',
              supabase
                .from('public_consultation_hours')
                .select(
                  'id, faculty_id, weekday, starts_at, ends_at, mode, space_id, appointment_url, notes, source_id, last_verified_at'
                )
                .eq('faculty_id', faculty.id)
                .eq('term_id', currentTerm.id)
                .order('weekday')
                .order('starts_at')
            )
          : Promise.resolve([]),
        currentTerm
          ? readQuery<any[]>(
              'faculty teaching assignments',
              supabase
                .from('public_faculty_section_assignments')
                .select('section_id')
                .eq('faculty_id', faculty.id)
            )
          : Promise.resolve([]),
        readQuery<any[]>(
          'faculty research links',
          supabase
            .from('public_faculty_research_areas')
            .select('research_area_id')
            .eq('faculty_id', faculty.id)
        )
      ]);

      const sectionIds = unique((assignments ?? []).map((row: any) => row.section_id));
      const sectionRows = sectionIds.length && currentTerm
        ? await readQuery<any[]>(
            'faculty current sections',
            supabase
              .from('public_sections')
              .select('id, section_code, course_id')
              .in('id', sectionIds)
              .eq('term_id', currentTerm.id)
          )
        : [];

      const courseIds = unique((sectionRows ?? []).map((row: any) => row.course_id));
      const courseRows = courseIds.length
        ? await readQuery<any[]>(
            'faculty course details',
            supabase
              .from('public_courses')
              .select('id, code, title')
              .in('id', courseIds)
          )
        : [];

      const courseMap = new Map((courseRows ?? []).map((row: any) => [row.id, row]));

      const areaIds = unique((areaLinks ?? []).map((row: any) => row.research_area_id));
      const areaRows = areaIds.length
        ? await readQuery<any[]>(
            'faculty research areas',
            supabase
              .from('public_research_areas')
              .select('id, slug, name')
              .in('id', areaIds)
          )
        : [];

      const primaryOffice = currentTerm
        ? (officeRows ?? []).find((row: any) => row.term_id === currentTerm.id)
          ?? (officeRows ?? []).find((row: any) => row.term_id === null)
          ?? null
        : (officeRows ?? []).find((row: any) => row.term_id === null) ?? null;

      const sources = await getSourceMap(
        supabase,
        [faculty.source_id, ...(consultations ?? []).map((row: any) => row.source_id)],
        markReadError
      );
      const facultySpaceMap = await getSpaceMap(
        supabase,
        [primaryOffice?.space_id, ...(consultations ?? []).map((row: any) => row.space_id)],
        markReadError
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
        spaceName: row.space_id ? facultySpaceMap.get(row.space_id)?.name ?? null : null,
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
        officeSpaceId: primaryOffice?.space_id ?? null,
        officeSpaceName: primaryOffice?.space_id ? facultySpaceMap.get(primaryOffice.space_id)?.name ?? null : null,
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
      const currentTerm = await getCurrentTerm(supabase, markReadError);
      if (!currentTerm) return [];

      let query = supabase
        .from('public_consultation_hours')
        .select(
          'id, faculty_id, weekday, starts_at, ends_at, mode, space_id, appointment_url, notes, source_id, last_verified_at'
        )
        .eq('term_id', currentTerm.id)
        .order('weekday')
        .order('starts_at');

      if (input.weekday) query = query.eq('weekday', input.weekday);
      if (input.facultyId) query = query.eq('faculty_id', input.facultyId);

      const data = await readQuery<any[]>('list consultations', query.limit(100));
      const rows = data ?? [];
      const facultyIds = unique(rows.map((row) => row.faculty_id));
      const facultyRows = facultyIds.length
        ? await readQuery<any[]>(
            'consultation faculty profiles',
            supabase
              .from('public_faculty')
              .select('id, slug, display_name')
              .in('id', facultyIds)
          )
        : [];

      const facultyMap = new Map((facultyRows ?? []).map((row: any) => [row.id, row]));
      const sources = await getSourceMap(supabase, rows.map((row) => row.source_id), markReadError);
      const consultationSpaceMap = await getSpaceMap(
        supabase,
        rows.map((row) => row.space_id),
        markReadError
      );

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
            spaceName: row.space_id ? consultationSpaceMap.get(row.space_id)?.name ?? null : null,
            appointmentUrl: safeExternalUrl(row.appointment_url),
            notes: row.notes,
            meta: metaFor(row.source_id, row.last_verified_at, sources)
          } satisfies ConsultationSummary;
        })
        .filter((value): value is ConsultationSummary => Boolean(value));
    },

    async getRoomSchedule(spaceId: string): Promise<RoomSchedule> {
      const currentTerm = await getCurrentTerm(supabase, markReadError);
      if (!currentTerm) return { spaceId, currentTerm: null, meetings: [] };

      const sectionRows = await readQuery<any[]>(
        'room schedule sections',
        supabase
          .from('public_sections')
          .select('id, section_code, course_id')
          .eq('term_id', currentTerm.id)
      );

      const sections = sectionRows ?? [];
      const sectionIds = sections.map((row) => row.id);
      if (!sectionIds.length) return { spaceId, currentTerm, meetings: [] };

      const meetingRows = await readQuery<any[]>(
        'room schedule meetings',
        supabase
          .from('public_section_meetings')
          .select('id, section_id, weekday, starts_at, ends_at')
          .in('section_id', sectionIds)
          .eq('space_id', spaceId)
          .order('weekday')
          .order('starts_at')
      );

      const courseIds = unique(sections.map((row) => row.course_id));
      const courseRows = courseIds.length
        ? await readQuery<any[]>(
            'room schedule course details',
            supabase
              .from('public_courses')
              .select('id, code, title')
              .in('id', courseIds)
          )
        : [];

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
      const data = await readQuery<any[]>(
        'academic services',
        supabase
          .from('public_academic_services')
          .select(
            'id, slug, name, description, space_id, official_url, source_id, last_verified_at'
          )
          .order('name')
      );

      const rows = data ?? [];
      const sources = await getSourceMap(supabase, rows.map((row) => row.source_id), markReadError);
      const serviceSpaceMap = await getSpaceMap(supabase, rows.map((row) => row.space_id), markReadError);

      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        spaceId: row.space_id,
        spaceName: row.space_id ? serviceSpaceMap.get(row.space_id)?.name ?? null : null,
        officialUrl: safeExternalUrl(row.official_url),
        meta: metaFor(row.source_id, row.last_verified_at, sources)
      }));
    },

    async listResearchAreas(): Promise<ResearchAreaSummary[]> {
      const areas = await readQuery<any[]>(
        'research areas',
        supabase
          .from('public_research_areas')
          .select('id, slug, name, description, source_id')
          .order('name')
      );

      const rows = areas ?? [];
      const areaIds = rows.map((row) => row.id);
      const links = areaIds.length
        ? await readQuery<any[]>(
            'research faculty links',
            supabase
              .from('public_faculty_research_areas')
              .select('research_area_id, faculty_id')
              .in('research_area_id', areaIds)
          )
        : [];
      const facultyIds = unique((links ?? []).map((row: any) => row.faculty_id));
      const facultyRows = facultyIds.length
        ? await readQuery<any[]>(
            'course faculty profiles',
            supabase
              .from('public_faculty')
              .select('id, slug, display_name, title')
              .in('id', facultyIds)
          )
        : [];
      const facultyMap = new Map((facultyRows ?? []).map((row: any) => [row.id, row]));
      const sources = await getSourceMap(supabase, rows.map((row) => row.source_id), markReadError);

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
      const data = await readQuery<any[]>(
        'academic resources',
        supabase
          .from('public_academic_resources')
          .select('id, slug, title, category, description, official_url, source_id, last_checked_at')
          .order('category')
          .order('title')
      );
      const rows = data ?? [];
      const sources = await getSourceMap(supabase, rows.map((row) => row.source_id), markReadError);
      return rows
        .map((row) => {
          const officialUrl = safeExternalUrl(row.official_url);
          if (!officialUrl) return null;
          return {
            id: row.id,
            slug: row.slug,
            title: row.title,
            category: row.category,
            description: row.description,
            officialUrl,
            lastCheckedAt: row.last_checked_at,
            meta: metaFor(row.source_id, row.last_checked_at, sources)
          } satisfies AcademicResourceSummary;
        })
        .filter((value): value is AcademicResourceSummary => Boolean(value));
    },

    async listAcademicDates(): Promise<AcademicDateSummary[]> {
      const data = await readQuery<any[]>(
        'academic dates',
        supabase
          .from('public_academic_dates')
          .select('id, title, category, starts_on, ends_on, official_url, source_id')
          .order('starts_on')
      );
      const rows = data ?? [];
      const sources = await getSourceMap(supabase, rows.map((row) => row.source_id), markReadError);
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
      const data = await readQuery<any[]>(
        'academic events',
        supabase
          .from('public_academic_events')
          .select('id, slug, title, description, starts_at, ends_at, space_id, organizer, official_url, source_id')
          .order('starts_at')
      );
      const rows = data ?? [];
      const sources = await getSourceMap(supabase, rows.map((row) => row.source_id), markReadError);
      const eventSpaceMap = await getSpaceMap(supabase, rows.map((row) => row.space_id), markReadError);
      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        spaceId: row.space_id,
        spaceName: row.space_id ? eventSpaceMap.get(row.space_id)?.name ?? null : null,
        organizer: row.organizer,
        officialUrl: safeExternalUrl(row.official_url),
        meta: metaFor(row.source_id, null, sources)
      }));
    }
  };
}
