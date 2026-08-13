import { describe, expect, it } from 'vitest';
import { scoreSearchCandidate } from '../rank';

describe('universal search ranking', () => {
  it('treats compact room aliases as exact matches', () => {
    expect(scoreSearchCandidate('MB304', { title: 'MB 304', aliases: ['304'] })).toBeGreaterThanOrEqual(96);
  });

  it('ranks canonical course codes at the top', () => {
    expect(scoreSearchCandidate('demo101', { title: 'DEMO 101 Demo Analysis', canonicalCode: 'DEMO 101' })).toBe(100);
  });

  it('supports predictable prefix matching without fuzzy guessing', () => {
    const prefix = scoreSearchCandidate('Prof Demo', { title: 'Prof. Demo Alpha' });
    const unrelated = scoreSearchCandidate('Prof Demo', { title: 'Math Clinic' });
    expect(prefix).toBeGreaterThan(unrelated);
  });

  it('does not return unrelated candidates', () => {
    expect(scoreSearchCandidate('clinic', { title: 'MB 304', keywords: ['classroom'] })).toBe(0);
  });
});
