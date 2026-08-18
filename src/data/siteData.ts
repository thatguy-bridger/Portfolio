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

export type PageBlockType = 'heading' | 'text' | 'image' | 'button' | 'divider' | 'model3d' | 'widget' | 'video' | 'gallery' | 'embed' | 'code' | 'repeater' | 'workgrid' | 'horizontal-scroll';

/** One manually-entered repetition of a repeater block's widget, keyed by the widget's instance-variable ids — same shape as a single widget block's widgetValues. */
export interface RepeaterItem {
  id: string;
  values: Record<string, string>;
}

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

export type TextBoxShape = 'none' | 'rounded' | 'pill' | 'square';

/** Per-block text styling — overrides the site-wide font for just this one heading/text block. */
export interface TextEffects {
  /** a FontDef id from design-system/fonts.ts; unset = inherit the site's display/body font */
  fontId?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  /** any CSS color, e.g. a hex string; unset = inherit the normal heading/body color */
  color?: string;
  /** fills the text's own box, like a highlight/badge; unset = transparent */
  backgroundColor?: string;
  /** the shape of that box when backgroundColor (or this) is set; 'none' = no box even if a background color is chosen */
  boxShape?: TextBoxShape;
  /** extra letter-spacing in px, can be negative */
  letterSpacing?: number;
  shadow?: boolean;
}

export interface PageBlock {
  id: string;
  type: PageBlockType;
  /** heading/text */
  content?: string;
  /** legacy heading/text size tier — still used as a fallback default when fontSizePx is unset, so old content keeps its original size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** heading/text font size in px, set directly via the size input; unset = fall back to the size tier above */
  fontSizePx?: number;
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
  /** gallery, and horizontal-scroll (which reuses the same photo list/editor, just laid out as a sideways-scrolling row) */
  galleryImages?: GalleryImage[];
  /** embed — the raw URL the user pasted (a YouTube/Vimeo/Maps/etc link); the kind is detected from it */
  embedUrl?: string;
  /** custom code — raw HTML/CSS/JS, rendered inside a sandboxed iframe */
  codeHtml?: string;
  /** repeater — repeats a widget once per data item, either typed in by hand or pulled from a URL */
  repeaterWidgetId?: string;
  repeaterMode?: 'manual' | 'url';
  repeaterItems?: RepeaterItem[];
  repeaterSourceUrl?: string;
  /** dot/bracket path to the array within the fetched JSON, e.g. "results" or "data.items"; empty = the response itself is the array */
  repeaterSourcePath?: string;
  /** maps each of the widget's instance-scoped variable ids to a dot/bracket path within one array item, e.g. { "wvar-1": "name", "wvar-2": "stats.followers" } */
  repeaterFieldMap?: Record<string, string>;
  /** how many repetitions per row in the grid */
  repeaterColumns?: number;
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
  /** the same freeform group/canvas system the homepage uses — every page is edited and rendered the same way. */
  groups: HomepageGroup[];
}

/** Routes a custom page's path can never occupy — they're the app's own static routes. */
export const RESERVED_PATHS = new Set(['login', 'edit', 'edit/widgets', 'edit/messages', 'edit/homepage', 'edit/preview', 'edit/history']);

/** The freeform homepage canvas is authored at this fixed design width (px); it's centered and capped at this width on wider screens. */
export const GROUP_CANVAS_WIDTH = 1200;

/** A separate, narrower design width a group's blocks can optionally be re-arranged at for mobile — see GroupBlock.mobilePosition. Below MOBILE_BREAKPOINT (GroupRenderer), a group with no customized mobile layout still falls back to a simple stacked column. */
export const MOBILE_CANVAS_WIDTH = 390;

export type EntranceAnimation = 'none' | 'fade' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale';

/**
 * A continuous, scroll-position-driven effect — distinct from EntranceAnimation,
 * which fires once and stays. 'parallax' shifts the block opposite the scroll
 * direction; 'progress' fades/scales it in and out as it crosses the viewport
 * (reversible, unlike a one-shot reveal); 'sticky' pins it to the viewport while
 * its group section scrolls past.
 */
export type ScrollEffectType = 'none' | 'parallax' | 'progress' | 'sticky';
export type ScrollEffectPreset = 'subtle' | 'medium' | 'dramatic';

export interface ScrollEffectConfig {
  type: ScrollEffectType;
  /** unset (unless type is 'sticky') means "use the advanced intensity value" instead of a named preset */
  preset?: ScrollEffectPreset;
  /** 0-100 advanced override for parallax/progress strength, used when preset is unset */
  intensity?: number;
  /** px from the top of the viewport while pinned (sticky only) */
  stickyOffset?: number;
}

