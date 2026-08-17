import { useRef } from 'react';
import { WidgetElementContent } from './WidgetElementContent';
import type { Widget, WidgetElement } from '../../data/siteData';

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const MIN_SIZE = 4;

interface DragState {
  id: string;
  mode: 'move' | 'resize';
  startX: number;
  startY: number;
  start: { x: number; y: number; w: number; h: number };
}

/**
 * The Widget Studio's editing canvas — elements can be dragged anywhere and
 * resized from their corner, positioned as percentages of the canvas so a
 * widget scales cleanly whatever width it's eventually placed at. This is a
 * deliberately separate implementation from the work-tile grid (BentoGrid):
 * a widget's canvas is a small fixed-aspect composition surface, not a
 * responsive multi-breakpoint page grid, so reusing that engine here would
 * mean fighting its column/breakpoint assumptions rather than benefiting
 * from them.
 */
export function WidgetCanvas({
  widget,
  selectedId,
  onSelect,
  onChange,
}: {
  widget: Widget;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<Pick<WidgetElement, 'x' | 'y' | 'w' | 'h'>>) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<DragState | null>(null);

  function startDrag(e: React.PointerEvent, el: WidgetElement, mode: 'move' | 'resize') {
    e.preventDefault();
    e.stopPropagation();
    onSelect(el.id);
    dragState.current = { id: el.id, mode, startX: e.clientX, startY: e.clientY, start: { x: el.x, y: el.y, w: el.w, h: el.h } };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onDragMove(e: React.PointerEvent) {
    const d = dragState.current;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!d || !rect) return;
    const dxPct = ((e.clientX - d.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - d.startY) / rect.height) * 100;
    if (d.mode === 'move') {
      onChange(d.id, {
        x: clamp(d.start.x + dxPct, 0, 100 - d.start.w),
        y: Math.max(0, d.start.y + dyPct),
      });
    } else {
      onChange(d.id, {
        w: clamp(d.start.w + dxPct, MIN_SIZE, 100 - d.start.x),
        h: Math.max(MIN_SIZE, d.start.h + dyPct),
      });
    }
  }

  function onDragUp(e: React.PointerEvent) {
    dragState.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  return (
    <div
      ref={containerRef}
      onClick={() => onSelect(null)}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: widget.aspect,
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-default)',
        touchAction: 'none',
      }}
    >
      {widget.elements.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
            pointerEvents: 'none',
          }}
        >
          Add an element to start building
        </div>
      )}
      {widget.elements.map((el) => (
        <div
          key={el.id}
          onPointerDown={(e) => startDrag(e, el, 'move')}
          onPointerMove={onDragMove}
          onPointerUp={onDragUp}
          style={{
            position: 'absolute',
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.w}%`,
            height: `${el.h}%`,
            cursor: 'grab',
            outline: selectedId === el.id ? '2px solid var(--accent-primary)' : '1px dashed var(--border-strong)',
            outlineOffset: -1,
          }}
        >
          <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
            <WidgetElementContent element={el} variables={widget.variables} />
          </div>
          {selectedId === el.id && (
            <div
              onPointerDown={(e) => startDrag(e, el, 'resize')}
              onPointerMove={onDragMove}
              onPointerUp={onDragUp}
              title="Drag to resize"
              style={{
                position: 'absolute',
                right: -6,
                bottom: -6,
                width: 14,
                height: 14,
                borderRadius: 4,
                background: 'var(--surface-panel)',
                border: '1.5px solid var(--accent-primary)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                cursor: 'nwse-resize',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
