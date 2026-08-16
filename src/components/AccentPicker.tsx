import { ACCENT_PRESETS } from '../design-system/accent';
import { useTheme } from '../design-system/theme';

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
        <label
          title="Custom color"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            cursor: 'pointer',
            border: accentId === 'custom' ? '2px solid var(--text-heading)' : '2px solid var(--border-strong)',
            background:
              accentId === 'custom'
                ? customAccentHex
                : 'conic-gradient(red,orange,yellow,green,blue,violet,red)',
            display: 'inline-block',
            position: 'relative',
          }}
        >
          <input
            type="color"
            value={customAccentHex}
            onChange={(e) => setCustomAccent(e.target.value)}
            style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
          />
        </label>
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
        Pick a preset, or the last swatch for any custom color.
      </span>
    </div>
  );
}
