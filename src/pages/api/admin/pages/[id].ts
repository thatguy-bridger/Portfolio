import type { APIRoute } from 'astro';
import { getSupabase } from '../../../../lib/supabase-server';
import { isValidPageBlocks, normalizePagePath, normalizePageTitle } from '../../../../lib/pages';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Single page row — used by the editor page to reload after an external change, if ever needed. */
export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: 'Missing page id.' }, 400);
  try {
    const { data, error } = await getSupabase().from('pages').select('*').eq('id', id).maybeSingle();
    if (error) return json({ error: error.message }, 502);
    if (!data) return json({ error: 'Page not found.' }, 404);
    return json({ page: data });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Server is not configured correctly.' }, 500);
  }
};

/**
 * Partial update — the autosave endpoint (useAutosave PATCHes `draft_blocks`
 * here debounced) and also how the pages list renames a page (`title`/`path`).
 * Only fields actually present in the body are touched; omitted keys are
 * left alone, and a field being cleared client-side always arrives as an
 * explicit value (e.g. '') rather than `undefined` — see EditableImage's
 * Remove button and simpleBlocks.tsx's fallbacks — so there is nothing here
 * that needs to distinguish "not sent" from "sent as undefined": JSON has no
 * `undefined`, so that ambiguity can't reach this endpoint at all.
 */
export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ error: 'Missing page id.' }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Malformed request body.' }, 400);
  }
  const { draft_blocks, title: rawTitle, path: rawPath } = (body ?? {}) as Record<string, unknown>;

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (draft_blocks !== undefined) {
    if (!isValidPageBlocks(draft_blocks)) return json({ error: 'draft_blocks must be an array of sections.' }, 400);
    update.draft_blocks = draft_blocks;
    update.draft_updated_at = new Date().toISOString();
  }
  if (rawTitle !== undefined) {
    const title = normalizePageTitle(rawTitle);
    if (!title) return json({ error: 'title is required.' }, 400);
    update.title = title;
  }
  if (rawPath !== undefined) {
    const path = normalizePagePath(rawPath);
    if (!path) return json({ error: 'path must start with "/" and contain only lowercase letters, numbers, and hyphens per segment.' }, 400);
    update.path = path;
  }
  if (Object.keys(update).length === 1) return json({ error: 'Nothing to update.' }, 400);

  try {
    const { data, error } = await getSupabase().from('pages').update(update).eq('id', id).select('id, path, title, status, updated_at, published_at').maybeSingle();
    if (error) {
      if (error.code === '23505') return json({ error: `A page already exists at "${update.path}".` }, 409);
      return json({ error: error.message }, 502);
    }
    if (!data) return json({ error: 'Page not found.' }, 404);
    return json({ page: data });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Server is not configured correctly.' }, 500);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: 'Missing page id.' }, 400);
  try {
    const { error } = await getSupabase().from('pages').delete().eq('id', id);
    if (error) return json({ error: error.message }, 502);
    return json({ ok: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Server is not configured correctly.' }, 500);
  }
};
