// The motion engine itself: a single module-level registry of "magnetic"
// DOM nodes, one shared Pointer-Events listener, and one shared
// requestAnimationFrame loop that springs every registered node's transform
// toward a target computed from (a) cursor proximity and (b) neighboring
// nodes' current displacement. Framework-light by design — plain DOM refs
// in, `el.style.transform` out; useMagnetic.ts is the only React-specific
// file, a thin registration wrapper around this.
//
// Two effects come out of the same tick loop:
//  - Cursor attraction/repulsion (deliverable #2): each node's own
//    preset.polarity/strength/radius against the live pointer position.
//    While the pointer is held down (pointerTracker.ts's `pressed`), this
//    sign flips for every node — attractors repel, the one negative-
//    polarity type (quote) attracts — reverting the instant the button is
//    released, cancelled, or the window loses focus.
//  - Element-to-element reaction (deliverable #3): the `coupling` pass
//    below — every node also nudges every other node within COUPLING_SPAN,
//    scaled by how far the *source* node is currently displaced (so it's a
//    real consequence of the cursor moving one element, not a canned
//    second animation) and signed by relative polarity, so same-polarity
//    neighbors nudge apart and opposite-polarity ones nudge together —
//    an actual (if simplified) magnet analogy, not just a metaphor.
//
// Rest-position math: rather than caching each node's layout rect and
// invalidating it on scroll/resize, every tick re-reads
// getBoundingClientRect() (transform-only style changes never force layout,
// so this stays compositor-cheap) and backs out the *rest* center by
// subtracting the offset we applied last frame. That makes the engine
// self-correcting across scrolling, resizing, and reflow with zero extra
// listeners — see restCenterOf().
import { springStep, smoothstep } from './springs';
import { COUPLING_SPAN, LOCK_FRACTION } from './presets';
import { motionAllowed, subscribeMotionAllowed } from './env';
import { subscribePointer, pointerRecentlyActive, getPointer } from './pointerTracker';
import type { MagneticPreset, Vec2 } from './types';

export interface MagneticCallbacks {
  onFieldEnter?: () => void;
  onLockOn?: () => void;
  onFieldLeave?: () => void;
}

interface Node {
  el: HTMLElement;
  preset: MagneticPreset;
  callbacks: MagneticCallbacks;
  offset: Vec2;
  velocity: Vec2;
  scale: number;
  scaleVelocity: number;
  target: Vec2;
  targetScale: number;
  restCenter: Vec2;
  /** getBoundingClientRect().width / el.offsetWidth — how much smaller/larger this node currently renders on screen than its own layout size, from any ancestor CSS `scale(...)` (PublicPage.tsx's canvas-fit-to-container scale, e.g.). All physics above runs in screen-space (matches the pointer's real coordinates); this factor un-does an ancestor scale on the *applied* translate so the visual on-screen displacement still matches what the physics computed, instead of shrinking/growing with the ancestor's zoom. 1 when there's no such ancestor (ReflowedSection's blocks, most cases). */
  visualScale: number;
  inField: boolean;
  locked: boolean;
}

const nodes = new Map<HTMLElement, Node>();

let rafHandle = 0;
let lastTick = 0;
let allowed = motionAllowed();
let unsubscribePointer: (() => void) | null = null;

function attachPointerIfNeeded() {
  if (unsubscribePointer || typeof window === 'undefined') return;
  unsubscribePointer = subscribePointer(() => ensureLoopRunning());
}

function detachPointerIfIdle() {
  if (!unsubscribePointer || nodes.size > 0) return;
  unsubscribePointer();
  unsubscribePointer = null;
}

