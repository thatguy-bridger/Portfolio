// Single source of truth for block types — adapted from Alta-Seminary's
// src/blocks/registry.js pattern (thatguy-bridger/Alta-Seminary). Adding a
// new block type is one entry here (plus a renderer in
// src/components/blocks/) — both the "Add block" picker and the settings
// panel are driven off this registry, not hand-built per type like the old
// app's BlockContent.tsx/PageEditor.tsx were.
//
// field.kind: 'text' | 'richtext' | 'select' | 'image' | 'toggle'.
// field.showIf(props) restricts a field to when another prop has a given value.
// field.inline (default true for text/richtext/image, always false for
// select/toggle) — false forces a field into the side settings panel instead
// of being directly click-to-edit on the canvas (e.g. a button's URL:
// clicking a live button shouldn't jump you into editing its href).
import type { CanvasBlock, PageSection, SlotItem } from './types';

export type FieldKind = 'text' | 'richtext' | 'select' | 'image' | 'toggle';

export interface SelectOption {
  value: string;
  label: string;
}

export interface BlockField {
  key: string;
  kind: FieldKind;
  label: string;
  options?: SelectOption[];
  /** restricts this field to when the block's current props satisfy this predicate */
  showIf?: (props: Record<string, unknown>) => boolean;
  /** default: true for text/richtext/image, always false for select/toggle regardless of this flag */
  inline?: boolean;
  placeholder?: string;
}

export interface BlockDefinition {
  label: string;
  category: string;
  /** a short glyph standing in for a real icon — see readme.md's Iconography note: plain glyphs here, swap for a Lucide icon set in production */
  icon: string;
  description: string;
  defaultProps: Record<string, unknown>;
  fields: BlockField[];
  /** container blocks (columns/carousel) hold nested SlotItem[] under this props key instead of/alongside their own fields — the canvas handles drag-in/out for these specially, see dragInOut.ts */
  slotsKey?: 'columns' | 'items';
  /** how many slots a container block's slotsKey array holds, and which registry type each seeds with when the block is first created */
  slotCount?: number;
  slotSeedType?: string;
}

export const BLOCK_CATEGORIES = ['Layout', 'Media', 'Informational', 'Interactive'] as const;

