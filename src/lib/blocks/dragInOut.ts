// Cross-container drag logic for CanvasEditor.tsx — lets an admin drag a
// real top-level canvas block into a Columns/Carousel slot (and back out
// again). Adapted from Alta-Seminary's src/admin-app/builder/dragReorg.js,
// which does the equivalent for its dnd-kit-sortable linear block list;
// this version works over our freeform, position-based CanvasBlock[] instead
// — a slot is always a fixed array index (columns/carousel slots don't grow
// or shrink), so "pulling a block out" leaves a fresh empty slot behind
// rather than removing an array entry.
import { createBlock, createSlotItem, BLOCK_REGISTRY } from './registry';
import type { CanvasBlock, SlotItem } from './types';

export interface ContainerBlock extends CanvasBlock {
  props: { columns?: SlotItem[]; items?: SlotItem[] } & Record<string, unknown>;
}

export function isContainerType(type: string): boolean {
  return !!BLOCK_REGISTRY[type]?.slotsKey;
}

function slotsKeyFor(type: string): 'columns' | 'items' | undefined {
  return BLOCK_REGISTRY[type]?.slotsKey;
}

/** A slot with no real content yet — dropping onto (or pulling out into an empty spot from) one of these never loses anything meaningful. */
export function isBlankSlot(item: SlotItem): boolean {
  const def = BLOCK_REGISTRY[item.type];
  if (!def) return true;
  return def.fields.every((f) => {
    const v = item.props[f.key];
    return v === '' || v === undefined || v === null || (Array.isArray(v) && v.length === 0);
  });
}

/**
 * Moves a top-level block into a container block's slot, replacing whatever
 * was there. The moved block's id/type/props carry over unchanged (only its
 * position/zIndex, which a slot has no use for, are dropped); the container
 * gets a brand-new slotsKey array reference so React state updates cleanly.
 */
export function moveBlockIntoSlot(blocks: CanvasBlock[], blockId: string, containerId: string, slotIndex: number): CanvasBlock[] {
  const moved = blocks.find((b) => b.id === blockId);
  const container = blocks.find((b) => b.id === containerId);
  const key = container ? slotsKeyFor(container.type) : undefined;
  if (!moved || !container || !key || moved.id === containerId) return blocks;

  const slotItem: SlotItem = { id: moved.id, type: moved.type, props: moved.props };
  const withoutMoved = blocks.filter((b) => b.id !== blockId);
  return withoutMoved.map((b) => {
    if (b.id !== containerId) return b;
    const list = [...(((b.props[key] as SlotItem[]) ?? []))];
    list[slotIndex] = slotItem;
    return { ...b, props: { ...b.props, [key]: list } };
  });
}

/**
 * Pulls a slot's content back out as a real top-level block at the given
 * canvas position, leaving a fresh empty slot (seeded with the container's
 * configured slotSeedType) behind in its place.
 */
export function extractSlotToTopLevel(
  blocks: CanvasBlock[],
  containerId: string,
  slotIndex: number,
  position: CanvasBlock['position'],
  zIndex: number,
): CanvasBlock[] {
  const container = blocks.find((b) => b.id === containerId);
  const def = container ? BLOCK_REGISTRY[container.type] : undefined;
  const key = def?.slotsKey;
  if (!container || !def || !key) return blocks;
  const list = ((container.props[key] as SlotItem[]) ?? []);
  const item = list[slotIndex];
  if (!item) return blocks;

  const seeded = createSlotItem(def.slotSeedType ?? 'rich-text');
  const nextList = list.map((s, i) => (i === slotIndex ? seeded : s));
  const newBlock: CanvasBlock = { id: item.id, type: item.type, props: item.props, position, zIndex };

  return [
    ...blocks.map((b) => (b.id === containerId ? { ...b, props: { ...b.props, [key]: nextList } } : b)),
    newBlock,
  ];
}

/** Replaces one slot's content with a freshly created block of the given registry type — the "change this slot's block type" action in the settings UI. */
export function setSlotType(blocks: CanvasBlock[], containerId: string, slotIndex: number, type: string): CanvasBlock[] {
  const container = blocks.find((b) => b.id === containerId);
  const key = container ? slotsKeyFor(container.type) : undefined;
  if (!container || !key) return blocks;
  const list = [...(((container.props[key] as SlotItem[]) ?? []))];
  const fresh = createBlock(type);
  list[slotIndex] = fresh;
  return blocks.map((b) => (b.id === containerId ? { ...b, props: { ...b.props, [key]: list } } : b));
}

/** Patches one field of a slot item's props in place. */
export function updateSlotProps(blocks: CanvasBlock[], containerId: string, slotIndex: number, patch: Record<string, unknown>): CanvasBlock[] {
  const container = blocks.find((b) => b.id === containerId);
  const key = container ? slotsKeyFor(container.type) : undefined;
  if (!container || !key) return blocks;
  const list = ((container.props[key] as SlotItem[]) ?? []).map((s, i) => (i === slotIndex ? { ...s, props: { ...s.props, ...patch } } : s));
  return blocks.map((b) => (b.id === containerId ? { ...b, props: { ...b.props, [key]: list } } : b));
}
