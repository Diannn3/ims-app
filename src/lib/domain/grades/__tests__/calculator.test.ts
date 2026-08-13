import { describe, expect, it } from 'vitest';
import { calculateGradebook, categoryPercent, requiredAverageForTarget } from '../calculator';
import type { GradeCategory } from '../types';

const pointsCategory: GradeCategory = {
  id: 'le',
  name: 'Long Exams',
  weight: 50,
  mode: 'points',
  assessments: [
    { id: 'le1', name: 'LE 1', earned: 42, possible: 50 },
    { id: 'le2', name: 'LE 2', earned: 76, possible: 100 },
    { id: 'le3', name: 'LE 3', earned: null, possible: null }
  ]
};

describe('grade calculator', () => {
  it('excludes pending assessments instead of treating them as zero', () => {
    expect(categoryPercent(pointsCategory)).toBeCloseTo((118 / 150) * 100, 8);
  });

  it('supports equal-assessment averaging independently of point totals', () => {
    const category: GradeCategory = {
      ...pointsCategory,
      mode: 'equal-average',
      assessments: [
        { id: 'a', name: 'A', earned: 9, possible: 10 },
        { id: 'b', name: 'B', earned: 5, possible: 10 }
      ]
    };
    expect(categoryPercent(category)).toBeCloseTo(70, 8);
  });

  it('reports performance only across currently graded category weight', () => {
    const result = calculateGradebook([
      pointsCategory,
      { id: 'final', name: 'Final', weight: 50, mode: 'points', assessments: [] }
    ]);
    expect(result.gradedWeight).toBe(50);
    expect(result.performanceOnGradedWork).toBeCloseTo((118 / 150) * 100, 8);
  });

  it('solves the remaining average needed for a target', () => {
    expect(requiredAverageForTarget(80, 60, 25)).toBeCloseTo(80, 8);
  });

  it('returns null when there is no remaining weight', () => {
    expect(requiredAverageForTarget(80, 60, 0)).toBeNull();
  });
});
