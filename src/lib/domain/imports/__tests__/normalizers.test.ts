import { describe, expect, it } from 'vitest';
import { normalizeRoom, normalizeTime, normalizeWeekdays } from '../normalizers';

 describe('academic import normalizers', () => {
  it('resolves common room aliases to permanent space IDs', () => {
    expect(normalizeRoom('MB304')).toBe('mb304');
    expect(normalizeRoom('MB 304')).toBe('mb304');
    expect(normalizeRoom('304')).toBe('mb304');
  });

  it('fails closed for an unknown room and permits explicit TBA', () => {
    expect(normalizeRoom('MB 999')).toBeUndefined();
    expect(normalizeRoom('TBA')).toBeNull();
  });

  it('expands common weekday notation deterministically', () => {
    expect(normalizeWeekdays('MWF')).toEqual([1, 3, 5]);
    expect(normalizeWeekdays('TTh')).toEqual([2, 4]);
    expect(normalizeWeekdays('Mon, Wed, Fri')).toEqual([1, 3, 5]);
  });

  it('normalizes 12-hour and 24-hour clock input', () => {
    expect(normalizeTime('1:30 PM')).toBe('13:30');
    expect(normalizeTime('08:05')).toBe('08:05');
    expect(normalizeTime('25:00')).toBeNull();
  });
});
