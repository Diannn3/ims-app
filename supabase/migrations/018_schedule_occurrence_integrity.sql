-- 018_schedule_occurrence_integrity.sql
-- Canonicalize the last schedule-V1 ambiguity at the database boundary:
-- weekdays must be sorted and unique, and a section cannot contain the exact same
-- day/time/room occurrence twice. Application normalization already produces this
-- shape, but RPC callers must not be trusted to preserve it.

-- Exact duplicate meeting occurrences are redundant and make room/course read models
-- misleading. NULL room means TBA/unspecified and participates in identity.
create unique index if not exists section_meetings_identity_uidx
  on public.section_meetings(section_id, weekday, starts_at, ends_at, space_id)
  nulls not distinct;

create or replace function private.guard_schedule_import_weekday_canonical()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_canonical integer[];
  v_total integer;
  v_distinct integer;
begin
  if new.status not in ('valid','changed','unchanged') then
    return new;
  end if;

  if jsonb_typeof(new.normalized_payload) is distinct from 'object'
     or jsonb_typeof(new.normalized_payload->'weekdays') is distinct from 'array' then
    -- The primary row-integrity trigger owns the structural error message.
    return new;
  end if;

  select
    count(*)::integer,
    count(distinct (item #>> '{}')::integer)::integer,
    array_agg(distinct (item #>> '{}')::integer order by (item #>> '{}')::integer)
  into v_total, v_distinct, v_canonical
  from jsonb_array_elements(new.normalized_payload->'weekdays') item
  where jsonb_typeof(item) = 'number'
    and (item #>> '{}') ~ '^[1-7]$';

  -- Invalid weekday tokens are rejected by guard_schedule_import_row_integrity().
  -- If every token is valid, enforce the canonical representation expected by V1.
  if v_total <> jsonb_array_length(new.normalized_payload->'weekdays') then
    return new;
  end if;

  if v_total <> v_distinct then
    raise exception 'row % contains duplicate weekdays', new.row_number using errcode = '23514';
  end if;

  if new.normalized_payload->'weekdays' is distinct from to_jsonb(v_canonical) then
    raise exception 'row % weekdays must be sorted in canonical order', new.row_number using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function private.guard_schedule_import_weekday_canonical() from public, anon, authenticated;

drop trigger if exists schedule_import_weekday_canonical_guard on public.import_rows;
create trigger schedule_import_weekday_canonical_guard
before insert on public.import_rows
for each row execute function private.guard_schedule_import_weekday_canonical();
