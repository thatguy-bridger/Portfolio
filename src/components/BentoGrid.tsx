import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export interface BentoTile {
  id: string;
  colSpan: number;
  rowSpan: number;
  /** freeform position, in fine grid units — undefined means "not placed yet", auto-packed for display */
  x?: number;
  y?: number;
  content: ReactNode;
}

const ROW_HEIGHT = 96;
const GAP = 16;
/** The move grid is finer than the resize grid — each resize cell splits into this many move steps per axis. */
const FINE = 4;

function useColumnCount() {
  const [columns, setColumns] = useState(6);
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setColumns(w < 640 ? 2 : w < 1024 ? 4 : 6);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return columns;
}

/** Tracks an element's rendered width, so pixel geometry can be computed on the very first paint, not just during a drag. */
function useElementWidth(): [React.RefObject<HTMLDivElement>, number] {
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

interface Placed extends BentoTile {
  px: number;
  py: number;
}

/**
 * Resolves every tile's fine-grid position: tiles with an explicit x/y use
 * it directly (and reserve their footprint first); any tile without one
 * yet — never dragged, or a legacy tile from before freeform positions
 * existed — is auto-packed left-to-right, top-to-bottom into the lowest
 * open spot, in array order, so the very first render looks the same as
 * the old auto-flow-dense grid did.
 */
function resolvePositions(tiles: BentoTile[], columns: number): Placed[] {
  const columnsFine = columns * FINE;
  const skyline = new Array(columnsFine).fill(0);

  function reserve(x: number, w: number, topY: number) {
    for (let i = x; i < Math.min(x + w, columnsFine); i++) skyline[i] = Math.max(skyline[i], topY);
  }
  function place(w: number): number {
    let bestX = 0;
    let bestY = Infinity;
    for (let x = 0; x <= columnsFine - w; x++) {
      let y = 0;
      for (let i = x; i < x + w; i++) y = Math.max(y, skyline[i]);
      if (y < bestY) {
        bestY = y;
        bestX = x;
      }
    }
    return bestY === Infinity ? 0 : bestX;
  }

  const placed: Placed[] = [];
  const withPos = tiles.filter((t) => t.x != null && t.y != null);
  const withoutPos = tiles.filter((t) => t.x == null || t.y == null);

  for (const t of withPos) {
    const w = Math.min(t.colSpan, columns) * FINE;
    reserve(t.x!, w, t.y! + t.rowSpan * FINE);
    placed.push({ ...t, px: t.x!, py: t.y! });
  }
  for (const t of withoutPos) {
    const w = Math.min(t.colSpan, columns) * FINE;
    const h = t.rowSpan * FINE;
    const x = place(w);
    let y = 0;
    for (let i = x; i < x + w; i++) y = Math.max(y, skyline[i]);
    reserve(x, w, y + h);
    placed.push({ ...t, px: x, py: y });
  }
  return placed;
}

/**
 * Freeform tile canvas: each tile can be both moved (drag the grip handle
 * anywhere, snapping to a fine sub-grid) and resized (drag the corner
 * handle, snapping to the coarser column/row grid) independently — closer
 * to a slide-layout canvas than an auto-packing dashboard grid. Tiles are
 * free to overlap; stacking order follows array order, with the tile
 * being dragged brought to the front for the duration of the drag.
 */
export function BentoGrid({
  tiles,
  editable = false,
  onChange,
}: {
  tiles: BentoTile[];
  editable?: boolean;
  onChange?: (id: string, patch: { colSpan?: number; rowSpan?: number; x?: number; y?: number }) => void;
}) {
  const columns = useColumnCount();
  const [containerRef, containerWidth] = useElementWidth();
  const placed = useMemo(() => resolvePositions(tiles, columns), [tiles, columns]);
  const maxYFine = placed.reduce((m, t) => Math.max(m, t.py + t.rowSpan * FINE), FINE);

  const columnWidthPx = containerWidth > 0 ? (containerWidth - GAP * (columns - 1)) / columns : 100;
  const fineColPx = (columnWidthPx + GAP) / FINE;
  const fineRowPx = (ROW_HEIGHT + GAP) / FINE;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: Math.max(maxYFine * fineRowPx - GAP, ROW_HEIGHT),
      }}
    >
      {placed.map((tile) => (
        <BentoTileView
          key={tile.id}
          tile={tile}
          columns={columns}
          editable={editable}
          fineColPx={fineColPx}
          fineRowPx={fineRowPx}
          onResize={(colSpan, rowSpan) => onChange?.(tile.id, { colSpan, rowSpan })}
          onMove={(x, y) => onChange?.(tile.id, { x, y })}
        />
      ))}
    </div>
  );
}

