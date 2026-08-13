-- 013_import_staging_immutability.sql
-- Staged import content is an audit artifact. Once the atomic staging RPC has created
-- a batch, application roles may read it and reviewers may acknowledge warnings, but
-- they cannot rewrite/delete staged rows or validation issue content. This keeps the
-- preview token meaningful and prevents application bugs from changing what an admin
-- reviewed before apply.

-- Rows are immutable through the Data API. apply_import_batch() is SECURITY DEFINER
-- and can still move row status to applied/skipped as part of its own transaction.
drop policy if exists "admin update import rows" on public.import_rows;
drop policy if exists "admin delete import rows" on public.import_rows;
revoke update, delete on table public.import_rows from authenticated;

-- Batches may only be rejected directly by admins. The apply RPC owns applying/applied
-- transitions; staging RPC owns creation. Column grants prevent accidental metadata,
-- counts, or preview-hash rewrites from server UI code.
revoke update, delete on table public.import_batches from authenticated;
grant update (status, updated_at) on table public.import_batches to authenticated;

-- Validation issue content is immutable. Reviewers/admins may only fill the warning
-- acknowledgement fields; no role can rewrite error/warning prose or delete evidence.
drop policy if exists "admin delete import issues" on public.import_issues;
revoke update, delete on table public.import_issues from authenticated;
grant update (acknowledged_at, acknowledged_by) on table public.import_issues to authenticated;

create or replace function private.guard_import_issue_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch_status text;
begin
  if not private.has_any_role(array['content_editor','admin']::public.app_role[]) then
    raise exception 'reviewer role required' using errcode = '42501';
  end if;

  if new.import_row_id is distinct from old.import_row_id
     or new.issue_type is distinct from old.issue_type
     or new.message is distinct from old.message
     or new.field is distinct from old.field
     or new.error_code is distinct from old.error_code
     or new.original_value is distinct from old.original_value
     or new.normalized_value is distinct from old.normalized_value
     or new.suggested_value is distinct from old.suggested_value
     or new.created_at is distinct from old.created_at then
    raise exception 'validation issue content is immutable' using errcode = '42501';
  end if;

  select b.status into v_batch_status
  from public.import_rows r
  join public.import_batches b on b.id = r.batch_id
  where r.id = old.import_row_id;

  if v_batch_status <> 'ready' then
    raise exception 'warnings may only be acknowledged on ready batches' using errcode = '23514';
  end if;
  if old.issue_type <> 'warning' then
    raise exception 'only warnings can be acknowledged' using errcode = '23514';
  end if;
  if old.acknowledged_at is not null then
    raise exception 'warning acknowledgement is immutable' using errcode = '23514';
  end if;
  if new.acknowledged_at is null or new.acknowledged_by is distinct from (select auth.uid()) then
    raise exception 'warning acknowledgement must record the current reviewer' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function private.guard_import_issue_update() from public, anon, authenticated;
