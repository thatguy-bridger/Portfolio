// Real connectivity/health checks for /admin/diagnostics — and the compact
// summary admin/index.astro shows on the dashboard. Started life as the
// inline try/catch in admin/index.astro (Phase 4's "this becomes the real
// Diagnostics screen in Phase 5" placeholder); moved here so both pages
// share one implementation instead of drifting apart.
//
// Every check below is independent and individually try/catch'd, so one
// failure (or the whole client failing to initialize) reports as a specific,
// readable failure for that check rather than a 500 that takes the rest of
// the page down. In particular, the media-bucket check is deliberately
// separate from the general table-connectivity check: a project that ran
// 0001_init.sql but skipped 0002_media_storage.sql has working tables (every
// table check passes) but no `media` Storage bucket, and that split shows up
// here as one specific red check, not "everything is broken."
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminSession } from './firebase-admin';
import { MEDIA_BUCKET } from './media';
import { getSupabase } from './supabase-server';

export interface DiagnosticCheck {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

/** Every table this app writes to, per 0001_init.sql / 0003_publish_history.sql. */
const TABLES = ['pages', 'contact_submissions', 'media_library', 'revision_history'] as const;

function skipped(id: string, label: string): DiagnosticCheck {
  return { id, label, ok: false, detail: 'Skipped — Supabase is not configured (see the check above).' };
}

/**
 * `supabaseOverride` exists purely for testability — it lets
 * .scratch-check/test-diagnostics.ts drive this against a fake HTTP server
 * standing in for Supabase's REST/Storage APIs (a real `createClient(...)`
 * pointed at that fake server), sidestepping `getSupabase()`'s dependence on
 * `import.meta.env`, which only exists inside Astro/Vite's own module
 * graph — not under a plain `tsx` invocation. Every real caller (the
 * diagnostics page, the admin dashboard) omits it and gets the normal
 * service-role client.
 */
export async function runDiagnostics(admin: AdminSession, supabaseOverride?: SupabaseClient): Promise<DiagnosticCheck[]> {
  const checks: DiagnosticCheck[] = [];

  // Trivially true — the middleware (src/middleware.ts) would have redirected
  // a signed-out visitor to /admin/login before this page ever rendered. It's
  // still stated explicitly, per the phase brief, rather than left implicit.
  checks.push({
    id: 'firebase-auth',
    label: 'Firebase Auth session',
    ok: true,
    detail: `Valid — signed in as ${admin.email ?? admin.uid}.`,
  });

  let supabase: SupabaseClient | null = null;
  try {
    supabase = supabaseOverride ?? getSupabase();
    checks.push({ id: 'supabase-config', label: 'Supabase environment configured', ok: true, detail: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.' });
  } catch (err) {
    checks.push({
      id: 'supabase-config',
      label: 'Supabase environment configured',
      ok: false,
      detail: err instanceof Error ? err.message : 'Unknown error constructing the Supabase client.',
    });
  }

  if (!supabase) {
    checks.push(skipped('supabase-connectivity', 'Supabase connectivity'));
    checks.push(skipped('media-bucket', `Media storage bucket ("${MEDIA_BUCKET}")`));
    for (const table of TABLES) checks.push(skipped(`table-${table}`, `Table: ${table}`));
    return checks;
  }

  try {
    const { error } = await supabase.from('pages').select('id', { count: 'exact', head: true });
    checks.push(
      error
        ? { id: 'supabase-connectivity', label: 'Supabase connectivity', ok: false, detail: error.message }
        : { id: 'supabase-connectivity', label: 'Supabase connectivity', ok: true, detail: 'Reached the database and queried the `pages` table.' },
    );
  } catch (err) {
    checks.push({ id: 'supabase-connectivity', label: 'Supabase connectivity', ok: false, detail: err instanceof Error ? err.message : 'Unknown connectivity error.' });
  }

  try {
    const { data, error } = await supabase.storage.getBucket(MEDIA_BUCKET);
    if (error || !data) {
      checks.push({
        id: 'media-bucket',
        label: `Media storage bucket ("${MEDIA_BUCKET}")`,
        ok: false,
        detail: error?.message ?? `Bucket "${MEDIA_BUCKET}" does not exist — run supabase/migrations/0002_media_storage.sql against this project.`,
      });
    } else {
      checks.push({ id: 'media-bucket', label: `Media storage bucket ("${MEDIA_BUCKET}")`, ok: true, detail: `Bucket exists${data.public ? ' and is public' : ' but is NOT public — uploaded images would 403 for visitors'}.` });
    }
  } catch (err) {
    checks.push({ id: 'media-bucket', label: `Media storage bucket ("${MEDIA_BUCKET}")`, ok: false, detail: err instanceof Error ? err.message : 'Unknown storage error.' });
  }

  for (const table of TABLES) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      checks.push(
        error
          ? { id: `table-${table}`, label: `Table: ${table}`, ok: false, detail: error.message }
          : { id: `table-${table}`, label: `Table: ${table}`, ok: true, detail: `${count ?? 0} row(s).` },
      );
    } catch (err) {
      checks.push({ id: `table-${table}`, label: `Table: ${table}`, ok: false, detail: err instanceof Error ? err.message : 'Unknown error.' });
    }
  }

  return checks;
}
