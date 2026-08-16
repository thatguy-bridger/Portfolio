import { useState } from 'react';
import { useTheme } from '../design-system/theme';
import { IconButton } from './ui/IconButton';
import { Switch } from './ui/Switch';
import { AccentPicker } from './AccentPicker';
import { FontPicker } from './FontPicker';

const SCHEME_LABEL: Record<string, string> = { system: 'System', light: 'Light', dark: 'Dark' };
const SCHEME_FROM_LABEL: Record<string, 'system' | 'light' | 'dark'> = { System: 'system', Light: 'light', Dark: 'dark' };

export function CustomizePanel() {
  const [open, setOpen] = useState(false);
  const { colorScheme, setColorScheme, displayFont, bodyFont, setDisplayFont, setBodyFont } = useTheme();

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 90, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
      {open && (
        <div
          style={{
            width: 300,
            maxHeight: '70vh',
            overflowY: 'auto',
            background: 'var(--surface-glass)',
            backdropFilter: 'var(--blur-glass)',
            WebkitBackdropFilter: 'var(--blur-glass)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xl)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            fontFamily: 'var(--font-body)',
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>Customize</h4>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              Appearance, accent color, and fonts — saved with your site.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-body)' }}>Appearance</span>
            <Switch
              options={['System', 'Light', 'Dark']}
              value={SCHEME_LABEL[colorScheme]}
              onChange={(v) => setColorScheme(SCHEME_FROM_LABEL[v])}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-body)' }}>Accent color</span>
            <AccentPicker />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-body)' }}>Display font</span>
            <FontPicker slot="display" activeId={displayFont.id} onSelect={setDisplayFont} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-body)' }}>Body font</span>
            <FontPicker slot="body" activeId={bodyFont.id} onSelect={setBodyFont} />
          </div>
        </div>
      )}
      <IconButton icon="⚙" tone="accent" size={52} title="Customize" onClick={() => setOpen((o) => !o)} />
    </div>
  );
}
