import { useEffect, useRef, useState } from 'react';
import { createBlock, BLOCK_REGISTRY } from '../../lib/blocks/registry';
import type { SlotItem } from '../../lib/blocks/types';
import { type BlockComponentProps, bool, str } from './types';
// Circular import — safe: see the identical note in ColumnsBlockView.tsx.
import { BLOCK_COMPONENTS } from './BlockRenderer';

const SLOT_TYPE_OPTIONS = Object.entries(BLOCK_REGISTRY).filter(([, def]) => !def.slotsKey);
const ASPECT_RATIO: Record<string, string> = { '21:9': '21 / 9', '16:9': '16 / 9', '4:3': '4 / 3', '1:1': '1 / 1' };

export function CarouselBlockView({ props, editable, onFieldChange, blockId, activeSlotIndex, onSelectSlot, onExtractSlot, narrow }: BlockComponentProps) {
  const items = Array.isArray(props.items) ? (props.items as SlotItem[]) : [];
  const autoplay = bool(props, 'autoplay');
  const loop = bool(props, 'loop', true);
  const showArrows = bool(props, 'showArrows', true);
  const showDots = bool(props, 'showDots', true);
  const aspect = ASPECT_RATIO[str(props, 'aspectRatio', '16:9')] ?? ASPECT_RATIO['16:9'];

  const [active, setActive] = useState(0);
  const clamped = Math.min(active, Math.max(0, items.length - 1));
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (editable || !autoplay || items.length < 2) return;
    timer.current = setInterval(() => {
      setActive((i) => (i + 1 >= items.length ? (loop ? 0 : i) : i + 1));
    }, 3500);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [editable, autoplay, loop, items.length]);

  function go(delta: number) {
    setActive((i) => {
      const next = i + delta;
      if (next < 0) return loop ? items.length - 1 : 0;
      if (next >= items.length) return loop ? 0 : items.length - 1;
      return next;
    });
  }

  function updateSlotProps(i: number, patch: Record<string, unknown>) {
    const next = items.map((it, ii) => (ii === i ? { ...it, props: { ...it.props, ...patch } } : it));
    onFieldChange('items', next);
  }
  function changeSlotType(i: number, type: string) {
    const fresh = createBlock(type);
    onFieldChange('items', items.map((it, ii) => (ii === i ? fresh : it)));
  }

  if (items.length === 0) return null;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: aspect, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--surface-card)' }}>
        {editable ? (
          // Editable mode shows every slide stacked so each is directly
          // reachable/editable at once, rather than only the "active" one —
          // matches how EditableImage/EditableText already work everywhere
          // else (always visible when editing, no separate preview step).
          <div style={{ display: 'flex', height: '100%', overflowX: 'auto', gap: 12, padding: 4 }}>
            {items.map((slide, i) => {
              const Component = BLOCK_COMPONENTS[slide.type];
              const isActive = activeSlotIndex === i;
              return (
                <div
                  key={slide.id}
                  data-slot-container={blockId}
                  data-slot-index={i}
                  style={{ flex: '0 0 85%', display: 'flex', flexDirection: 'column', outline: isActive ? '2px solid var(--accent-primary)' : '1px dashed var(--border-default)', outlineOffset: 2, borderRadius: 'var(--radius-sm)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 4 }} onPointerDown={(e) => e.stopPropagation()}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Slide {i + 1}</span>
                    <select
                      value={slide.type}
                      onChange={(e) => changeSlotType(i, e.target.value)}
                      style={{ flex: 1, fontSize: 11, padding: '3px 4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-body)' }}
                    >
                      {SLOT_TYPE_OPTIONS.map(([type, def]) => (
                        <option key={type} value={type}>{def.label}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => onSelectSlot?.(i)} title="Settings" style={slotBtnStyle(isActive)}>⚙</button>
                    <button type="button" onClick={() => onExtractSlot?.(i)} title="Pull out to the main canvas" style={slotBtnStyle(false)}>⇱</button>
                  </div>
                  <div style={{ flex: 1, minHeight: 60 }}>
                    {Component ? <Component props={slide.props} editable onFieldChange={(key, value) => updateSlotProps(i, { [key]: value })} /> : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          (() => {
            const slide = items[clamped];
            const Component = BLOCK_COMPONENTS[slide.type];
            return Component ? <Component props={slide.props} editable={false} onFieldChange={() => {}} narrow={narrow} /> : null;
          })()
        )}

        {!editable && showArrows && items.length > 1 && (
          <>
            <CarouselArrow dir="prev" onClick={() => go(-1)} />
            <CarouselArrow dir="next" onClick={() => go(1)} />
          </>
        )}
      </div>

      {!editable && showDots && items.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {items.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{ width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', background: i === clamped ? 'var(--accent-gradient)' : 'var(--border-strong)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CarouselArrow({ dir, onClick }: { dir: 'prev' | 'next'; onClick: () => void }) {
  const side: React.CSSProperties = dir === 'prev' ? { left: 10 } : { right: 10 };
  return (
    <button
      onClick={onClick}
      aria-label={dir === 'prev' ? 'Previous slide' : 'Next slide'}
      style={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: 'none',
        background: 'var(--surface-panel)',
        color: 'var(--text-heading)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        fontSize: 16,
        ...side,
      }}
    >
      {dir === 'prev' ? '‹' : '›'}
    </button>
  );
}

function slotBtnStyle(active: boolean): React.CSSProperties {
  return {
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    width: 20,
    height: 20,
    fontSize: 11,
    cursor: 'pointer',
    background: active ? 'var(--accent-gradient)' : 'var(--surface-card)',
    color: active ? '#fff' : 'var(--text-muted)',
    flexShrink: 0,
  };
}
