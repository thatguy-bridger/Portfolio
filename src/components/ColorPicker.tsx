import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ToolbarDropdown } from './Popover';

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(Number.isFinite(n) ? n : 0)));
}
function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}
function toHex2(n: number): string {
  return clamp255(n).toString(16).padStart(2, '0');
}

/** Parses hex (#rgb / #rgba / #rrggbb / #rrggbbaa) or rgb()/rgba() strings into RGBA. Anything unrecognized (including undefined) falls back to opaque black. */
export function parseColor(input: string | undefined): RGBA {
  if (!input) return { r: 0, g: 0, b: 0, a: 1 };
  const s = input.trim();
  const rgbMatch = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (rgbMatch) {
    return {
      r: clamp255(+rgbMatch[1]),
      g: clamp255(+rgbMatch[2]),
      b: clamp255(+rgbMatch[3]),
      a: rgbMatch[4] !== undefined ? clamp01(+rgbMatch[4]) : 1,
    };
  }
  const hex = s.replace('#', '');
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    const [r, g, b] = hex.split('').map((c) => parseInt(c + c, 16));
    return { r, g, b, a: 1 };
  }
  if (/^[0-9a-f]{4}$/i.test(hex)) {
    const [r, g, b, a] = hex.split('').map((c) => parseInt(c + c, 16));
    return { r, g, b, a: a / 255 };
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16), a: 1 };
  }
  if (/^[0-9a-f]{8}$/i.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: parseInt(hex.slice(6, 8), 16) / 255,
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

/** Serializes RGBA back to a CSS color string — plain #rrggbb when opaque (or alpha disallowed), rgba() otherwise. */
export function formatColor(c: RGBA, allowAlpha: boolean): string {
  if (!allowAlpha || c.a >= 1) return `#${toHex2(c.r)}${toHex2(c.g)}${toHex2(c.b)}`;
  return `rgba(${clamp255(c.r)}, ${clamp255(c.g)}, ${clamp255(c.b)}, ${Math.round(clamp01(c.a) * 100) / 100})`;
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s: s * 100, v: max * 100 };
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: clamp255((r + m) * 255), g: clamp255((g + m) * 255), b: clamp255((b + m) * 255) };
}

const CHECKERBOARD = 'repeating-conic-gradient(var(--surface-card) 0% 25%, var(--surface-panel) 0% 50%) 50% / 10px 10px';

export const DEFAULT_SWATCHES = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#0f172a',
  '#ffffff',
];

/** User-saved colors, shared across every picker in the app and persisted locally so they survive reloads. */
const CUSTOM_SWATCHES_KEY = 'portfolio:customSwatches';
const customSwatchListeners = new Set<(swatches: string[]) => void>();

function loadCustomSwatches(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SWATCHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((c) => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

function saveCustomSwatches(swatches: string[]) {
  try {
    localStorage.setItem(CUSTOM_SWATCHES_KEY, JSON.stringify(swatches));
  } catch {
    // localStorage unavailable (private mode, etc.) — the saved-colors row just won't persist across reloads.
  }
  customSwatchListeners.forEach((listener) => listener(swatches));
}

/** Keeps every open picker's "saved colors" row in sync with each other, in the same tab. */
function useCustomSwatches(): [string[], (swatches: string[]) => void] {
  const [swatches, setSwatches] = useState<string[]>(loadCustomSwatches);
  useEffect(() => {
    customSwatchListeners.add(setSwatches);
    return () => {
      customSwatchListeners.delete(setSwatches);
    };
  }, []);
  return [swatches, saveCustomSwatches];
}

const numberInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '3px 4px',
  borderRadius: 5,
  border: '1px solid var(--border-default)',
  background: 'var(--surface-card)',
  color: 'var(--text-heading)',
  fontSize: 11,
  textAlign: 'center',
};

function NumberField({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (n: number) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 10, color: 'var(--text-muted)', flex: 1 }}>
      <input
        type="number"
        className="cp-number-field"
        min={0}
        max={max}
        value={Math.round(value)}
        onChange={(e) => onChange(clampTo(Number(e.target.value), max))}
        style={numberInputStyle}
      />
      {label}
    </label>
  );
}
function clampTo(n: number, max: number): number {
  return Math.max(0, Math.min(max, Number.isFinite(n) ? n : 0));
}

