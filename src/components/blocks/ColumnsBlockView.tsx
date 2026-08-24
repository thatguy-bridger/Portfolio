import { createBlock, BLOCK_REGISTRY } from '../../lib/blocks/registry';
import type { SlotItem } from '../../lib/blocks/types';
import { type BlockComponentProps, str } from './types';
// BlockRenderer.tsx imports ColumnsBlockView (it's one of the entries in
// BLOCK_COMPONENTS) — this is a circular import, safe here because
// BLOCK_COMPONENTS is only ever read lazily, inside a function body below,
// never at module-evaluation time (same pattern Alta-Seminary's
// ColumnsBlock.jsx documents for its own identical circular import).
import { BLOCK_COMPONENTS } from './BlockRenderer';

const SLOT_TYPE_OPTIONS = Object.entries(BLOCK_REGISTRY).filter(([, def]) => !def.slotsKey);

export function ColumnsBlockView({ props, editable, onFieldChange, blockId, activeSlotIndex, onSelectSlot, onExtractSlot, narrow }: BlockComponentProps) {
  const count = str(props, 'columnCount', '2') === '3' ? 3 : 2;
  const gap = { sm: 12, md: 20, lg: 32 }[str(props, 'gap', 'lg')] ?? 32;
  const columns = (Array.isArray(props.columns) ? (props.columns as SlotItem[]) : []).slice(0, count);

  function updateSlotProps(i: number, patch: Record<string, unknown>) {
    const next = columns.map((c, ci) => (ci === i ? { ...c, props: { ...c.props, ...patch } } : c));
    onFieldChange('columns', next);
  }
  function changeSlotType(i: number, type: string) {
    const fresh = createBlock(type);
    const next = columns.map((c, ci) => (ci === i ? fresh : c));
    onFieldChange('columns', next);
  }

  return (
    <div style={{ width: '100%', height: narrow ? 'auto' : '100%', display: 'flex', flexDirection: narrow ? 'column' : 'row', gap, overflow: narrow ? 'visible' : editable ? 'visible' : 'auto' }}>
      {columns.map((col, i) => {
        const Component = BLOCK_COMPONENTS[col.type];
        const isActive = editable && activeSlotIndex === i;
        return (
          <div
            key={col.id}
            data-slot-container={blockId}
            data-slot-index={i}
            style={{
              flex: narrow ? undefined : '1 1 0',
              minWidth: 0,
              minHeight: editable ? 60 : undefined,
              display: 'flex',
              flexDirection: 'column',
              outline: isActive ? '2px solid var(--accent-primary)' : editable ? '1px dashed var(--border-default)' : 'none',
              outlineOffset: 2,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {editable && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }} onPointerDown={(e) => e.stopPropagation()}>
                <select
                  value={col.type}
                  onChange={(e) => changeSlotType(i, e.target.value)}
                  style={{ flex: 1, fontSize: 11, padding: '3px 4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-body)' }}
                >
                  {SLOT_TYPE_OPTIONS.map(([type, def]) => (
                    <option key={type} value={type}>{def.label}</option>
                  ))}
                </select>
                <button type="button" onClick={() => onSelectSlot?.(i)} title="Settings" style={slotBtnStyle(isActive)}>
                  ⚙
                </button>
                <button type="button" onClick={() => onExtractSlot?.(i)} title="Pull out to the main canvas" style={slotBtnStyle(false)}>
                  ⇱
                </button>
              </div>
            )}
            <div style={{ flex: 1, minHeight: editable ? 40 : undefined }}>
              {Component ? <Component props={col.props} editable={editable} onFieldChange={(key, value) => updateSlotProps(i, { [key]: value })} narrow={narrow} /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function slotBtnStyle(active: boolean): React.CSSProperties {
  return {
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    width: 22,
    height: 22,
    fontSize: 12,
    cursor: 'pointer',
    background: active ? 'var(--accent-gradient)' : 'var(--surface-card)',
    color: active ? '#fff' : 'var(--text-muted)',
  };
}
