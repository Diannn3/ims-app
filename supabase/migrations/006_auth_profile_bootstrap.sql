-- 006_auth_profile_bootstrap.sql
-- Create the least-privileged application profile whenever an Auth user is created.
-- Role promotion remains an explicit administrator operation; user metadata never
-- controls public.profiles.role.

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name, role)
  values (
    new.id,
    nullif(coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, ''), '@', 1)), ''),
    'student'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function private.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_ims_profile on auth.users;
create trigger on_auth_user_created_ims_profile
after insert on auth.users
for each row execute function private.handle_new_auth_user();

-- Backfill a profile for Auth users that existed before the trigger. Deliberately
-- assign the default student role; administrators can promote selected accounts.
insert into public.profiles (user_id, display_name, role)
select
  u.id,
  nullif(coalesce(u.raw_user_meta_data->>'display_name', split_part(coalesce(u.email, ''), '@', 1)), ''),
  'student'::public.app_role
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null
on conflict (user_id) do nothing;
