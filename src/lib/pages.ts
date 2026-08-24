// Shared page-path validation for the admin pages endpoints (create + rename)
// — one rule set so the two can't quietly drift apart.
import { getSupabase } from './supabase-server';

const MAX_PATH_LENGTH = 200;
const MAX_TITLE_LENGTH = 200;
// Root "/" or "/segment(/segment)*", each segment lowercase alphanumeric +
// hyphens. Deliberately restrictive (no uppercase/spaces/special chars) —
// this becomes a URL, and Astro's [...path] route splits on "/" verbatim.
const PATH_SEGMENT_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Returns the normalized path (trailing slash stripped, except root) or null if invalid. */
export function normalizePagePath(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > MAX_PATH_LENGTH) return null;
  if (trimmed === '/') return '/';
  // The leading "/" is optional from the user's point of view — "about" and
  // "/about" should create the same page — so it's added here rather than
  // rejecting input that's missing it.
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const path = withSlash.replace(/\/+$/, '');
  const segments = path.slice(1).split('/');
  if (segments.some((s) => !PATH_SEGMENT_RE.test(s))) return null;
  return path;
}

export function normalizePageTitle(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > MAX_TITLE_LENGTH) return null;
  return trimmed;
}

/**
 * A deliberately shallow shape check for the `draft_blocks` jsonb payload —
 * not a full re-validation of every block's props (that's the registry's
 * job client-side, and BlockRenderer already no-ops on an unknown type, see
 * BlockRenderer.tsx), just enough to reject something that obviously isn't
 * a PageSection[] before it lands in the database — e.g. a malformed/partial
 * request body, not a trusted client bug.
 */
/**
 * Returns the id of the `pages` row at path "/" (the site's homepage),
 * creating it as an empty draft first if it doesn't exist yet. The homepage
 * is otherwise a completely ordinary page — this just means the admin
 * dashboard's "Homepage" shortcut always has somewhere to link, without the
 * owner needing to know to create a page at the exact path "/" themselves.
 */
export async function getOrCreateHomepage(): Promise<string> {
  const supabase = getSupabase();
  const { data: existing } = await supabase.from('pages').select('id').eq('path', '/').maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('pages')
    .insert({ path: '/', title: 'Home', status: 'draft', draft_blocks: [] })
    .select('id')
    .single();
  if (!error) return created.id;

  // Lost a race with a concurrent request that created it first (unique
  // violation on `pages.path`) — just look it up instead of failing.
  if (error.code === '23505') {
    const { data: retry } = await supabase.from('pages').select('id').eq('path', '/').single();
    if (retry) return retry.id;
  }
  throw new Error(error.message);
}

export function isValidPageBlocks(value: unknown): value is unknown[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (section) =>
      section !== null &&
      typeof section === 'object' &&
      typeof (section as Record<string, unknown>).id === 'string' &&
      Array.isArray((section as Record<string, unknown>).blocks),
  );
}
