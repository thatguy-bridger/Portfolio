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
  // — added for FONT_COMBOS (trending social/portfolio pairings)
  { id: 'instrument-serif', family: 'Instrument Serif', category: 'display', weights: [400], gf: 'Instrument+Serif' },
  { id: 'archivo-black', family: 'Archivo Black', category: 'display', weights: [400], gf: 'Archivo+Black' },
  { id: 'anton', family: 'Anton', category: 'display', weights: [400], gf: 'Anton' },
  { id: 'silkscreen', family: 'Silkscreen', category: 'display', weights: [400, 700], gf: 'Silkscreen:wght@400;700' },
  { id: 'geist', family: 'Geist', category: 'display', weights: [400, 500, 600, 700, 800], gf: 'Geist:wght@400;500;600;700;800' },
  { id: 'schibsted-grotesk', family: 'Schibsted Grotesk', category: 'display', weights: [400, 500, 600, 700, 800], gf: 'Schibsted+Grotesk:wght@400;500;600;700;800' },

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
  // — added for FONT_COMBOS (trending social/portfolio pairings)
  { id: 'instrument-sans', family: 'Instrument Sans', category: 'sans', weights: [400, 500, 600, 700], gf: 'Instrument+Sans:wght@400;500;600;700' },
  { id: 'hanken-grotesk', family: 'Hanken Grotesk', category: 'sans', weights: [400, 500, 600, 700, 800], gf: 'Hanken+Grotesk:wght@400;500;600;700;800' },
  { id: 'onest', family: 'Onest', category: 'sans', weights: [400, 500, 600, 700, 800], gf: 'Onest:wght@400;500;600;700;800' },

  // Mono — code / meta / labels
  { id: 'jetbrains-mono', family: 'JetBrains Mono', category: 'mono', weights: [400, 500, 600, 700], gf: 'JetBrains+Mono:wght@400;500;600;700' },
  { id: 'ibm-plex-mono', family: 'IBM Plex Mono', category: 'mono', weights: [400, 500, 600, 700], gf: 'IBM+Plex+Mono:wght@400;500;600;700' },
  { id: 'space-mono', family: 'Space Mono', category: 'mono', weights: [400, 700], gf: 'Space+Mono:wght@400;700' },
  { id: 'fira-code', family: 'Fira Code', category: 'mono', weights: [400, 500, 600, 700], gf: 'Fira+Code:wght@400;500;600;700' },
  // — added for FONT_COMBOS (trending social/portfolio pairings)
  { id: 'geist-mono', family: 'Geist Mono', category: 'mono', weights: [400, 500, 600, 700], gf: 'Geist+Mono:wght@400;500;600;700' },
];

export const DEFAULT_DISPLAY_FONT = FONT_LIBRARY.find((f) => f.id === 'space-grotesk')!;
export const DEFAULT_BODY_FONT = FONT_LIBRARY.find((f) => f.id === 'inter')!;
export const DEFAULT_MONO_FONT = FONT_LIBRARY.find((f) => f.id === 'jetbrains-mono')!;

/** A curated display+body(+mono) pairing — modern typography combos trending in
 *  contemporary portfolio/brand design (Dribbble/Behance/Instagram-adjacent). */
export interface FontCombo {
  id: string;
  label: string;
  description: string;
  displayId: string;
  bodyId: string;
  monoId: string;
}

export const FONT_COMBOS: FontCombo[] = [
  {
    id: 'neo-brutalist',
    label: 'Neo-Brutalist',
    description: 'Oversized black headlines over a clean grotesk body with monospace accents — raw, grid-heavy web-brutalism.',
    displayId: 'archivo-black',
    bodyId: 'work-sans',
    monoId: 'space-mono',
  },
  {
    id: 'quiet-luxury-serif',
    label: 'Quiet Luxury Serif',
    description: 'Wonky italic serif headlines against a crisp sans body — the fashion/beauty personal-brand look flooding Instagram carousels.',
    displayId: 'instrument-serif',
    bodyId: 'instrument-sans',
    monoId: 'jetbrains-mono',
  },
  {
    id: 'y2k-pixel-revival',
    label: 'Y2K Pixel Revival',
    description: 'Chunky pixel-art headline over a modern sans body — the blobby Y2K reboot aesthetic on Gen-Z portfolios and TikTok.',
    displayId: 'silkscreen',
    bodyId: 'dm-sans',
    monoId: 'space-mono',
  },
  {
    id: 'vercel-dev-grotesk',
    label: 'Vercel Dev Grotesk',
    description: 'Ultra-clean geometric grotesk system with a matching mono — the shadcn/Vercel-style "indie hacker" developer-portfolio look.',
    displayId: 'geist',
    bodyId: 'hanken-grotesk',
    monoId: 'geist-mono',
  },
  {
    id: 'soft-grotesk-startup',
    label: 'Soft Grotesk Startup',
    description: 'Warm, rounded variable grotesk headlines with a friendly neutral body — common across 2024-25 SaaS and product branding.',
    displayId: 'bricolage',
    bodyId: 'figtree',
    monoId: 'ibm-plex-mono',
  },
  {
    id: 'loud-poster',
    label: 'Loud Poster',
    description: 'Ultra-bold condensed poster type against a friendly geometric sans — streetwear-meets-editorial energy for big hero statements.',
    displayId: 'anton',
    bodyId: 'plus-jakarta',
    monoId: 'space-mono',
  },
  {
    id: 'editorial-wonk',
    label: 'Editorial Wonk',
    description: 'A wonky optical-size serif headline paired with a classic serif body — literary, zine-and-newsletter energy.',
    displayId: 'fraunces',
    bodyId: 'newsreader',
    monoId: 'jetbrains-mono',
  },
  {
    id: 'scandi-grotesk',
    label: 'Scandi Grotesk',
    description: 'A crisp Nordic-newsroom grotesk headline over a neutral geometric body — minimal, ultra-legible Scandinavian tech branding.',
    displayId: 'schibsted-grotesk',
    bodyId: 'onest',
    monoId: 'jetbrains-mono',
  },
];

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
