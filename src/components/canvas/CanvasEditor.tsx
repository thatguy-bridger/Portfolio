// The freeform block-canvas editor — one section's worth of CanvasBlocks,
// absolutely positioned and directly manipulable: drag to move by pressing
// down anywhere on the block itself (a plain click, without moving, just
// selects it — see startDrag/onDragMove — so this doubles as the click
// target too, no separate handle needed), 8 Canva/Slides-style resize handles,
// snapping/alignment guides against the canvas bounds and every other
// block's edges/centers (snap.ts), a registry-driven "Add block" picker and
// settings panel, and drag-into/out-of a Columns/Carousel slot. Adapted
// from the old app's GroupCanvas.tsx (src/components/GroupCanvas.tsx on
// main) — same overall shape (scaled absolute canvas, pointer-capture
// drag), rebuilt for the block-registry model and extended with all-sides
// resize handles and container drag-in/out, which the old app didn't have.
import { useMemo, useRef, useState } from 'react';
import {
  BLOCK_REGISTRY,
  createCanvasBlock,
  duplicateBlock,
} from '../../lib/blocks/registry';
import { extractSlotToTopLevel, isContainerType, moveBlockIntoSlot, updateSlotProps } from '../../lib/blocks/dragInOut';
import { computeMoveSnap, computeResizeSnap, type GuideLine, type ResizeHandle } from '../../lib/blocks/snap';
import { DESKTOP_CANVAS_WIDTH, type BlockPosition, type CanvasBlock, type SlotItem } from '../../lib/blocks/types';
import { useElementWidth } from '../../lib/blocks/useElementWidth';
import { BlockRenderer } from '../blocks/BlockRenderer';
import { ReflowedSection } from '../render/ReflowedSection';
import { AddBlockPicker } from './AddBlockPicker';
import { SettingsPanel } from './SettingsPanel';

const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const HANDLE_CURSOR: Record<ResizeHandle, string> = {
  n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
  ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize',
};
const DEFAULT_SIZE: Record<string, { w: number; h: number }> = {
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
const MIN_SIZE = 40;

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
  const [mobilePreview, setMobilePreview] = useState(false);
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
      const rawX = Math.max(0, d.start.x + dx);
      const rawY = Math.max(0, d.start.y + dy);
      const snap = computeMoveSnap({ x: rawX, y: rawY, w: d.start.w, h: d.start.h }, others, canvasWidth, canvasHeight);
      updateBlockPosition(d.id, { x: snap.x, y: snap.y });
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

    const snap = computeResizeSnap(handle, { x: rawX, y: rawY, w: rawW, h: rawH }, others, canvasWidth, canvasHeight);
    updateBlockPosition(d.id, snap);
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
    const size = DEFAULT_SIZE[type] ?? { w: 320, h: 160 };
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
  function toggleLock() {
    if (!selectedId) return;
    onChange(blocks.map((b) => (b.id === selectedId ? { ...b, locked: !b.locked } : b)));
  }

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

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <AddBlockPicker onAdd={addBlock} />
        <button
          type="button"
          data-testid="mobile-preview-toggle"
          onClick={() => setMobilePreview((v) => !v)}
          style={{
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-pill)',
            padding: '7px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            background: mobilePreview ? 'var(--accent-gradient)' : 'var(--surface-card)',
            color: mobilePreview ? '#fff' : 'var(--text-body)',
          }}
        >
          {mobilePreview ? '📱 Mobile preview (on)' : '📱 Mobile preview'}
        </button>

        {!mobilePreview && selectedBlock && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <ToolbarButton onClick={duplicateSelected}>Duplicate</ToolbarButton>
            <ToolbarButton onClick={bringToFront}>Bring to front</ToolbarButton>
            <ToolbarButton onClick={sendToBack}>Send to back</ToolbarButton>
            <ToolbarButton onClick={toggleLock}>{selectedBlock.locked ? 'Unlock' : 'Lock'}</ToolbarButton>
            <ToolbarButton onClick={deleteSelected} danger>Delete</ToolbarButton>
          </div>
        )}
      </div>

      {mobilePreview ? (
        <div style={{ maxWidth: 390, margin: '0 auto', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} data-testid="mobile-preview-frame">
          <ReflowedSection section={{ id: 'preview', name: 'preview', background, backgroundImage, minHeight, paddingY, blocks }} />
          {blocks.length === 0 && (
            <p style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Add a block to see the mobile layout.</p>
          )}
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

                    {b.locked && (
                      <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 11, background: 'var(--surface-panel)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-strong)' }}>
                        🔒
                      </div>
                    )}
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
