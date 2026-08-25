// The freeform block-canvas editor — one section's worth of CanvasBlocks,
// absolutely positioned and directly manipulable: drag to move by pressing
// down anywhere on the block itself (a plain click, without moving, just
// selects it — see startDrag/onDragMove — so this doubles as the click
// target too, no separate handle needed), 8 Canva/Slides-style resize handles,
// snapping/alignment guides against the canvas bounds and every other
// block's edges/centers (snap.ts), a registry-driven "Add block" picker and
// settings panel, drag-into/out-of a Columns/Carousel slot, a sticky
// toolbar, a full keyboard-shortcut layer, and a live rescalable preview
// that reuses PublicPage.tsx's real rendering logic. Adapted from the old
// app's GroupCanvas.tsx (src/components/GroupCanvas.tsx on main) — same
// overall shape (scaled absolute canvas, pointer-capture drag), rebuilt for
// the block-registry model and extended with all-sides resize handles and
// container drag-in/out, which the old app didn't have.
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BLOCK_REGISTRY,
  createCanvasBlock,
  duplicateBlock,
} from '../../lib/blocks/registry';
import { extractSlotToTopLevel, isContainerType, moveBlockIntoSlot, updateSlotProps } from '../../lib/blocks/dragInOut';
import { reflowOrder } from '../../lib/blocks/reflow';
import { DEFAULT_BLOCK_SIZE, blockScale } from '../../lib/blocks/scale';
import { clampToCanvasBounds, computeMoveSnap, computeResizeSnap, type GuideLine, type ResizeHandle } from '../../lib/blocks/snap';
import { DESKTOP_CANVAS_WIDTH, MOBILE_BREAKPOINT, type BlockPosition, type CanvasBlock, type SlotItem } from '../../lib/blocks/types';
import { useElementWidth } from '../../lib/blocks/useElementWidth';
import { BlockRenderer } from '../blocks/BlockRenderer';
import { PublicSection } from '../render/PublicPage';
import { AddBlockPicker } from './AddBlockPicker';
import { SettingsPanel } from './SettingsPanel';

const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const HANDLE_CURSOR: Record<ResizeHandle, string> = {
  n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
  ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize',
};
const MIN_SIZE = 40;

// Hard limits on how far a block can be dragged/resized (owner request:
// "a hard limit on the furthest part of the page editor"). Width has a real,
// meaningful ceiling — DESKTOP_CANVAS_WIDTH *is* the design's fixed viewport
// width, so a block extending past it is unambiguously off-screen on every
// real visitor's desktop view. Height does not have an equivalent natural
// ceiling: a section's canvas height already auto-grows from its content
// (see `canvasHeight` below) and pages scroll vertically forever, so a
// genuinely tall section (a long timeline, a big stacked gallery) is
// legitimate, not a mistake. We still cap it — generously — rather than
// leaving it fully unbounded, purely as a sanity backstop against a runaway
// drag value (a stray/huge pointer delta) producing a pathological block
// position; MAX_CANVAS_HEIGHT is chosen far above any realistic section's
// content height so it should never be felt in normal use.
const MAX_CANVAS_HEIGHT = 6000;

// "Default padding on the website" reference for the content-safe warning
// outline (owner request: warn, don't block, when a block extends past
// where real content normally sits). This codebase's one existing, concrete
// "default padding" value for real rendered page content is ReflowedSection
// .tsx's own section padding (`padding: '40px 20px'`) — the exact padding
// every real mobile visitor (and this editor's own preview) already gets.
// We reuse its 20px horizontal figure (== the --space-5 design token) as
// the desktop content-safe inset too, so the warning reflects a convention
// that already exists elsewhere in this app rather than inventing a new one.
const CONTENT_SAFE_INSET = 20;

interface DragState {
  mode: 'move' | 'resize';
  id: string;
  handle?: ResizeHandle;
  startClientX: number;
  startClientY: number;
  start: BlockPosition;
}

interface DropTarget {
  containerId: string;
  slotIndex: number;
  rect: DOMRect;
}

interface ActiveSlot {
  containerId: string;
  slotIndex: number;
}

interface PreviewDragState {
  startX: number;
  startWidth: number;
}

const MIN_PREVIEW_WIDTH = 320;
const MAX_PREVIEW_WIDTH = DESKTOP_CANVAS_WIDTH;

const NUDGE_STEP = 4;
const NUDGE_STEP_LARGE = 24;

