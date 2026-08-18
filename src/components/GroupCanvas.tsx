import { useLayoutEffect, useRef, useState } from 'react';
import { BlockContent, AddBlockMenu, newBlock } from './BlockContent';
import { WorkGrid } from '../sections/WorkGrid';
import { Button } from './ui/Button';
import { ImageInput } from './ImageInput';
import { ToolbarDropdown } from './Popover';
import { ColorPickerPanel } from './ColorPicker';
import {
  newBlockId,
  newGroupBlockId,
  GROUP_CANVAS_WIDTH,
  MOBILE_CANVAS_WIDTH,
  type CustomPage,
  type EntranceAnimation,
  type GroupBlock,
  type GroupBlockPosition,
  type GroupBlockStyle,
  type PageBlockType,
  type SiteTile,
  type Widget,
} from '../data/siteData';

export type CanvasDevice = 'desktop' | 'mobile';

const ANIMATION_OPTIONS: Array<{ key: EntranceAnimation; label: string }> = [
  { key: 'none', label: 'None' },
  { key: 'fade', label: 'Fade in' },
  { key: 'slide-up', label: 'Slide up' },
  { key: 'slide-left', label: 'Slide from left' },
  { key: 'slide-right', label: 'Slide from right' },
  { key: 'scale', label: 'Scale in' },
];

const FINE_PX = 8;
const SNAP_PX = 6;
const MIN_SIZE = 40;
const DEFAULT_W = 320;
const DEFAULT_H = 120;
const WORKGRID_DEFAULT_W = 1140;
const WORKGRID_DEFAULT_H = 560;

function snap(n: number) {
  return Math.round(n / FINE_PX) * FINE_PX;
}

/**
 * Derives a starting mobile layout for whichever blocks don't have one yet:
 * a simple full-width stacked column (same order the public site's
 * un-customized mobile fallback already uses), so a group is never blank
 * when its Mobile tab is first opened. Heights scale with the width change
 * so a block that was short-and-wide on desktop doesn't become a tiny
 * sliver. Pure — callers decide whether to persist the result.
 */
export function seedMobileLayout(blocks: GroupBlock[]): Record<string, GroupBlockPosition> {
  const margin = 10;
  const width = MOBILE_CANVAS_WIDTH - margin * 2;
  const ordered = [...blocks]
    .filter((b) => !b.hideOnMobile)
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
  const out: Record<string, GroupBlockPosition> = {};
  let cursor = margin;
  const gap = 16;
  for (const b of ordered) {
    const h = Math.max(MIN_SIZE, Math.round(b.position.h * (width / b.position.w)));
    out[b.id] = { x: margin, y: cursor, w: width, h };
    cursor += h + gap;
  }
  return out;
}

interface DragState {
  mode: 'move' | 'resize';
  ids: string[];
  startX: number;
  startY: number;
  starts: Record<string, { x: number; y: number; w: number; h: number }>;
}

interface GuideLine {
  axis: 'x' | 'y';
  /** position along the axis, in canvas px */
  pos: number;
  /** the line's extent, in canvas px, along the other axis */
  from: number;
  to: number;
}

