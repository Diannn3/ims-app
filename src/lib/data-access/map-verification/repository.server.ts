import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PhysicalVerificationChecklist,
  VerificationEntityType,
  VerificationScope,
  VerificationSessionStatus
} from '$lib/domain/map-verification';

// This repository intentionally uses an untyped client boundary until the local
// Supabase schema has been replayed and database.types.ts is regenerated. No
// component or route reaches Supabase directly.
type MapClient = SupabaseClient<any>;

export type MapVerificationSession = {
  id: string;
  buildingId: string;
  baseRevision: string;
  title: string | null;
  scope: VerificationScope;
  status: VerificationSessionStatus;
  checklist: Partial<PhysicalVerificationChecklist>;
  createdBy: string;
  assignedTo: string | null;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MapVerificationChange = {
  id: string;
  sessionId: string;
  entityType: VerificationEntityType;
  entityId: string;
  changeKind: 'update' | 'insert' | 'delete';
  beforeValue: unknown;
  afterValue: unknown;
  createdBy: string;
  createdAt: string;
};

export type MapVerificationEvidence = {
  id: string;
  sessionId: string;
  kind: 'photo' | 'note' | 'qr' | 'reference';
  storagePath: string | null;
  caption: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
};

export type MapPublishSnapshot = {
  id: string;
  sessionId: string;
  canonicalRevision: string;
  payload: Record<string, unknown>;
  approvedBy: string;
  approvedAt: string;
  createdAt: string;
};

export type MapVerificationDetail = {
  session: MapVerificationSession;
  changes: MapVerificationChange[];
  evidence: MapVerificationEvidence[];
  snapshot: MapPublishSnapshot | null;
};

function session(row: any): MapVerificationSession {
  return {
    id: row.id,
    buildingId: row.building_id,
    baseRevision: row.base_revision,
    title: row.title ?? null,
    scope: row.scope,
    status: row.status,
    checklist: row.checklist ?? {},
    createdBy: row.created_by,
    assignedTo: row.assigned_to ?? null,
    submittedAt: row.submitted_at ?? null,
    reviewedBy: row.reviewed_by ?? null,
    reviewedAt: row.reviewed_at ?? null,
    rejectionReason: row.rejection_reason ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function change(row: any): MapVerificationChange {
  return {
    id: row.id,
    sessionId: row.session_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    changeKind: row.change_kind,
    beforeValue: row.before_value,
    afterValue: row.after_value,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

function evidence(row: any): MapVerificationEvidence {
  return {
    id: row.id,
    sessionId: row.session_id,
    kind: row.kind,
    storagePath: row.storage_path ?? null,
    caption: row.caption ?? null,
    metadata: row.metadata ?? {},
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

function snapshot(row: any): MapPublishSnapshot {
  return {
    id: row.id,
    sessionId: row.session_id,
    canonicalRevision: row.canonical_revision,
    payload: row.payload ?? {},
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at
  };
}

async function rpc<T>(client: MapClient, name: string, args: Record<string, unknown>) {
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export async function listMapVerificationSessions(client: MapClient) {
  const { data, error } = await client
    .from('map_verification_sessions')
    .select('id, building_id, base_revision, title, scope, status, checklist, created_by, assigned_to, submitted_at, reviewed_by, reviewed_at, rejection_reason, created_at, updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(session);
}

export async function getMapVerificationDetail(client: MapClient, id: string): Promise<MapVerificationDetail | null> {
  const { data: row, error: sessionError } = await client
    .from('map_verification_sessions')
    .select('id, building_id, base_revision, title, scope, status, checklist, created_by, assigned_to, submitted_at, reviewed_by, reviewed_at, rejection_reason, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();
  if (sessionError) throw new Error(sessionError.message);
  if (!row) return null;

  const [{ data: changes, error: changesError }, { data: evidenceRows, error: evidenceError }, { data: snapshots, error: snapshotError }] = await Promise.all([
    client.from('map_verification_changes').select('id, session_id, entity_type, entity_id, change_kind, before_value, after_value, created_by, created_at').eq('session_id', id).order('created_at'),
    client.from('map_verification_evidence').select('id, session_id, kind, storage_path, caption, metadata, created_by, created_at').eq('session_id', id).order('created_at', { ascending: false }),
    client.from('map_publish_snapshots').select('id, session_id, canonical_revision, payload, approved_by, approved_at, created_at').eq('session_id', id).maybeSingle()
  ]);
  if (changesError) throw new Error(changesError.message);
  if (evidenceError) throw new Error(evidenceError.message);
  if (snapshotError) throw new Error(snapshotError.message);
  return {
    session: session(row),
    changes: (changes ?? []).map(change),
    evidence: (evidenceRows ?? []).map(evidence),
    snapshot: snapshots ? snapshot(snapshots) : null
  };
}

export async function createMapVerificationSession(client: MapClient, input: { buildingId: string; baseRevision: string; scope: VerificationScope; title?: string }) {
  return rpc<string>(client, 'create_map_verification_session', {
    p_building_id: input.buildingId,
    p_base_revision: input.baseRevision,
    p_scope: input.scope,
    p_title: input.title ?? null
  });
}

export async function saveMapVerificationSession(client: MapClient, input: { id: string; scope: VerificationScope; title: string; checklist: Partial<PhysicalVerificationChecklist> }) {
  await rpc(client, 'save_map_verification_session', {
    p_session_id: input.id,
    p_scope: input.scope,
    p_title: input.title,
    p_checklist: input.checklist
  });
}

export async function upsertMapVerificationChange(client: MapClient, input: { sessionId: string; entityType: VerificationEntityType; entityId: string; changeKind?: 'update' | 'insert' | 'delete'; beforeValue: unknown; afterValue: unknown }) {
  return rpc<string>(client, 'upsert_map_verification_change', {
    p_session_id: input.sessionId,
    p_entity_type: input.entityType,
    p_entity_id: input.entityId,
    p_change_kind: input.changeKind ?? 'update',
    p_before_value: input.beforeValue,
    p_after_value: input.afterValue
  });
}

export async function addMapVerificationEvidence(client: MapClient, input: { sessionId: string; kind: 'photo' | 'note' | 'qr' | 'reference'; storagePath?: string; caption?: string; metadata?: Record<string, unknown> }) {
  return rpc<string>(client, 'add_map_verification_evidence', {
    p_session_id: input.sessionId,
    p_kind: input.kind,
    p_storage_path: input.storagePath ?? null,
    p_caption: input.caption ?? null,
    p_metadata: input.metadata ?? {}
  });
}

export async function submitMapVerificationSession(client: MapClient, id: string) {
  await rpc(client, 'submit_map_verification_session', { p_session_id: id });
}

export async function rejectMapVerificationSession(client: MapClient, id: string, reason: string) {
  await rpc(client, 'reject_map_verification_session', { p_session_id: id, p_reason: reason });
}

export async function approveMapVerificationSession(client: MapClient, input: { id: string; canonicalRevision: string; snapshot: Record<string, unknown> }) {
  return rpc<string>(client, 'approve_map_verification_session', {
    p_session_id: input.id,
    p_canonical_revision: input.canonicalRevision,
    p_snapshot: input.snapshot
  });
}

export async function rebaseMapVerificationSession(client: MapClient, input: { id: string; currentRevision: string; currentEntities: Record<string, unknown> }) {
  await rpc(client, 'rebase_map_verification_session', {
    p_session_id: input.id,
    p_current_revision: input.currentRevision,
    p_current_entities: input.currentEntities
  });
}