const SHORTCUT_HELP_TEXT = [
  'Delete / Backspace — delete selected block',
  '⌘/Ctrl D — duplicate selected block',
  '⌘/Ctrl C, ⌘/Ctrl V — copy / paste a block',
  'Arrow keys — nudge selected block (Shift = bigger step)',
  '⌘/Ctrl ] , ⌘/Ctrl [ — bring to front / send to back',
  '⌘/Ctrl L — lock / unlock selected block',
  'Tab / Shift+Tab — cycle selection between blocks',
  'Escape — deselect',
].join('\n');

function isEditableTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return (el as HTMLElement).isContentEditable;
}

function isInteractiveTarget(el: Element | null): boolean {
  if (!el) return false;
  if (isEditableTarget(el)) return true;
  const tag = el.tagName;
  return tag === 'BUTTON' || tag === 'A';
}

export function CanvasEditor({
  blocks,
  onChange,
  background,
  backgroundImage,
  paddingY = 0,
  minHeight,
}: {
  blocks: CanvasBlock[];
  onChange: (blocks: CanvasBlock[]) => void;
  background?: string;
  backgroundImage?: string;
  paddingY?: number;
  minHeight?: number;
}) {
  const [containerRef, containerWidth] = useElementWidth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  // null = normal editing canvas; a number = read-only preview, rendered at
  // exactly that pixel width via PublicSection (see item 4's header note
  // above) — replaces the old binary mobilePreview toggle.
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  // Set only during an active move-drag, so the dragged block's own DOM
  // node can go pointer-events:none for that moment — otherwise, since it's
  // rendered on top of everything at the cursor's exact screen position (as
  // it must be, to be visibly draggable), document.elementFromPoint in
  // updateDropTarget below would always hit the dragged block itself rather
  // than whatever slot is actually underneath it. Pointer CAPTURE (set in
  // startDrag) keeps delivering move/up events to the handle regardless —
  // capture bypasses hit-testing entirely, so this is safe.
  const [draggingMoveId, setDraggingMoveId] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const previewDragRef = useRef<PreviewDragState | null>(null);
  // In-memory clipboard for Cmd/Ctrl+C / +V — deliberately not the real OS
  // clipboard: a block is structured data (props/position/nested slots),
  // not text, so there's nothing meaningful to put on the system clipboard
  // for another app to read, and staying in-memory means paste can offset
  // position (see pasteClipboard) the way a real "paste" affordance should.
  const clipboardRef = useRef<CanvasBlock | null>(null);
  // How many times the current clipboard contents have been pasted in a
  // row — each paste steps further from the original (like addBlock's
  // cascade), so pasting repeatedly fans blocks out instead of stacking
  // them exactly on top of each other. Resets whenever a fresh copy happens.
  const pasteCountRef = useRef(0);

  const canvasWidth = DESKTOP_CANVAS_WIDTH;
  const scale = containerWidth > 0 ? Math.min(1, containerWidth / canvasWidth) : 1;
  const maxBottom = blocks.reduce((m, b) => Math.max(m, b.position.y + b.position.h), 0);
  const canvasHeight = Math.max(minHeight ?? 0, maxBottom + 40);

  const selectedBlock = useMemo(() => blocks.find((b) => b.id === selectedId) ?? null, [blocks, selectedId]);

  function updateBlockPosition(id: string, patch: Partial<BlockPosition>) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, position: { ...b.position, ...patch } } : b)));
  }
  function updateBlockProps(id: string, patch: Record<string, unknown>) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, props: { ...b.props, ...patch } } : b)));
  }

  function select(id: string) {
    setSelectedId(id);
    setActiveSlot(null);
  }

  function startDrag(e: React.PointerEvent, id: string, mode: 'move' | 'resize', handle?: ResizeHandle) {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    e.stopPropagation();
    select(id);
    // A locked block is still selectable (e.g. to unlock it again) — it
    // just doesn't get drag/resize tracking set up. Resize handles are
    // already hidden for locked blocks, so only the whole-block move-drag
    // ever reaches this path for one.
    if (block.locked) return;
    e.preventDefault();
    dragRef.current = { mode, id, handle, startClientX: e.clientX, startClientY: e.clientY, start: { ...block.position } };
    if (mode === 'move') setDraggingMoveId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function updateDropTarget(clientX: number, clientY: number, draggedId: string, draggedType: string) {
    if (isContainerType(draggedType)) {
      setDropTarget(null);
      return;
    }
    const el = document.elementFromPoint(clientX, clientY);
    const slotEl = el?.closest('[data-slot-container]') as HTMLElement | null;
    if (!slotEl) {
      setDropTarget(null);
      return;
    }
    const containerId = slotEl.dataset.slotContainer!;
    const slotIndex = Number(slotEl.dataset.slotIndex);
    if (containerId === draggedId) {
      setDropTarget(null);
      return;
    }
    setDropTarget({ containerId, slotIndex, rect: slotEl.getBoundingClientRect() });
  }

  function onDragMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.startClientX) / scale;
    const dy = (e.clientY - d.startClientY) / scale;
    const others = blocks.filter((b) => b.id !== d.id).map((b) => ({ position: b.position }));

    if (d.mode === 'move') {
      // Hard canvas-edge clamp (both bounds — not just the lower one) before
      // snapping, so a whole-block drag can never carry it past the right
      // or bottom edge, only ever snap/settle within them. A plain move
      // never changes w/h, so this clamps x/y directly within their own
      // valid ranges (0..canvasWidth-w, 0..MAX_CANVAS_HEIGHT-h) rather than
      // going through clampToCanvasBounds — that helper's job is to *shrink*
      // whichever side overflowed, which is exactly right for a resize
      // handle but wrong here (it would shrink the block instead of just
      // stopping it at the edge).
      const clampedStartX = Math.min(Math.max(d.start.x + dx, 0), Math.max(0, canvasWidth - d.start.w));
      const clampedStartY = Math.min(Math.max(d.start.y + dy, 0), Math.max(0, MAX_CANVAS_HEIGHT - d.start.h));
      const snap = computeMoveSnap({ x: clampedStartX, y: clampedStartY, w: d.start.w, h: d.start.h }, others, canvasWidth, canvasHeight);
      const clampedX = Math.min(Math.max(snap.x, 0), Math.max(0, canvasWidth - d.start.w));
      const clampedY = Math.min(Math.max(snap.y, 0), Math.max(0, MAX_CANVAS_HEIGHT - d.start.h));
      updateBlockPosition(d.id, { x: clampedX, y: clampedY });
      setGuides(snap.guides);
      const draggedBlock = blocks.find((b) => b.id === d.id);
      if (draggedBlock) updateDropTarget(e.clientX, e.clientY, d.id, draggedBlock.type);
      return;
    }

    const handle = d.handle!;
    let rawX = d.start.x, rawY = d.start.y, rawW = d.start.w, rawH = d.start.h;
    if (handle.includes('e')) rawW = d.start.w + dx;
    if (handle.includes('w')) {
      rawW = d.start.w - dx;
      rawX = d.start.x + dx;
    }
    if (handle.includes('s')) rawH = d.start.h + dy;
    if (handle.includes('n')) {
      rawH = d.start.h - dy;
      rawY = d.start.y + dy;
    }
    // Shift while dragging a corner handle locks the block's aspect ratio —
    // the "maintain aspect ratio where expected" Canva/Slides behavior.
    if (e.shiftKey && handle.length === 2) {
      const ratio = d.start.w / d.start.h;
      rawH = rawW / ratio;
      if (handle.includes('n')) rawY = d.start.y + d.start.h - rawH;
    }
    if (rawW < MIN_SIZE) {
      if (handle.includes('w')) rawX = d.start.x + d.start.w - MIN_SIZE;
      rawW = MIN_SIZE;
    }
    if (rawH < MIN_SIZE) {
      if (handle.includes('n')) rawY = d.start.y + d.start.h - MIN_SIZE;
      rawH = MIN_SIZE;
    }

    // Hard canvas-edge clamp — applied last, after the aspect-ratio and
    // min-size adjustments above, so neither of those can sneak a block
    // back out of bounds. Shrinks from whichever side actually overflowed
    // (see clampToCanvasBounds) rather than translating the box, so e.g.
    // overshooting the east handle stops right at the canvas's right edge
    // without moving the block's left edge.
    const clampedRaw = clampToCanvasBounds({ x: rawX, y: rawY, w: rawW, h: rawH }, canvasWidth, MAX_CANVAS_HEIGHT);
    const snap = computeResizeSnap(handle, clampedRaw, others, canvasWidth, canvasHeight);
    const clampedSnap = clampToCanvasBounds(snap, canvasWidth, MAX_CANVAS_HEIGHT);
    updateBlockPosition(d.id, clampedSnap);
    setGuides(snap.guides);
  }

  function onDragUp(e: React.PointerEvent) {
    const d = dragRef.current;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    if (d?.mode === 'move' && dropTarget) {
      onChange(moveBlockIntoSlot(blocks, d.id, dropTarget.containerId, dropTarget.slotIndex));
      setSelectedId(null);
    }
    dragRef.current = null;
    setDraggingMoveId(null);
    setGuides([]);
    setDropTarget(null);
  }

  function addBlock(type: string) {
    const step = (blocks.length % 6) * 24;
    const size = DEFAULT_BLOCK_SIZE[type] ?? { w: 320, h: 160 };
    const zIndex = Math.max(0, ...blocks.map((b) => b.zIndex)) + 1;
    const block = createCanvasBlock(type, { x: 20 + step, y: 20 + step, w: size.w, h: size.h }, zIndex);
    onChange([...blocks, block]);
    select(block.id);
  }

  function deleteSelected() {
    if (!selectedId) return;
    onChange(blocks.filter((b) => b.id !== selectedId));
    setSelectedId(null);
    setActiveSlot(null);
  }

  function duplicateSelected() {
    if (!selectedBlock) return;
    const dup = duplicateBlock(selectedBlock);
    onChange([...blocks, dup]);
    select(dup.id);
  }

  function copySelected() {
    if (!selectedBlock) return;
    clipboardRef.current = selectedBlock;
    pasteCountRef.current = 0;
  }

  function pasteClipboard() {
    const clip = clipboardRef.current;
    if (!clip) return;
    pasteCountRef.current += 1;
    // Cascades further from the original each repeated paste (mirrors
    // addBlock's own `(blocks.length % 6) * 24` stagger) so pasting several
    // times in a row fans blocks out instead of stacking them exactly on
    // top of each other.
    const step = (pasteCountRef.current % 6) * 24;
    const dup = duplicateBlock(clip); // fresh id + fresh nested-slot ids
    const maxZ = Math.max(0, ...blocks.map((b) => b.zIndex));
    const pasted: CanvasBlock = {
      ...dup,
      position: { ...clip.position, x: clip.position.x + step, y: clip.position.y + step },
      zIndex: maxZ + 1,
    };
    onChange([...blocks, pasted]);
    select(pasted.id);
  }

  function bringToFront() {
    if (!selectedId) return;
    const maxZ = Math.max(0, ...blocks.map((b) => b.zIndex));
    onChange(blocks.map((b) => (b.id === selectedId ? { ...b, zIndex: maxZ + 1 } : b)));
  }
  function sendToBack() {
    if (!selectedId) return;
    const minZ = Math.min(0, ...blocks.map((b) => b.zIndex));
    onChange(blocks.map((b) => (b.id === selectedId ? { ...b, zIndex: minZ - 1 } : b)));
  }
  /** Toggles lock state for an explicit block id — the primitive both the
   * always-visible per-block lock badge (item 5) and the selection-based
   * toggleLock() below share, since the badge needs to flip a block's lock
   * independent of (and before) selecting it. */
  function toggleLockById(id: string) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, locked: !b.locked } : b)));
  }
  function toggleLock() {
    if (selectedId) toggleLockById(selectedId);
  }

  /** Cycles the selection to the next/previous block in reading order — top
   * to bottom, left to right (the same order reflowOrder.ts already sorts
   * blocks into for the mobile-stacked layout). Chosen over z-order for
   * Tab/Shift+Tab because it's the order a visitor actually encounters
   * blocks scrolling down the real page, so keyboard-cycling through blocks
   * here matches the order they'd tab through on the live site — z-order is
   * an editor-internal stacking concept a visitor never perceives. See the
   * design-decision note in the final report for "navigation linking". */
  function cycleSelection(direction: 1 | -1) {
    const ordered = reflowOrder(blocks);
    if (ordered.length === 0) return;
    const idx = ordered.findIndex((b) => b.id === selectedId);
    const nextIdx = idx === -1 ? (direction === 1 ? 0 : ordered.length - 1) : (idx + direction + ordered.length) % ordered.length;
    select(ordered[nextIdx].id);
  }

  function nudgeSelected(dx: number, dy: number) {
    if (!selectedBlock || selectedBlock.locked) return;
    // Position-only clamp (same reasoning as onDragMove's move-mode clamp
    // above) — a nudge never changes w/h, so it must clamp x/y directly
    // rather than via clampToCanvasBounds, which would shrink the block
    // instead of just stopping it at the edge.
    const { x: px, y: py, w, h } = selectedBlock.position;
    const x = Math.min(Math.max(px + dx, 0), Math.max(0, canvasWidth - w));
    const y = Math.min(Math.max(py + dy, 0), Math.max(0, MAX_CANVAS_HEIGHT - h));
    updateBlockPosition(selectedBlock.id, { x, y });
  }

  // Keyboard shortcuts — see the SHORTCUT_HELP_TEXT constant above for the
  // full list, and the final report's "navigation linking" design-decision
  // note for why Tab/Shift+Tab cycle selection specifically. Attached to
  // `window` for the lifetime of this component only (removed on unmount),
  // per the "only active while this editor is mounted, not globally
  // always-on" requirement — CanvasEditor unmounts whenever PageEditor.tsx
  // switches to Preview-as-visitor mode or another section tab, taking this
  // listener with it. Disabled outright while this editor's own read-only
  // preview is active (nothing here should be editable then), and every
  // branch below first checks the keystroke isn't actually a real
  // text-editing keystroke in an EditableText field or a settings-panel
  // input/textarea/select.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (previewWidth != null) return;
      const target = document.activeElement;
      if (isEditableTarget(target)) return;

      const mod = e.metaKey || e.ctrlKey;
      const key = e.key;

      if (key === 'Tab') {
        // Don't hijack real focus-traversal through actual interactive
        // controls (toolbar buttons, links) — only take over Tab when
        // focus isn't already on one of those, so keyboard users can still
        // reach every button/input normally.
        if (isInteractiveTarget(target)) return;
        e.preventDefault();
        cycleSelection(e.shiftKey ? -1 : 1);
        return;
      }
      if (key === 'Escape') {
        setSelectedId(null);
        setActiveSlot(null);
        return;
      }
      if ((key === 'Delete' || key === 'Backspace') && selectedId) {
        e.preventDefault();
        deleteSelected();
        return;
      }
      if (mod && key.toLowerCase() === 'd' && selectedId) {
        e.preventDefault();
        duplicateSelected();
        return;
      }
      if (mod && key.toLowerCase() === 'c' && selectedBlock) {
        // If the user actually has real text selected elsewhere on the
        // page, let the browser's native copy happen instead of hijacking
        // it into a block-copy just because a block also happens to be
        // selected.
        const sel = window.getSelection();
        if (sel && sel.toString().length > 0) return;
        e.preventDefault();
        copySelected();
        return;
      }
      if (mod && key.toLowerCase() === 'v' && clipboardRef.current) {
        e.preventDefault();
        pasteClipboard();
        return;
      }
      if (mod && key === ']' && selectedId) {
        e.preventDefault();
        bringToFront();
        return;
      }
      if (mod && key === '[' && selectedId) {
        e.preventDefault();
        sendToBack();
        return;
      }
      if (mod && key.toLowerCase() === 'l' && selectedId) {
        e.preventDefault();
        toggleLock();
        return;
      }
      if (!mod && !e.altKey && selectedBlock && !selectedBlock.locked) {
        const step = e.shiftKey ? NUDGE_STEP_LARGE : NUDGE_STEP;
        if (key === 'ArrowLeft') { e.preventDefault(); nudgeSelected(-step, 0); return; }
        if (key === 'ArrowRight') { e.preventDefault(); nudgeSelected(step, 0); return; }
        if (key === 'ArrowUp') { e.preventDefault(); nudgeSelected(0, -step); return; }
        if (key === 'ArrowDown') { e.preventDefault(); nudgeSelected(0, step); return; }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- functions above close over `blocks`/`selectedId` etc. directly; re-binding each render (cheap, a plain addEventListener) keeps them fresh without re-deriving a stable-callback dependency list.
  }, [blocks, selectedId, selectedBlock, previewWidth]);

  function extractSlot(containerId: string, slotIndex: number) {
    const container = blocks.find((b) => b.id === containerId);
    if (!container) return;
    const maxZ = Math.max(0, ...blocks.map((b) => b.zIndex));
    const position: BlockPosition = { x: container.position.x + 24, y: container.position.y + container.position.h + 24, w: 320, h: 160 };
    const next = extractSlotToTopLevel(blocks, containerId, slotIndex, position, maxZ + 1);
    onChange(next);
    setActiveSlot(null);
    const created = next[next.length - 1];
    if (created) select(created.id);
  }

  function startPreviewResize(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    previewDragRef.current = { startX: e.clientX, startWidth: previewWidth ?? DESKTOP_CANVAS_WIDTH };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPreviewResizeMove(e: React.PointerEvent) {
    const d = previewDragRef.current;
    if (!d) return;
    const next = Math.min(MAX_PREVIEW_WIDTH, Math.max(MIN_PREVIEW_WIDTH, Math.round(d.startWidth + (e.clientX - d.startX))));
    setPreviewWidth(next);
  }
  function onPreviewResizeUp(e: React.PointerEvent) {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    previewDragRef.current = null;
  }

  // Resolves whichever thing the settings panel should show right now — a
  // selected top-level block's own fields, or (takes priority) a selected
  // nested slot's fields, so there's exactly one panel state regardless of
  // where the selection lives.
  let panelTarget: { title: string; type: string; props: Record<string, unknown>; onFieldChange: (key: string, value: unknown) => void; onClose: () => void } | null = null;
  if (activeSlot) {
    const container = blocks.find((b) => b.id === activeSlot.containerId);
    const def = container ? BLOCK_REGISTRY[container.type] : undefined;
    const key = def?.slotsKey;
    const item = key ? ((container!.props[key] as SlotItem[] | undefined) ?? [])[activeSlot.slotIndex] : undefined;
    if (item) {
      panelTarget = {
        title: `${BLOCK_REGISTRY[item.type]?.label ?? item.type} settings`,
        type: item.type,
        props: item.props,
        onFieldChange: (key2, value) => onChange(updateSlotProps(blocks, activeSlot.containerId, activeSlot.slotIndex, { [key2]: value })),
        onClose: () => setActiveSlot(null),
      };
    }
  } else if (selectedBlock) {
    panelTarget = {
      title: `${BLOCK_REGISTRY[selectedBlock.type]?.label ?? selectedBlock.type} settings`,
      type: selectedBlock.type,
      props: selectedBlock.props,
      onFieldChange: (key, value) => updateBlockProps(selectedBlock.id, { [key]: value }),
      onClose: () => setSelectedId(null),
    };
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Placeholder styling for empty click-to-edit fields — see EditableText.tsx */}
      <style>{`.editable-field:empty:before{content:attr(data-placeholder);color:var(--text-muted);pointer-events:none;}`}</style>

      {/* Sticky toolbar (owner request #1) — position:sticky rather than
          fixed: PageEditor.tsx/CanvasDemo.tsx mount this inside plain
          document flow with no ancestor `overflow` scroll container (the
          admin page's <main> just has padding/max-width, confirmed by
          reading PageEditor.tsx before choosing an approach), so sticky
          pins correctly against the real page scroll without needing to
          know this component's own on-page offset the way `fixed` would.
          `top: 0` because nothing else in this app is fixed/sticky above
          it (no global nav bar in BaseLayout.astro). A background + border
          keeps the canvas from visibly scrolling underneath/behind it once
          pinned; z-index is above every other z-indexed layer in this
          component (drop-highlight's 5000 is the next highest). */}
      <div
        data-testid="canvas-toolbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 6000,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'var(--bg-app)',
          padding: '8px 4px',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <AddBlockPicker onAdd={addBlock} />
        <button
          type="button"
          data-testid="preview-toggle"
          onClick={() =>
            setPreviewWidth((w) => (w == null ? Math.min(DESKTOP_CANVAS_WIDTH, Math.max(containerWidth || DESKTOP_CANVAS_WIDTH, MOBILE_BREAKPOINT)) : null))
          }
          style={{
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-pill)',
            padding: '7px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            background: previewWidth != null ? 'var(--accent-gradient)' : 'var(--surface-card)',
            color: previewWidth != null ? '#fff' : 'var(--text-body)',
          }}
        >
          {previewWidth != null ? '👁 Preview (on)' : '👁 Preview'}
        </button>

        {previewWidth != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              data-testid="preview-width-slider"
              min={MIN_PREVIEW_WIDTH}
              max={MAX_PREVIEW_WIDTH}
              value={previewWidth}
              onChange={(e) => setPreviewWidth(Number(e.target.value))}
              style={{ width: 140 }}
              aria-label="Preview width"
            />
            <span data-testid="preview-width-label" style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 150 }}>
              {previewWidth}px · {previewWidth < MOBILE_BREAKPOINT ? 'Mobile layout' : 'Desktop layout'}
            </span>
          </div>
        )}

        {previewWidth == null && selectedBlock && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <ToolbarButton onClick={duplicateSelected}>Duplicate</ToolbarButton>
            <ToolbarButton onClick={bringToFront}>Bring to front</ToolbarButton>
            <ToolbarButton onClick={sendToBack}>Send to back</ToolbarButton>
            <ToolbarButton onClick={toggleLock}>{selectedBlock.locked ? 'Unlock' : 'Lock'}</ToolbarButton>
            <ToolbarButton onClick={deleteSelected} danger>Delete</ToolbarButton>
          </div>
        )}

        <span
          title={SHORTCUT_HELP_TEXT}
          style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', cursor: 'help', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-pill)', padding: '4px 10px', whiteSpace: 'nowrap' }}
        >
          ⌨ Shortcuts
        </span>
      </div>

      {previewWidth != null ? (
        <div style={{ overflowX: 'auto', padding: '4px 2px' }}>
          <div
            data-testid="preview-frame"
            style={{ position: 'relative', width: previewWidth, margin: '0 auto', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
          >
            <PublicSection
              section={{ id: 'preview', name: 'preview', background, backgroundImage, minHeight, paddingY, blocks }}
              previewWidth={previewWidth}
              motionEnabled={false}
            />
            {blocks.length === 0 && (
              <p style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Add a block to see the preview.</p>
            )}
            <div
              data-testid="preview-resize-handle"
              onPointerDown={startPreviewResize}
              onPointerMove={onPreviewResizeMove}
              onPointerUp={onPreviewResizeUp}
              title="Drag to resize the preview width"
              style={{
                position: 'absolute',
                top: '50%',
                right: 4,
                transform: 'translateY(-50%)',
                width: 14,
                height: 44,
                borderRadius: 7,
                cursor: 'ew-resize',
                background: 'var(--accent-primary)',
                boxShadow: 'var(--shadow-sm)',
                zIndex: 10,
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div
            ref={containerRef}
            data-testid="canvas-container"
            style={{
              position: 'relative',
              width: '100%',
              height: (canvasHeight + paddingY * 2) * scale,
              // backgroundColor, not the `background` shorthand — mixing
              // that with the backgroundImage/-Size/-Position longhands
              // below across re-renders is what React warns about (a
              // shorthand and its longhands fighting over the same
              // underlying CSS property).
              backgroundColor: background,
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              overflow: 'hidden',
              touchAction: 'none',
              outline: '1px dashed var(--border-default)',
              outlineOffset: -1,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedId(null);
                  setActiveSlot(null);
                }
              }}
              style={{ position: 'absolute', top: paddingY, left: 0, width: canvasWidth, height: canvasHeight, transform: `scale(${scale})`, transformOrigin: 'top left' }}
            >
              {blocks.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14, pointerEvents: 'none' }}>
                  Add a block to start building this section
                </div>
              )}

              {blocks.map((b) => {
                const isSelected = selectedId === b.id;
                // Content-safe warning (folded-in owner request): flagged,
                // not blocked, whenever this block extends past the
                // CONTENT_SAFE_INSET margin from either canvas edge — see
                // that constant's comment for what "default padding" value
                // this reuses and why.
                const overflowsSafeArea = b.position.x < CONTENT_SAFE_INSET || b.position.x + b.position.w > canvasWidth - CONTENT_SAFE_INSET;
                return (
                  <div
                    key={b.id}
                    data-testid={`canvas-block-${b.id}`}
                    onPointerDown={(e) => startDrag(e, b.id, 'move')}
                    onPointerMove={onDragMove}
                    onPointerUp={onDragUp}
                    onMouseEnter={() => setHoveredId(b.id)}
                    onMouseLeave={() => setHoveredId((h) => (h === b.id ? null : h))}
                    style={{
                      position: 'absolute',
                      left: b.position.x,
                      top: b.position.y,
                      width: b.position.w,
                      height: b.position.h,
                      zIndex: b.zIndex,
                      outline: isSelected ? '2px solid var(--accent-primary)' : hoveredId === b.id ? '1px solid var(--accent-primary)' : 'none',
                      outlineOffset: -1,
                      opacity: b.locked ? 0.85 : draggingMoveId === b.id ? 0.6 : 1,
                      pointerEvents: draggingMoveId === b.id ? 'none' : undefined,
                    }}
                  >
                    <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: 6 }}>
                      <BlockRenderer
                        type={b.type}
                        props={b.props}
                        editable
                        onFieldChange={(key, value) => updateBlockProps(b.id, { [key]: value })}
                        blockId={b.id}
                        activeSlotIndex={activeSlot?.containerId === b.id ? activeSlot.slotIndex : null}
                        onSelectSlot={(slotIndex) => {
                          select(b.id);
                          setActiveSlot({ containerId: b.id, slotIndex });
                        }}
                        onExtractSlot={(slotIndex) => extractSlot(b.id, slotIndex)}
                        scale={blockScale(b.type, b.position)}
                      />
                    </div>

                    {isSelected && !b.locked && (
                      <>
                        {RESIZE_HANDLES.map((handle) => (
                          <div
                            key={handle}
                            data-testid={`resize-handle-${handle}`}
                            onPointerDown={(e) => startDrag(e, b.id, 'resize', handle)}
                            onPointerMove={onDragMove}
                            onPointerUp={onDragUp}
                            title={`Drag to resize (${handle})`}
                            style={{ position: 'absolute', ...handlePosition(handle), width: 12, height: 12, cursor: HANDLE_CURSOR[handle], borderRadius: 3, background: 'var(--surface-panel)', border: '1.5px solid var(--accent-primary)', boxShadow: 'var(--shadow-sm)', zIndex: 1000 }}
                          />
                        ))}
                      </>
                    )}

                    {overflowsSafeArea && (
                      <div
                        data-testid={`content-safe-warning-${b.id}`}
                        title="Extends past the site's default content padding — may bleed into the page's outer margins on the real site."
                        style={{ position: 'absolute', inset: -3, border: '2px dashed #f59e0b', borderRadius: 4, pointerEvents: 'none', zIndex: 900 }}
                      />
                    )}

                    {/* Lock/unlock badge (owner request #5) — always visible
                        on every block, locked or not, positioned outside the
                        block's own resize-handle perimeter (all 8 handles
                        occupy roughly -6..+6px around each edge when
                        selected; this sits fully above that band) so it
                        never collides with the NE handle even on a selected,
                        unlocked block. stopPropagation on pointerdown keeps
                        a click here from also starting/selecting a
                        whole-block move-drag. */}
                    <button
                      type="button"
                      data-testid={`lock-toggle-${b.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLockById(b.id);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      title={b.locked ? 'Unlock this block' : 'Lock this block'}
                      aria-label={b.locked ? 'Unlock this block' : 'Lock this block'}
                      style={{
                        position: 'absolute',
                        top: -28,
                        right: -10,
                        width: 20,
                        height: 20,
                        padding: 0,
                        fontSize: 11,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--surface-panel)',
                        border: b.locked ? '1px solid var(--border-strong)' : '1px solid var(--border-default)',
                        boxShadow: 'var(--shadow-sm)',
                        opacity: b.locked ? 1 : 0.55,
                        zIndex: 1001,
                      }}
                    >
                      {b.locked ? '🔒' : '🔓'}
                    </button>
                  </div>
                );
              })}

              {guides.map((g, i) =>
                g.axis === 'x' ? (
                  <div key={i} data-testid="snap-guide-x" style={{ position: 'absolute', left: g.pos, top: g.from, width: 1, height: g.to - g.from, background: 'var(--accent-primary)', zIndex: 2000, pointerEvents: 'none' }} />
                ) : (
                  <div key={i} data-testid="snap-guide-y" style={{ position: 'absolute', top: g.pos, left: g.from, height: 1, width: g.to - g.from, background: 'var(--accent-primary)', zIndex: 2000, pointerEvents: 'none' }} />
                ),
              )}
            </div>

            {dropTarget && (
              <div
                data-testid="slot-drop-highlight"
                style={{
                  position: 'fixed',
                  left: dropTarget.rect.left,
                  top: dropTarget.rect.top,
                  width: dropTarget.rect.width,
                  height: dropTarget.rect.height,
                  outline: '3px solid var(--accent-primary)',
                  outlineOffset: -2,
                  background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
                  zIndex: 5000,
                  pointerEvents: 'none',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
            )}
          </div>

          {panelTarget && <SettingsPanel {...panelTarget} />}
        </div>
      )}
    </div>
  );
}

function handlePosition(handle: ResizeHandle): React.CSSProperties {
  const half = -6;
  switch (handle) {
    case 'nw': return { top: half, left: half };
    case 'n': return { top: half, left: '50%', transform: 'translateX(-50%)' };
    case 'ne': return { top: half, right: half };
    case 'e': return { top: '50%', right: half, transform: 'translateY(-50%)' };
    case 'se': return { bottom: half, right: half };
    case 's': return { bottom: half, left: '50%', transform: 'translateX(-50%)' };
    case 'sw': return { bottom: half, left: half };
    case 'w': return { top: '50%', left: half, transform: 'translateY(-50%)' };
  }
}

function ToolbarButton({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 'none',
        borderRadius: 'var(--radius-pill)',
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        background: danger ? '#dc2626' : 'var(--surface-card)',
        color: danger ? '#fff' : 'var(--text-body)',
      }}
    >
      {children}
    </button>
  );
}
