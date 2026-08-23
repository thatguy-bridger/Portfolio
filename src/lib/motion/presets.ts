// Block-type -> magnetic personality. This is where "different objects have
// different polarities" becomes a concrete, per-type decision: a CTA button
// pulls hard and locks on with a tone; a hero heading drifts a little for
// texture; a quote block has *negative* polarity and gently recedes instead
// (proof the system isn't just "everything attracts a bit harder or
// softer" — the direction itself varies). Body-copy and structural types
// (rich-text, divider) are omitted entirely: motion on paragraph text hurts
// readability far more than it adds, so those never become magnetic nodes.
import type { MagneticPreset } from './types';

export const MOTION_PRESETS: Record<string, MagneticPreset> = {
  hero: { polarity: 1, strength: 0.18, radius: 260, maxOffset: 8, maxScale: 1.015, stiffness: 90, damping: 14, coupling: 0.4 },
  button: { polarity: 1, strength: 1, radius: 240, maxOffset: 20, maxScale: 1.08, stiffness: 170, damping: 15, coupling: 0.75, sfx: 'cta' },
  image: { polarity: 1, strength: 0.55, radius: 260, maxOffset: 14, maxScale: 1.03, stiffness: 130, damping: 16, coupling: 0.6, sfx: 'soft' },
  'image-text': { polarity: 1, strength: 0.35, radius: 220, maxOffset: 10, maxScale: 1.015, stiffness: 110, damping: 16, coupling: 0.55 },
  quote: { polarity: -1, strength: 0.3, radius: 200, maxOffset: 9, maxScale: 0.99, stiffness: 90, damping: 15, coupling: 0.55 },
  columns: { polarity: 1, strength: 0.16, radius: 220, maxOffset: 7, maxScale: 1.008, stiffness: 80, damping: 16, coupling: 0.4 },
  carousel: { polarity: 1, strength: 0.22, radius: 240, maxOffset: 9, maxScale: 1.012, stiffness: 90, damping: 16, coupling: 0.4, sfx: 'soft' },
};

/** How close (as a fraction of `radius`) counts as "locked on" — the moment worth its own, more emphatic tone (see audioEngine.ts's playLockTone) rather than just the soft field-enter blip. */
export const LOCK_FRACTION = 0.35;

/** How far (px) neighboring nodes still nudge each other — independent of any one node's own `radius`, since coupling is about the *pair's* separation, not either node's individual cursor-influence range. Falloff is gentler (see magneticField.ts's Math.pow exponent) than the cursor-radius falloff, so coupling reaches noticeably further than any one node's own influence radius — that's what makes it read as "elements affecting each other" rather than just "two separate cursor-attraction zones that happen to overlap". */
export const COUPLING_SPAN = 1000;
