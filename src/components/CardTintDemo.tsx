import { useState } from 'react';
import { ColorPicker } from './ColorPicker';

/**
 * Standalone ColorPicker demo with onClear wired up — AccentPicker's usage
 * never passes onClear (an accent always has a value), so this is the
 * Phase 1 demo surface that exercises the "None" swatch and RGBA-alpha
 * clearing path directly (see ColorPicker's own doc comment on the old
 * Firestore ignoreUndefinedProperties bug this guards against).
 */
export function CardTintDemo() {
  const [tint, setTint] = useState<string | undefined>(undefined);

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', background: tint ?? 'var(--surface-card)' }}>
      <ColorPicker value={tint} onChange={setTint} onClear={() => setTint(undefined)} title="Card tint" />
      <div>
        <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--text-heading)', marginBottom: 4 }}>Card tint (optional)</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
          {tint ? `Tinted ${tint}` : 'No tint — click the swatch to pick one, or clear it back to none.'}
        </p>
      </div>
    </div>
  );
}
