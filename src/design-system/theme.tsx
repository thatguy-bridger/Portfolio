import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ACCENT_PRESETS, deriveAccentVariants, type AccentVariants } from './accent';
import {
  DEFAULT_BODY_FONT,
  DEFAULT_DISPLAY_FONT,
  DEFAULT_MONO_FONT,
  FONT_LIBRARY,
  loadFont,
  type FontDef,
} from './fonts';
import './theme.css';

export type ColorScheme = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  cycleColorScheme: () => void;
  accentId: string;
  setAccentPreset: (id: string) => void;
  customAccentHex: string;
  setCustomAccent: (hex: string) => void;
  accentVariants: AccentVariants;
  displayFont: FontDef;
  bodyFont: FontDef;
  monoFont: FontDef;
  setDisplayFont: (id: string) => void;
  setBodyFont: (id: string) => void;
  setMonoFont: (id: string) => void;
  reducedMotion: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function findFont(id: string, fallback: FontDef): FontDef {
  return FONT_LIBRARY.find((f) => f.id === id) ?? fallback;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('system');
  const [accentId, setAccentId] = useState<string>('indigo');
  const [customAccentHex, setCustomAccentHex] = useState<string>('#6366f1');
  const [displayFontId, setDisplayFontId] = useState(DEFAULT_DISPLAY_FONT.id);
  const [bodyFontId, setBodyFontId] = useState(DEFAULT_BODY_FONT.id);
  const [monoFontId, setMonoFontId] = useState(DEFAULT_MONO_FONT.id);
  const [reducedMotion, setReducedMotion] = useState(false);

  const displayFont = findFont(displayFontId, DEFAULT_DISPLAY_FONT);
  const bodyFont = findFont(bodyFontId, DEFAULT_BODY_FONT);
  const monoFont = findFont(monoFontId, DEFAULT_MONO_FONT);

  const accentHex = useMemo(() => {
    if (accentId === 'custom') return customAccentHex;
    return ACCENT_PRESETS.find((p) => p.id === accentId)?.hex ?? ACCENT_PRESETS[0].hex;
  }, [accentId, customAccentHex]);

  const accentVariants = useMemo(() => deriveAccentVariants(accentHex), [accentHex]);

  // Respect prefers-color-scheme when colorScheme === 'system'; explicit choice overrides it.
  useEffect(() => {
    const root = document.documentElement;
    if (colorScheme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', colorScheme);
    }
  }, [colorScheme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-primary', accentVariants.base);
    root.style.setProperty('--accent-primary-hover', accentVariants.hover);
    root.style.setProperty('--link', accentVariants.base);
    root.style.setProperty('--link-hover', accentVariants.hover);
    root.style.setProperty('--shadow-glow-indigo', `0 8px 20px ${accentVariants.glow}`);
  }, [accentVariants]);

  useEffect(() => {
    loadFont(displayFont);
    document.documentElement.style.setProperty('--font-display', `'${displayFont.family}', var(--font-sans)`);
  }, [displayFont]);

  useEffect(() => {
    loadFont(bodyFont);
    document.documentElement.style.setProperty('--font-body', `'${bodyFont.family}', var(--font-sans)`);
  }, [bodyFont]);

  useEffect(() => {
    loadFont(monoFont);
    document.documentElement.style.setProperty('--font-mono', `'${monoFont.family}', ui-monospace, monospace`);
  }, [monoFont]);

  const value: ThemeContextValue = {
    colorScheme,
    setColorScheme,
    cycleColorScheme: () =>
      setColorScheme((s) => (s === 'system' ? 'light' : s === 'light' ? 'dark' : 'system')),
    accentId,
    setAccentPreset: (id) => setAccentId(id),
    customAccentHex,
    setCustomAccent: (hex) => {
      setCustomAccentHex(hex);
      setAccentId('custom');
    },
    accentVariants,
    displayFont,
    bodyFont,
    monoFont,
    setDisplayFont: setDisplayFontId,
    setBodyFont: setBodyFontId,
    setMonoFont: setMonoFontId,
    reducedMotion,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
