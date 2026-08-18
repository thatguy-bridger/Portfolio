import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from './client';
import { blocksToGroup, DEFAULT_SITE_DATA, newBlockId, newPageId, type CustomPage, type HomepageGroup, type SiteData, type SiteTile } from '../data/siteData';

const DRAFT_DOC = 'sites/draft';
const PUBLISHED_DOC = 'sites/published';
const VERSIONS_COLLECTION = 'siteVersions';
/** Keeps version history bounded — each publish reads/prunes at most this many docs, so the feature can't quietly run up Firestore usage over a long-lived site. */
const MAX_VERSIONS = 20;

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

/** One-time upgrade: old TileElement-based project pages become a single stacked group, same as any other legacy flat-block page. */
function migrateLegacyProjectPages(raw: unknown): CustomPage[] {
  if (!Array.isArray(raw)) return [];
  return (raw as LegacyProjectPage[]).map((p) => {
    const blocks = (p.elements ?? []).map((el) =>
      el.type === 'text'
        ? { id: newBlockId(), type: 'text' as const, content: el.content, size: 'md' as const }
        : { id: newBlockId(), type: 'image' as const, src: el.src, alt: el.alt, crop: el.crop as never },
    );
    return { id: newPageId(), path: p.slug, title: p.title, groups: [blocksToGroup(blocks)] };
  });
}

/** Migrates any button blocks' links (slug → path) within a block array. */
function migrateBlocks(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw;
  return raw.map((b) => (b && typeof b === 'object' && 'link' in b ? { ...b, link: migrateLink((b as { link: unknown }).link) } : b));
}

/** Migrates every group's blocks' links (slug → path) — groups nest a PageBlock inside each GroupBlock, one level deeper than a flat block list. */
function migrateGroups(raw: unknown): HomepageGroup[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Array<HomepageGroup & { blocks: Array<{ block?: unknown }> }>).map((g) => ({
    ...g,
    blocks: (g.blocks ?? []).map((gb) =>
      gb && typeof gb === 'object' && 'block' in gb && gb.block && typeof gb.block === 'object' && 'link' in gb.block
        ? { ...gb, block: { ...gb.block, link: migrateLink((gb.block as { link: unknown }).link) } }
        : gb,
    ),
  })) as HomepageGroup[];
}

/** One-time upgrade: pages saved before paths could have slashes carried a flat `slug` instead of `path`; pages saved before every page shared the homepage's group/canvas system carried a flat `blocks` list instead of `groups`. */
function migratePages(raw: unknown): CustomPage[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Array<CustomPage & { slug?: string; blocks?: unknown }>).map((p) => {
    const { slug, blocks, ...rest } = p;
    const path = rest.path ? rest.path : (slug ?? '');
    // A present-but-empty `groups` array means this page is already in the new format and
    // genuinely has zero sections — that must NOT fall through to the legacy-blocks branch
    // below, or every empty page would grow a spurious "Page content" group on every reload.
    const groups = Array.isArray(rest.groups) ? migrateGroups(rest.groups) : [blocksToGroup(migrateBlocks(blocks ?? []) as never)];
    return { ...rest, path, groups } as CustomPage;
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
  const widgets = Array.isArray(rest.widgets) ? rest.widgets : [];
  const homepageGroups = migrateGroups(rest.homepageGroups);
  const useFreeformHomepage = typeof rest.useFreeformHomepage === 'boolean' ? rest.useFreeformHomepage : false;
  const { projectPages: _legacy, ...withoutLegacy } = rest;
  return { ...DEFAULT_SITE_DATA, ...withoutLegacy, tiles, pages, blocks, widgets, homepageGroups, useFreeformHomepage } as SiteData;
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
  const db = getFirebaseDb();
  await setDoc(doc(db, PUBLISHED_DOC), { ...data, publishedAt: serverTimestamp() });
  await addDoc(collection(db, VERSIONS_COLLECTION), { data, publishedAt: serverTimestamp() });
  await pruneOldVersions();
}

async function pruneOldVersions(): Promise<void> {
  const snap = await getDocs(query(collection(getFirebaseDb(), VERSIONS_COLLECTION), orderBy('publishedAt', 'desc')));
  const excess = snap.docs.slice(MAX_VERSIONS);
  await Promise.all(excess.map((d) => deleteDoc(d.ref)));
}

export interface SiteVersion {
  id: string;
  data: SiteData;
  publishedAt: Timestamp | null;
}

/** Up to MAX_VERSIONS most recent publishes, newest first — this is the entire version history, there's never more than that many docs to read. */
export async function listVersions(): Promise<SiteVersion[]> {
  const snap = await getDocs(query(collection(getFirebaseDb(), VERSIONS_COLLECTION), orderBy('publishedAt', 'desc')));
  return snap.docs.map((d) => {
    const raw = d.data();
    return { id: d.id, data: normalizeSiteData(raw), publishedAt: (raw.publishedAt as Timestamp | undefined) ?? null };
  });
}
