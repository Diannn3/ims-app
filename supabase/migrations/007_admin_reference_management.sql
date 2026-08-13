-- 007_admin_reference_management.sql
-- Minimal trusted configuration flows needed before real academic imports arrive.

-- data_sources remains non-public because it contains internal notes. The safe
-- public_data_sources view is still the only public read surface.
drop policy if exists "admin insert data sources" on public.data_sources;
drop policy if exists "admin update data sources" on public.data_sources;
create policy "admin insert data sources"
  on public.data_sources for insert to authenticated
  with check ((select private.has_any_role(array['admin']::public.app_role[])));
create policy "admin update data sources"
  on public.data_sources for update to authenticated
  using ((select private.has_any_role(array['admin']::public.app_role[])))
  with check ((select private.has_any_role(array['admin']::public.app_role[])));

-- Explicit column grants make the intent survive stricter Data API grants.
revoke insert, update, delete on table public.data_sources from authenticated;
grant insert (label, source_type, source_url, authority, notes) on table public.data_sources to authenticated;
grant update (label, source_type, source_url, authority, notes) on table public.data_sources to authenticated;

-- Terms are staff configuration. Public users still see only the current term
-- through the RLS policy created in migration 004.
drop policy if exists "admin insert academic terms" on public.academic_terms;
drop policy if exists "admin update academic terms" on public.academic_terms;
create policy "admin insert academic terms"
  on public.academic_terms for insert to authenticated
  with check ((select private.has_any_role(array['admin']::public.app_role[])));
create policy "admin update academic terms"
  on public.academic_terms for update to authenticated
  using ((select private.has_any_role(array['admin']::public.app_role[])))
  with check ((select private.has_any_role(array['admin']::public.app_role[])));

-- Change the current term atomically so the partial unique index never observes
-- two current rows and a failed second update does not leave the app half-changed.
create or replace function public.set_current_academic_term(p_term_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_any_role(array['admin']::public.app_role[]) then
    raise exception 'admin role required' using errcode = '42501';
  end if;

  if not exists (select 1 from public.academic_terms where id = p_term_id) then
    raise exception 'academic term not found' using errcode = 'P0002';
  end if;

  -- Serialize term switches with a table lock; this path is rare and admin-only.
  lock table public.academic_terms in share row exclusive mode;
  update public.academic_terms set is_current = false where is_current = true;
  update public.academic_terms set is_current = true where id = p_term_id;
end;
$$;

revoke execute on function public.set_current_academic_term(text) from public, anon;
grant execute on function public.set_current_academic_term(text) to authenticated;
