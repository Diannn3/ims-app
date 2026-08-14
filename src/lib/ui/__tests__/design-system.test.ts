import { describe, expect, it } from 'vitest';
import {
  motionDurations,
  navigationItems,
  type IconName,
  type StatusTone,
  type ControlSize,
  type SearchResultKind,
  type SheetSnapPoint
} from '../design-system';

describe('IMS design-system contract', () => {
  it('keeps interaction timing inside the approved motion tiers', () => {
    expect(motionDurations).toEqual({ feedback: 120, state: 180, page: 240 });
  });

  it('exposes exactly five student navigation destinations', () => {
    expect(navigationItems.map((item) => item.href)).toEqual([
      '/',
      '/map',
      '/academics',
      '/people',
      '/tools/grades'
    ]);
  });

  it('keeps icons and status tones as constrained public interfaces', () => {
    const icon: IconName = 'map';
    const tone: StatusTone = 'success';
    expect([icon, tone]).toEqual(['map', 'success']);
  });

  it('constrains controls, search kinds, and map sheet positions', () => {
    const size: ControlSize = 'default';
    const kind: SearchResultKind = 'room';
    const snap: SheetSnapPoint = 'peek';
    expect([size, kind, snap]).toEqual(['default', 'room', 'peek']);
  });
});