function BentoTileView({
  tile,
  columns,
  editable,
  fineColPx,
  fineRowPx,
  onResize,
  onMove,
}: {
  tile: Placed;
  columns: number;
  editable: boolean;
  fineColPx: number;
  fineRowPx: number;
  onResize: (colSpan: number, rowSpan: number) => void;
  onMove: (x: number, y: number) => void;
}) {
  const [mode, setMode] = useState<'idle' | 'resizing' | 'moving'>('idle');
  const resizeState = useRef({ startX: 0, startY: 0, startCol: 1, startRow: 1 });
  const moveState = useRef({ startX: 0, startY: 0, startPx: 0, startPy: 0 });
  // Width still clamps to the current breakpoint's column count so a tile sized wide on
  // desktop doesn't force horizontal overflow on mobile — that's responsive display, not a
  // size limit. Height has no cap at all: drag as tall as you want.
  const colSpan = Math.min(tile.colSpan, columns);
  const rowSpan = tile.rowSpan;

  function onResizeDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    resizeState.current = { startX: e.clientX, startY: e.clientY, startCol: colSpan, startRow: rowSpan };
    setMode('resizing');
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onResizeMove(e: React.PointerEvent) {
    if (mode !== 'resizing') return;
    const { startX, startY, startCol, startRow } = resizeState.current;
    const deltaCols = Math.round((e.clientX - startX) / (fineColPx * FINE));
    const deltaRows = Math.round((e.clientY - startY) / (fineRowPx * FINE));
    const nextCol = Math.min(columns, Math.max(1, startCol + deltaCols));
    const nextRow = Math.max(1, startRow + deltaRows);
    onResize(nextCol, nextRow);
  }

  function onResizeUp(e: React.PointerEvent) {
    setMode('idle');
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  function onMoveDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    moveState.current = { startX: e.clientX, startY: e.clientY, startPx: tile.px, startPy: tile.py };
    setMode('moving');
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onMoveMove(e: React.PointerEvent) {
    if (mode !== 'moving') return;
    const { startX, startY, startPx, startPy } = moveState.current;
    const columnsFine = columns * FINE;
    const w = colSpan * FINE;
    const deltaX = Math.round((e.clientX - startX) / fineColPx);
    const deltaY = Math.round((e.clientY - startY) / fineRowPx);
    const nextX = Math.min(Math.max(columnsFine - w, 0), Math.max(0, startPx + deltaX));
    const nextY = Math.max(0, startPy + deltaY);
    onMove(nextX, nextY);
  }

  function onMoveUp(e: React.PointerEvent) {
    setMode('idle');
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  const left = tile.px * fineColPx;
  const top = tile.py * fineRowPx;
  const width = colSpan * FINE * fineColPx - GAP;
  const height = rowSpan * FINE * fineRowPx - GAP;

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        zIndex: mode !== 'idle' ? 10 : undefined,
        background: 'var(--surface-glass)',
        backdropFilter: 'var(--blur-glass)',
        WebkitBackdropFilter: 'var(--blur-glass)',
        border: mode !== 'idle' ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        transition:
          mode !== 'idle'
            ? 'none'
            : 'transform var(--duration-normal) var(--ease-standard), box-shadow var(--duration-normal) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)',
        boxShadow: mode === 'moving' ? 'var(--shadow-xl)' : 'var(--shadow-md)',
      }}
    >
      {tile.content}
      {editable && (
        <>
          <div
            onPointerDown={onMoveDown}
            onPointerMove={onMoveMove}
            onPointerUp={onMoveUp}
            title="Drag to move"
            style={{
              position: 'absolute',
              top: 6,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 28,
              height: 16,
              cursor: mode === 'moving' ? 'grabbing' : 'grab',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              touchAction: 'none',
              zIndex: 3,
            }}
          >
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-muted)' }} />
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-muted)' }} />
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-muted)' }} />
          </div>

          {/* Apple-style corner handle: a small rounded nub sitting right on the edge, not a big clickable button. */}
          <div
            onPointerDown={onResizeDown}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeUp}
            title="Drag to resize"
            style={{
              position: 'absolute',
              right: 3,
              bottom: 3,
              width: 13,
              height: 13,
              cursor: 'nwse-resize',
              borderRadius: 4,
              background: 'var(--surface-panel)',
              border: '1.5px solid var(--accent-primary)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              touchAction: 'none',
              zIndex: 3,
            }}
          />
        </>
      )}
    </div>
  );
}
