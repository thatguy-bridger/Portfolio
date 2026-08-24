import { useState } from 'react';
import { ThemeProvider, useTheme } from '../design-system/theme';
import { AccentPicker } from './AccentPicker';
import { FontPicker } from './FontPicker';
import { FontComboPicker } from './FontComboPicker';

/**
 * Groups accent + font customization behind a single <ThemeProvider> — the
 * Phase 1 demo surface for the accent/font system (deliverables 5 + 6 of the
 * design-system port). AccentPicker/FontPicker/ColorPicker all need this
 * provider as an ancestor; ThemeToggle deliberately doesn't (see its own
 * comment) so it can live in a separate island, e.g. a page header.
 */
export function ThemeSettingsPanel() {
  return (
    <ThemeProvider>
      <PanelBody />
    </ThemeProvider>
  );
}

type FontTab = 'combos' | 'individual';

function PanelBody() {
  const { displayFont, bodyFont, monoFont, setDisplayFont, setBodyFont, setMonoFont, applyFontCombo } = useTheme();
  const [fontTab, setFontTab] = useState<FontTab>('combos');

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--text-heading)', marginBottom: 4 }}>Accent color</h3>
        <AccentPicker />
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--text-heading)' }}>Fonts</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['combos', 'individual'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFontTab(tab)}
                style={{
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: fontTab === tab ? 'var(--accent-primary)' : 'var(--surface-card)',
                  color: fontTab === tab ? '#fff' : 'var(--text-muted)',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'combos' ? 'Combos' : 'Individual'}
              </button>
            ))}
          </div>
        </div>

        {fontTab === 'combos' ? (
          <FontComboPicker
            activeDisplayId={displayFont.id}
            activeBodyId={bodyFont.id}
            activeMonoId={monoFont.id}
            onApply={applyFontCombo}
          />
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <FontSlot label="Display" activeId={displayFont.id} slot="display" onSelect={setDisplayFont} />
            <FontSlot label="Body" activeId={bodyFont.id} slot="body" onSelect={setBodyFont} />
            <FontSlot label="Mono" activeId={monoFont.id} slot="mono" onSelect={setMonoFont} />
          </div>
        )}
      </div>
    </div>
  );
}

function FontSlot({
  label,
  activeId,
  slot,
  onSelect,
}: {
  label: string;
  activeId: string;
  slot: 'display' | 'body' | 'mono';
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 'var(--weight-semibold)' }}>{label}</h4>
      <FontPicker slot={slot} activeId={activeId} onSelect={onSelect} />
    </div>
  );
}
