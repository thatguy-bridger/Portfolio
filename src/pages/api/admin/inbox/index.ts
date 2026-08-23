import type { APIRoute } from 'astro';
import { getSupabase } from '../../../../lib/supabase-server';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Every contact-form submission, newest first, for /admin/inbox. */
export const GET: APIRoute = async () => {
  try {
    const { data, error } = await getSupabase().from('contact_submissions').select('*').order('created_at', { ascending: false });
    if (error) return json({ error: error.message }, 502);
    return json({ submissions: data ?? [] });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Server is not configured correctly.' }, 500);
  }
};
