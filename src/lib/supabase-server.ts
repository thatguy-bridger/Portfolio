import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-only, service-role client. The browser never talks to Supabase
// directly — every read of unpublished/draft content and every write goes
// through an Astro server endpoint that's gated by the Firebase session
// cookie first (see middleware.ts + firebase-admin.ts). That's what lets us
// skip Supabase's own auth.uid()-based RLS entirely: there is exactly one
// trusted caller (this server), and it decides who's allowed to do what.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = import.meta.env.SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured — see .env.example');
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
