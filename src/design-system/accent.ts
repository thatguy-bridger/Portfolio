export interface AccentPreset {
  id: string;
  label: string;
  /** base hue used for dark mode; light mode derives a deeper shade */
  hex: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'indigo', label: 'Indigo', hex: '#6366f1' },
  { id: 'purple', label: 'Purple', hex: '#9061e5' },
  { id: 'orange', label: 'Orange', hex: '#f59e0b' },
  { id: 'pink', label: 'Pink', hex: '#ec4899' },
  { id: 'green', label: 'Green', hex: '#22c55e' },
  { id: 'cyan', label: 'Cyan', hex: '#06b6d4' },
  { id: 'red', label: 'Red', hex: '#ef4444' },
  { id: 'blue', label: 'Blue', hex: '#3b82f6' },
];

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
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export interface AccentVariants {
  base: string;
  hover: string;
  /** deeper shade used for light-mode default state */
  light: string;
  lightHover: string;
  glow: string;
}

/** Derives hover / light-mode variants from a single base accent color. */
export function deriveAccentVariants(hex: string): AccentVariants {
  const hsl = hexToHsl(hex);
  const base = hslToHex(hsl);
  const hover = hslToHex({ ...hsl, l: Math.max(0, hsl.l - 8) });
  const light = hslToHex({ ...hsl, l: Math.max(0, hsl.l - 14) });
  const lightHover = hslToHex({ ...hsl, l: Math.max(0, hsl.l - 22) });
  const glow = `${base}66`;
  return { base, hover, light, lightHover, glow };
}
