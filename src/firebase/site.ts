import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, type Timestamp } from 'firebase/firestore';
import { getFirebaseDb } from './client';
import { DEFAULT_SITE_DATA, newBlockId, newPageId, type CustomPage, type SiteData, type SiteTile } from '../data/siteData';

const DRAFT_DOC = 'sites/draft';
const PUBLISHED_DOC = 'sites/published';

export interface StoredSite {
  data: SiteData;
  updatedAt?: Timestamp;
}

/** Older saves carried a flat "slug" on link objects instead of "path". */
function migrateLink(link: unknown): unknown {
  if (!link || typeof link !== 'object') return { type: 'none' };
  const l = link as Record<string, unknown>;
  if (l.path !== undefined || l.slug === undefined) return l;
  const { slug, ...rest } = l;
  return { ...rest, path: slug };
}

function normalizeTile(raw: Record<string, unknown>): SiteTile {
  return {
    elements: [],
    ...raw,
    link: migrateLink(raw.link),
  } as unknown as SiteTile;
}

interface LegacyProjectPage {
  slug: string;
  title: string;
  elements?: Array<{ type: 'text' | 'image'; content?: string; src?: string; alt?: string; crop?: unknown }>;
}

/** One-time upgrade: old TileElement-based project pages become PageBlock-based CustomPages. */
function migrateLegacyProjectPages(raw: unknown): CustomPage[] {
  if (!Array.isArray(raw)) return [];
  return (raw as LegacyProjectPage[]).map((p) => ({
    id: newPageId(),
    path: p.slug,
    title: p.title,
    blocks: (p.elements ?? []).map((el) =>
      el.type === 'text'
        ? { id: newBlockId(), type: 'text' as const, content: el.content, size: 'md' as const }
        : { id: newBlockId(), type: 'image' as const, src: el.src, alt: el.alt, crop: el.crop as never },
    ),
  }));
}

/** Migrates any button blocks' links (slug → path) within a block array. */
function migrateBlocks(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw;
  return raw.map((b) => (b && typeof b === 'object' && 'link' in b ? { ...b, link: migrateLink((b as { link: unknown }).link) } : b));
}

/** One-time upgrade: pages saved before paths could have slashes carried a flat `slug` instead of `path`. */
function migratePages(raw: unknown): CustomPage[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Array<CustomPage & { slug?: string }>).map((p) => {
    const { slug, ...rest } = p;
    return { ...(rest.path ? rest : { ...rest, path: slug ?? '' }), blocks: migrateBlocks(rest.blocks) } as CustomPage;
  });
}

/**
 * Fills in fields added after a document was first written (elements, link,
 * pages, blocks) so older saved sites keep working without losing content.
 * Also links, tile and button block links previously carried a "slug"
 * field instead of "path" — migrated the same way as pages.
 */
function normalizeSiteData(raw: Record<string, unknown>): SiteData {
  const { updatedAt: _u, publishedAt: _p, ...rest } = raw;
  const tiles = Array.isArray(rest.tiles) ? (rest.tiles as Record<string, unknown>[]).map(normalizeTile) : DEFAULT_SITE_DATA.tiles;
  const pages = Array.isArray(rest.pages) ? migratePages(rest.pages) : migrateLegacyProjectPages(rest.projectPages);
  const blocks = migrateBlocks(Array.isArray(rest.blocks) ? rest.blocks : []) as SiteData['blocks'];
  const { projectPages: _legacy, ...withoutLegacy } = rest;
  return { ...DEFAULT_SITE_DATA, ...withoutLegacy, tiles, pages, blocks } as SiteData;
}

export async function getDraft(): Promise<StoredSite> {
  const snap = await getDoc(doc(getFirebaseDb(), DRAFT_DOC));
  if (!snap.exists()) return { data: DEFAULT_SITE_DATA };
  const raw = snap.data();
  return { data: normalizeSiteData(raw), updatedAt: raw.updatedAt as Timestamp | undefined };
}

export function subscribeDraft(onChange: (site: StoredSite) => void) {
  return onSnapshot(doc(getFirebaseDb(), DRAFT_DOC), (snap) => {
    if (!snap.exists()) {
      onChange({ data: DEFAULT_SITE_DATA });
      return;
    }
    const raw = snap.data();
    onChange({ data: normalizeSiteData(raw), updatedAt: raw.updatedAt as Timestamp | undefined });
  });
}

export async function saveDraft(data: SiteData): Promise<void> {
  await setDoc(doc(getFirebaseDb(), DRAFT_DOC), { ...data, updatedAt: serverTimestamp() });
}

export async function getPublished(): Promise<StoredSite | null> {
  const snap = await getDoc(doc(getFirebaseDb(), PUBLISHED_DOC));
  if (!snap.exists()) return null;
  const raw = snap.data();
  return { data: normalizeSiteData(raw), updatedAt: raw.publishedAt as Timestamp | undefined };
}

export function subscribePublished(onChange: (site: StoredSite | null) => void) {
  return onSnapshot(doc(getFirebaseDb(), PUBLISHED_DOC), (snap) => {
    if (!snap.exists()) {
      onChange(null);
      return;
    }
    const raw = snap.data();
    onChange({ data: normalizeSiteData(raw), updatedAt: raw.publishedAt as Timestamp | undefined });
  });
}

export async function publishDraft(data: SiteData): Promise<void> {
  await setDoc(doc(getFirebaseDb(), PUBLISHED_DOC), { ...data, publishedAt: serverTimestamp() });
}
