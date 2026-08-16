import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface BentoTile {
  id: string;
  colSpan: number;
  rowSpan: number;
  content: ReactNode;
}

const ROW_HEIGHT = 96;
const GAP = 16;
const MAX_ROW_SPAN = 4;

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

/**
 * Freeform, resizable tile grid in the spirit of macOS Control Center: each
 * tile can be dragged from its bottom-right corner to any width x height (in
 * grid cells). `grid-auto-flow: dense` auto-packs remaining tiles into any
 * gaps a resize opens up, while still letting the creator leave space if
 * they want to.
 */
export function BentoGrid({
  tiles,
  editable = false,
  onChange,
}: {
  tiles: BentoTile[];
  editable?: boolean;
  onChange?: (id: string, colSpan: number, rowSpan: number) => void;
}) {
  const columns = useColumnCount();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridAutoRows: ROW_HEIGHT,
        gridAutoFlow: 'dense',
        gap: GAP,
      }}
    >
      {tiles.map((tile) => (
        <BentoTileView
          key={tile.id}
          tile={tile}
          columns={columns}
          editable={editable}
          containerRef={containerRef}
          onResize={(colSpan, rowSpan) => onChange?.(tile.id, colSpan, rowSpan)}
        />
      ))}
    </div>
  );
}

function BentoTileView({
  tile,
  columns,
  editable,
  containerRef,
  onResize,
}: {
  tile: BentoTile;
  columns: number;
  editable: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  onResize: (colSpan: number, rowSpan: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const dragState = useRef({ startX: 0, startY: 0, startCol: 1, startRow: 1, cellWidth: 100 });
  const colSpan = Math.min(tile.colSpan, columns);
  const rowSpan = Math.min(tile.rowSpan, MAX_ROW_SPAN);

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    const cellWidth = rect ? (rect.width - GAP * (columns - 1)) / columns + GAP : 100;
    dragState.current = { startX: e.clientX, startY: e.clientY, startCol: colSpan, startRow: rowSpan, cellWidth };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const { startX, startY, startCol, startRow, cellWidth } = dragState.current;
    const deltaCols = Math.round((e.clientX - startX) / cellWidth);
    const deltaRows = Math.round((e.clientY - startY) / (ROW_HEIGHT + GAP));
    const nextCol = Math.min(columns, Math.max(1, startCol + deltaCols));
    const nextRow = Math.min(MAX_ROW_SPAN, Math.max(1, startRow + deltaRows));
    onResize(nextCol, nextRow);
  }

  function onPointerUp(e: React.PointerEvent) {
    setDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  return (
    <div
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
        position: 'relative',
        background: 'var(--surface-glass)',
        backdropFilter: 'var(--blur-glass)',
        WebkitBackdropFilter: 'var(--blur-glass)',
        border: dragging ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        transition: dragging ? 'none' : 'transform var(--duration-normal) var(--ease-standard), box-shadow var(--duration-normal) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {tile.content}
      {editable && (
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            position: 'absolute',
            right: 4,
            bottom: 4,
            width: 18,
            height: 18,
            cursor: 'nwse-resize',
            borderRadius: 4,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: 'var(--text-muted)',
            touchAction: 'none',
          }}
          title="Drag to resize"
        >
          ⤡
        </div>
      )}
    </div>
  );
}
