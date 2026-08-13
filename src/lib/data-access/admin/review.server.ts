import type { SupabaseClient } from '@supabase/supabase-js';

export type ScheduleReviewMeeting = {
  id: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  roomId: string | null;
  reviewStatus: string;
  publicationStatus: string;
};

export type ScheduleReviewFaculty = {
  id: string;
  displayName: string;
};

export type ScheduleReviewItem = {
  id: string;
  sectionCode: string;
  courseCode: string;
  courseTitle: string | null;
  termId: string;
  reviewStatus: string;
  publicationStatus: string;
  updatedAt: string;
  meetings: ScheduleReviewMeeting[];
  faculty: ScheduleReviewFaculty[];
  lastEvent: { action: string; note: string | null; createdAt: string } | null;
};

export async function listScheduleReviewItems(supabase: SupabaseClient): Promise<ScheduleReviewItem[]> {
  const { data: currentTerm } = await supabase
    .from('academic_terms')
    .select('id')
    .eq('is_current', true)
    .maybeSingle();

  if (!currentTerm?.id) return [];

  const { data: sections, error: sectionsError } = await supabase
    .from('sections')
    .select('id, section_code, course_id, term_id, review_status, publication_status, updated_at')
    .eq('term_id', currentTerm.id)
    .order('updated_at', { ascending: false });
  if (sectionsError) throw new Error(sectionsError.message);
  if (!sections?.length) return [];

  const sectionIds = sections.map((section: any) => section.id);
  const courseIds = [...new Set(sections.map((section: any) => section.course_id))];

  const [{ data: courses }, { data: meetings }, { data: assignments }, { data: events }] = await Promise.all([
    supabase.from('courses').select('id, code, title').in('id', courseIds),
    supabase
      .from('section_meetings')
      .select('id, section_id, weekday, starts_at, ends_at, space_id, review_status, publication_status')
      .in('section_id', sectionIds)
      .order('weekday')
      .order('starts_at'),
    supabase.from('faculty_section_assignments').select('section_id, faculty_id').in('section_id', sectionIds),
    supabase
      .from('schedule_review_events')
      .select('section_id, action, note, created_at')
      .in('section_id', sectionIds)
      .order('created_at', { ascending: false })
  ]);

  const facultyIds = [...new Set((assignments ?? []).map((assignment: any) => assignment.faculty_id))];
  const { data: faculty } = facultyIds.length
    ? await supabase.from('faculty').select('id, display_name').in('id', facultyIds)
    : { data: [] as any[] };

  const courseById = new Map((courses ?? []).map((row: any) => [row.id, row]));
  const facultyById = new Map((faculty ?? []).map((row: any) => [row.id, row]));
  const meetingsBySection = new Map<string, any[]>();
  const facultyBySection = new Map<string, ScheduleReviewFaculty[]>();
  const lastEventBySection = new Map<string, any>();

  for (const meeting of meetings ?? []) {
    const list = meetingsBySection.get(meeting.section_id) ?? [];
    list.push(meeting);
    meetingsBySection.set(meeting.section_id, list);
  }
  for (const assignment of assignments ?? []) {
    const person = facultyById.get(assignment.faculty_id);
    if (!person) continue;
    const list = facultyBySection.get(assignment.section_id) ?? [];
    if (!list.some((item) => item.id === person.id)) {
      list.push({ id: person.id, displayName: person.display_name });
    }
    facultyBySection.set(assignment.section_id, list);
  }
  for (const event of events ?? []) {
    if (!lastEventBySection.has(event.section_id)) lastEventBySection.set(event.section_id, event);
  }

  return sections.map((section: any) => {
    const course = courseById.get(section.course_id);
    const lastEvent = lastEventBySection.get(section.id);
    return {
      id: section.id,
      sectionCode: section.section_code,
      courseCode: course?.code ?? 'Unknown course',
      courseTitle: course?.title ?? null,
      termId: section.term_id,
      reviewStatus: section.review_status,
      publicationStatus: section.publication_status,
      updatedAt: section.updated_at,
      meetings: (meetingsBySection.get(section.id) ?? []).map((meeting: any) => ({
        id: meeting.id,
        weekday: meeting.weekday,
        startsAt: meeting.starts_at,
        endsAt: meeting.ends_at,
        roomId: meeting.space_id,
        reviewStatus: meeting.review_status,
        publicationStatus: meeting.publication_status
      })),
      faculty: facultyBySection.get(section.id) ?? [],
      lastEvent: lastEvent
        ? { action: lastEvent.action, note: lastEvent.note, createdAt: lastEvent.created_at }
        : null
    };
  });
}