/**
 * The custom ARGB color-picking UI: a saturation/value square + hue and alpha
 * sliders, RGBA typing fields, a hex field, and a swatch row. This is the
 * reusable "guts" — call it directly when you want full control of the
 * trigger, or use <ColorPicker> below for the common swatch-button case.
 */
export function ColorPickerPanel({
  value,
  onChange,
  onClear,
  allowAlpha = true,
  swatches = DEFAULT_SWATCHES,
}: {
  value?: string;
  onChange: (color: string) => void;
  onClear?: () => void;
  allowAlpha?: boolean;
  swatches?: string[];
}) {
  const rgba = parseColor(value);
  const hsv = rgbToHsv(rgba.r, rgba.g, rgba.b);
  const [hue, setHue] = useState(hsv.h);
  const [customSwatches, setCustomSwatches] = useCustomSwatches();
  const currentColor = value ?? formatColor(rgba, allowAlpha);
  // Hue is ambiguous at s=0/v=0 (grays), so keep the slider's own hue steady across such updates instead of snapping to 0.
  useEffect(() => {
    if (hsv.s > 0.5 && hsv.v > 0.5) setHue(hsv.h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rgba.r, rgba.g, rgba.b]);

  const squareRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const alphaRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<'sv' | 'hue' | 'alpha' | null>(null);

  function commitRgb(next: { r: number; g: number; b: number }) {
    onChange(formatColor({ ...next, a: rgba.a }, allowAlpha));
  }
  function commitFromSv(clientX: number, clientY: number) {
    const el = squareRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const s = clamp01((clientX - r.left) / r.width) * 100;
    const v = 100 - clamp01((clientY - r.top) / r.height) * 100;
    commitRgb(hsvToRgb(hue, s, v));
  }
  function commitHue(clientX: number) {
    const el = hueRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const h = clamp01((clientX - r.left) / r.width) * 360;
    setHue(h);
    commitRgb(hsvToRgb(h, hsv.s || 100, hsv.v || 100));
  }
  function commitAlpha(clientX: number) {
    const el = alphaRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const a = clamp01((clientX - r.left) / r.width);
    onChange(formatColor({ ...rgba, a }, allowAlpha));
  }

  useEffect(() => {
    function move(e: PointerEvent) {
      if (draggingRef.current === 'sv') commitFromSv(e.clientX, e.clientY);
      else if (draggingRef.current === 'hue') commitHue(e.clientX);
      else if (draggingRef.current === 'alpha') commitAlpha(e.clientX);
    }
    function up() {
      draggingRef.current = null;
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hue, rgba.r, rgba.g, rgba.b, rgba.a]);

  const hexValue = `${toHex2(rgba.r)}${toHex2(rgba.g)}${toHex2(rgba.b)}${allowAlpha && rgba.a < 1 ? toHex2(rgba.a * 255) : ''}`;
  const [hexDraft, setHexDraft] = useState(hexValue);
  useEffect(() => setHexDraft(hexValue), [hexValue]);

  const pureHue = hsvToRgb(hue, 100, 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      {/* Saturation/value visualizer square */}
      <div
        ref={squareRef}
        onPointerDown={(e) => {
          draggingRef.current = 'sv';
          commitFromSv(e.clientX, e.clientY);
        }}
        style={{
          position: 'relative',
          width: '100%',
          height: 140,
          borderRadius: 8,
          cursor: 'crosshair',
          background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0)), rgb(${pureHue.r}, ${pureHue.g}, ${pureHue.b})`,
          touchAction: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '2px solid #fff',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.5)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        onPointerDown={(e) => {
          draggingRef.current = 'hue';
          commitHue(e.clientX);
        }}
        style={{
          position: 'relative',
          width: '100%',
          height: 14,
          borderRadius: 7,
          cursor: 'pointer',
          background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
          touchAction: 'none',
        }}
      >
        <SliderThumb pct={(hue / 360) * 100} />
      </div>

      {/* Alpha slider */}
      {allowAlpha && (
        <div
          ref={alphaRef}
          onPointerDown={(e) => {
            draggingRef.current = 'alpha';
            commitAlpha(e.clientX);
          }}
          style={{
            position: 'relative',
            width: '100%',
            height: 14,
            borderRadius: 7,
            cursor: 'pointer',
            background: CHECKERBOARD,
            touchAction: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 7,
              background: `linear-gradient(to right, rgba(${rgba.r},${rgba.g},${rgba.b},0), rgba(${rgba.r},${rgba.g},${rgba.b},1))`,
            }}
          />
          <SliderThumb pct={rgba.a * 100} />
        </div>
      )}

      {/* RGBA typing fields */}
      <div style={{ display: 'flex', gap: 6 }}>
        <NumberField label="R" value={rgba.r} max={255} onChange={(n) => commitRgb({ ...rgba, r: n })} />
        <NumberField label="G" value={rgba.g} max={255} onChange={(n) => commitRgb({ ...rgba, g: n })} />
        <NumberField label="B" value={rgba.b} max={255} onChange={(n) => commitRgb({ ...rgba, b: n })} />
        {allowAlpha && (
          <NumberField
            label="A"
            value={Math.round(rgba.a * 100)}
            max={100}
            onChange={(n) => onChange(formatColor({ ...rgba, a: clamp01(n / 100) }, allowAlpha))}
          />
        )}
      </div>

      {/* Hex field */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
        Hex
        <input
          value={hexDraft}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, allowAlpha ? 8 : 6);
            setHexDraft(v);
            if (v.length === 3 || v.length === 4 || v.length === 6 || v.length === 8) onChange(formatColor(parseColor(`#${v}`), allowAlpha));
          }}
          placeholder={allowAlpha ? 'rrggbbaa' : 'rrggbb'}
          style={{ flex: 1, padding: '4px 6px', borderRadius: 5, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-heading)', fontSize: 12, fontFamily: 'monospace' }}
        />
      </label>

      {/* Swatches + none */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
        {onClear && (
          <button
            onClick={onClear}
            title="None"
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: CHECKERBOARD,
              border: !value ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
        )}
        {swatches.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: c,
              border: value === c ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
        ))}
        {customSwatches.length > 0 && <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border-default)', margin: '0 1px' }} />}
        {customSwatches.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            onContextMenu={(e) => {
              e.preventDefault();
              setCustomSwatches(customSwatches.filter((s) => s !== c));
            }}
            title="Right-click to remove"
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: c,
              border: value === c ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
        ))}
        <button
          onClick={() => {
            if (customSwatches.includes(currentColor)) return;
            setCustomSwatches([...customSwatches, currentColor]);
          }}
          title="Save current color to defaults"
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'var(--surface-card)',
            border: '1px dashed var(--border-default)',
            color: 'var(--text-muted)',
            fontSize: 12,
            lineHeight: 1,
            cursor: 'pointer',
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

