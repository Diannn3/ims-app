-- Map Verification Studio
--
-- Canonical building geometry remains Git-owned (building.json, spaces.json,
-- graph.json, and floor-visuals.ts). These tables hold only review workflow,
-- deltas, evidence metadata, and immutable approval snapshots.

create table public.map_verification_sessions (
  id uuid primary key default gen_random_uuid(),
  building_id text not null references public.buildings(id) on delete restrict,
  base_revision text not null check (length(trim(base_revision)) > 0),
  title text,
  scope text not null default 'mixed' check (scope in ('space', 'graph', 'hallway', 'anchor', 'mixed')),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'archived')),
  checklist jsonb not null default '{}'::jsonb check (jsonb_typeof(checklist) = 'object'),
  created_by uuid not null references auth.users(id) on delete restrict,
  assigned_to uuid references auth.users(id) on delete set null,
  submitted_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index map_verification_sessions_status_idx
  on public.map_verification_sessions (status, updated_at desc);
create index map_verification_sessions_owner_idx
  on public.map_verification_sessions (created_by, updated_at desc);

create table public.map_verification_changes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.map_verification_sessions(id) on delete cascade,
  entity_type text not null check (entity_type in ('space', 'graph_node', 'graph_edge', 'hallway', 'anchor')),
  entity_id text not null check (length(trim(entity_id)) > 0),
  change_kind text not null default 'update' check (change_kind in ('update', 'insert', 'delete')),
  before_value jsonb not null,
  after_value jsonb not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (session_id, entity_type, entity_id)
);

create index map_verification_changes_session_idx
  on public.map_verification_changes (session_id, entity_type, entity_id);

