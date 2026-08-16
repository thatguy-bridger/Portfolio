import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { FONT_LIBRARY, loadFont } from '../design-system/fonts';
import { useClickAway } from '../design-system/useClickAway';
import type { TextEffects } from '../data/siteData';

/** Computes the inline style for a block's per-text font/effect overrides — unset fields fall through to the site's normal styling. */
export function effectsToStyle(e?: TextEffects): CSSProperties {
  if (!e) return {};
  const font = e.fontId ? FONT_LIBRARY.find((f) => f.id === e.fontId) : undefined;
  return {
    fontFamily: font ? `'${font.family}', sans-serif` : undefined,
    fontWeight: e.bold ? 700 : undefined,
    fontStyle: e.italic ? 'italic' : undefined,
    textDecoration: e.underline ? 'underline' : undefined,
    color: e.color || undefined,
    letterSpacing: e.letterSpacing ? `${e.letterSpacing}px` : undefined,
    textShadow: e.shadow ? '0 2px 10px rgba(0,0,0,0.35)' : undefined,
  };
}

const SWATCHES = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#a855f7', '#ec4899', '#0f172a', '#ffffff'];

function ToggleButton({ active, label, title, onClick }: { active: boolean; label: string; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        border: 'none',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        background: active ? 'var(--accent-primary)' : 'var(--surface-card)',
        color: active ? '#fff' : 'var(--text-body)',
      }}
    >
      {label}
    </button>
  );
}

/**
 * Per-block "Aa" trigger that opens a small font + effects panel — font
 * family, bold/italic/underline, a shadow toggle, color, and letter
 * spacing — layered on top of whatever the site's global font is. Portaled
 * to document.body with fixed positioning so it isn't clipped inside a
 * modal's scroll area, same pattern as the add-block menu.
 */
export function TextStylePopover({ value, onChange }: { value?: TextEffects; onChange: (v: TextEffects) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const v = value ?? {};

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

  function patch(p: Partial<TextEffects>) {
    onChange({ ...v, ...p });
  }

  const hasOverrides = !!(v.fontId || v.bold || v.italic || v.underline || v.color || v.letterSpacing || v.shadow);

  return (
    <span style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={toggle}
        title="Font & effects"
        style={{
          border: 'none',
          borderRadius: 'var(--radius-pill)',
          padding: '3px 10px',
          fontSize: 12,
          fontWeight: 700,
          fontStyle: 'italic',
          cursor: 'pointer',
          background: hasOverrides ? 'var(--accent-primary)' : 'var(--surface-card)',
          color: hasOverrides ? '#fff' : 'var(--text-body)',
        }}
      >
        Aa
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
              width: 230,
              background: 'var(--surface-glass)',
              backdropFilter: 'var(--blur-glass)',
              WebkitBackdropFilter: 'var(--blur-glass)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              fontFamily: 'var(--font-body)',
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Font</div>
              <select
                value={v.fontId ?? ''}
                onChange={(e) => {
                  const id = e.target.value;
                  const font = FONT_LIBRARY.find((f) => f.id === id);
                  if (font) loadFont(font);
                  patch({ fontId: id || undefined });
                }}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-heading)',
                  fontSize: 13,
                }}
              >
                <option value="">Site default</option>
                {FONT_LIBRARY.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.family}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              <ToggleButton active={!!v.bold} label="B" title="Bold" onClick={() => patch({ bold: !v.bold })} />
              <ToggleButton active={!!v.italic} label="I" title="Italic" onClick={() => patch({ italic: !v.italic })} />
              <ToggleButton active={!!v.underline} label="U" title="Underline" onClick={() => patch({ underline: !v.underline })} />
              <ToggleButton active={!!v.shadow} label="S" title="Shadow" onClick={() => patch({ shadow: !v.shadow })} />
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Color</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                <button
                  onClick={() => patch({ color: undefined })}
                  title="Site default"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'var(--surface-card)',
                    border: !v.color ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                    cursor: 'pointer',
                  }}
                />
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => patch({ color: c })}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: c,
                      border: v.color === c ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                      cursor: 'pointer',
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={v.color || '#000000'}
                  onChange={(e) => patch({ color: e.target.value })}
                  title="Custom color"
                  style={{ width: 22, height: 22, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                />
              </div>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
              Letter spacing
              <input
                type="range"
                min={-2}
                max={10}
                step={0.5}
                value={v.letterSpacing ?? 0}
                onChange={(e) => patch({ letterSpacing: parseFloat(e.target.value) })}
              />
            </label>

            {hasOverrides && (
              <button
                onClick={() => onChange({})}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--red-500)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: 0,
                }}
              >
                Reset to site default
              </button>
            )}
          </div>,
          document.body,
        )}
    </span>
  );
}
