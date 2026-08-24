/** A 3-stop color gradient — always exactly 3 hex colors, read start → middle → end. */
export type GradientStops = [string, string, string];

export interface AccentGradient {
  colors: GradientStops;
  /** CSS linear-gradient angle in degrees. */
  angle: number;
}

export interface AccentPreset {
  id: string;
  label: string;
  /**
   * 3-stop gradient built from the preset's identity hue: the middle stop is
   * the original single-hex accent color this preset used to be, the outer
   * two are analogous shades (±hue, ∓lightness) around it — so the preset
   * still reads as "indigo"/"purple"/etc., just expressed as a gradient.
   */
  colors: GradientStops;
}

export const DEFAULT_GRADIENT_ANGLE = 135;

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'indigo', label: 'Indigo', colors: ['#8da7f5', '#6366f1', '#5f39ed'] },
  { id: 'purple', label: 'Purple', colors: ['#9588eb', '#9061e5', '#9b3adf'] },
  { id: 'orange', label: 'Orange', colors: ['#f78337', '#f59e0b', '#caaf08'] },
  { id: 'pink', label: 'Pink', colors: ['#f072ce', '#ec4899', '#e81e53'] },
  { id: 'green', label: 'Green', colors: ['#38dd4e', '#22c55e', '#1b9e6a'] },
  { id: 'cyan', label: 'Cyan', colors: ['#10f8e4', '#06b6d4', '#056aa7'] },
  { id: 'red', label: 'Red', colors: ['#f36e8d', '#ef4444', '#eb4b1a'] },
  { id: 'blue', label: 'Blue', colors: ['#67c0f8', '#3b82f6', '#0f31f4'] },
];

/** Starting point for a brand-new custom gradient (e.g. first time the picker opens with nothing saved yet). */
export const DEFAULT_CUSTOM_GRADIENT: AccentGradient = {
  colors: ACCENT_PRESETS[0].colors,
  angle: DEFAULT_GRADIENT_ANGLE,
};

interface HSL {
  h: number;
  s: number;
  l: number;
}

function hexToHsl(hex: string): HSL {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
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
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex({ h, s, l }: HSL): string {
  const hN = ((h % 360) + 360) % 360;
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((hN / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hN < 60) [r, g, b] = [c, x, 0];
  else if (hN < 120) [r, g, b] = [x, c, 0];
  else if (hN < 180) [r, g, b] = [0, c, x];
  else if (hN < 240) [r, g, b] = [0, x, c];
  else if (hN < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function darken(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, l: Math.max(0, hsl.l - amount) });
}

export interface AccentVariants {
  /** Full 3-stop `linear-gradient(...)` string — for fill/background contexts. */
  gradient: string;
  /** Slightly darkened version of `gradient`, for hover states. */
  gradientHover: string;
  /** Flat representative color (the gradient's middle stop) — for contexts CSS can't put a gradient into: border-color, text color, outline, color-mix(), canvas/SVG strokes, etc. */
  base: string;
  hover: string;
  /** deeper shade used for light-mode default state */
  light: string;
  lightHover: string;
  glow: string;
}

/** Derives hover/flat/glow variants from a 3-stop accent gradient. */
export function deriveAccentVariants(colors: GradientStops, angle: number = DEFAULT_GRADIENT_ANGLE): AccentVariants {
  const [c1, c2, c3] = colors;
  const gradient = `linear-gradient(${angle}deg, ${c1}, ${c2}, ${c3})`;
  const gradientHover = `linear-gradient(${angle}deg, ${darken(c1, 8)}, ${darken(c2, 8)}, ${darken(c3, 8)})`;

  // The flat/scalar representative is derived from the gradient's middle stop — for the
  // built-in presets that's exactly the original single-hex accent color, so every
  // scalar-context consumer (border-color, text color, color-mix, canvas strokes, ...)
  // keeps looking the same as before this feature shipped.
  const hsl = hexToHsl(c2);
  const base = hslToHex(hsl);
  const hover = hslToHex({ ...hsl, l: Math.max(0, hsl.l - 8) });
  const light = hslToHex({ ...hsl, l: Math.max(0, hsl.l - 14) });
  const lightHover = hslToHex({ ...hsl, l: Math.max(0, hsl.l - 22) });
  const glow = `${base}66`;

  return { gradient, gradientHover, base, hover, light, lightHover, glow };
}
