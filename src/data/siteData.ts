import type { BadgeColor } from '../components/ui/Badge';
import type { GlassCardAccent } from '../components/ui/GlassCard';
import { DEFAULT_BODY_FONT, DEFAULT_DISPLAY_FONT } from '../design-system/fonts';

export interface ImageCrop {
  /** 1 = the whole photo, at its own natural aspect ratio, no cropping; >1 zooms in around the focal point */
  zoom: number;
  /** focal point, 0-100 — where the zoom is centered / anchored */
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
  /** natural pixel size of the uploaded image, used to render at its own aspect ratio with no forced crop */
  width?: number;
  height?: number;
}

export interface TileLink {
  type: 'none' | 'external' | 'internal';
  /** external: full https:// URL */
  url?: string;
  /** internal: a CustomPage's path, e.g. "school/clubs/justserve" */
  path?: string;
}

export interface SiteTile {
  id: string;
  title: string;
  description: string;
  accent: GlassCardAccent;
  colSpan: number;
  rowSpan: number;
  /** freeform position, in fine grid units (finer than colSpan/rowSpan's cell size) — undefined until the tile is first dragged, auto-packed until then */
  x?: number;
  y?: number;
  /** extra content blocks shown on the card face, below title/description */
  elements: TileElement[];
  link: TileLink;
}

export interface SiteSkill {
  label: string;
  color: BadgeColor;
}

export type PageBlockType = 'heading' | 'text' | 'image' | 'button' | 'divider' | 'model3d' | 'widget' | 'video' | 'gallery' | 'embed' | 'code';

/** 3D model formats the viewer can load, by file extension. */
export const MODEL_FORMATS = ['.glb', '.gltf', '.obj', '.fbx', '.stl', '.ply'] as const;
export type Model3DFormat = (typeof MODEL_FORMATS)[number];

/** One photo in a gallery block — same natural-size/crop model as a standalone image block. */
export interface GalleryImage {
  id: string;
  src: string;
  width?: number;
  height?: number;
  alt?: string;
}

export type EmbedKind = 'youtube' | 'vimeo' | 'maps' | 'twitter' | 'generic';

/** Per-block text styling — overrides the site-wide font for just this one heading/text block. */
export interface TextEffects {
  /** a FontDef id from design-system/fonts.ts; unset = inherit the site's display/body font */
  fontId?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  /** any CSS color, e.g. a hex string; unset = inherit the normal heading/body color */
  color?: string;
  /** extra letter-spacing in px, can be negative */
  letterSpacing?: number;
  shadow?: boolean;
}

export interface PageBlock {
  id: string;
  type: PageBlockType;
  /** heading/text */
  content?: string;
  /** heading/text size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** heading/text per-block font + effects */
  textEffects?: TextEffects;
  /** image */
  src?: string;
  alt?: string;
  crop?: ImageCrop;
  /** natural pixel size of the uploaded image, used to render at its own aspect ratio with no forced crop */
  width?: number;
  height?: number;
  /** button */
  label?: string;
  link?: TileLink;
  /** 3d model — a Firebase Storage download URL, plus the format so the viewer knows which loader to use */
  modelSrc?: string;
  modelFormat?: Model3DFormat;
  modelFileName?: string;
  /** widget instance */
  widgetId?: string;
  /** per-instance values for the referenced widget's "instance"-scoped variables, keyed by variable id */
  widgetValues?: Record<string, string>;
  /** video — a Firebase Storage download URL for an uploaded file */
  videoSrc?: string;
  videoFileName?: string;
  /** gallery */
  galleryImages?: GalleryImage[];
  /** embed — the raw URL the user pasted (a YouTube/Vimeo/Maps/etc link); the kind is detected from it */
  embedUrl?: string;
  /** custom code — raw HTML/CSS/JS, rendered inside a sandboxed iframe */
  codeHtml?: string;
}

export type WidgetVariableType = 'text' | 'number' | 'color' | 'image' | 'date' | 'boolean';
export type WidgetVariableScope = 'global' | 'instance';

