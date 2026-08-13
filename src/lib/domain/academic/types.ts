export type PublicationMeta = {
  sourceLabel: string | null;
  sourceUrl: string | null;
  lastVerifiedAt: string | null;
};

export type AcademicTermSummary = {
  id: string;
  academicYear: string;
  termName: string;
};

export type MeetingSummary = {
  id: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  spaceId: string | null;
  spaceName: string | null;
};

export type InstructorSummary = {
  id: string;
  slug: string;
  displayName: string;
  title: string | null;
};

export type SectionSummary = {
  id: string;
  sectionCode: string;
  instructors: InstructorSummary[];
  meetings: MeetingSummary[];
};

export type CourseSummary = {
  id: string;
  code: string;
  title: string | null;
  units: number | null;
  meta: PublicationMeta;
};

export type CourseDetail = CourseSummary & {
  description: string | null;
  currentTerm: AcademicTermSummary | null;
  sections: SectionSummary[];
  prerequisites: Array<{
    code: string;
    title: string | null;
    relationshipType: string;
  }>;
};

export type FacultySummary = {
  id: string;
  slug: string;
  displayName: string;
  title: string | null;
  officialEmail: string | null;
  officialProfileUrl: string | null;
  meta: PublicationMeta;
};

export type ConsultationSummary = {
  id: string;
  facultyId: string;
  facultySlug: string;
  facultyName: string;
  weekday: number | null;
  startsAt: string | null;
  endsAt: string | null;
  mode: 'in_person' | 'online' | 'hybrid' | 'by_appointment';
  spaceId: string | null;
  spaceName: string | null;
  appointmentUrl: string | null;
  notes: string | null;
  meta: PublicationMeta;
};

export type FacultyDetail = FacultySummary & {
  bio: string | null;
  publicationsUrl: string | null;
  officeSpaceId: string | null;
  officeSpaceName: string | null;
  consultations: ConsultationSummary[];
  currentSections: Array<{
    sectionId: string;
    sectionCode: string;
    courseCode: string;
    courseTitle: string | null;
  }>;
  researchAreas: Array<{ slug: string; name: string }>;
};

export type RoomSchedule = {
  spaceId: string;
  currentTerm: AcademicTermSummary | null;
  meetings: Array<{
    id: string;
    weekday: number;
    startsAt: string;
    endsAt: string;
    courseCode: string;
    courseTitle: string | null;
    sectionCode: string;
  }>;
};

export type ServiceSummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  spaceId: string | null;
  spaceName: string | null;
  officialUrl: string | null;
  meta: PublicationMeta;
};

export type AcademicRepositoryStatus = {
  configured: boolean;
  available: boolean;
  message?: string;
};


export type ResearchAreaSummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  faculty: Array<{ id: string; slug: string; displayName: string; title: string | null }>;
  meta: PublicationMeta;
};

export type AcademicResourceSummary = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string | null;
  officialUrl: string;
  lastCheckedAt: string | null;
  meta: PublicationMeta;
};

export type AcademicDateSummary = {
  id: string;
  title: string;
  category: string | null;
  startsOn: string;
  endsOn: string | null;
  officialUrl: string | null;
  meta: PublicationMeta;
};

export type AcademicEventSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  spaceId: string | null;
  spaceName: string | null;
  organizer: string | null;
  officialUrl: string | null;
  meta: PublicationMeta;
};
