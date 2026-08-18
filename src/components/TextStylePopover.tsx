import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FONT_LIBRARY, loadFont } from '../design-system/fonts';
import { useClickAway } from '../design-system/useClickAway';
import type { TextBoxShape, TextEffects } from '../data/siteData';

const SHAPE_RADIUS: Record<TextBoxShape, number> = { none: 0, rounded: 8, pill: 999, square: 0 };

/** Computes the inline style for a block's per-text font/effect overrides — unset fields fall through to the site's normal styling. */
export function effectsToStyle(e?: TextEffects): CSSProperties {
  if (!e) return {};
  const font = e.fontId ? FONT_LIBRARY.find((f) => f.id === e.fontId) : undefined;
  const hasBox = !!e.backgroundColor && (e.boxShape ?? 'rounded') !== 'none';
  return {
    fontFamily: font ? `'${font.family}', sans-serif` : undefined,
    fontWeight: e.bold ? 700 : undefined,
    fontStyle: e.italic ? 'italic' : undefined,
    textDecoration: e.underline ? 'underline' : undefined,
    color: e.color || undefined,
    letterSpacing: e.letterSpacing ? `${e.letterSpacing}px` : undefined,
    textShadow: e.shadow ? '0 2px 10px rgba(0,0,0,0.35)' : undefined,
    backgroundColor: hasBox ? e.backgroundColor : undefined,
    borderRadius: hasBox ? SHAPE_RADIUS[e.boxShape ?? 'rounded'] : undefined,
    padding: hasBox ? ((e.boxShape ?? 'rounded') === 'pill' ? '8px 22px' : '6px 14px') : undefined,
    display: hasBox ? 'inline-block' : undefined,
  };
}

const SWATCHES = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#a855f7', '#ec4899', '#0f172a', '#ffffff'];

function ToggleButton({ active, label, title, onClick }: { active: boolean; label: string; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        border: 'none',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        flexShrink: 0,
        background: active ? 'var(--accent-primary)' : 'var(--surface-card)',
        color: active ? '#fff' : 'var(--text-body)',
      }}
    >
      {label}
    </button>
  );
}

/**
 * One Google-Docs-style toolbar trigger: a small button showing the current
 * value that opens its own focused dropdown panel, instead of everything
 * living in one big popover. Portaled to document.body with fixed
 * positioning so it isn't clipped inside a modal's scroll area.
 */
export function ToolbarDropdown({ trigger, title, width = 200, children }: { trigger: ReactNode; title: string; width?: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
    setOpen((o) => !o);
  }
  const close = () => setOpen(false);
  useClickAway(open, [btnRef, panelRef], close);

  useEffect(() => {
    if (!open) return;
    document.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <span style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={toggle}
        title={title}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          border: 'none',
          borderRadius: 6,
          padding: '3px 6px',
          fontSize: 12,
          cursor: 'pointer',
          background: 'var(--surface-card)',
          color: 'var(--text-body)',
          height: 26,
        }}
      >
        {trigger}
        <span style={{ fontSize: 8, opacity: 0.6 }}>▾</span>
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              zIndex: 300,
              width,
              maxHeight: 320,
              overflowY: 'auto',
              background: 'var(--surface-glass)',
              backdropFilter: 'var(--blur-glass)',
              WebkitBackdropFilter: 'var(--blur-glass)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontFamily: 'var(--font-body)',
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </span>
  );
}

export function ColorGrid({ value, onPick, onClear }: { value?: string; onPick: (c: string) => void; onClear: () => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
      <button
        onClick={onClear}
        title="None"
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background:
            'repeating-conic-gradient(var(--surface-card) 0% 25%, var(--surface-panel) 0% 50%) 50% / 8px 8px',
          border: !value ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
          cursor: 'pointer',
        }}
      />
      {SWATCHES.map((c) => (
        <button
          key={c}
          onClick={() => onPick(c)}
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: c,
            border: value === c ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
            cursor: 'pointer',
          }}
        />
      ))}
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onPick(e.target.value)}
        title="Custom color"
        style={{ width: 24, height: 24, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }}
      />
    </div>
  );
}

const SHAPE_OPTIONS: Array<{ key: TextBoxShape; label: string }> = [
  { key: 'none', label: 'No box' },
  { key: 'square', label: 'Square' },
  { key: 'rounded', label: 'Rounded' },
  { key: 'pill', label: 'Pill' },
];

/**
 * A row of independent, Google-Docs-style toolbar dropdowns for a block's
 * font, text color, background/highlight color, and box shape, plus simple
 * bold/italic/underline/shadow toggles — instead of one big everything-panel.
 */
