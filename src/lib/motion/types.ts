// Shared shape for one registered magnetic node's configuration — the
// per-element "polarity" the owner asked for ("different objects have
// different polarities") lives entirely in these numbers, tuned per block
// type in presets.ts.
export interface MagneticPreset {
  /** +1 pulls the element toward the cursor (attraction); -1 pushes it away (repulsion) — the literal "polarity". */
  polarity: 1 | -1;
  /** 0..1 multiplier on how hard this element responds — a big CTA button (~1) vs. a small caption (~0.2). */
  strength: number;
  /** px — cursor distance at which this element starts responding at all. */
  radius: number;
  /** px — the offset ceiling; strength/falloff scale within this, never past it. */
  maxOffset: number;
  /** the scale the element eases toward at full "locked on" proximity (e.g. 1.06 = 6% growth; 0.99 = a hair of shrink for a repelling element). */
  maxScale: number;
  /** spring constants — higher stiffness/lower damping = snappier; see springStep. */
  stiffness: number;
  damping: number;
  /** 0 disables element-to-element coupling for this node entirely (it still reacts to the cursor, but never nudges/gets nudged by neighbors). */
  coupling: number;
  /** which short synthesized tone (if any) plays on field-enter / lock-on / click — see audioEngine.ts. Omit for a silent node (most body-text/decorative blocks). */
  sfx?: 'soft' | 'cta';
}

export interface Vec2 {
  x: number;
  y: number;
}
