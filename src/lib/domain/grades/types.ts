export type CategoryMode = 'points' | 'equal-average';

export interface Assessment {
  id: string;
  name: string;
  earned: number | null;
  possible: number | null;
}

export interface GradeCategory {
  id: string;
  name: string;
  weight: number;
  mode: CategoryMode;
  assessments: Assessment[];
}

export interface CategoryResult {
  id: string;
  name: string;
  weight: number;
  percent: number | null;
  weightedContribution: number | null;
  gradedCount: number;
  totalCount: number;
}

export interface GradebookResult {
  categories: CategoryResult[];
  enteredWeight: number;
  gradedWeight: number;
  earnedWeightedPoints: number;
  performanceOnGradedWork: number | null;
}

export interface GradingScaleRow {
  id: string;
  minimumPercent: number;
  label: string;
}

export interface GradebookDocument {
  version: 1;
  id: string;
  name: string;
  categories: GradeCategory[];
  gradingScale: GradingScaleRow[];
  updatedAt: string;
}
