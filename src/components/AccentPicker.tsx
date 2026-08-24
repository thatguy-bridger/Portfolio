import { ACCENT_PRESETS } from '../design-system/accent';
import { useTheme } from '../design-system/theme';
import { gradientCss, GradientPicker } from './GradientPicker';

export function AccentPicker() {
  const { accentId, setAccentPreset, customAccentGradient, setCustomAccent } = useTheme();

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
              background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]}, ${preset.colors[2]})`,
              border: accentId === preset.id ? '2px solid var(--text-heading)' : '2px solid transparent',
              boxShadow: accentId === preset.id ? '0 0 0 2px var(--surface-panel)' : 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
        <button
          type="button"
          onClick={() => setAccentPreset('custom')}
          title="Custom gradient"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: accentId === 'custom' ? '2px solid var(--text-heading)' : '2px solid var(--border-strong)',
            boxShadow: accentId === 'custom' ? '0 0 0 2px var(--surface-panel)' : 'none',
            background: accentId === 'custom' ? gradientCss(customAccentGradient) : 'conic-gradient(red,orange,yellow,green,blue,violet,red)',
            cursor: 'pointer',
            padding: 0,
          }}
        />
      </div>

      {accentId === 'custom' && <GradientPicker value={customAccentGradient} onChange={setCustomAccent} />}

      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
        Pick a preset, or the last swatch to build and save your own 3-color gradient.
      </span>
    </div>
  );
}
