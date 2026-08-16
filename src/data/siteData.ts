import type { BadgeColor } from '../components/ui/Badge';
import type { GlassCardAccent } from '../components/ui/GlassCard';
import { DEFAULT_BODY_FONT, DEFAULT_DISPLAY_FONT } from '../design-system/fonts';

export interface ImageCrop {
  /** 1 = fits the frame (object-fit: cover); up to ~3 to zoom in further */
  zoom: number;
  /** focal point, 0-100 — maps to CSS object-position / transform-origin */
  posX: number;
  posY: number;
}

export const DEFAULT_CROP: ImageCrop = { zoom: 1, posX: 50, posY: 50 };

export interface TileElement {
  id: string;
  type: 'text' | 'image';
  /** text elements */
  content?: string;
  /** image elements — a Firebase Storage download URL */
  src?: string;
  alt?: string;
  crop?: ImageCrop;
}

export interface TileLink {
  type: 'none' | 'external' | 'internal';
  /** external: full https:// URL */
  url?: string;
  /** internal: slug, resolves to /mywork/<slug> */
  slug?: string;
}

export interface SiteTile {
  id: string;
  title: string;
  description: string;
  accent: GlassCardAccent;
  colSpan: number;
  rowSpan: number;
  /** extra content blocks shown on the card face, below title/description */
  elements: TileElement[];
  link: TileLink;
}

export interface SiteSkill {
  label: string;
  color: BadgeColor;
}

export type PageBlockType = 'heading' | 'text' | 'image' | 'button' | 'divider';

export interface PageBlock {
  id: string;
  type: PageBlockType;
  /** heading/text */
  content?: string;
  /** heading/text size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** image */
  src?: string;
  alt?: string;
  crop?: ImageCrop;
  /** button */
  label?: string;
  link?: TileLink;
}

/**
 * A standalone, freely-creatable page — its own URL under /mywork/<slug>,
 * edited with the same endless block editor as the main page-content
 * section. A work tile can point its link at one of these, but a page
 * doesn't have to belong to any tile.
 */
export interface CustomPage {
  id: string;
  slug: string;
  title: string;
  blocks: PageBlock[];
}

export interface SiteData {
  hero: {
    eyebrow: string;
    headlineStart: string;
    headlineHighlight: string;
    headlineEnd: string;
    subtitle: string;
  };
  about: {
    text: string;
    skills: SiteSkill[];
  };
  contact: {
    heading: string;
    subtext: string;
    email: string;
  };
  tiles: SiteTile[];
  /** standalone pages under /mywork/<slug>, independent of any tile */
  pages: CustomPage[];
  /** freeform, endlessly-addable content section between Work and About */
  blocks: PageBlock[];
  accentId: string;
  customAccentHex: string;
  displayFontId: string;
  bodyFontId: string;
}

export const DEFAULT_SITE_DATA: SiteData = {
  hero: {
    eyebrow: 'Product Designer',
    headlineStart: 'Designing calm,',
    headlineHighlight: 'useful',
    headlineEnd: 'software.',
    subtitle:
      "I partner with startups to turn fuzzy ideas into shipped products — from first sketch to design system.",
  },
  about: {
    text:
      "I'm a product designer who ships. Ten years across fintech, travel, and creative tools — I care most about the gap between a good idea and a good product, and closing it fast without losing the craft.",
    skills: [
      { label: 'Product design', color: 'indigo' },
      { label: 'Design systems', color: 'purple' },
      { label: 'Prototyping', color: 'orange' },
      { label: 'Front-end', color: 'green' },
      { label: 'Brand', color: 'pink' },
    ],
  },
  contact: {
    heading: "Let's work together",
    subtext: "Have a project in mind? Drop your email and I'll get back to you within a day.",
    email: 'hello@example.com',
  },
  tiles: [
    { id: 'nimbus', title: 'Nimbus Finance', description: 'Redesigning a banking app for clarity.', accent: 'indigo', colSpan: 3, rowSpan: 2, elements: [], link: { type: 'none' } },
    { id: 'loop', title: 'Loop Studio', description: 'Brand + web for a design collective.', accent: 'purple', colSpan: 2, rowSpan: 1, elements: [], link: { type: 'none' } },
    { id: 'fielda', title: 'Fielda', description: 'Field-service scheduling, reimagined.', accent: 'orange', colSpan: 1, rowSpan: 1, elements: [], link: { type: 'none' } },
    { id: 'aperture', title: 'Aperture', description: 'A photo-first portfolio template.', accent: 'pink', colSpan: 2, rowSpan: 2, elements: [], link: { type: 'none' } },
    { id: 'northwind', title: 'Northwind Travel', description: 'Booking flow for a boutique travel agency.', accent: 'indigo', colSpan: 2, rowSpan: 1, elements: [], link: { type: 'none' } },
    { id: 'kiln', title: 'Kiln', description: 'Ceramics studio storefront + class booking.', accent: 'orange', colSpan: 1, rowSpan: 1, elements: [], link: { type: 'none' } },
  ],
  pages: [],
  blocks: [],
  accentId: 'indigo',
  customAccentHex: '#6366f1',
  displayFontId: DEFAULT_DISPLAY_FONT.id,
  bodyFontId: DEFAULT_BODY_FONT.id,
};

export function newTileId() {
  return `tile-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newElementId() {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newBlockId() {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newPageId() {
  return `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Ensures a slug is non-empty and doesn't collide with an existing page. */
export function uniqueSlug(base: string, existing: CustomPage[], ignoreId?: string): string {
  const clean = slugify(base) || 'page';
  const taken = new Set(existing.filter((p) => p.id !== ignoreId).map((p) => p.slug));
  if (!taken.has(clean)) return clean;
  let i = 2;
  while (taken.has(`${clean}-${i}`)) i++;
  return `${clean}-${i}`;
}
