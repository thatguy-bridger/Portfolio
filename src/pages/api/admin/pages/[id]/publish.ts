import type { APIRoute } from 'astro';
import { getSupabase } from '../../../../../lib/supabase-server';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/**
 * Publish is a deliberate, explicit action — not something autosave ever
 * does on its own. Copies the current draft_blocks over published_blocks,
 * flips status to 'published', and stamps published_at. Reads-then-writes
 * in one round trip (fetch draft_blocks, write it back as published_blocks)
 * rather than a raw SQL "published_blocks = draft_blocks" purely because
 * supabase-js's query builder doesn't expose a column-to-column copy — the
 * two Supabase calls still happen server-side, back to back, with no client
 * involvement in between.
 */
export const POST: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: 'Missing page id.' }, 400);

  try {
    const supabase = getSupabase();
    const { data: page, error: fetchError } = await supabase.from('pages').select('draft_blocks').eq('id', id).maybeSingle();
    if (fetchError) return json({ error: fetchError.message }, 502);
    if (!page) return json({ error: 'Page not found.' }, 404);

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('pages')
      .update({ published_blocks: page.draft_blocks, status: 'published', published_at: now, updated_at: now })
      .eq('id', id)
      .select('id, path, title, status, updated_at, published_at')
      .maybeSingle();
    if (error) return json({ error: error.message }, 502);
    if (!data) return json({ error: 'Page not found.' }, 404);
    return json({ page: data });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Server is not configured correctly.' }, 500);
  }
};
