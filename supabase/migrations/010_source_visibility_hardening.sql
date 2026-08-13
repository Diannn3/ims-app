-- 010_source_visibility_hardening.sql
-- Public provenance is opt-in. Internal sheets/files may be valid import sources
-- without exposing their labels or URLs through the anonymous Data API.

alter table public.data_sources
  add column if not exists public_metadata boolean not null default false;

-- Staff can inspect source configuration through the base table. RLS keeps this
-- unavailable to ordinary authenticated users even though SELECT is granted.
drop policy if exists "staff read data sources" on public.data_sources;
create policy "staff read data sources"
  on public.data_sources for select to authenticated
  using ((select private.has_any_role(array['content_editor','admin']::public.app_role[])));

grant select on table public.data_sources to authenticated;

-- Admins already own source mutations. Extend migration 007's column privileges to
-- the new public-metadata switch without granting broader mutation rights.
grant insert (public_metadata) on table public.data_sources to authenticated;
grant update (public_metadata) on table public.data_sources to authenticated;

-- Keep the public projection deliberately owner-executed: it exposes only the safe
-- columns below, and only for records explicitly approved for public provenance.
create or replace view public.public_data_sources
with (security_barrier = true)
as
select
  id,
  label,
  source_type,
  source_url,
  authority,
  created_at
from public.data_sources
where public_metadata = true;

revoke all on public.public_data_sources from public;
grant select on public.public_data_sources to anon, authenticated;