// `node.offset`/`.velocity`/`.target` are tracked in *screen* px throughout
// (matches getBoundingClientRect() and the pointer's real coordinates, so
// distance/radius math is meaningless in any other space). Only the CSS
// translate actually written to the element needs converting to *local* px
// (divide by visualScale) — see the paint pass below — because a CSS
// transform is interpreted in the element's own pre-ancestor-scale space,
// then visually shrunk/grown again by any ancestor `scale(...)` (e.g.
// PublicPage.tsx's canvas-fit-to-container scale). Skipping that conversion
// would make a node's real on-screen pull shrink/grow with whatever
// container width the visitor happens to have.
function restCenterOf(node: Node): Vec2 {
  const box = node.el.getBoundingClientRect();
  return { x: box.left + box.width / 2 - node.offset.x, y: box.top + box.height / 2 - node.offset.y };
}

function visualScaleOf(node: Node): number {
  const layoutWidth = node.el.offsetWidth;
  if (!layoutWidth) return 1;
  const box = node.el.getBoundingClientRect();
  // box.width already includes both the ancestor scale *and* this node's
  // own current hover-grow scale (node.scale, from last frame) — divide the
  // latter back out so what's left is just the ancestor's contribution.
  const s = box.width / layoutWidth / (node.scale || 1);
  return s > 0.01 ? s : 1;
}

function tick(now: number) {
  rafHandle = 0;
  const dt = Math.min((now - (lastTick || now)) / 1000, 1 / 30);
  lastTick = now;

  const pointerLive = pointerRecentlyActive();
  const pointerState = pointerLive ? getPointer() : null;
  const activePointer: Vec2 | null = pointerState;
  // While the pointer is held down, every node's cursor-attraction sign
  // reverses — attractors (buttons, hero, images, ...) repel, and the one
  // negative-polarity type (quote) attracts — for as long as the button
  // stays down. This only negates the *cursor* pull below; the coupling
  // pass further down stays untouched because `polaritySign` is applied
  // identically to every node, so the `node.preset.polarity ===
  // other.preset.polarity` comparison it relies on is unaffected (flipping
  // both sides of an equality by the same factor preserves it).
  const polaritySign = pointerState?.pressed ? -1 : 1;

  // Pass 1: rest centers + current ancestor-scale factor (needed by the pointer/coupling passes and by paint, respectively).
  for (const node of nodes.values()) {
    node.restCenter = restCenterOf(node);
    node.visualScale = visualScaleOf(node);
  }

  // Pass 2: per-node target offset/scale from cursor proximity + neighbor coupling.
  let anyMoving = false;
  for (const node of nodes.values()) {
    let tx = 0;
    let ty = 0;
    let scaleBoost = 0;

    if (activePointer) {
      const dx = activePointer.x - node.restCenter.x;
      const dy = activePointer.y - node.restCenter.y;
      const dist = Math.hypot(dx, dy);
      const inField = dist < node.preset.radius;
      if (inField && dist > 0.01) {
        const falloff = smoothstep(1 - dist / node.preset.radius);
        const pull = node.preset.polarity * polaritySign * node.preset.strength * falloff * node.preset.maxOffset;
        tx += (dx / dist) * pull;
        ty += (dy / dist) * pull;
        scaleBoost = falloff * (node.preset.maxScale - 1);
      }
      const locked = dist < node.preset.radius * LOCK_FRACTION;
      if (inField && !node.inField) node.callbacks.onFieldEnter?.();
      if (locked && !node.locked) node.callbacks.onLockOn?.();
      if (!inField && node.inField) node.callbacks.onFieldLeave?.();
      node.inField = inField;
      node.locked = locked;
    } else if (node.inField) {
      node.callbacks.onFieldLeave?.();
      node.inField = false;
      node.locked = false;
    }

    if (node.preset.coupling > 0) {
      for (const other of nodes.values()) {
        if (other === node) continue;
        const otherMag = Math.hypot(other.offset.x, other.offset.y);
        if (otherMag < 0.5) continue;
        const dx = other.restCenter.x - node.restCenter.x;
        const dy = other.restCenter.y - node.restCenter.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1 || dist >= COUPLING_SPAN) continue;
        const falloff = Math.pow(1 - dist / COUPLING_SPAN, 1.15);
        // Same polarity -> push apart (-1); opposite polarity -> pull together (+1) — the actual magnet rule.
        const sign = node.preset.polarity === other.preset.polarity ? -1 : 1;
        const mag = node.preset.coupling * otherMag * falloff * sign;
        tx += (dx / dist) * mag;
        ty += (dy / dist) * mag;
      }
    }

    const maxT = node.preset.maxOffset * 1.5;
    const tmag = Math.hypot(tx, ty);
    if (tmag > maxT) {
      tx = (tx / tmag) * maxT;
      ty = (ty / tmag) * maxT;
    }
    node.target = { x: tx, y: ty };
    node.targetScale = 1 + scaleBoost;
  }

  // Pass 3: spring-integrate toward target and paint.
  const idleEpsilon = 0.05;
  for (const node of nodes.values()) {
    const sx = springStep({ x: node.offset.x, v: node.velocity.x }, node.target.x, node.preset.stiffness, node.preset.damping, dt);
    const sy = springStep({ x: node.offset.y, v: node.velocity.y }, node.target.y, node.preset.stiffness, node.preset.damping, dt);
    const ss = springStep({ x: node.scale, v: node.scaleVelocity }, node.targetScale, node.preset.stiffness * 1.2, node.preset.damping, dt);
    node.offset = { x: sx.x, y: sy.x };
    node.velocity = { x: sx.v, y: sy.v };
    node.scale = ss.x;
    node.scaleVelocity = ss.v;
    const localX = sx.x / node.visualScale;
    const localY = sy.x / node.visualScale;
    node.el.style.transform = `translate3d(${localX.toFixed(2)}px, ${localY.toFixed(2)}px, 0) scale(${ss.x.toFixed(4)})`;

    if (
      Math.abs(node.velocity.x) + Math.abs(node.velocity.y) > idleEpsilon ||
      Math.abs(node.offset.x - node.target.x) + Math.abs(node.offset.y - node.target.y) > idleEpsilon ||
      Math.abs(node.scale - node.targetScale) > 0.0005
    ) {
      anyMoving = true;
    }
  }

  if (anyMoving || pointerLive) {
    ensureLoopRunning();
  }
}