function SliderThumb({ pct }: { pct: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${clampTo(pct, 100)}%`,
        top: '50%',
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.3)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
    />
  );
}

/**
 * A swatch-button trigger that opens the custom ARGB <ColorPickerPanel> —
 * the drop-in replacement for native <input type="color"> and the old
 * swatches-only ColorGrid. Call this wherever a color needs picking.
 */
export function ColorPicker({
  value,
  onChange,
  onClear,
  allowAlpha = true,
  swatches,
  title = 'Color',
  size = 22,
  trigger,
  panelWidth = 200,
}: {
  value?: string;
  onChange: (color: string) => void;
  onClear?: () => void;
  allowAlpha?: boolean;
  swatches?: string[];
  title?: string;
  size?: number;
  trigger?: ReactNode;
  panelWidth?: number;
}) {
  return (
    <ToolbarDropdown
      title={title}
      width={panelWidth}
      chromeless={!!trigger}
      trigger={
        trigger ?? (
          <span
            style={{
              position: 'relative',
              display: 'inline-block',
              width: size,
              height: size,
              borderRadius: '50%',
              background: CHECKERBOARD,
              border: '1px solid var(--border-default)',
              overflow: 'hidden',
            }}
          >
            {value && <span style={{ position: 'absolute', inset: 0, background: value }} />}
          </span>
        )
      }
    >
      <ColorPickerPanel value={value} onChange={onChange} onClear={onClear} allowAlpha={allowAlpha} swatches={swatches} />
    </ToolbarDropdown>
  );
}
