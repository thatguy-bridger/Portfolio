import { useEffect, useRef, useState } from 'react';
import { BLOCK_CATEGORIES, BLOCK_REGISTRY } from '../../lib/blocks/registry';

/** The "+ Add block" trigger and its category-grouped dropdown — driven entirely off BLOCK_REGISTRY, same as the settings panel (registry.ts's whole point). */
export function AddBlockPicker({ onAdd }: { onAdd: (type: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [open]);

  const byCategory = BLOCK_CATEGORIES.map((cat) => ({
    cat,
    types: Object.entries(BLOCK_REGISTRY).filter(([, def]) => def.category === cat),
  })).filter((g) => g.types.length > 0);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          border: 'none',
          borderRadius: 'var(--radius-pill)',
          padding: '8px 18px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          background: 'var(--accent-gradient)',
          color: '#fff',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        + Add block
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 6,
            zIndex: 4000,
            width: 300,
            maxHeight: 420,
            overflowY: 'auto',
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: 'var(--surface-panel)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {byCategory.map(({ cat, types }) => (
            <div key={cat}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 6px 6px' }}>{cat}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {types.map(([type, def]) => (
                  <button
                    key={type}
                    type="button"
                    data-testid={`add-block-${type}`}
                    onClick={() => {
                      onAdd(type);
                      setOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      textAlign: 'left',
                      border: 'none',
                      background: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 8px',
                      cursor: 'pointer',
                      color: 'var(--text-body)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-card)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ width: 26, height: 26, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {def.icon}
                    </span>
                    <span>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{def.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{def.description}</div>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
