import { useEffect, useRef } from 'react';
import { useTheme } from './theme';
import type { SiteData } from '../data/siteData';

type ThemeFields = Pick<SiteData, 'accentId' | 'customAccentHex' | 'displayFontId' | 'bodyFontId'>;

/** Applies a loaded site's saved accent/font choices to the ThemeProvider once. */
export function useApplyThemeFromData(data: ThemeFields | null) {
  const theme = useTheme();
  const applied = useRef(false);

  useEffect(() => {
    if (!data || applied.current) return;
    applied.current = true;
    if (data.accentId === 'custom') {
      theme.setCustomAccent(data.customAccentHex);
    } else {
      theme.setAccentPreset(data.accentId);
    }
    theme.setDisplayFont(data.displayFontId);
    theme.setBodyFont(data.bodyFontId);
    // Intentionally runs once per loaded `data` — theme is omitted from deps
    // since its context value is recreated every render.
  }, [data]);
}