/** Tracks a container's rendered width so the canvas can scale to fit narrower screens without a horizontal scrollbar. Shared with GroupRenderer's read-only desktop rendering. */
export function useElementWidth(): [React.RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/**
 * The freeform canvas for one homepage group: blocks can be dragged and
 * resized anywhere (in real canvas pixels, snapped to an 8px grid), can
 * overlap with explicit front/back ordering, can be grouped so several
 * move together, and can be locked in place. Authored at a fixed design
 * width and scaled down to fit narrower editor panes.
 *
 * `device` switches which position field is being edited: 'desktop' (the
 * default) reads/writes `position` at GROUP_CANVAS_WIDTH; 'mobile' reads/
 * writes `mobilePosition` at the narrower MOBILE_CANVAS_WIDTH, seeding a
 * stacked starting layout for any block that doesn't have one yet. Adding,
 * deleting, and reordering blocks only happens in desktop mode — mobile
 * mode is purely a repositioning pass over the same set of blocks.
 */
export function GroupCanvas({
  blocks,
  editable,
  onChange,
  pages,
  widgets,
  tiles,
  onTilesChange,
  background,
  backgroundImage,
  paddingY = 0,
  minHeight,
  device = 'desktop',
}: {
  blocks: GroupBlock[];
  editable: boolean;
  onChange: (blocks: GroupBlock[]) => void;
  pages?: CustomPage[];
  widgets?: Widget[];
  /** the site's portfolio tiles — only needed if this group has a Work Grid block */
  tiles?: SiteTile[];
  onTilesChange?: (tiles: SiteTile[]) => void;
  /** the enclosing group's own background/height, previewed here so editing matches what ships */
  background?: string;
  backgroundImage?: string;
  paddingY?: number;
  minHeight?: number;
  device?: CanvasDevice;
}) {
  const [containerRef, containerWidth] = useElementWidth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const dragState = useRef<DragState | null>(null);
  const mobile = device === 'mobile';
  const canvasWidth = mobile ? MOBILE_CANVAS_WIDTH : GROUP_CANVAS_WIDTH;

  // Mobile editing only shows blocks that will actually render on mobile, and seeds a
  // starting stacked layout the first time a block is arranged there.
  const visibleBlocks = mobile ? blocks.filter((b) => !b.hideOnMobile) : blocks;
  const missingSeed = mobile && visibleBlocks.some((b) => !b.mobilePosition);
  useLayoutEffect(() => {
    if (!missingSeed) return;
    const seeded = seedMobileLayout(blocks);
    onChange(blocks.map((b) => (b.mobilePosition || b.hideOnMobile ? b : { ...b, mobilePosition: seeded[b.id], mobileStale: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingSeed]);

  function getPos(b: GroupBlock): GroupBlockPosition {
    return (mobile ? b.mobilePosition : b.position) ?? b.position;
  }

  const scale = containerWidth > 0 ? Math.min(1, containerWidth / canvasWidth) : 1;
  const maxBottom = visibleBlocks.reduce((m, b) => Math.max(m, getPos(b).y + getPos(b).h), 0);
  const canvasHeight = Math.max(minHeight ?? 0, maxBottom + 40);

  function updateBlock(id: string, patch: Partial<GroupBlock>) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }
  function updatePosition(id: string, patch: Partial<GroupBlockPosition>) {
    onChange(
      blocks.map((b) => {
        if (b.id !== id) return b;
        if (mobile) return { ...b, mobilePosition: { ...getPos(b), ...patch }, mobileStale: false };
        return { ...b, position: { ...b.position, ...patch }, mobileStale: b.mobilePosition ? true : b.mobileStale };
      }),
    );
  }

  function idsToMove(id: string): string[] {
    const block = blocks.find((b) => b.id === id);
    if (selectedIds.includes(id) && selectedIds.length > 1) return selectedIds;
    if (block?.groupMemberId) return blocks.filter((b) => b.groupMemberId === block.groupMemberId).map((b) => b.id);
    return [id];
  }

  function select(id: string, additive: boolean) {
    const block = blocks.find((b) => b.id === id);
    const linked = block?.groupMemberId ? blocks.filter((b) => b.groupMemberId === block.groupMemberId).map((b) => b.id) : [id];
    if (additive) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...linked])));
    } else {
      setSelectedIds(linked);
    }
  }

  function startDrag(e: React.PointerEvent, id: string, mode: 'move' | 'resize') {
    const block = blocks.find((b) => b.id === id);
    if (!block || block.locked) return;
    e.preventDefault();
    e.stopPropagation();
    select(id, e.shiftKey);
    const ids = mode === 'resize' ? [id] : idsToMove(id);
    const starts: DragState['starts'] = {};
    for (const bid of ids) {
      const b = blocks.find((x) => x.id === bid);
      if (b) starts[bid] = { ...getPos(b) };
    }
    dragState.current = { mode, ids, startX: e.clientX, startY: e.clientY, starts };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function computeGuides(movingId: string, x: number, y: number, w: number, h: number): { x: number; y: number; guides: GuideLine[] } {
    const others = visibleBlocks.filter((b) => b.id !== movingId && !dragState.current!.ids.includes(b.id));
    const targetsX = [0, canvasWidth / 2, canvasWidth, ...others.flatMap((o) => [getPos(o).x, getPos(o).x + getPos(o).w / 2, getPos(o).x + getPos(o).w])];
    const targetsY = [0, canvasHeight / 2, canvasHeight, ...others.flatMap((o) => [getPos(o).y, getPos(o).y + getPos(o).h / 2, getPos(o).y + getPos(o).h])];
    const myX = [x, x + w / 2, x + w];
    const myY = [y, y + h / 2, y + h];

    let snappedX = x;
    let bestDx = SNAP_PX + 1;
    let guideX: GuideLine | null = null;
    for (const mx of myX) {
      for (const tx of targetsX) {
        const d = Math.abs(mx - tx);
        if (d < bestDx) {
          bestDx = d;
          snappedX = x + (tx - mx);
          guideX = { axis: 'x', pos: tx, from: 0, to: canvasHeight };
        }
      }
    }
    let snappedY = y;
    let bestDy = SNAP_PX + 1;
    let guideY: GuideLine | null = null;
    for (const my of myY) {
      for (const ty of targetsY) {
        const d = Math.abs(my - ty);
        if (d < bestDy) {
          bestDy = d;
          snappedY = y + (ty - my);
          guideY = { axis: 'y', pos: ty, from: 0, to: canvasWidth };
        }
      }
    }
    const foundGuides: GuideLine[] = [];
    if (guideX) foundGuides.push(guideX);
    if (guideY) foundGuides.push(guideY);
    return { x: bestDx <= SNAP_PX ? snappedX : snap(x), y: bestDy <= SNAP_PX ? snappedY : snap(y), guides: foundGuides };
  }

  function onDragMove(e: React.PointerEvent) {
    const d = dragState.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / scale;
    const dy = (e.clientY - d.startY) / scale;

    if (d.mode === 'resize') {
      const id = d.ids[0];
      const start = d.starts[id];
      const rawW = Math.max(MIN_SIZE, start.w + dx);
      const rawH = Math.max(MIN_SIZE, start.h + dy);
      const { x, y, guides: g } = computeGuides(id, start.x, start.y, rawW, rawH);
      void x;
      void y;
      updatePosition(id, { w: snap(rawW), h: snap(rawH) });
      setGuides(g);
      return;
    }

    // move — drag every id in the set by the same delta, snapping the primary block and applying the same offset to the rest
    const primaryId = d.ids[0];
    const primaryStart = d.starts[primaryId];
    const rawX = Math.max(0, primaryStart.x + dx);
    const rawY = Math.max(0, primaryStart.y + dy);
    const { x: snappedX, y: snappedY, guides: g } = computeGuides(primaryId, rawX, rawY, primaryStart.w, primaryStart.h);
    const offsetX = snappedX - primaryStart.x;
    const offsetY = snappedY - primaryStart.y;
    onChange(
      blocks.map((b) => {
        if (!d.ids.includes(b.id)) return b;
        const start = d.starts[b.id];
        const next = { x: Math.max(0, start.x + offsetX), y: Math.max(0, start.y + offsetY) };
        if (mobile) return { ...b, mobilePosition: { ...getPos(b), ...next }, mobileStale: false };
        return { ...b, position: { ...b.position, ...next }, mobileStale: b.mobilePosition ? true : b.mobileStale };
      }),
    );
    setGuides(g);
  }

  function onDragUp(e: React.PointerEvent) {
    dragState.current = null;
    setGuides([]);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  function addWorkGrid() {
    const gb: GroupBlock = {
      id: newGroupBlockId(),
      block: { id: newBlockId(), type: 'workgrid' },
      position: { x: 30, y: blocks.length === 0 ? 20 : 20 + blocks.length * 24, w: WORKGRID_DEFAULT_W, h: WORKGRID_DEFAULT_H },
      zIndex: blocks.length + 1,
    };
    onChange([...blocks, gb]);
    setSelectedIds([gb.id]);
  }

  function addBlockOfType(type: PageBlockType) {
    const step = (blocks.length % 6) * 24;
    const gb: GroupBlock = {
      id: newGroupBlockId(),
      block: newBlock(type),
      position: { x: 20 + step, y: 20 + step, w: DEFAULT_W, h: DEFAULT_H },
      zIndex: blocks.length + 1,
    };
    onChange([...blocks, gb]);
    setSelectedIds([gb.id]);
  }

  function removeSelected() {
    onChange(blocks.filter((b) => !selectedIds.includes(b.id)));
    setSelectedIds([]);
  }

  function bringToFront() {
    const maxZ = Math.max(0, ...blocks.map((b) => b.zIndex));
    onChange(blocks.map((b) => (selectedIds.includes(b.id) ? { ...b, zIndex: maxZ + 1 } : b)));
  }
  function sendToBack() {
    const minZ = Math.min(0, ...blocks.map((b) => b.zIndex));
    onChange(blocks.map((b) => (selectedIds.includes(b.id) ? { ...b, zIndex: minZ - 1 } : b)));
  }
  function toggleLock() {
    const anyUnlocked = selectedIds.some((id) => !blocks.find((b) => b.id === id)?.locked);
    onChange(blocks.map((b) => (selectedIds.includes(b.id) ? { ...b, locked: anyUnlocked } : b)));
  }
  function toggleHideOnMobile() {
    const anyShown = selectedIds.some((id) => !blocks.find((b) => b.id === id)?.hideOnMobile);
    onChange(blocks.map((b) => (selectedIds.includes(b.id) ? { ...b, hideOnMobile: anyShown } : b)));
    // Hiding a block while arranging mobile removes it from this canvas — drop the now-stale selection.
    if (mobile && anyShown) setSelectedIds([]);
  }
  function groupSelected() {
    const groupMemberId = newGroupBlockId();
    onChange(blocks.map((b) => (selectedIds.includes(b.id) ? { ...b, groupMemberId } : b)));
  }
  function ungroupSelected() {
    onChange(blocks.map((b) => (selectedIds.includes(b.id) ? { ...b, groupMemberId: undefined } : b)));
  }
  function patchSelectedStyle(patch: Partial<GroupBlockStyle>) {
    onChange(blocks.map((b) => (selectedIds.includes(b.id) ? { ...b, style: { ...b.style, ...patch } } : b)));
  }
  function setSelectedAnimation(animation: EntranceAnimation) {
    onChange(blocks.map((b) => (selectedIds.includes(b.id) ? { ...b, animation } : b)));
  }

  const selectedBlocks = blocks.filter((b) => selectedIds.includes(b.id));
  const primaryStyle = selectedBlocks[0]?.style ?? {};
  const primaryAnimation = selectedBlocks[0]?.animation ?? 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {editable && selectedBlocks.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {selectedBlocks.length} selected
          </span>
          <ToolbarButton onClick={bringToFront}>Bring to front</ToolbarButton>
          <ToolbarButton onClick={sendToBack}>Send to back</ToolbarButton>
          <ToolbarButton onClick={toggleLock}>{selectedBlocks.some((b) => b.locked) ? 'Unlock' : 'Lock'}</ToolbarButton>
          <ToolbarButton onClick={toggleHideOnMobile}>{selectedBlocks.some((b) => b.hideOnMobile) ? 'Show on mobile' : 'Hide on mobile'}</ToolbarButton>
          {selectedBlocks.length > 1 && <ToolbarButton onClick={groupSelected}>Group</ToolbarButton>}
          {selectedBlocks.some((b) => b.groupMemberId) && <ToolbarButton onClick={ungroupSelected}>Ungroup</ToolbarButton>}

          <ToolbarDropdown title="Style" width={220} trigger={<span>Style</span>}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Background color</div>
            <ColorPickerPanel value={primaryStyle.background} onChange={(c) => patchSelectedStyle({ background: c })} onClear={() => patchSelectedStyle({ background: undefined })} />

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 4 }}>Background image</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ImageInput label={primaryStyle.backgroundImage ? 'Replace' : '+ Upload'} onSelect={(src) => patchSelectedStyle({ backgroundImage: src })} />
              {primaryStyle.backgroundImage && (
                <button onClick={() => patchSelectedStyle({ backgroundImage: undefined })} style={{ border: 'none', background: 'none', color: 'var(--red-500)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  Remove
                </button>
              )}
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 4 }}>Border</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ColorPickerPanel value={primaryStyle.borderColor} onChange={(c) => patchSelectedStyle({ borderColor: c })} onClear={() => patchSelectedStyle({ borderColor: undefined })} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              Width
              <input
                type="number"
                min={0}
                max={20}
                value={primaryStyle.borderWidth ?? 0}
                onChange={(e) => patchSelectedStyle({ borderWidth: Math.max(0, Number(e.target.value) || 0) })}
                style={{ width: 50, padding: '3px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-heading)', fontSize: 12 }}
              />
              px
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              Corner radius
              <input
                type="number"
                min={0}
                max={999}
                value={primaryStyle.borderRadius ?? 0}
                onChange={(e) => patchSelectedStyle({ borderRadius: Math.max(0, Number(e.target.value) || 0) })}
                style={{ width: 50, padding: '3px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-heading)', fontSize: 12 }}
              />
              px
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-body)' }}>
              <input type="checkbox" checked={!!primaryStyle.shadow} onChange={(e) => patchSelectedStyle({ shadow: e.target.checked })} />
              Shadow
            </label>
          </ToolbarDropdown>

          <ToolbarDropdown title="Entrance animation" width={170} trigger={<span>Animate</span>}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Entrance animation</div>
            {ANIMATION_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelectedAnimation(opt.key)}
                style={{
                  textAlign: 'left',
                  border: 'none',
                  background: primaryAnimation === opt.key ? 'var(--accent-primary)' : 'none',
                  color: primaryAnimation === opt.key ? '#fff' : 'var(--text-body)',
                  borderRadius: 6,
                  padding: '6px 8px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </ToolbarDropdown>

          <ToolbarButton onClick={removeSelected} danger>
            Delete
          </ToolbarButton>
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: (canvasHeight + paddingY * 2) * scale,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
          background: background || 'var(--surface-card)',
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'hidden',
          touchAction: 'none',
        }}
      >
        <div
          onClick={(e) => {
            // The scaled wrapper (not the unscaled outer container) is what
            // actually receives a click on empty canvas space, since it's
            // rendered at the container's full size — a click that lands on
            // e.currentTarget here (not a child block) is genuinely background.
            if (e.target === e.currentTarget) setSelectedIds([]);
          }}
          style={{
            position: 'absolute',
            top: paddingY,
            left: 0,
            width: canvasWidth,
            height: canvasHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {visibleBlocks.length === 0 && editable && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14, pointerEvents: 'none', textAlign: 'center', padding: 16 }}>
              {mobile ? 'Every block in this section is hidden on mobile.' : 'Add a block to start building this section'}
            </div>
          )}
          {visibleBlocks.map((b) => (
            <div
              key={b.id}
              onPointerDown={(e) => editable && select(b.id, e.shiftKey)}
              style={{
                position: 'absolute',
                left: getPos(b).x,
                top: getPos(b).y,
                width: getPos(b).w,
                height: getPos(b).h,
                zIndex: b.zIndex,
                outline: selectedIds.includes(b.id) ? '2px solid var(--accent-primary)' : editable ? '1px dashed var(--border-strong)' : 'none',
                outlineOffset: -1,
                background: b.style?.background,
                backgroundImage: b.style?.backgroundImage ? `url(${b.style.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: b.style?.borderWidth ? `${b.style.borderWidth}px solid ${b.style.borderColor ?? 'var(--border-default)'}` : undefined,
                borderRadius: b.style?.borderRadius,
                boxShadow: b.style?.shadow ? 'var(--shadow-lg)' : undefined,
                opacity: b.locked && editable ? 0.85 : 1,
              }}
            >
              <div style={{ width: '100%', height: '100%', overflow: b.block.type === 'workgrid' ? 'visible' : 'auto', padding: b.block.type === 'workgrid' ? 0 : 4 }}>
                {b.block.type === 'workgrid' ? (
                  <WorkGrid tiles={tiles ?? []} pages={pages} editable={editable} onChange={onTilesChange} />
                ) : (
                  <BlockContent block={b.block} editable={editable} onUpdate={(patch) => updateBlock(b.id, { block: { ...b.block, ...patch } })} pages={pages} widgets={widgets} />
                )}
              </div>

              {editable && selectedIds.includes(b.id) && !b.locked && (
                <>
                  <div
                    onPointerDown={(e) => startDrag(e, b.id, 'move')}
                    onPointerMove={onDragMove}
                    onPointerUp={onDragUp}
                    title="Drag to move"
                    style={{
                      position: 'absolute',
                      top: -14,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 28,
                      height: 16,
                      cursor: 'grab',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--surface-panel)',
                      border: '1px solid var(--border-strong)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      zIndex: 1000,
                    }}
                  >
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-muted)' }} />
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-muted)' }} />
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-muted)' }} />
                  </div>
                  <div
                    onPointerDown={(e) => startDrag(e, b.id, 'resize')}
                    onPointerMove={onDragMove}
                    onPointerUp={onDragUp}
                    title="Drag to resize"
                    style={{
                      position: 'absolute',
                      right: -6,
                      bottom: -6,
                      width: 14,
                      height: 14,
                      cursor: 'nwse-resize',
                      borderRadius: 4,
                      background: 'var(--surface-panel)',
                      border: '1.5px solid var(--accent-primary)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      zIndex: 1000,
                    }}
                  />
                </>
              )}
              {editable && b.locked && (
                <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 12, background: 'var(--surface-panel)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-strong)' }}>
                  🔒
                </div>
              )}
              {editable && mobile && b.mobileStale && (
                <div title="Desktop position changed since this block's mobile layout was last touched" style={{ position: 'absolute', top: -10, left: -10, fontSize: 12, background: '#d97706', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-strong)' }}>
                  ⚠
                </div>
              )}
            </div>
          ))}

          {guides.map((g, i) =>
            g.axis === 'x' ? (
              <div key={i} style={{ position: 'absolute', left: g.pos, top: g.from, width: 1, height: g.to - g.from, background: 'var(--accent-primary)', zIndex: 2000, pointerEvents: 'none' }} />
            ) : (
              <div key={i} style={{ position: 'absolute', top: g.pos, left: g.from, height: 1, width: g.to - g.from, background: 'var(--accent-primary)', zIndex: 2000, pointerEvents: 'none' }} />
            ),
          )}
        </div>
      </div>

      {editable && !mobile && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <AddBlockMenu onAdd={addBlockOfType} />
          {tiles && <Button variant="ghost" size="sm" onClick={addWorkGrid}>+ Work Grid</Button>}
        </div>
      )}
      {editable && mobile && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          Arranging for mobile. Switch to Desktop to add, remove, or restyle blocks.
        </p>
      )}
    </div>
  );
}

function ToolbarButton({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: 'none',
        borderRadius: 'var(--radius-pill)',
        padding: '4px 12px',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        background: danger ? 'var(--red-600)' : 'var(--surface-card)',
        color: danger ? '#fff' : 'var(--text-body)',
      }}
    >
      {children}
    </button>
  );
}