export function TextStylePopover({ value, onChange }: { value?: TextEffects; onChange: (v: TextEffects) => void }) {
  const v = value ?? {};
  function patch(p: Partial<TextEffects>) {
    onChange({ ...v, ...p });
  }
  const currentFont = v.fontId ? FONT_LIBRARY.find((f) => f.id === v.fontId) : undefined;
  const hasOverrides = !!(v.fontId || v.bold || v.italic || v.underline || v.color || v.backgroundColor || (v.boxShape && v.boxShape !== 'none') || v.letterSpacing || v.shadow);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      <ToolbarDropdown title="Font" width={200} trigger={<span style={{ maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentFont?.family ?? 'Font'}</span>}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Font</div>
        <button
          onClick={() => patch({ fontId: undefined })}
          style={{
            textAlign: 'left',
            border: 'none',
            background: !v.fontId ? 'var(--accent-soft, var(--surface-card))' : 'none',
            borderRadius: 6,
            padding: '6px 8px',
            fontSize: 13,
            color: 'var(--text-body)',
            cursor: 'pointer',
          }}
        >
          Site default
        </button>
        {FONT_LIBRARY.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              loadFont(f);
              patch({ fontId: f.id });
            }}
            style={{
              textAlign: 'left',
              border: 'none',
              background: v.fontId === f.id ? 'var(--accent-primary)' : 'none',
              color: v.fontId === f.id ? '#fff' : 'var(--text-body)',
              borderRadius: 6,
              padding: '6px 8px',
              fontSize: 14,
              fontFamily: `'${f.family}', sans-serif`,
              cursor: 'pointer',
            }}
          >
            {f.family}
          </button>
        ))}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 4 }}>
          Letter spacing
          <input type="range" min={-2} max={10} step={0.5} value={v.letterSpacing ?? 0} onChange={(e) => patch({ letterSpacing: parseFloat(e.target.value) })} />
        </label>
      </ToolbarDropdown>

      <ToolbarDropdown
        title="Text color"
        width={190}
        trigger={
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
            <span style={{ fontWeight: 700 }}>A</span>
            <span style={{ width: 14, height: 3, borderRadius: 1, background: v.color || 'var(--text-muted)', marginTop: 1 }} />
          </span>
        }
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Text color</div>
        <ColorGrid value={v.color} onPick={(c) => patch({ color: c })} onClear={() => patch({ color: undefined })} />
      </ToolbarDropdown>

      <ToolbarDropdown
        title="Background color"
        width={190}
        trigger={
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
            <span style={{ fontWeight: 700 }}>🖍</span>
            <span style={{ width: 14, height: 3, borderRadius: 1, background: v.backgroundColor || 'var(--text-muted)', marginTop: 1 }} />
          </span>
        }
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Background color</div>
        <ColorGrid value={v.backgroundColor} onPick={(c) => patch({ backgroundColor: c, boxShape: v.boxShape ?? 'rounded' })} onClear={() => patch({ backgroundColor: undefined })} />
      </ToolbarDropdown>

      <ToolbarDropdown title="Textbox shape" width={150} trigger={<span>Shape</span>}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Textbox shape</div>
        {SHAPE_OPTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => patch({ boxShape: s.key })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textAlign: 'left',
              border: 'none',
              background: (v.boxShape ?? 'none') === s.key ? 'var(--accent-primary)' : 'none',
              color: (v.boxShape ?? 'none') === s.key ? '#fff' : 'var(--text-body)',
              borderRadius: 6,
              padding: '6px 8px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: 18,
                height: 12,
                background: (v.boxShape ?? 'none') === s.key ? '#fff' : 'var(--text-muted)',
                borderRadius: SHAPE_RADIUS[s.key] === 999 ? 6 : Math.min(SHAPE_RADIUS[s.key], 4),
                opacity: s.key === 'none' ? 0.3 : 1,
                flexShrink: 0,
              }}
            />
            {s.label}
          </button>
        ))}
      </ToolbarDropdown>

      <ToggleButton active={!!v.bold} label="B" title="Bold" onClick={() => patch({ bold: !v.bold })} />
      <ToggleButton active={!!v.italic} label="I" title="Italic" onClick={() => patch({ italic: !v.italic })} />
      <ToggleButton active={!!v.underline} label="U" title="Underline" onClick={() => patch({ underline: !v.underline })} />
      <ToggleButton active={!!v.shadow} label="S" title="Shadow" onClick={() => patch({ shadow: !v.shadow })} />

      {hasOverrides && (
        <button
          onClick={() => onChange({})}
          title="Reset to site default"
          style={{
            border: 'none',
            background: 'none',
            color: 'var(--red-500)',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            padding: '0 4px',
            flexShrink: 0,
          }}
        >
          ↺
        </button>
      )}
    </div>
  );
}
