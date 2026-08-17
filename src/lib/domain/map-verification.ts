export type VerificationScope = 'space' | 'graph' | 'hallway' | 'anchor' | 'mixed';
export type VerificationSessionStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'archived';
export type VerificationEntityType = 'space' | 'graph_node' | 'graph_edge' | 'hallway' | 'anchor';

export type PhysicalVerificationChecklist = {
  signage_name: boolean;
  doorway_location: boolean;
  corridor_connection: boolean;
  nearby_context: boolean;
  anchor_exact_location?: boolean;
  anchor_mounting?: boolean;
};

export type VerificationChange = {
  entityType: VerificationEntityType;
  entityId: string;
  beforeValue: unknown;
  afterValue: unknown;
};

export function requiresAnchorChecks(changes: Pick<VerificationChange, 'entityType'>[]) {
  return changes.some((change) => change.entityType === 'anchor');
}

export function isPhysicalChecklistComplete(
  checklist: Partial<PhysicalVerificationChecklist> | null | undefined,
  changes: Pick<VerificationChange, 'entityType'>[] = []
) {
  if (!checklist?.signage_name || !checklist.doorway_location || !checklist.corridor_connection || !checklist.nearby_context) {
    return false;
  }
  if (!requiresAnchorChecks(changes)) return true;
  return Boolean(checklist.anchor_exact_location && checklist.anchor_mounting);
}

export function rebaseConflicts(
  changes: VerificationChange[],
  currentEntities: Record<string, unknown>
) {
  return changes
    .map((change) => ({
      key: `${change.entityType}:${change.entityId}`,
      expected: change.beforeValue,
      current: currentEntities[`${change.entityType}:${change.entityId}`]
    }))
    .filter(({ expected, current }) => !deepEqual(expected, current));
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== 'object' || typeof right !== 'object' || left === null || right === null) return false;
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}
