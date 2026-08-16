export type FontCategory = 'display' | 'serif' | 'sans' | 'mono';

export interface FontDef {
  id: string;
  family: string;
  category: FontCategory;
  weights: number[];
  /** value used in the Google Fonts CSS2 API "family=" param */
  gf: string;
}

export const FONT_LIBRARY: FontDef[] = [
  // Display — bold, geometric, captivating. Space Grotesk is the default.
  { id: 'space-grotesk', family: 'Space Grotesk', category: 'display', weights: [400, 500, 600, 700], gf: 'Space+Grotesk:wght@400;500;600;700' },
  { id: 'syne', family: 'Syne', category: 'display', weights: [400, 600, 700, 800], gf: 'Syne:wght@400;600;700;800' },
  { id: 'unbounded', family: 'Unbounded', category: 'display', weights: [400, 600, 700, 800], gf: 'Unbounded:wght@400;600;700;800' },
  { id: 'bricolage', family: 'Bricolage Grotesque', category: 'display', weights: [400, 600, 700, 800], gf: 'Bricolage+Grotesque:wght@400;600;700;800' },
  { id: 'familjen', family: 'Familjen Grotesk', category: 'display', weights: [400, 500, 600, 700], gf: 'Familjen+Grotesk:wght@400;500;600;700' },
  { id: 'big-shoulders', family: 'Big Shoulders Display', category: 'display', weights: [400, 600, 700, 800], gf: 'Big+Shoulders+Display:wght@400;600;700;800' },
  { id: 'chivo', family: 'Chivo', category: 'display', weights: [400, 600, 700, 900], gf: 'Chivo:wght@400;600;700;900' },
  { id: 'sora', family: 'Sora', category: 'display', weights: [400, 600, 700, 800], gf: 'Sora:wght@400;600;700;800' },

  // Serif — elegant/editorial
  { id: 'fraunces', family: 'Fraunces', category: 'serif', weights: [400, 500, 600, 700], gf: 'Fraunces:wght@400;500;600;700' },
  { id: 'playfair', family: 'Playfair Display', category: 'serif', weights: [400, 600, 700, 800], gf: 'Playfair+Display:wght@400;600;700;800' },
  { id: 'lora', family: 'Lora', category: 'serif', weights: [400, 500, 600, 700], gf: 'Lora:wght@400;500;600;700' },
  { id: 'newsreader', family: 'Newsreader', category: 'serif', weights: [400, 500, 600, 700], gf: 'Newsreader:wght@400;500;600;700' },
  { id: 'bitter', family: 'Bitter', category: 'serif', weights: [400, 500, 600, 700], gf: 'Bitter:wght@400;500;600;700' },
  { id: 'spectral', family: 'Spectral', category: 'serif', weights: [400, 500, 600, 700], gf: 'Spectral:wght@400;500;600;700' },
  { id: 'cormorant', family: 'Cormorant', category: 'serif', weights: [400, 500, 600, 700], gf: 'Cormorant:wght@400;500;600;700' },
  { id: 'source-serif', family: 'Source Serif 4', category: 'serif', weights: [400, 500, 600, 700], gf: 'Source+Serif+4:wght@400;500;600;700' },

  // Sans — clean, neutral body faces. Inter is the default body pairing.
  { id: 'inter', family: 'Inter', category: 'sans', weights: [300, 400, 500, 600, 700], gf: 'Inter:wght@300;400;500;600;700' },
  { id: 'manrope', family: 'Manrope', category: 'sans', weights: [300, 400, 500, 600, 700], gf: 'Manrope:wght@300;400;500;600;700' },
  { id: 'plus-jakarta', family: 'Plus Jakarta Sans', category: 'sans', weights: [300, 400, 500, 600, 700], gf: 'Plus+Jakarta+Sans:wght@300;400;500;600;700' },
  { id: 'outfit', family: 'Outfit', category: 'sans', weights: [300, 400, 500, 600, 700], gf: 'Outfit:wght@300;400;500;600;700' },
  { id: 'work-sans', family: 'Work Sans', category: 'sans', weights: [300, 400, 500, 600, 700], gf: 'Work+Sans:wght@300;400;500;600;700' },
  { id: 'figtree', family: 'Figtree', category: 'sans', weights: [300, 400, 500, 600, 700], gf: 'Figtree:wght@300;400;500;600;700' },
  { id: 'dm-sans', family: 'DM Sans', category: 'sans', weights: [400, 500, 600, 700], gf: 'DM+Sans:wght@400;500;600;700' },

  // Mono — code / meta / labels
  { id: 'jetbrains-mono', family: 'JetBrains Mono', category: 'mono', weights: [400, 500, 600, 700], gf: 'JetBrains+Mono:wght@400;500;600;700' },
  { id: 'ibm-plex-mono', family: 'IBM Plex Mono', category: 'mono', weights: [400, 500, 600, 700], gf: 'IBM+Plex+Mono:wght@400;500;600;700' },
  { id: 'space-mono', family: 'Space Mono', category: 'mono', weights: [400, 700], gf: 'Space+Mono:wght@400;700' },
  { id: 'fira-code', family: 'Fira Code', category: 'mono', weights: [400, 500, 600, 700], gf: 'Fira+Code:wght@400;500;600;700' },
];

export const DEFAULT_DISPLAY_FONT = FONT_LIBRARY.find((f) => f.id === 'space-grotesk')!;
export const DEFAULT_BODY_FONT = FONT_LIBRARY.find((f) => f.id === 'inter')!;
export const DEFAULT_MONO_FONT = FONT_LIBRARY.find((f) => f.id === 'jetbrains-mono')!;

const loaded = new Set<string>();

/** Injects a Google Fonts <link> for the given font if it isn't already loaded. */
export function loadFont(font: FontDef) {
  if (loaded.has(font.id)) return;
  loaded.add(font.id);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.gf}&display=swap`;
  document.head.appendChild(link);
}

export function fontsByCategory(category: FontCategory): FontDef[] {
  return FONT_LIBRARY.filter((f) => f.category === category);
}
