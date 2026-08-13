-- 012_atomic_import_staging.sql
-- Stage a validated schedule import as one database transaction.
--
-- Prior application code created a batch, inserted rows, then inserted issues through
-- separate Data API calls. A network/RLS failure between those calls could leave a
-- partially staged batch whose status already looked ready. From this migration on,
-- authenticated staff may read/review staging tables but cannot INSERT into them
-- directly; the SECURITY DEFINER RPC below owns atomic creation.

-- Direct staging writes are no longer part of the application contract.
drop policy if exists "staff create import batches" on public.import_batches;
drop policy if exists "stager insert import rows" on public.import_rows;
drop policy if exists "stager insert import issues" on public.import_issues;

revoke insert on table public.import_batches from authenticated;
revoke insert on table public.import_rows from authenticated;
revoke insert on table public.import_issues from authenticated;

create or replace function public.stage_schedule_import_batch(
  p_source_id uuid,
  p_term_id text,
  p_filename text,
  p_preview_hash text,
  p_rows jsonb,
  p_schema_version integer default 1,
  p_authoritative_snapshot boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch_id uuid;
  v_batch_status text;
  v_row jsonb;
  v_issue jsonb;
  v_import_row_id uuid;
  v_row_number integer;
  v_row_status text;
  v_row_count integer := 0;
  v_valid_count integer := 0;
  v_changed_count integer := 0;
  v_unchanged_count integer := 0;
  v_skipped_count integer := 0;
  v_invalid_count integer := 0;
  v_error_count integer := 0;
  v_warning_count integer := 0;
  v_info_count integer := 0;
  v_issue_type text;
begin
  if not private.has_any_role(array['content_editor','admin']::public.app_role[]) then
    raise exception 'content editor or admin role required' using errcode = '42501';
  end if;

  if p_source_id is null or not exists (select 1 from public.data_sources where id = p_source_id) then
    raise exception 'valid data source is required' using errcode = '23503';
  end if;
  if p_term_id is null or not exists (select 1 from public.academic_terms where id = p_term_id) then
    raise exception 'valid academic term is required' using errcode = '23503';
  end if;
  if p_filename is null or btrim(p_filename) = '' then
    raise exception 'filename is required' using errcode = '23514';
  end if;
  if length(p_filename) > 255 then
    raise exception 'filename is too long' using errcode = '22001';
  end if;
  if p_preview_hash is null or btrim(p_preview_hash) = '' then
    raise exception 'preview hash is required' using errcode = '23514';
  end if;
  if p_schema_version <> 1 then
    raise exception 'unsupported import schema version: %', p_schema_version using errcode = '22023';
  end if;
  if p_authoritative_snapshot then
    raise exception 'authoritative snapshot reconciliation is not implemented' using errcode = '0A000';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'rows must be a JSON array' using errcode = '22023';
  end if;
  if jsonb_array_length(p_rows) = 0 then
    raise exception 'at least one staged data row is required' using errcode = '23514';
  end if;
  if jsonb_array_length(p_rows) > 5000 then
    raise exception 'import exceeds 5000 row limit' using errcode = '54000';
  end if;

  -- Structural validation and aggregate counts are recomputed in the database.
  -- Counts from browser/server code are never trusted as authorization/apply gates.
  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    if jsonb_typeof(v_row) <> 'object' then
      raise exception 'each staged row must be a JSON object' using errcode = '22023';
    end if;

    begin
      v_row_number := (v_row->>'rowNumber')::integer;
    exception when others then
      raise exception 'rowNumber must be an integer' using errcode = '22023';
    end;
    if v_row_number < 2 then
      raise exception 'rowNumber must refer to a CSV data row' using errcode = '22023';
    end if;

    v_row_status := v_row->>'status';
    if v_row_status is null or v_row_status not in ('valid','invalid','unchanged','changed','skipped') then
      raise exception 'unsupported staged row status for row %', v_row_number using errcode = '22023';
    end if;

    if jsonb_typeof(v_row->'rawPayload') is distinct from 'object' then
      raise exception 'rawPayload must be an object for row %', v_row_number using errcode = '22023';
    end if;

    if v_row_status in ('valid','changed','unchanged') then
      if jsonb_typeof(v_row->'normalizedPayload') is distinct from 'object'
         or nullif(v_row->>'sourceRecordKey','') is null
         or nullif(v_row->>'contentHash','') is null then
        raise exception 'resolved source identity is required for row %', v_row_number using errcode = '23514';
      end if;
    end if;

    if coalesce(jsonb_typeof(v_row->'issues'), 'array') <> 'array' then
      raise exception 'issues must be an array for row %', v_row_number using errcode = '22023';
    end if;

    v_row_count := v_row_count + 1;
    case v_row_status
      when 'valid' then v_valid_count := v_valid_count + 1;
      when 'changed' then v_changed_count := v_changed_count + 1;
      when 'unchanged' then v_unchanged_count := v_unchanged_count + 1;
      when 'skipped' then v_skipped_count := v_skipped_count + 1;
      when 'invalid' then v_invalid_count := v_invalid_count + 1;
    end case;

    for v_issue in select value from jsonb_array_elements(coalesce(v_row->'issues', '[]'::jsonb))
    loop
      if jsonb_typeof(v_issue) <> 'object' then
        raise exception 'issue entries must be objects for row %', v_row_number using errcode = '22023';
      end if;
      v_issue_type := v_issue->>'severity';
      if v_issue_type not in ('error','warning','info') then
        raise exception 'invalid issue severity for row %', v_row_number using errcode = '22023';
      end if;
      if nullif(v_issue->>'code','') is null or nullif(v_issue->>'message','') is null then
        raise exception 'issues require code and message for row %', v_row_number using errcode = '23514';
      end if;

      case v_issue_type
        when 'error' then v_error_count := v_error_count + 1;
        when 'warning' then v_warning_count := v_warning_count + 1;
        when 'info' then v_info_count := v_info_count + 1;
      end case;
    end loop;
  end loop;

  v_batch_status := case when v_error_count > 0 then 'validation_failed' else 'ready' end;

  insert into public.import_batches (
    source_id,
    term_id,
    imported_by,
    status,
    row_count,
    valid_row_count,
    error_count,
    warning_count,
    filename,
    preview_hash,
    schema_version,
    authoritative_snapshot,
    summary
  ) values (
    p_source_id,
    p_term_id,
    auth.uid(),
    v_batch_status,
    v_row_count,
    v_valid_count + v_changed_count + v_unchanged_count,
    v_error_count,
    v_warning_count,
    p_filename,
    p_preview_hash,
    p_schema_version,
    false,
    jsonb_build_object(
      'valid', v_valid_count,
      'changed', v_changed_count,
      'unchanged', v_unchanged_count,
      'skipped', v_skipped_count,
      'invalid', v_invalid_count,
      'info', v_info_count
    )
  ) returning id into v_batch_id;

  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    v_row_number := (v_row->>'rowNumber')::integer;
    v_row_status := v_row->>'status';

    insert into public.import_rows (
      batch_id,
      row_number,
      entity_type,
      raw_payload,
      normalized_payload,
      status,
      source_record_key,
      content_hash
    ) values (
      v_batch_id,
      v_row_number,
      'schedule_v1',
      v_row->'rawPayload',
      case when jsonb_typeof(v_row->'normalizedPayload') = 'object' then v_row->'normalizedPayload' else null end,
      v_row_status,
      nullif(v_row->>'sourceRecordKey',''),
      nullif(v_row->>'contentHash','')
    ) returning id into v_import_row_id;

    for v_issue in select value from jsonb_array_elements(coalesce(v_row->'issues', '[]'::jsonb))
    loop
      insert into public.import_issues (
        import_row_id,
        issue_type,
        error_code,
        message,
        field,
        original_value,
        normalized_value,
        suggested_value
      ) values (
        v_import_row_id,
        v_issue->>'severity',
        v_issue->>'code',
        v_issue->>'message',
        nullif(v_issue->>'field',''),
        nullif(v_issue->>'originalValue',''),
        nullif(v_issue->>'normalizedValue',''),
        nullif(v_issue->>'suggestedValue','')
      );
    end loop;
  end loop;

  return v_batch_id;
end;
$$;

revoke execute on function public.stage_schedule_import_batch(uuid, text, text, text, jsonb, integer, boolean) from public, anon;
grant execute on function public.stage_schedule_import_batch(uuid, text, text, text, jsonb, integer, boolean) to authenticated;
