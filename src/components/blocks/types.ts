// Shared prop contract every block-type render component implements —
// mirrors Alta-Seminary's BLOCK_COMPONENTS convention (BlockRenderer.jsx):
// the same component renders both the live/read-only view (editable=false)
// and the in-canvas editable view (editable=true, inline fields become
// click-to-edit), so there's exactly one place each block type's markup is
// defined, never a separate "editor version" that can drift from the public one.
export interface BlockComponentProps {
  props: Record<string, unknown>;
  editable: boolean;
  onFieldChange: (key: string, value: unknown) => void;
  // Container-only (columns/carousel) — ignored by every simple block type,
  // populated by CanvasEditor/PublicPage when rendering a container. A slot
  // is edited by the container itself calling onFieldChange('columns'|'items', …)
  // with a patched array (it already owns that full array via `props`); these
  // extras only cover the things a slot can't do to itself: being the target
  // of a cross-container drag-in (detected via data-slot-* attributes, see
  // ColumnsBlockView/CarouselBlockView), opening its own settings in the side
  // panel, and being pulled back out to a top-level block.
  blockId?: string;
  activeSlotIndex?: number | null;
  onSelectSlot?: (slotIndex: number) => void;
  onExtractSlot?: (slotIndex: number) => void;
  // Set by ReflowedSection (the mobile-reflow path, see reflow.ts) so a
  // block whose normal layout is side-by-side (Image + Text, Columns) can
  // stack itself vertically instead — otherwise a fixed-width freeform
  // block forced full-width-but-still-row-layout at a ~380px viewport
  // would squeeze each side into an unreadably narrow sliver. Every other
  // block type ignores this.
  narrow?: boolean;
  // How far this block's box currently departs from its type's reference
  // ("1.0 scale") size — see lib/blocks/scale.ts's blockScale(). Passed by
  // every render path (CanvasEditor.tsx, ReflowedSection.tsx, PublicPage.tsx)
  // so a block resized bigger/smaller renders its text bigger/smaller
  // identically in the editor and for real visitors, never just in one
  // view. Text-bearing block types (Hero/RichText/Quote/ImageText's
  // heading) use it to compute a responsive font size; every other block
  // type ignores it. Defaults to 1 (normal size) when absent, e.g. for a
  // block rendered as a nested Columns/Carousel slot item, which has no
  // box of its own to scale against.
  scale?: number;
}

export function str(props: Record<string, unknown>, key: string, fallback = ''): string {
  const v = props[key];
  return typeof v === 'string' ? v : fallback;
}

export function bool(props: Record<string, unknown>, key: string, fallback = false): boolean {
  const v = props[key];
  return typeof v === 'boolean' ? v : fallback;
}
