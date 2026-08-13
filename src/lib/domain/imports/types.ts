export type ImportIssueSeverity = 'info' | 'warning' | 'error';

export type ImportIssue = {
  rowNumber: number;
  field: string | null;
  severity: ImportIssueSeverity;
  code: string;
  message: string;
  originalValue?: string | null;
  normalizedValue?: string | null;
  suggestedValue?: string | null;
};

export type CanonicalScheduleRowV1 = {
  schemaVersion: 1;
  rowNumber: number;
  courseCode: string;
  sectionCode: string;
  facultyName: string | null;
  facultyEmail: string | null;
  weekdays: number[];
  startsAt: string;
  endsAt: string;
  roomId: string | null;
  sourceRecordKey: string;
};

export type ResolvedScheduleRowV1 = CanonicalScheduleRowV1 & {
  courseId: string | null;
  facultyId: string | null;
};

export type ImportValidationContext = {
  coursesByCode: Map<string, { id: string; code: string }>;
  facultyByEmail: Map<string, { id: string; displayName: string }>;
  facultyByName: Map<string, Array<{ id: string; displayName: string }>>;
  roomIds: Set<string>;
};

export type StagedScheduleRow = {
  rowNumber: number;
  raw: Record<string, string>;
  canonical: CanonicalScheduleRowV1 | null;
  resolved: ResolvedScheduleRowV1 | null;
  issues: ImportIssue[];
  contentHash: string | null;
};
