// Shared types for the block-registry-driven freeform canvas (Phase 2).
//
// Storage shape: a page's `draft_blocks` / `published_blocks` jsonb column
// (supabase/migrations/0001_init.sql) holds a `PageSection[]` — this file's
// `PageBlocks`. Each section is a named freeform canvas (its own background/
// height/padding, mirroring the old app's HomepageGroup) containing
// absolutely-positioned top-level blocks. A block's `props` are whatever
// shape BLOCK_REGISTRY[block.type].defaultProps defines (see registry.ts).
//
// Dropped vs. the old HomepageGroup/GroupBlock model: `mobilePosition` /
// `mobileStale` (mobile is now automatic reflow, see reflow.ts — there is no
// separate mobile layout to author or go stale), `groupMemberId` (multi-
// block grouping — not part of this phase's scope), and per-block
// `animation`/`scrollEffect` (Phase 3: Motion, per QA_CHECKLIST.md — adding
// them later is an additive, non-breaking field on CanvasBlock).

/** A block's absolute position/size on its section's canvas, in px at DESKTOP_CANVAS_WIDTH design width. Freeform only applies at desktop width — see reflow.ts for how narrow viewports render instead. */
export interface BlockPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * One item living inside a nested container block's slot array (a Columns
 * block's `props.columns`, a Carousel block's `props.items`) — Alta-
 * Seminary's shape (src/blocks/ColumnsBlock.jsx, CarouselBlock.jsx):
 * `type` is a real BLOCK_REGISTRY key (or, for Carousel only, the pseudo-type
 * 'media' — a plain image+caption slide with no settings panel of its own),
 * `props` shaped like that type's own defaultProps. Dragging a top-level
 * CanvasBlock into a slot converts it to one of these (dropping its
 * position/zIndex, which a slot doesn't need); dragging it back out converts
 * it back (see dragInOut.ts).
 */
export interface SlotItem {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

/** One freely-positioned, top-level block on a section's canvas. */
export interface CanvasBlock {
  id: string;
  /** a BLOCK_REGISTRY key, e.g. 'hero' | 'columns' | 'carousel' | ... */
  type: string;
  props: Record<string, unknown>;
  position: BlockPosition;
  /** stacking order among this section's blocks — higher renders on top */
  zIndex: number;
  /** locked blocks can't be dragged/resized/selected-for-delete, but stay visible and editable inline */
  locked?: boolean;
}

/**
 * A named, freely orderable section of a page's freeform canvas — what a
 * Hero/Work/About/Contact "section" is in this model. Unlike a fixed
 * component, a section is just a background/height plus a canvas of freely
 * positioned blocks, so any number of any kind can exist in any order.
 */
export interface PageSection {
  id: string;
  name: string;
  background?: string;
  backgroundImage?: string;
  /** px; 0/undefined = auto-height from content */
  minHeight?: number;
  paddingY?: number;
  blocks: CanvasBlock[];
}

/** The full shape stored in `pages.draft_blocks` / `pages.published_blocks`. */
export type PageBlocks = PageSection[];

/** The freeform canvas is authored at this fixed design width (px); centered and capped at this width on wider screens — same convention as the old app's GROUP_CANVAS_WIDTH. */
export const DESKTOP_CANVAS_WIDTH = 1200;

/** Below this viewport width, a section stops rendering its freeform desktop layout and reflows to a single stacked column instead (see reflow.ts). Matches the old app's MOBILE_BREAKPOINT. */
export const MOBILE_BREAKPOINT = 700;
