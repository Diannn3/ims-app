import { describe, expect, it } from 'vitest';
import { normalizeSearchQuery } from '../formatters';

describe('normalizeSearchQuery', () => {
  it('normalizes unicode/whitespace and removes LIKE wildcard syntax', () => {
    expect(normalizeSearchQuery('  MB％  304_%\\  ')).toBe('MB 304');
  });

  it('removes control characters', () => {
    expect(normalizeSearchQuery('Math\u0000\u0007 Clinic')).toBe('Math Clinic');
  });

  it('caps public search input length', () => {
    expect(normalizeSearchQuery('x'.repeat(120))).toHaveLength(80);
  });
});