export const BLOCK_REGISTRY: Record<string, BlockDefinition> = {
  hero: {
    label: 'Hero / Heading',
    category: 'Informational',
    icon: 'H',
    description: 'A big heading with an optional subheading — great for the top of a section.',
    defaultProps: {
      eyebrow: '', heading: 'A big statement', subheading: '', align: 'center',
      headingSize: 'normal', textColor: 'auto',
    },
    fields: [
      { key: 'eyebrow', kind: 'text', label: 'Eyebrow (small label above heading)' },
      { key: 'heading', kind: 'text', label: 'Heading' },
      { key: 'subheading', kind: 'text', label: 'Subheading' },
      { key: 'align', kind: 'select', label: 'Alignment', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
      { key: 'headingSize', kind: 'select', label: 'Heading size', options: [{ value: 'normal', label: 'Normal' }, { value: 'large', label: 'Large' }, { value: 'xlarge', label: 'Extra large' }] },
      { key: 'textColor', kind: 'select', label: 'Text color', options: [{ value: 'auto', label: 'Auto' }, { value: 'light', label: 'Force light' }, { value: 'dark', label: 'Force dark' }] },
    ],
  },
  'rich-text': {
    label: 'Rich Text',
    category: 'Informational',
    icon: 'T',
    description: 'A block of formatted text.',
    defaultProps: { content: 'Write something here.', textAlign: 'left', fontSize: 'normal' },
    fields: [
      { key: 'content', kind: 'richtext', label: 'Content' },
      { key: 'fontSize', kind: 'select', label: 'Font size', options: [{ value: 'small', label: 'Small' }, { value: 'normal', label: 'Normal' }, { value: 'large', label: 'Large' }] },
      { key: 'textAlign', kind: 'select', label: 'Text alignment', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
    ],
  },
  image: {
    label: 'Image',
    category: 'Media',
    icon: 'I',
    description: 'A single photo, optionally with a caption and a link.',
    defaultProps: { imageUrl: '', alt: '', caption: '', corners: 'rounded', shadow: true, link: '' },
    fields: [
      { key: 'imageUrl', kind: 'image', label: 'Image' },
      // inline:false — clicking an image inline edits the image itself
      // (see EditableImage); alt text has no on-canvas affordance of its
      // own, so it only ever appears in the settings panel.
      { key: 'alt', kind: 'text', label: 'Alt text (required for accessibility)', inline: false },
      { key: 'caption', kind: 'text', label: 'Caption' },
      { key: 'link', kind: 'text', label: 'Link (optional — makes the image clickable)', inline: false },
      { key: 'corners', kind: 'select', label: 'Corners', options: [{ value: 'sharp', label: 'Sharp' }, { value: 'rounded', label: 'Rounded' }] },
      { key: 'shadow', kind: 'toggle', label: 'Shadow' },
    ],
  },
  'image-text': {
    label: 'Image + Text',
    category: 'Media',
    icon: 'IT',
    description: 'A photo next to a block of text, side by side.',
    defaultProps: { imageUrl: '', alt: '', heading: '', body: '', imagePosition: 'left', gap: 'lg' },
    fields: [
      { key: 'imageUrl', kind: 'image', label: 'Image' },
      { key: 'alt', kind: 'text', label: 'Alt text', inline: false },
      { key: 'heading', kind: 'text', label: 'Heading' },
      { key: 'body', kind: 'richtext', label: 'Body' },
      { key: 'imagePosition', kind: 'select', label: 'Image position', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
      { key: 'gap', kind: 'select', label: 'Gap', options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }] },
    ],
  },
  button: {
    label: 'Button / CTA',
    category: 'Interactive',
    icon: '➜',
    description: 'A clickable button linking to another page or an external URL.',
    defaultProps: { label: 'Click me', href: '', variant: 'primary', size: 'md', newTab: false },
    fields: [
      { key: 'label', kind: 'text', label: 'Label' },
      { key: 'href', kind: 'text', label: 'Link (page path or URL)', inline: false },
      { key: 'variant', kind: 'select', label: 'Style', options: [{ value: 'primary', label: 'Primary' }, { value: 'secondary', label: 'Secondary' }, { value: 'outline', label: 'Outline' }] },
      { key: 'size', kind: 'select', label: 'Size', options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }] },
      { key: 'newTab', kind: 'toggle', label: 'Open in new tab' },
    ],
  },
  quote: {
    label: 'Quote',
    category: 'Informational',
    icon: '"',
    description: 'A pulled quote, with an optional citation.',
    defaultProps: { quoteText: 'Say something quotable.', citation: '', align: 'center', size: 'normal' },
    fields: [
      { key: 'quoteText', kind: 'richtext', label: 'Quote' },
      { key: 'citation', kind: 'text', label: 'Citation (e.g. a name or source)' },
      { key: 'size', kind: 'select', label: 'Size', options: [{ value: 'normal', label: 'Normal' }, { value: 'large', label: 'Large' }] },
      { key: 'align', kind: 'select', label: 'Alignment', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
    ],
  },
  'contact-form': {
    label: 'Contact Form',
    category: 'Interactive',
    icon: '@',
    description: 'A name/email/message form that submits to your inbox.',
    defaultProps: { heading: 'Get in touch', subheading: '', submitLabel: 'Send message' },
    fields: [
      { key: 'heading', kind: 'text', label: 'Heading' },
      { key: 'subheading', kind: 'text', label: 'Subheading' },
      { key: 'submitLabel', kind: 'text', label: 'Submit button label', inline: false },
    ],
  },
  divider: {
    label: 'Divider',
    category: 'Layout',
    icon: '—',
    description: 'A simple line or blank space to separate content.',
    defaultProps: { style: 'line', size: 'md' },
    fields: [
      { key: 'style', kind: 'select', label: 'Style', options: [{ value: 'line', label: 'Line' }, { value: 'space', label: 'Space only' }] },
      { key: 'size', kind: 'select', label: 'Size', options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }] },
    ],
  },
  columns: {
    label: 'Columns',
    category: 'Layout',
    icon: '▥',
    description: 'Two or three side-by-side columns — drag any block into a column to nest it there.',
    // `columns` is a fixed-length array of slots (only the first
    // `columnCount` render) — each slot is {id, type, props}, where `type`
    // is a real BLOCK_REGISTRY key, so a column can hold any block type
    // (Alta-Seminary's ColumnsBlock.jsx shape).
    defaultProps: {
      columnCount: '2', gap: 'lg',
      columns: [] as SlotItem[],
    },
    fields: [
      { key: 'columnCount', kind: 'select', label: 'Number of columns', options: [{ value: '2', label: '2' }, { value: '3', label: '3' }] },
      { key: 'gap', kind: 'select', label: 'Gap', options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }] },
    ],
    slotsKey: 'columns',
    slotCount: 3,
    slotSeedType: 'rich-text',
  },
  carousel: {
    label: 'Carousel / Slider',
    category: 'Media',
    icon: '◂▸',
    description: 'A sliding set of slides visitors can click through — drag any block into a slide to nest it there.',
    defaultProps: {
      items: [] as SlotItem[],
      autoplay: false, loop: true, showArrows: true, showDots: true, aspectRatio: '16:9',
    },
    fields: [
      { key: 'aspectRatio', kind: 'select', label: 'Slide aspect ratio', options: [{ value: '21:9', label: '21:9 (ultra-wide)' }, { value: '16:9', label: '16:9' }, { value: '4:3', label: '4:3' }, { value: '1:1', label: 'Square' }] },
      { key: 'autoplay', kind: 'toggle', label: 'Auto-advance' },
      { key: 'loop', kind: 'toggle', label: 'Loop back to start' },
      { key: 'showArrows', kind: 'toggle', label: 'Show prev/next arrows' },
      { key: 'showDots', kind: 'toggle', label: 'Show dot indicators' },
    ],
    slotsKey: 'items',
    slotCount: 3,
    slotSeedType: 'image',
  },
};

