import { describe, expect, it } from 'vitest';
import { isPhysicalChecklistComplete, rebaseConflicts, requiresAnchorChecks } from '../map-verification';

const complete = {
  signage_name: true,
  doorway_location: true,
  corridor_connection: true,
  nearby_context: true
};

describe('map verification trust gates', () => {
  it('requires all physical room checks before submission', () => {
    expect(isPhysicalChecklistComplete(complete, [{ entityType: 'space' }])).toBe(true);
    expect(isPhysicalChecklistComplete({ ...complete, nearby_context: false }, [{ entityType: 'space' }])).toBe(false);
  });

  it('requires anchor location and mounting checks for anchor changes', () => {
    expect(requiresAnchorChecks([{ entityType: 'anchor' }])).toBe(true);
    expect(isPhysicalChecklistComplete(complete, [{ entityType: 'anchor' }])).toBe(false);
    expect(isPhysicalChecklistComplete({ ...complete, anchor_exact_location: true, anchor_mounting: true }, [{ entityType: 'anchor' }])).toBe(true);
  });

  it('blocks a rebase when canonical before-value changed', () => {
    const changes = [{ entityType: 'space' as const, entityId: 'mb304', beforeValue: { x: 1 }, afterValue: { x: 2 } }];
    expect(rebaseConflicts(changes, { 'space:mb304': { x: 1 } })).toHaveLength(0);
    expect(rebaseConflicts(changes, { 'space:mb304': { x: 9 } })).toHaveLength(1);
  });
});
