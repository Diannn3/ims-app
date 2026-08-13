-- 019_spatial_parent_integrity.sql
-- Permanent IDs are the integration boundary between academic records and the
-- navigation dataset. As the schema becomes multi-building capable, reject impossible
-- building/floor/space combinations at the database boundary instead of relying on UI
-- forms to keep redundant parent IDs synchronized.

create unique index if not exists floors_id_building_uidx
  on public.floors(id, building_id);

alter table public.spaces
  drop constraint if exists spaces_floor_building_fkey;
alter table public.spaces
  add constraint spaces_floor_building_fkey
  foreign key (floor_id, building_id)
  references public.floors(id, building_id)
  on delete cascade
  not valid;
alter table public.spaces validate constraint spaces_floor_building_fkey;

alter table public.location_anchors
  drop constraint if exists location_anchors_floor_building_fkey;
alter table public.location_anchors
  add constraint location_anchors_floor_building_fkey
  foreign key (floor_id, building_id)
  references public.floors(id, building_id)
  on delete cascade
  not valid;
alter table public.location_anchors validate constraint location_anchors_floor_building_fkey;

-- The existing anchor->space FK intentionally uses ON DELETE SET NULL. A composite
-- FK would interfere with that behavior by including non-null building/floor columns,
-- so enforce the same-floor/same-building invariant with a focused trigger instead.
create or replace function private.guard_location_anchor_space_consistency()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.space_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.spaces s
    where s.id = new.space_id
      and s.building_id = new.building_id
      and s.floor_id = new.floor_id
  ) then
    raise exception 'location anchor space must belong to the anchor building and floor'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function private.guard_location_anchor_space_consistency() from public, anon, authenticated;

drop trigger if exists location_anchor_space_consistency_guard on public.location_anchors;
create trigger location_anchor_space_consistency_guard
before insert or update of building_id, floor_id, space_id on public.location_anchors
for each row execute function private.guard_location_anchor_space_consistency();
