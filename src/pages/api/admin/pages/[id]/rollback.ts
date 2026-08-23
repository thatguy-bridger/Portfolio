import type { APIRoute } from 'astro';
import { logPublishRevision } from '../../../../../lib/history/log';
import { getSupabase } from '../../../../../lib/supabase-server';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/**
 * Rolls a page's LIVE (published) content back to a previously published
 * snapshot. Deliberately restricted to `event_type = 'publish'` revisions —
 * "roll back a page to a previously published version" (the phase brief) is
 * about the publish-history layer, not the finer-grained draft-save layer;
 * rolling back to an in-progress draft snapshot would be a stranger
 * operation (whose intent, "make this the live site," is being expressed by
 * publishing, not by browsing autosave history) and isn't offered by the
 * History UI's rollback button for a 'draft_save' row.
 *
 * Only touches published_blocks/status/published_at — never draft_blocks,
 * so a rollback can't silently discard whatever the owner currently has
 * mid-edit in the canvas. And per the phase brief, this is itself logged as
 * a NEW 'publish' revision rather than rewriting/deleting the history it
 * rolled back past — so the trail always reads "what was live, in order,"
 * including "we went back to an earlier version" as its own visible event.
 */
export const POST: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ error: 'Missing page id.' }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Malformed request body.' }, 400);
  }
  const { revisionId } = (body ?? {}) as Record<string, unknown>;
  if (typeof revisionId !== 'string' || !revisionId) return json({ error: 'revisionId is required.' }, 400);

  try {
    const supabase = getSupabase();
    const { data: revision, error: fetchError } = await supabase
      .from('revision_history')
      .select('id, event_type, blocks, owner_id')
      .eq('id', revisionId)
      .eq('owner_type', 'page')
      .maybeSingle();
    if (fetchError) return json({ error: fetchError.message }, 502);
    if (!revision || revision.owner_id !== id) return json({ error: 'Revision not found for this page.' }, 404);
    if (revision.event_type !== 'publish') {
      return json({ error: 'Only a previously published revision can be rolled back to.' }, 400);
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('pages')
      .update({ published_blocks: revision.blocks, status: 'published', published_at: now, updated_at: now })
      .eq('id', id)
      .select('id, path, title, status, updated_at, published_at')
      .maybeSingle();
    if (error) return json({ error: error.message }, 502);
    if (!data) return json({ error: 'Page not found.' }, 404);

    await logPublishRevision(id, revision.blocks);

    return json({ page: data });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Server is not configured correctly.' }, 500);
  }
};
