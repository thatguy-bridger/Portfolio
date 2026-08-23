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
import '../styles/theme.css';

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

// Color scheme itself is owned by the pre-paint script inlined in BaseLayout.astro's <head>
// (window.PortfolioTheme) so it can be read and applied synchronously, before React ever
// mounts — see that file. Accent and font choices don't have that constraint (nothing needs
// them before hydration), so this provider just persists them to their own localStorage keys directly.
const ACCENT_KEY = 'portfolio:accent';
const CUSTOM_ACCENT_KEY = 'portfolio:accentCustom';
const DISPLAY_FONT_KEY = 'portfolio:fontDisplay';
const BODY_FONT_KEY = 'portfolio:fontBody';
const MONO_FONT_KEY = 'portfolio:fontMono';

function readLS(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLS(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable (private mode, etc.) — selection still applies for this load, just won't persist.
  }
}

function readColorSchemeFromGlobal(): ColorScheme {
  const stored = window.PortfolioTheme?.get() ?? 'auto';
  return stored === 'auto' ? 'system' : stored;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('system');
  const [accentId, setAccentId] = useState<string>('indigo');
  const [customAccentHex, setCustomAccentHex] = useState<string>('#6366f1');
  const [displayFontId, setDisplayFontId] = useState(DEFAULT_DISPLAY_FONT.id);
  const [bodyFontId, setBodyFontId] = useState(DEFAULT_BODY_FONT.id);
  const [monoFontId, setMonoFontId] = useState(DEFAULT_MONO_FONT.id);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Hydrate from localStorage / the pre-paint theme-init.js global once mounted in the browser —
  // this island also renders on the server (Astro/SSR), where neither exists, so state starts at
  // safe defaults and syncs to the real persisted values in this effect instead of a lazy
  // useState initializer (which would run during SSR too and throw, or diverge from the server
  // render and trip a hydration mismatch).
  useEffect(() => {
    setColorSchemeState(readColorSchemeFromGlobal());
    setAccentId(readLS(ACCENT_KEY) ?? 'indigo');
    setCustomAccentHex(readLS(CUSTOM_ACCENT_KEY) ?? '#6366f1');
    setDisplayFontId(readLS(DISPLAY_FONT_KEY) ?? DEFAULT_DISPLAY_FONT.id);
    setBodyFontId(readLS(BODY_FONT_KEY) ?? DEFAULT_BODY_FONT.id);
    setMonoFontId(readLS(MONO_FONT_KEY) ?? DEFAULT_MONO_FONT.id);

    // Keep in sync with a toggle/picker mounted in a different island (e.g. a header ThemeToggle
    // vs. this settings panel) — both talk to the same window.PortfolioTheme, not shared React state.
    function onExternalThemeChange(e: WindowEventMap['portfolio-theme-change']) {
      setColorSchemeState(e.detail === 'auto' ? 'system' : e.detail);
    }
    window.addEventListener('portfolio-theme-change', onExternalThemeChange);
    return () => window.removeEventListener('portfolio-theme-change', onExternalThemeChange);
  }, []);

  const displayFont = findFont(displayFontId, DEFAULT_DISPLAY_FONT);
  const bodyFont = findFont(bodyFontId, DEFAULT_BODY_FONT);
  const monoFont = findFont(monoFontId, DEFAULT_MONO_FONT);

  const accentHex = useMemo(() => {
    if (accentId === 'custom') return customAccentHex;
    return ACCENT_PRESETS.find((p) => p.id === accentId)?.hex ?? ACCENT_PRESETS[0].hex;
  }, [accentId, customAccentHex]);

  const accentVariants = useMemo(() => deriveAccentVariants(accentHex), [accentHex]);

  function setColorScheme(scheme: ColorScheme) {
    setColorSchemeState(scheme);
    window.PortfolioTheme?.set(scheme === 'system' ? 'auto' : scheme);
  }

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
    root.style.setProperty('--shadow-glow-accent', `0 8px 20px ${accentVariants.glow}`);
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
      setColorScheme(colorScheme === 'system' ? 'light' : colorScheme === 'light' ? 'dark' : 'system'),
    accentId,
    setAccentPreset: (id) => {
      setAccentId(id);
      writeLS(ACCENT_KEY, id);
    },
    customAccentHex,
    setCustomAccent: (hex) => {
      setCustomAccentHex(hex);
      setAccentId('custom');
      writeLS(CUSTOM_ACCENT_KEY, hex);
      writeLS(ACCENT_KEY, 'custom');
    },
    accentVariants,
    displayFont,
    bodyFont,
    monoFont,
    setDisplayFont: (id) => {
      setDisplayFontId(id);
      writeLS(DISPLAY_FONT_KEY, id);
    },
    setBodyFont: (id) => {
      setBodyFontId(id);
      writeLS(BODY_FONT_KEY, id);
    },
    setMonoFont: (id) => {
      setMonoFontId(id);
      writeLS(MONO_FONT_KEY, id);
    },
    reducedMotion,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
