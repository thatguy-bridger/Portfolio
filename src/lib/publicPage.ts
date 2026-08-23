import { getSupabase } from './supabase-server';
import type { PageBlocks } from './blocks/types';

export interface PublishedPage {
  id: string;
  path: string;
  title: string;
  blocks: PageBlocks;
}

/**
 * Looks up a page by its exact path and returns its published_blocks — null
 * if no page exists there, it's never been published, or Supabase itself is
 * unreachable/unconfigured (caught, not thrown: a broken backend should 404
 * a visitor, not crash the response). Shared by the homepage
 * (src/pages/index.astro, path "/") and the catch-all route
 * (src/pages/[...path].astro, everything else) so the two can never
 * disagree about what "live" means.
 */
export async function fetchPublishedPage(path: string): Promise<PublishedPage | null> {
  try {
    const { data, error } = await getSupabase()
      .from('pages')
      .select('id, path, title, status, published_blocks')
      .eq('path', path)
      .maybeSingle();
    if (error || !data || data.status !== 'published' || !data.published_blocks) return null;
    return { id: data.id, path: data.path, title: data.title, blocks: data.published_blocks as PageBlocks };
  } catch {
    return null;
  }
}
