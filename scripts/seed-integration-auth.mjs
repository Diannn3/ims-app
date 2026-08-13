import { createClient } from '@supabase/supabase-js';
import { getLocalSupabaseStatus } from './lib/local-supabase.mjs';

let url = process.env.LOCAL_SUPABASE_URL;
let elevatedKey = process.env.LOCAL_SUPABASE_SECRET_KEY || process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !elevatedKey) {
  try {
    const local = getLocalSupabaseStatus();
    url = local.apiUrl;
    elevatedKey = local.elevatedKey;
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Could not discover local Supabase fixture credentials.');
    process.exit(2);
  }
}

let parsedUrl;
try {
  parsedUrl = new URL(url);
} catch {
  console.error('LOCAL_SUPABASE_URL is not a valid URL.');
  process.exit(2);
}

if (!['127.0.0.1', 'localhost', '::1'].includes(parsedUrl.hostname)) {
  console.error(`Refusing to seed integration staff accounts against non-local Supabase host: ${parsedUrl.hostname}`);
  process.exit(3);
}

const fixtures = [
  {
    email: 'editor.integration@example.test',
    password: 'IMS-Local-Editor-2026!',
    displayName: 'Integration Editor',
    role: 'content_editor'
  },
  {
    email: 'admin.integration@example.test',
    password: 'IMS-Local-Admin-2026!',
    displayName: 'Integration Admin',
    role: 'admin'
  }
];

const supabase = createClient(url, elevatedKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const { data: existingData, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) {
  console.error(`Could not inspect local Auth users: ${listError.message}`);
  process.exit(1);
}

for (const fixture of fixtures) {
  let user = existingData.users.find((candidate) => candidate.email?.toLowerCase() === fixture.email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: fixture.email,
      password: fixture.password,
      email_confirm: true,
      user_metadata: { display_name: fixture.displayName, integration_fixture: true }
    });
    if (error || !data.user) {
      console.error(`Could not create ${fixture.role} integration user: ${error?.message ?? 'unknown error'}`);
      process.exit(1);
    }
    user = data.user;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: fixture.password,
      email_confirm: true,
      user_metadata: { display_name: fixture.displayName, integration_fixture: true }
    });
    if (error) {
      console.error(`Could not refresh ${fixture.role} integration user: ${error.message}`);
      process.exit(1);
    }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ display_name: fixture.displayName, role: fixture.role })
    .eq('user_id', user.id);

  if (profileError) {
    console.error(`Could not assign ${fixture.role} profile: ${profileError.message}`);
    process.exit(1);
  }

  console.log(`Prepared local-only ${fixture.role} fixture ${fixture.email}.`);
}
