import { useEffect } from 'react';
import { FONT_COMBOS, FONT_LIBRARY, loadFont, type FontCombo } from '../design-system/fonts';

function fontById(id: string) {
  return FONT_LIBRARY.find((f) => f.id === id)!;
}

/**
 * "Combos" section of the font settings: curated modern display+body(+mono) pairings,
 * each rendered live in its own actual fonts so the preview shows the real vibe, not
 * just a label. Picking a combo applies all three font slots at once via applyFontCombo,
 * while the individual per-category pickers (FontPicker) remain fully independent and
 * still reachable — this component only ever calls the theme's setters, never owns state.
 */
export function FontComboPicker({
  activeDisplayId,
  activeBodyId,
  activeMonoId,
  onApply,
}: {
  activeDisplayId: string;
  activeBodyId: string;
  activeMonoId: string;
  onApply: (combo: FontCombo) => void;
}) {
  // Preload every combo's fonts up front so all previews render in their real faces
  // immediately, rather than popping in one at a time as cards scroll into view.
  useEffect(() => {
    for (const combo of FONT_COMBOS) {
      loadFont(fontById(combo.displayId));
      loadFont(fontById(combo.bodyId));
      loadFont(fontById(combo.monoId));
    }
  }, []);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 'var(--space-3)',
      }}
    >
      {FONT_COMBOS.map((combo) => {
        const display = fontById(combo.displayId);
        const body = fontById(combo.bodyId);
        const mono = fontById(combo.monoId);
        const isActive =
          activeDisplayId === combo.displayId && activeBodyId === combo.bodyId && activeMonoId === combo.monoId;

        return (
          <button
            key={combo.id}
            onClick={() => onApply(combo)}
            aria-pressed={isActive}
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-default)'}`,
              background: isActive ? 'var(--surface-card)' : 'var(--surface-base)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              boxShadow: isActive ? '0 0 0 1px var(--accent-primary)' : 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}
              >
                {combo.label}
              </span>
              {isActive && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    border: '1px solid var(--accent-primary)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '1px 6px',
                  }}
                >
                  Active
                </span>
              )}
            </div>

            <span
              style={{
                fontFamily: `'${display.family}', var(--font-sans)`,
                fontSize: 26,
                lineHeight: 1.15,
                fontWeight: display.weights.includes(700) ? 700 : display.weights[display.weights.length - 1],
                color: 'var(--text-heading)',
              }}
            >
              {display.family}
            </span>

            <span
              style={{
                fontFamily: `'${body.family}', var(--font-sans)`,
                fontSize: 14,
                lineHeight: 1.4,
                color: 'var(--text-body)',
              }}
            >
              Paired with {body.family} for body text.
            </span>

            <span
              style={{
                fontFamily: `'${mono.family}', ui-monospace, monospace`,
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              {mono.family}
            </span>

            <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{combo.description}</span>
          </button>
        );
      })}
    </div>
  );
}