/** Visual overrides for one freeform block, layered on top of whatever its content normally looks like. */
export interface GroupBlockStyle {
  background?: string;
  backgroundImage?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  shadow?: boolean;
}

export interface GroupBlockPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One freely-positioned block on a homepage group's canvas. */
export interface GroupBlock {
  id: string;
  block: PageBlock;
  position: GroupBlockPosition;
  zIndex: number;
  locked?: boolean;
  /** blocks sharing the same groupMemberId move and resize together when dragged as a set */
  groupMemberId?: string;
  hideOnMobile?: boolean;
  style?: GroupBlockStyle;
  animation?: EntranceAnimation;
  /** an independent position/size for this block at MOBILE_CANVAS_WIDTH — unset means the group hasn't been customized for mobile yet, and falls back to a simple stacked column */
  mobilePosition?: GroupBlockPosition;
  /** true once this block's desktop position has changed since mobilePosition was last touched — surfaced as a "review mobile layout" flag in the editor */
  mobileStale?: boolean;
  /** continuous scroll-driven motion — separate from the one-shot entrance `animation` above. Disabled under reduced-motion (except sticky, which isn't motion) and on narrow/mobile viewports for parallax and sticky specifically. */
  scrollEffect?: ScrollEffectConfig;
}

/**
 * A named, freely orderable/removable section of the freeform homepage —
 * what Hero, About, Work, and Contact become once a site switches over.
 * Unlike those old fixed components, a group is just a background/height
 * plus a canvas of freely positioned blocks, so any number of any kind can
 * exist in any order.
 */
export interface HomepageGroup {
  id: string;
  name: string;
  background?: string;
  backgroundImage?: string;
  /** px; 0/undefined = auto-height from content */
  minHeight?: number;
  paddingY?: number;
  blocks: GroupBlock[];
  /** opts this section in as a scroll-snap stop — off by default; the page only applies snap-scrolling at all once at least one group has this on */
  scrollSnap?: boolean;
}

/** Reasonable starting heights (px) for a block dropped into a stacked, full-width column — used only to seed a position, never read again once the user has actually resized something. */
const LEGACY_BLOCK_HEIGHT: Record<PageBlockType, number> = {
  heading: 90,
  text: 140,
  image: 400,
  button: 70,
  divider: 40,
  model3d: 420,
  widget: 300,
  video: 420,
  gallery: 400,
  embed: 400,
  code: 300,
  repeater: 400,
  workgrid: 560,
  'horizontal-scroll': 300,
};

/**
 * One-time upgrade path: turns an old flat, linearly-ordered block list
 * (from before every page shared the homepage's freeform group/canvas
 * system) into a single stacked group, full-width, in the same order —
 * so existing page content survives the migration untouched, just now
 * freely repositionable like everything else.
 */
export function blocksToGroup(blocks: PageBlock[], name = 'Page content'): HomepageGroup {
  const margin = 40;
  const width = GROUP_CANVAS_WIDTH - margin * 2;
  const gap = 24;
  let cursor = margin;
  const groupBlocks: GroupBlock[] = blocks.map((block, i) => {
    const h = LEGACY_BLOCK_HEIGHT[block.type] ?? 200;
    const position = { x: margin, y: cursor, w: width, h };
    cursor += h + gap;
    return { id: newGroupBlockId(), block, position, zIndex: i + 1 };
  });
  return { id: newGroupId(), name, blocks: groupBlocks };
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
  /** standalone pages at any URL path, independent of any tile */
  pages: CustomPage[];
  /** freeform, endlessly-addable content section between Work and About */
  blocks: PageBlock[];
  /** reusable widgets, built in the Widget Studio, insertable via a "widget" block anywhere */
  widgets: Widget[];
  /** the freeform homepage's sections — empty/unused until useFreeformHomepage is switched on */
  homepageGroups: HomepageGroup[];
  /** opt-in switch: false (default) renders the classic Hero/Work/About/Contact stack; true renders homepageGroups instead. Never flips itself — only an explicit action in the Builder sets it, so the live site never goes blank mid-rebuild. */
  useFreeformHomepage: boolean;
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
  homepageGroups: [],
  useFreeformHomepage: false,
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

export function newRepeaterItemId() {
  return `rpt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newGroupId() {
  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newGroupBlockId() {
  return `gblk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