create table public.map_verification_evidence (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.map_verification_sessions(id) on delete cascade,
  kind text not null check (kind in ('photo', 'note', 'qr', 'reference')),
  storage_path text,
  caption text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index map_verification_evidence_session_idx
  on public.map_verification_evidence (session_id, created_at desc);

create table public.map_publish_snapshots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.map_verification_sessions(id) on delete restrict,
  canonical_revision text not null check (length(trim(canonical_revision)) > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  approved_by uuid not null references auth.users(id) on delete restrict,
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (session_id)
);

alter table public.map_verification_sessions enable row level security;
alter table public.map_verification_changes enable row level security;
alter table public.map_verification_evidence enable row level security;
alter table public.map_publish_snapshots enable row level security;

-- Only map staff can read drafts. Writes are intentionally RPC-only so that
-- state transitions, ownership, and physical-verification gates cannot be
-- bypassed through the Data API.
create policy "map staff read verification sessions"
  on public.map_verification_sessions for select to authenticated
  using (
    (select private.has_any_role(array['map_editor','admin']::public.app_role[]))
    and (
      (select private.has_any_role(array['admin']::public.app_role[]))
      or created_by = (select auth.uid())
      or assigned_to = (select auth.uid())
    )
  );

create policy "map staff read verification changes"
  on public.map_verification_changes for select to authenticated
  using (
    exists (
      select 1
      from public.map_verification_sessions s
      where s.id = session_id
        and (select private.has_any_role(array['map_editor','admin']::public.app_role[]))
        and (
          (select private.has_any_role(array['admin']::public.app_role[]))
          or s.created_by = (select auth.uid())
          or s.assigned_to = (select auth.uid())
        )
    )
  );

create policy "map staff read verification evidence"
  on public.map_verification_evidence for select to authenticated
  using (
    exists (
      select 1
      from public.map_verification_sessions s
      where s.id = session_id
        and (select private.has_any_role(array['map_editor','admin']::public.app_role[]))
        and (
          (select private.has_any_role(array['admin']::public.app_role[]))
          or s.created_by = (select auth.uid())
          or s.assigned_to = (select auth.uid())
        )
    )
  );

create policy "map staff read publish snapshots"
  on public.map_publish_snapshots for select to authenticated
  using (
    exists (
      select 1
      from public.map_verification_sessions s
      where s.id = session_id
        and (select private.has_any_role(array['map_editor','admin']::public.app_role[]))
        and (
          (select private.has_any_role(array['admin']::public.app_role[]))
          or s.created_by = (select auth.uid())
          or s.assigned_to = (select auth.uid())
        )
    )
  );

revoke all on table public.map_verification_sessions from anon, authenticated;
revoke all on table public.map_verification_changes from anon, authenticated;
revoke all on table public.map_verification_evidence from anon, authenticated;
revoke all on table public.map_publish_snapshots from anon, authenticated;
grant select on table public.map_verification_sessions to authenticated;
grant select on table public.map_verification_changes to authenticated;
grant select on table public.map_verification_evidence to authenticated;
grant select on table public.map_publish_snapshots to authenticated;

create or replace function private.map_verification_checklist_complete(
  p_checklist jsonb,
  p_requires_anchor boolean
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((p_checklist ->> 'signage_name')::boolean, false)
    and coalesce((p_checklist ->> 'doorway_location')::boolean, false)
    and coalesce((p_checklist ->> 'corridor_connection')::boolean, false)
    and coalesce((p_checklist ->> 'nearby_context')::boolean, false)
    and (
      not p_requires_anchor
      or (
        coalesce((p_checklist ->> 'anchor_exact_location')::boolean, false)
        and coalesce((p_checklist ->> 'anchor_mounting')::boolean, false)
      )
    );
$$;
revoke execute on function private.map_verification_checklist_complete(jsonb, boolean) from public, anon, authenticated;

create or replace function private.guard_map_publish_snapshot_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'map publish snapshots are immutable' using errcode = '55000';
end;
$$;

create trigger map_publish_snapshots_immutable
  before update or delete on public.map_publish_snapshots
  for each row execute function private.guard_map_publish_snapshot_immutable();

create or replace function public.create_map_verification_session(
  p_building_id text,
  p_base_revision text,
  p_scope text default 'mixed',
  p_title text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not private.has_any_role(array['map_editor','admin']::public.app_role[]) then
    raise exception 'map verification role required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.buildings where id = p_building_id) then
    raise exception 'building does not exist' using errcode = '23503';
  end if;
  if p_scope not in ('space','graph','hallway','anchor','mixed') then
    raise exception 'invalid verification scope' using errcode = '22023';
  end if;
  insert into public.map_verification_sessions (building_id, base_revision, scope, title, created_by)
  values (p_building_id, trim(p_base_revision), p_scope, nullif(trim(p_title), ''), (select auth.uid()))
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.create_map_verification_session(text, text, text, text) from public, anon;
grant execute on function public.create_map_verification_session(text, text, text, text) to authenticated;

create or replace function public.save_map_verification_session(
  p_session_id uuid,
  p_scope text,
  p_title text,
  p_checklist jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_any_role(array['map_editor','admin']::public.app_role[]) then
    raise exception 'map verification role required' using errcode = '42501';
  end if;
  if p_scope not in ('space','graph','hallway','anchor','mixed') then
    raise exception 'invalid verification scope' using errcode = '22023';
  end if;
  update public.map_verification_sessions
  set scope = p_scope,
      title = nullif(trim(p_title), ''),
      checklist = coalesce(p_checklist, '{}'::jsonb),
      status = case when status = 'rejected' then 'draft' else status end,
      rejection_reason = case when status = 'rejected' then null else rejection_reason end,
      updated_at = now()
  where id = p_session_id
    and status in ('draft','rejected')
    and (
      (select private.has_any_role(array['admin']::public.app_role[]))
      or created_by = (select auth.uid())
      or assigned_to = (select auth.uid())
    );
  if not found then raise exception 'draft is not editable' using errcode = '42501'; end if;
end;
$$;
revoke execute on function public.save_map_verification_session(uuid, text, text, jsonb) from public, anon;
grant execute on function public.save_map_verification_session(uuid, text, text, jsonb) to authenticated;

create or replace function public.upsert_map_verification_change(
  p_session_id uuid,
  p_entity_type text,
  p_entity_id text,
  p_change_kind text,
  p_before_value jsonb,
  p_after_value jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not private.has_any_role(array['map_editor','admin']::public.app_role[]) then
    raise exception 'map verification role required' using errcode = '42501';
  end if;
  if p_entity_type not in ('space','graph_node','graph_edge','hallway','anchor')
    or p_change_kind not in ('update','insert','delete') then
    raise exception 'invalid map change' using errcode = '22023';
  end if;
  insert into public.map_verification_changes (
    session_id, entity_type, entity_id, change_kind, before_value, after_value, created_by
  )
  select p_session_id, p_entity_type, trim(p_entity_id), p_change_kind,
         coalesce(p_before_value, '{}'::jsonb), coalesce(p_after_value, '{}'::jsonb), (select auth.uid())
  where exists (
    select 1 from public.map_verification_sessions s
    where s.id = p_session_id
      and s.status in ('draft','rejected')
      and ((select private.has_any_role(array['admin']::public.app_role[]))
        or s.created_by = (select auth.uid()) or s.assigned_to = (select auth.uid()))
  )
  on conflict (session_id, entity_type, entity_id) do update
    set change_kind = excluded.change_kind,
        before_value = excluded.before_value,
        after_value = excluded.after_value,
        created_by = excluded.created_by,
        created_at = now()
  returning id into v_id;
  if v_id is null then raise exception 'draft is not editable' using errcode = '42501'; end if;
  update public.map_verification_sessions set updated_at = now() where id = p_session_id;
  return v_id;
end;
$$;
revoke execute on function public.upsert_map_verification_change(uuid, text, text, text, jsonb, jsonb) from public, anon;
grant execute on function public.upsert_map_verification_change(uuid, text, text, text, jsonb, jsonb) to authenticated;

create or replace function public.add_map_verification_evidence(
  p_session_id uuid,
  p_kind text,
  p_storage_path text default null,
  p_caption text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not private.has_any_role(array['map_editor','admin']::public.app_role[]) then
    raise exception 'map verification role required' using errcode = '42501';
  end if;
  if p_kind not in ('photo','note','qr','reference') then
    raise exception 'invalid evidence kind' using errcode = '22023';
  end if;
  insert into public.map_verification_evidence (session_id, kind, storage_path, caption, metadata, created_by)
  select p_session_id, p_kind, nullif(trim(p_storage_path), ''), nullif(trim(p_caption), ''),
         coalesce(p_metadata, '{}'::jsonb), (select auth.uid())
  where exists (
    select 1 from public.map_verification_sessions s
    where s.id = p_session_id and s.status in ('draft','rejected')
      and ((select private.has_any_role(array['admin']::public.app_role[]))
        or s.created_by = (select auth.uid()) or s.assigned_to = (select auth.uid()))
  )
  returning id into v_id;
  if v_id is null then raise exception 'draft is not editable' using errcode = '42501'; end if;
  update public.map_verification_sessions set updated_at = now() where id = p_session_id;
  return v_id;
end;
$$;
revoke execute on function public.add_map_verification_evidence(uuid, text, text, text, jsonb) from public, anon;
grant execute on function public.add_map_verification_evidence(uuid, text, text, text, jsonb) to authenticated;

create or replace function public.submit_map_verification_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.map_verification_sessions%rowtype;
  v_requires_anchor boolean;
begin
  if not private.has_any_role(array['map_editor','admin']::public.app_role[]) then
    raise exception 'map verification role required' using errcode = '42501';
  end if;
  select * into v_session from public.map_verification_sessions where id = p_session_id for update;
  if not found or v_session.status not in ('draft','rejected')
    or not ((select private.has_any_role(array['admin']::public.app_role[]))
      or v_session.created_by = (select auth.uid()) or v_session.assigned_to = (select auth.uid())) then
    raise exception 'draft is not submit-ready' using errcode = '42501';
  end if;
  select exists (
    select 1 from public.map_verification_changes c
    where c.session_id = p_session_id and c.entity_type = 'anchor'
  ) into v_requires_anchor;
  if not private.map_verification_checklist_complete(v_session.checklist, v_requires_anchor) then
    raise exception 'physical verification checklist is incomplete' using errcode = '23514';
  end if;
  if not exists (select 1 from public.map_verification_changes where session_id = p_session_id) then
    raise exception 'verification session has no changes' using errcode = '23514';
  end if;
  update public.map_verification_sessions
  set status = 'submitted', submitted_at = now(), updated_at = now(), rejection_reason = null
  where id = p_session_id;
end;
$$;
revoke execute on function public.submit_map_verification_session(uuid) from public, anon;
grant execute on function public.submit_map_verification_session(uuid) to authenticated;

create or replace function public.reject_map_verification_session(p_session_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_any_role(array['admin']::public.app_role[]) then
    raise exception 'admin role required' using errcode = '42501';
  end if;
  update public.map_verification_sessions
  set status = 'rejected', rejection_reason = nullif(trim(p_reason), ''), reviewed_by = (select auth.uid()), reviewed_at = now(), updated_at = now()
  where id = p_session_id and status in ('submitted','in_review');
  if not found then raise exception 'session is not reviewable' using errcode = '42501'; end if;
end;
$$;
revoke execute on function public.reject_map_verification_session(uuid, text) from public, anon;
grant execute on function public.reject_map_verification_session(uuid, text) to authenticated;

create or replace function public.approve_map_verification_session(
  p_session_id uuid,
  p_canonical_revision text,
  p_snapshot jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.map_verification_sessions%rowtype;
  v_requires_anchor boolean;
  v_snapshot_id uuid;
begin
  if not private.has_any_role(array['admin']::public.app_role[]) then
    raise exception 'admin role required' using errcode = '42501';
  end if;
  select * into v_session from public.map_verification_sessions where id = p_session_id for update;
  if not found or v_session.status not in ('submitted','in_review') then
    raise exception 'session is not reviewable' using errcode = '42501';
  end if;
  select exists (
    select 1 from public.map_verification_changes c
    where c.session_id = p_session_id and c.entity_type = 'anchor'
  ) into v_requires_anchor;
  if not private.map_verification_checklist_complete(v_session.checklist, v_requires_anchor) then
    raise exception 'physical verification checklist is incomplete' using errcode = '23514';
  end if;
  if jsonb_typeof(coalesce(p_snapshot, '{}'::jsonb)) <> 'object' or p_snapshot = '{}'::jsonb then
    raise exception 'approval snapshot must be a non-empty object' using errcode = '22023';
  end if;
  insert into public.map_publish_snapshots (session_id, canonical_revision, payload, approved_by)
  values (p_session_id, trim(p_canonical_revision), p_snapshot, (select auth.uid()))
  returning id into v_snapshot_id;
  update public.map_verification_sessions
  set status = 'approved', reviewed_by = (select auth.uid()), reviewed_at = now(), updated_at = now()
  where id = p_session_id;
  return v_snapshot_id;
end;
$$;
revoke execute on function public.approve_map_verification_session(uuid, text, jsonb) from public, anon;
grant execute on function public.approve_map_verification_session(uuid, text, jsonb) to authenticated;

create or replace function public.rebase_map_verification_session(
  p_session_id uuid,
  p_current_revision text,
  p_current_entities jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.map_verification_sessions%rowtype;
  v_change public.map_verification_changes%rowtype;
  v_key text;
begin
  if not private.has_any_role(array['map_editor','admin']::public.app_role[]) then
    raise exception 'map verification role required' using errcode = '42501';
  end if;
  if jsonb_typeof(coalesce(p_current_entities, '{}'::jsonb)) <> 'object' then
    raise exception 'current canonical entities must be an object' using errcode = '22023';
  end if;
  select * into v_session from public.map_verification_sessions where id = p_session_id for update;
  if not found or v_session.status not in ('draft','rejected')
    or not ((select private.has_any_role(array['admin']::public.app_role[]))
      or v_session.created_by = (select auth.uid()) or v_session.assigned_to = (select auth.uid())) then
    raise exception 'draft is not rebasable' using errcode = '42501';
  end if;
  for v_change in select * from public.map_verification_changes where session_id = p_session_id loop
    v_key := v_change.entity_type || ':' || v_change.entity_id;
    if (p_current_entities -> v_key) is distinct from v_change.before_value then
      raise exception 'canonical geometry conflict for %', v_key using errcode = '40001';
    end if;
  end loop;
  for v_change in select * from public.map_verification_changes where session_id = p_session_id loop
    v_key := v_change.entity_type || ':' || v_change.entity_id;
    update public.map_verification_changes
    set before_value = p_current_entities -> v_key
    where id = v_change.id;
  end loop;
  update public.map_verification_sessions set base_revision = trim(p_current_revision), updated_at = now() where id = p_session_id;
end;
$$;
revoke execute on function public.rebase_map_verification_session(uuid, text, jsonb) from public, anon;
grant execute on function public.rebase_map_verification_session(uuid, text, jsonb) to authenticated;
