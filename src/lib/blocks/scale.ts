// Content-scales-with-its-box math, shared by every place a block ever
// renders — the editor canvas (CanvasEditor.tsx), the mobile-reflow stack
// (ReflowedSection.tsx, used by both the editor's preview and real narrow
// visitors), and the public desktop renderer (PublicPage.tsx). A single
// source of truth here is what keeps "resizing a box visibly resizes its
// text" true identically everywhere that block is ever shown, rather than
// three separate approximations that could drift.
//
// The reference ("1.0 scale") size for each type is the same {w,h} a freshly
// added block starts at (see CanvasEditor.tsx's addBlock/DEFAULT_BLOCK_SIZE
// use) — resizing a block up from there scales its text up, down scales it
// down, and a block that's never been touched renders at exactly its
// type's normal, un-scaled size.
import type { BlockPosition } from './types';

export const DEFAULT_BLOCK_SIZE: Record<string, { w: number; h: number }> = {
  hero: { w: 700, h: 260 },
  'rich-text': { w: 420, h: 160 },
  image: { w: 360, h: 260 },
  'image-text': { w: 640, h: 280 },
  button: { w: 200, h: 60 },
  quote: { w: 480, h: 180 },
  divider: { w: 600, h: 40 },
  'contact-form': { w: 460, h: 420 },
  columns: { w: 900, h: 260 },
  carousel: { w: 640, h: 380 },
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;

/**
 * How far a block's current box departs from its type's reference size —
 * the factor text-bearing block views (HeroBlockView, RichTextBlockView,
 * QuoteBlockView, ImageTextBlockView's heading, ...) multiply their normal
 * font size by. Uses the geometric mean of the width ratio and height ratio
 * (not just width, and not raw area) so a box that's been dragged wider-
 * but-shorter (or taller-but-narrower) still yields one sensible scale
 * factor instead of a single axis dominating — same idea as how Canva/
 * Slides scale a text box's content when you drag a corner vs. an edge.
 * Clamped to [0.5, 2.5] so a block can never be resized into unreadably
 * tiny or absurdly oversized text.
 */
export function blockScale(type: string, position: Pick<BlockPosition, 'w' | 'h'> | undefined): number {
  const ref = DEFAULT_BLOCK_SIZE[type];
  if (!ref || !position || ref.w <= 0 || ref.h <= 0 || position.w <= 0 || position.h <= 0) return 1;
  const scale = Math.sqrt((position.w / ref.w) * (position.h / ref.h));
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/** Applies a scale factor to a base font size, with its own absolute px floor/ceiling — belt-and-suspenders on top of blockScale's own [0.5, 2.5] clamp, since a base size can vary a lot between fields (an eyebrow label vs. a big heading) and each needs its own sane readable bounds regardless of the box's scale factor. */
export function scaledFontSize(base: number, scale: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, base * scale));
}
