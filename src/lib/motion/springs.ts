// Minimal hand-rolled damped-spring integrator — the "spring integration"
// half of threesided.com's stated approach (Pointer Events + spring math +
// rAF + CSS transforms, zero external physics library). One scalar spring
// per axis (x, y, scale) is enough to get natural-feeling overshoot/settle
// without pulling in a dependency for it.
export interface SpringState {
  x: number;
  v: number;
}

/**
 * Advances one damped-spring axis by `dt` seconds using semi-implicit
 * (symplectic) Euler integration — cheap, numerically stable for the small
 * fixed-ish timesteps a rAF loop produces, and standard for this kind of
 * UI spring (same integration shape as Framer Motion/react-spring use
 * internally, just written by hand here instead of imported).
 *
 * `stiffness` (k) pulls `x` toward `target`; `damping` (c) bleeds velocity
 * so it settles instead of oscillating forever. Both are per-node so a
 * "heavier" element (e.g. a big hero heading) can feel slower/softer than a
 * "snappier" one (a small CTA button) — see presets.ts.
 */
export function springStep(state: SpringState, target: number, stiffness: number, damping: number, dt: number): SpringState {
  const accel = -stiffness * (state.x - target) - damping * state.v;
  const v = state.v + accel * dt;
  const x = state.x + v * dt;
  return { x, v };
}

/** Classic smoothstep — used to ease a linear 0..1 falloff (e.g. "how far into the influence radius") into a curve with soft edges instead of a linear ramp that kinks at the boundary. */
export function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}
