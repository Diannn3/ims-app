# Staff authentication

The public app does not require an account. Staff authentication exists only for restricted academic-data workflows.

## Local setup

1. Start local Supabase.
2. Create a test Auth user in local Supabase Studio (`http://127.0.0.1:54323`). Migration `006_auth_profile_bootstrap.sql` creates a `student` application profile automatically.
3. Promote only the intended test account from a trusted SQL session:

```sql
update public.profiles
set role = 'admin'
where user_id = (select id from auth.users where email = 'your-local-admin@example.com');
```

Use `content_editor` instead when testing the review-only workflow.

## Security boundary

- New Auth users always start as `student`.
- Browser metadata never assigns an application role.
- Authenticated users can update only their own `display_name`; role mutation is not granted to the `authenticated` API role.
- `/admin` is protected in SvelteKit and again by PostgreSQL RLS / RPC checks.
- Content editors may stage and review imports. Only admins may apply or reject batches in the first release.
