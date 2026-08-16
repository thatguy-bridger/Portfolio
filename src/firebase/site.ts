import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, type Timestamp } from 'firebase/firestore';
import { getFirebaseDb } from './client';
import { DEFAULT_SITE_DATA, type SiteData, type SiteTile } from '../data/siteData';

const DRAFT_DOC = 'sites/draft';
const PUBLISHED_DOC = 'sites/published';

export interface StoredSite {
  data: SiteData;
  updatedAt?: Timestamp;
}

function normalizeTile(raw: Record<string, unknown>): SiteTile {
  return {
    elements: [],
    link: { type: 'none' },
    ...raw,
  } as unknown as SiteTile;
}

/**
 * Fills in fields added after a document was first written (elements, link,
 * projectPages) so older saved sites keep working without losing content.
 */
function normalizeSiteData(raw: Record<string, unknown>): SiteData {
  const { updatedAt: _u, publishedAt: _p, ...rest } = raw;
  const tiles = Array.isArray(rest.tiles) ? (rest.tiles as Record<string, unknown>[]).map(normalizeTile) : DEFAULT_SITE_DATA.tiles;
  const projectPages = Array.isArray(rest.projectPages) ? rest.projectPages : [];
  return { ...DEFAULT_SITE_DATA, ...rest, tiles, projectPages } as SiteData;
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
