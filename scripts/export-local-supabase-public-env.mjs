import { getLocalSupabaseStatus } from './lib/local-supabase.mjs';

const { apiUrl, browserKey } = getLocalSupabaseStatus();

// This script is intentionally safe to append to GitHub's GITHUB_ENV. It emits
// only values that are intended for the browser-facing local test application.
// Elevated local fixture credentials never leave getLocalSupabaseStatus().
process.stdout.write(`PUBLIC_SUPABASE_URL=${apiUrl}\n`);
process.stdout.write(`PUBLIC_SUPABASE_PUBLISHABLE_KEY=${browserKey}\n`);
