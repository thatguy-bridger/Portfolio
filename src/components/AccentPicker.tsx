import { ACCENT_PRESETS } from '../design-system/accent';
import { useTheme } from '../design-system/theme';
import { ColorPicker } from './ColorPicker';

export function AccentPicker() {
  const { accentId, setAccentPreset, customAccentHex, setCustomAccent } = useTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {ACCENT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => setAccentPreset(preset.id)}
            title={preset.label}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: preset.hex,
              border: accentId === preset.id ? '2px solid var(--text-heading)' : '2px solid transparent',
              boxShadow: accentId === preset.id ? '0 0 0 2px var(--surface-panel)' : 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
        <ColorPicker
          value={customAccentHex}
          onChange={setCustomAccent}
          allowAlpha={false}
          trigger={
            <span
              title="Custom color"
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: accentId === 'custom' ? '2px solid var(--text-heading)' : '2px solid var(--border-strong)',
                boxShadow: accentId === 'custom' ? '0 0 0 2px var(--surface-panel)' : 'none',
                background: accentId === 'custom' ? customAccentHex : 'conic-gradient(red,orange,yellow,green,blue,violet,red)',
                display: 'inline-block',
              }}
            />
          }
        />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
        Pick a preset, or the last swatch for any custom color.
      </span>
    </div>
  );
}