export const BLOCK_TYPES = Object.keys(BLOCK_REGISTRY);

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Deep-clones a block type's defaultProps into a fresh props object — never a shallow spread, since e.g. columns/items are arrays that would otherwise be shared by reference across every instance of that type. */
function cloneDefaultProps(type: string): Record<string, unknown> {
  const def = BLOCK_REGISTRY[type];
  if (!def) throw new Error(`Unknown block type: ${type}`);
  return structuredClone(def.defaultProps);
}

/** Creates one nested slot item (a Columns column or Carousel slide) of the given registry type, with a fresh unique id. */
export function createSlotItem(type: string): SlotItem {
  return { id: newId(), type, props: cloneDefaultProps(type) };
}

/** Creates a block's {id, type, props} — for a container type (columns/carousel), also seeds its slotsKey array with slotCount fresh slot items so it renders with real (if empty) content immediately, each with its own unique id. */
export function createBlock(type: string): { id: string; type: string; props: Record<string, unknown> } {
  const def = BLOCK_REGISTRY[type];
  if (!def) throw new Error(`Unknown block type: ${type}`);
  const props = cloneDefaultProps(type);
  if (def.slotsKey && def.slotCount) {
    props[def.slotsKey] = Array.from({ length: def.slotCount }, () => createSlotItem(def.slotSeedType ?? 'rich-text'));
  }
  return { id: newId(), type, props };
}

/** Creates a positioned top-level CanvasBlock ready to drop onto a section's canvas. */
export function createCanvasBlock(type: string, position: CanvasBlock['position'], zIndex: number): CanvasBlock {
  const base = createBlock(type);
  return { ...base, position, zIndex };
}

export function createSection(name = 'New section'): PageSection {
  return { id: newId(), name, blocks: [] };
}

export function newBlockId(): string {
  return newId();
}

/** Clones an existing top-level block (new id, and fresh ids for any nested slot items so a duplicated Columns/Carousel doesn't share slot ids with the original), offset slightly so it's visibly a second block rather than exactly overlapping the first. */
export function duplicateBlock(block: CanvasBlock): CanvasBlock {
  const props = structuredClone(block.props);
  for (const key of ['columns', 'items'] as const) {
    if (Array.isArray(props[key])) {
      props[key] = (props[key] as SlotItem[]).map((s) => ({ ...s, id: newId() }));
    }
  }
  return {
    id: newId(),
    type: block.type,
    props,
    position: { ...block.position, x: block.position.x + 24, y: block.position.y + 24 },
    zIndex: block.zIndex + 1,
  };
}

/** Content fields (text/richtext/image) render as click-to-edit directly on the canvas by default; `inline: false` opts a field out (e.g. URLs) into the settings panel. select/toggle fields never render inline regardless of the flag — there's no sensible on-canvas affordance for them. */
export function isInlineField(field: BlockField): boolean {
  if (field.kind === 'select' || field.kind === 'toggle') return false;
  return field.inline !== false;
}

/** Fields a block type's settings panel should show for its current props (inline-eligible fields excluded — those are edited on the canvas itself — filtered further by each field's own showIf). */
export function panelFields(type: string, props: Record<string, unknown>): BlockField[] {
  const def = BLOCK_REGISTRY[type];
  if (!def) return [];
  return def.fields.filter((f) => !isInlineField(f)).filter((f) => !f.showIf || f.showIf(props));
}

/** Fields a block type renders inline, directly on the canvas, for its current props. */
export function inlineFields(type: string, props: Record<string, unknown>): BlockField[] {
  const def = BLOCK_REGISTRY[type];
  if (!def) return [];
  return def.fields.filter(isInlineField).filter((f) => !f.showIf || f.showIf(props));
}
