import assert from 'node:assert/strict';

const grades = await import('../src/lib/domain/grades/calculator.ts');

const gradeResult = grades.calculateGradebook([
  {
    id: 'exams',
    name: 'Long Exams',
    weight: 60,
    mode: 'points',
    assessments: [
      { id: 'le1', name: 'LE 1', earned: 42, possible: 50 },
      { id: 'le2', name: 'LE 2', earned: 38, possible: 50 }
    ]
  },
  {
    id: 'quizzes',
    name: 'Quizzes',
    weight: 40,
    mode: 'equal-average',
    assessments: [
      { id: 'q1', name: 'Quiz 1', earned: 9, possible: 10 },
      { id: 'q2', name: 'Quiz 2', earned: null, possible: 10 }
    ]
  }
]);

// Pending work is excluded: exams = 80%, graded quiz = 90%, weighted result = 84%.
assert.equal(Math.round((gradeResult.performanceOnGradedWork ?? 0) * 100) / 100, 84);
assert.equal(Math.round(gradeResult.earnedWeightedPoints * 100) / 100, 84);
assert.equal(grades.requiredAverageForTarget(90, 72, 20), 90);

console.log('Dependency-light grade smoke passed:');
console.log(` - performance on graded work: ${gradeResult.performanceOnGradedWork?.toFixed(2)}%`);
console.log(' - pending assessments remained excluded');
console.log(' - target-grade solver returned the expected remaining average');
