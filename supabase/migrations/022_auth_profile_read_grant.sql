-- 022_auth_profile_read_grant.sql
-- The public-read hardening migration revokes table grants by default. Staff
-- sign-in still needs the authenticated user's own profile row for role checks;
-- RLS remains the row-level boundary and exposes no profile data to anon.

grant select (user_id, display_name, role) on table public.profiles to authenticated;