function ensureLoopRunning() {
  if (rafHandle || nodes.size === 0 || typeof window === 'undefined') return;
  rafHandle = window.requestAnimationFrame(tick);
}

function resetNodeVisual(node: Node) {
  node.offset = { x: 0, y: 0 };
  node.velocity = { x: 0, y: 0 };
  node.scale = 1;
  node.scaleVelocity = 0;
  node.target = { x: 0, y: 0 };
  node.targetScale = 1;
  node.inField = false;
  node.locked = false;
  node.el.style.transform = '';
}

subscribeMotionAllowed((next) => {
  allowed = next;
  if (!allowed) {
    for (const node of nodes.values()) resetNodeVisual(node);
    if (rafHandle) {
      cancelAnimationFrame(rafHandle);
      rafHandle = 0;
    }
  }
});

/**
 * Registers one DOM element as a magnetic node. No-ops (returns a no-op
 * unregister) when motion is currently disallowed (reduced-motion or a
 * coarse pointer) — callers that also want the reduced-motion-safe static
 * hover fallback should check `motionAllowed()` themselves; this function
 * only ever drives the physics.
 */
export function registerMagneticNode(el: HTMLElement, preset: MagneticPreset, callbacks: MagneticCallbacks = {}): () => void {
  if (!allowed || typeof window === 'undefined') return () => {};
  attachPointerIfNeeded();
  const node: Node = {
    el,
    preset,
    callbacks,
    offset: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    scale: 1,
    scaleVelocity: 0,
    target: { x: 0, y: 0 },
    targetScale: 1,
    restCenter: { x: 0, y: 0 },
    visualScale: 1,
    inField: false,
    locked: false,
  };
  nodes.set(el, node);
  ensureLoopRunning();
  return () => {
    const existing = nodes.get(el);
    if (existing) existing.el.style.transform = '';
    nodes.delete(el);
    detachPointerIfIdle();
  };
}

/** Exposed for tests/diagnostics — not used by the render path itself. */
export function magneticNodeCount(): number {
  return nodes.size;
}
