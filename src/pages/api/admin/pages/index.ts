import type { APIRoute } from 'astro';
import { getSupabase } from '../../../../lib/supabase-server';
import { normalizePagePath, normalizePageTitle } from '../../../../lib/pages';

// Gated by middleware.ts (isProtectedApi) — Astro.locals.admin is guaranteed
// non-null by the time either handler below runs.

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** List every page, most-recently-updated first, for the /admin/pages list view. */
export const GET: APIRoute = async () => {
  try {
    const { data, error } = await getSupabase()
      .from('pages')
      .select('id, path, title, status, updated_at, published_at')
      .order('updated_at', { ascending: false });
    if (error) return json({ error: error.message }, 502);
    return json({ pages: data ?? [] });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Server is not configured correctly.' }, 500);
  }
};

/** Creates a new page — starts as an unpublished draft with an empty canvas. */
export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Malformed request body.' }, 400);
  }
  const { path: rawPath, title: rawTitle } = (body ?? {}) as Record<string, unknown>;
  const path = normalizePagePath(rawPath);
  const title = normalizePageTitle(rawTitle);
  if (!path) return json({ error: 'path must start with "/" and contain only lowercase letters, numbers, and hyphens per segment.' }, 400);
  if (!title) return json({ error: 'title is required.' }, 400);

  try {
    const { data, error } = await getSupabase()
      .from('pages')
      .insert({ path, title, status: 'draft', draft_blocks: [] })
      .select('id, path, title, status, updated_at, published_at')
      .single();
    if (error) {
      // Postgres unique_violation on pages.path
      if (error.code === '23505') return json({ error: `A page already exists at "${path}".` }, 409);
      return json({ error: error.message }, 502);
    }
    return json({ page: data }, 201);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Server is not configured correctly.' }, 500);
  }
};
