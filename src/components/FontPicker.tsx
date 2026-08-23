import { useState } from 'react';
import { FONT_LIBRARY, type FontCategory } from '../design-system/fonts';

const SLOT_CATEGORIES: Record<'display' | 'body' | 'mono', FontCategory[]> = {
  display: ['display'],
  body: ['sans', 'serif'],
  mono: ['mono'],
};

export function FontPicker({
  slot,
  activeId,
  onSelect,
}: {
  slot: 'display' | 'body' | 'mono';
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const categories = SLOT_CATEGORIES[slot];
  const [category, setCategory] = useState<FontCategory>(categories[0]);
  const fonts = FONT_LIBRARY.filter((f) => f.category === category);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {categories.length > 1 && (
        <div style={{ display: 'flex', gap: 6 }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                background: category === c ? 'var(--accent-primary)' : 'var(--surface-card)',
                color: category === c ? '#fff' : 'var(--text-muted)',
                textTransform: 'capitalize',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxHeight: 160,
          overflowY: 'auto',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: 4,
        }}
      >
        {fonts.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            style={{
              textAlign: 'left',
              border: 'none',
              background: activeId === f.id ? 'var(--surface-card)' : 'transparent',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              cursor: 'pointer',
              color: activeId === f.id ? 'var(--accent-primary)' : 'var(--text-body)',
              fontSize: 15,
            }}
          >
            <span style={{ fontFamily: `'${f.family}', var(--font-sans)` }}>{f.family}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
