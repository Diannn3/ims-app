import type { GradeCategory, GradebookResult } from './types';

function validAssessment(a: GradeCategory['assessments'][number]) {
  return a.earned !== null && a.possible !== null && Number.isFinite(a.earned) && Number.isFinite(a.possible) && a.possible > 0;
}

export function categoryPercent(category: GradeCategory): number | null {
  const graded = category.assessments.filter(validAssessment);
  if (graded.length === 0) return null;

  if (category.mode === 'equal-average') {
    return graded.reduce((sum, a) => sum + ((a.earned as number) / (a.possible as number)) * 100, 0) / graded.length;
  }

  const earned = graded.reduce((sum, a) => sum + (a.earned as number), 0);
  const possible = graded.reduce((sum, a) => sum + (a.possible as number), 0);
  return possible > 0 ? (earned / possible) * 100 : null;
}

export function calculateGradebook(categories: GradeCategory[]): GradebookResult {
  const categoryResults = categories.map((category) => {
    const percent = categoryPercent(category);
    return {
      id: category.id,
      name: category.name,
      weight: Number(category.weight) || 0,
      percent,
      weightedContribution: percent === null ? null : (percent / 100) * (Number(category.weight) || 0),
      gradedCount: category.assessments.filter(validAssessment).length,
      totalCount: category.assessments.length
    };
  });

  const enteredWeight = categoryResults.reduce((sum, c) => sum + c.weight, 0);
  const graded = categoryResults.filter((c) => c.percent !== null);
  const gradedWeight = graded.reduce((sum, c) => sum + c.weight, 0);
  const earnedWeightedPoints = graded.reduce((sum, c) => sum + (c.weightedContribution ?? 0), 0);
  const performanceOnGradedWork = gradedWeight > 0 ? (earnedWeightedPoints / gradedWeight) * 100 : null;

  return { categories: categoryResults, enteredWeight, gradedWeight, earnedWeightedPoints, performanceOnGradedWork };
}

export function requiredAverageForTarget(targetPercent: number, currentWeightedPoints: number, remainingWeight: number): number | null {
  if (!Number.isFinite(targetPercent) || !Number.isFinite(currentWeightedPoints) || !Number.isFinite(remainingWeight) || remainingWeight <= 0) return null;
  return ((targetPercent - currentWeightedPoints) / remainingWeight) * 100;
}
