import { useEffect, useState } from 'react';
import type { AccentGradient, GradientStops } from '../design-system/accent';
import { ColorPicker } from './ColorPicker';

export function gradientCss(g: AccentGradient): string {
  return `linear-gradient(${g.angle}deg, ${g.colors[0]}, ${g.colors[1]}, ${g.colors[2]})`;
}

function sameGradient(a: AccentGradient, b: AccentGradient): boolean {
  return a.angle === b.angle && a.colors[0] === b.colors[0] && a.colors[1] === b.colors[1] && a.colors[2] === b.colors[2];
}

/**
 * User-saved custom gradients — the gradient analog of ColorPicker.tsx's
 * CUSTOM_SWATCHES: shared across every open GradientPicker in the same tab
 * via a small listener set, persisted to localStorage so they survive
 * reloads. Deliberately separate from `portfolio:customSwatches` (that one
 * holds single flat colors for the general-purpose ColorPicker; this one
 * holds full 3-stop gradients).
 */
const CUSTOM_GRADIENTS_KEY = 'portfolio:customGradients';
const customGradientListeners = new Set<(gradients: AccentGradient[]) => void>();

function isGradientShape(v: unknown): v is AccentGradient {
  if (!v || typeof v !== 'object') return false;
  const g = v as Record<string, unknown>;
  return (
    Array.isArray(g.colors) &&
    g.colors.length === 3 &&
    g.colors.every((c) => typeof c === 'string') &&
    typeof g.angle === 'number' &&
    Number.isFinite(g.angle)
  );
}

function loadCustomGradients(): AccentGradient[] {
  try {
    const raw = localStorage.getItem(CUSTOM_GRADIENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isGradientShape) : [];
  } catch {
    return [];
  }
}

function saveCustomGradients(gradients: AccentGradient[]) {
  try {
    localStorage.setItem(CUSTOM_GRADIENTS_KEY, JSON.stringify(gradients));
  } catch {
    // localStorage unavailable (private mode, etc.) — the saved-gradients row just won't persist across reloads.
  }
  customGradientListeners.forEach((listener) => listener(gradients));
}

/** Keeps every open picker's "saved gradients" row in sync with each other, in the same tab. */
function useCustomGradients(): [AccentGradient[], (gradients: AccentGradient[]) => void] {
  const [gradients, setGradients] = useState<AccentGradient[]>(loadCustomGradients);
  useEffect(() => {
    customGradientListeners.add(setGradients);
    return () => {
      customGradientListeners.delete(setGradients);
    };
  }, []);
  return [gradients, saveCustomGradients];
}

export function GradientSwatch({
  gradient,
  size = 28,
  selected = false,
  title,
  onClick,
  onContextMenu,
}: {
  gradient: AccentGradient;
  size?: number;
  selected?: boolean;
  title?: string;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={title}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: gradientCss(gradient),
        border: selected ? '2px solid var(--text-heading)' : '1px solid var(--border-default)',
        boxShadow: selected ? '0 0 0 2px var(--surface-panel)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        padding: 0,
        flexShrink: 0,
      }}
    />
  );
}

function replaceStop(colors: GradientStops, index: number, hex: string): GradientStops {
  const next = [...colors] as GradientStops;
  next[index] = hex;
  return next;
}

/**
 * The custom 3-color-gradient builder: a live preview strip, three
 * independently-pickable stop colors (via <ColorPicker>), an angle slider,
 * and a row of saved gradients (save with "+", remove with right-click) —
 * the gradient analog of ColorPicker.tsx's swatch row.
 */
export function GradientPicker({ value, onChange }: { value: AccentGradient; onChange: (gradient: AccentGradient) => void }) {
  const [customGradients, setCustomGradients] = useCustomGradients();
  const alreadySaved = customGradients.some((g) => sameGradient(g, value));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      <div
        style={{
          height: 32,
          borderRadius: 8,
          background: gradientCss(value),
          border: '1px solid var(--border-default)',
        }}
      />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {([0, 1, 2] as const).map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <ColorPicker
              value={value.colors[i]}
              onChange={(hex) => onChange({ ...value, colors: replaceStop(value.colors, i, hex) })}
              allowAlpha={false}
              title={`Stop ${i + 1}`}
              size={26}
            />
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Stop {i + 1}</span>
          </div>
        ))}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
        Angle
        <input
          type="range"
          min={0}
          max={360}
          value={value.angle}
          onChange={(e) => onChange({ ...value, angle: Number(e.target.value) })}
          style={{ flex: 1 }}
        />
        <span style={{ width: 32, textAlign: 'right', fontFamily: 'monospace' }}>{Math.round(value.angle)}°</span>
      </label>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
        {customGradients.map((g, i) => (
          <GradientSwatch
            key={i}
            gradient={g}
            selected={sameGradient(g, value)}
            title="Click to use, right-click to remove"
            onClick={() => onChange(g)}
            onContextMenu={(e) => {
              e.preventDefault();
              setCustomGradients(customGradients.filter((_, idx) => idx !== i));
            }}
          />
        ))}
        <button
          onClick={() => {
            if (alreadySaved) return;
            setCustomGradients([...customGradients, value]);
          }}
          title={alreadySaved ? 'Already saved' : 'Save current gradient'}
          disabled={alreadySaved}
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'var(--surface-card)',
            border: '1px dashed var(--border-default)',
            color: 'var(--text-muted)',
            fontSize: 12,
            lineHeight: 1,
            cursor: alreadySaved ? 'default' : 'pointer',
            opacity: alreadySaved ? 0.5 : 1,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