/**
 * A typed value a widget's elements can bind to instead of a static value.
 * "global" variables share one value across every place the widget is
 * used; "instance" variables get filled in separately each time the
 * widget is dropped onto a page.
 */
export interface WidgetVariable {
  id: string;
  name: string;
  type: WidgetVariableType;
  scope: WidgetVariableScope;
  /** the value for a global variable, or the fallback shown for an instance variable until it's filled in — always stored as a string (numbers/booleans/dates encoded as strings, color as hex, image as a Storage URL) */
  defaultValue: string;
  /**
   * Where the value comes from. "static" (default) uses defaultValue as-is.
   * "url" fetches JSON from sourceUrl client-side (at edit time and on every
   * page load) and plucks sourcePath out of it, falling back to
   * defaultValue while loading or if the fetch/CORS/path fails. An instance
   * override in WidgetInstanceValuesForm still takes priority over either.
   */
  source?: 'static' | 'url';
  sourceUrl?: string;
  /** dot/bracket path into the fetched JSON, e.g. "data.temp" or "results.0.name"; empty = use the whole response (coerced to a string) */
  sourcePath?: string;
}

export type WidgetElementType = 'text' | 'image' | 'shape';

/** One positioned piece of a widget's canvas. Position/size are percentages of the canvas, so a widget scales cleanly at any width it's placed at. */
export interface WidgetElement {
  id: string;
  type: WidgetElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  /** if set, this element's value comes from that variable instead of the static field(s) below */
  boundVariableId?: string;
  /** text */
  content?: string;
  fontSizePx?: number;
  align?: 'left' | 'center' | 'right';
  textEffects?: TextEffects;
  /** image */
  src?: string;
  crop?: ImageCrop;
  /** shape */
  shapeKind?: 'rect' | 'circle';
  fill?: string;
  radius?: number;
}

/** A reusable, user-built widget — a small fixed-aspect canvas of elements, some bound to typed variables. */
export interface Widget {
  id: string;
  name: string;
  /** canvas aspect ratio as a CSS aspect-ratio value, e.g. "4 / 3" */
  aspect: string;
  elements: WidgetElement[];
  variables: WidgetVariable[];
}

/**
 * A standalone, freely-creatable page at any URL path (e.g.
 * "school/clubs/justserve", not just under a fixed prefix), edited with the
 * same endless block editor as the main page-content section and given its
 * own tab in the Builder. A work tile can point its link at one of these,
 * but a page doesn't have to belong to any tile.
 */
export interface CustomPage {
  id: string;
  /** full URL path, no leading/trailing slash, e.g. "school/clubs/justserve" */
  path: string;
  title: string;
  blocks: PageBlock[];
}

/** Routes a custom page's path can never occupy — they're the app's own static routes. */
export const RESERVED_PATHS = new Set(['login', 'edit', 'edit/widgets', 'edit/messages']);

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
  /** standalone pages at any URL path, independent of any tile */
  pages: CustomPage[];
  /** freeform, endlessly-addable content section between Work and About */
  blocks: PageBlock[];
  /** reusable widgets, built in the Widget Studio, insertable via a "widget" block anywhere */
  widgets: Widget[];
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
  widgets: [],
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

export function newWidgetId() {
  return `widget-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newWidgetElementId() {
  return `wel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newWidgetVariableId() {
  return `wvar-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newGalleryImageId() {
  return `gimg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Slugifies each "/"-separated segment of a path and drops empty ones, e.g. "School/ Clubs //JustServe" → "school/clubs/justserve". */
export function sanitizePath(input: string): string {
  return input.split('/').map(slugify).filter(Boolean).join('/');
}

/** Ensures a path is non-empty, isn't a reserved route, and doesn't collide with an existing page. */
export function uniquePath(base: string, existing: CustomPage[], ignoreId?: string): string {
  let clean = sanitizePath(base) || 'page';
  if (RESERVED_PATHS.has(clean)) clean = `${clean}-page`;
  const taken = new Set(existing.filter((p) => p.id !== ignoreId).map((p) => p.path));
  if (!taken.has(clean)) return clean;
  let i = 2;
  while (taken.has(`${clean}-${i}`)) i++;
  return `${clean}-${i}`;
}
