// Capability checks the whole motion engine gates on — kept in one place so
// "should the physics run at all" is answered identically everywhere
// (magneticField.ts, AmbientFieldCanvas.tsx, useMagnetic.ts) instead of each
// call site re-deriving it slightly differently.
//
// Two independent reasons to fall back to the quiet/static mode:
//  - prefers-reduced-motion: the visitor asked for less motion, full stop.
//  - a coarse/no pointer (touch, or no pointer at all): there's no
//    "cursor nearby" concept on touch, and threesided.com's own reference
//    explicitly preserves native touch behavior rather than faking hover.
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function hasFinePointer(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true;
  return window.matchMedia('(pointer: fine)').matches;
}

export function motionAllowed(): boolean {
  return !prefersReducedMotion() && hasFinePointer();
}

/** Fires `cb(allowed)` whenever either underlying media query flips — lets the engine react live to an OS setting change or (in tests) `page.emulateMedia`, without every consumer wiring its own listeners. */
export function subscribeMotionAllowed(cb: (allowed: boolean) => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = window.matchMedia('(pointer: fine)');
  const handler = () => cb(!reduced.matches && pointer.matches);
  reduced.addEventListener('change', handler);
  pointer.addEventListener('change', handler);
  return () => {
    reduced.removeEventListener('change', handler);
    pointer.removeEventListener('change', handler);
  };
}
