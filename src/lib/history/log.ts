// Server-side revision_history writers, shared by the autosave PATCH
// endpoint and the publish/rollback endpoints — see
// supabase/migrations/0003_publish_history.sql for why both event types
// share one table. Both functions are deliberately best-effort: a hiccup
// writing a *history* row must never fail the *actual* save/publish it's
// recording, which has already succeeded (or is about to, for the publish
// case — see publish.ts's ordering) by the time these run.
import type { PageSection } from '../blocks/types';
import { getSupabase } from '../supabase-server';

/** At most one draft_save revision logged per page per this window — see maybeLogDraftSaveRevision. */
const DRAFT_SAVE_THROTTLE_MS = 2 * 60 * 1000;

/**
 * Logs a 'publish' revision unconditionally — every publish (including a
 * rollback, which is itself a new publish event, never a silent rewrite of
 * history) is a single deliberate action, never automatic, so every one
 * earns its own history row.
 */
export async function logPublishRevision(pageId: string, blocks: PageSection[]): Promise<void> {
  try {
    await getSupabase().from('revision_history').insert({ owner_type: 'page', owner_id: pageId, event_type: 'publish', blocks });
  } catch {
    // best-effort — see file header
  }
}

/**
 * Logs a 'draft_save' revision, throttled to at most one per
 * DRAFT_SAVE_THROTTLE_MS per page. Autosave (useAutosave.ts) already
 * debounces to ~900ms of quiet, but a long editing session still fires it
 * often; logging a revision_history row on every tick would flood the table
 * for no real benefit. Time-based throttling rather than diff-based: it's
 * simpler (no need to fetch-and-compare the previous snapshot on every
 * autosave tick — this only needs its timestamp), and a 2-minute cadence
 * already gives a usably granular "watch a draft evolve" history without
 * needing to reason about what counts as a "non-trivial" diff.
 */
export async function maybeLogDraftSaveRevision(pageId: string, blocks: PageSection[]): Promise<void> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('revision_history')
      .select('created_at')
      .eq('owner_type', 'page')
      .eq('owner_id', pageId)
      .eq('event_type', 'draft_save')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return;
    const lastLoggedAt = data?.created_at ? new Date(data.created_at).getTime() : 0;
    if (Date.now() - lastLoggedAt < DRAFT_SAVE_THROTTLE_MS) return;
    await supabase.from('revision_history').insert({ owner_type: 'page', owner_id: pageId, event_type: 'draft_save', blocks });
  } catch {
    // best-effort — see file header
  }
}
