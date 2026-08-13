import type {
  AcademicRepositoryStatus,
  ConsultationSummary,
  CourseDetail,
  CourseSummary,
  FacultyDetail,
  FacultySummary,
  RoomSchedule,
  ServiceSummary,
  ResearchAreaSummary,
  AcademicResourceSummary,
  AcademicDateSummary,
  AcademicEventSummary
} from './types';

export interface AcademicRepository {
  status(): AcademicRepositoryStatus;
  listCourses(input?: { query?: string; termId?: string }): Promise<CourseSummary[]>;
  getCourseByCode(code: string): Promise<CourseDetail | null>;
  listFaculty(input?: { query?: string }): Promise<FacultySummary[]>;
  getFacultyBySlug(slug: string): Promise<FacultyDetail | null>;
  listConsultations(input?: { weekday?: number; facultyId?: string }): Promise<ConsultationSummary[]>;
  getRoomSchedule(spaceId: string): Promise<RoomSchedule>;
  listServices(): Promise<ServiceSummary[]>;
  listResearchAreas(): Promise<ResearchAreaSummary[]>;
  listAcademicResources(): Promise<AcademicResourceSummary[]>;
  listAcademicDates(): Promise<AcademicDateSummary[]>;
  listEvents(): Promise<AcademicEventSummary[]>;
}
