import type { APIRoute } from 'astro';
import { getSupabase } from '../../../../../lib/supabase-server';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** How many revisions the History view shows — plenty for "watch a draft evolve" without an unbounded payload; the throttling in maybeLogDraftSaveRevision (src/lib/history/log.ts) already keeps rows from piling up faster than one every ~2 minutes of active editing anyway. */
const HISTORY_LIMIT = 100;

/**
 * Lists this page's revision_history rows — both 'draft_save' and 'publish'
 * events interleaved on one timeline, newest first (same convention as
 * /api/admin/pages, /api/admin/inbox). Includes the full `blocks` snapshot
 * per row so the History UI can diff any two entries client-side without a
 * second round trip per comparison.
 */
export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: 'Missing page id.' }, 400);
  try {
    const { data, error } = await getSupabase()
      .from('revision_history')
      .select('id, event_type, blocks, created_at')
      .eq('owner_type', 'page')
      .eq('owner_id', id)
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT);
    if (error) return json({ error: error.message }, 502);
    return json({ revisions: data ?? [] });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Server is not configured correctly.' }, 500);
  }
};
