import type { APIRoute } from 'astro';
import { getSupabase } from '../../../../lib/supabase-server';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Marks a submission read/unread — `{ read: boolean }`. */
export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ error: 'Missing submission id.' }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Malformed request body.' }, 400);
  }
  const { read } = (body ?? {}) as Record<string, unknown>;
  if (typeof read !== 'boolean') return json({ error: 'read must be a boolean.' }, 400);

  try {
    const { data, error } = await getSupabase().from('contact_submissions').update({ read }).eq('id', id).select('*').maybeSingle();
    if (error) return json({ error: error.message }, 502);
    if (!data) return json({ error: 'Not found.' }, 404);
    return json({ submission: data });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Server is not configured correctly.' }, 500);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: 'Missing submission id.' }, 400);
  try {
    const { error } = await getSupabase().from('contact_submissions').delete().eq('id', id);
    if (error) return json({ error: error.message }, 502);
    return json({ ok: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Server is not configured correctly.' }, 500);
  }
};
