// One shared window-level Pointer Events listener, fanned out to whoever
// needs live cursor position — magneticField.ts (element attraction) and
// AmbientFieldCanvas's renderer (the ambient repulsion-grid visual) both
// subscribe here instead of each attaching their own `pointermove`
// listener. Reference-counted: the real DOM listener attaches on the first
// subscriber and detaches once the last one unsubscribes.
export interface PointerState {
  x: number;
  y: number;
  /** false once the pointer hasn't moved recently, or has left the viewport/window blurred — callers treat this as "no cursor to react to" rather than snapping to a stale (x, y). */
  active: boolean;
  /** true while a pointer button is held down anywhere in the window — drives the "polarity reversal" press mode (magneticField.ts flips each node's cursor-attraction sign, ambientFieldRenderer.ts flips push-away to pull-in). Cleared defensively on pointerup/pointercancel *and* by the same active-loss signals as `active` (blur/mouseleave), so a press that ends outside the window, or a window that loses focus mid-press, never leaves this stuck true. */
  pressed: boolean;
}

type Listener = (state: PointerState) => void;

const listeners = new Set<Listener>();
let state: PointerState = { x: 0, y: 0, active: false, pressed: false };
let lastMoveAt = 0;
let attached = false;

function emit() {
  for (const l of listeners) l(state);
}

function onMove(e: PointerEvent) {
  state = { ...state, x: e.clientX, y: e.clientY, active: true };
  lastMoveAt = performance.now();
  emit();
}

function onDown() {
  if (state.pressed) return;
  state = { ...state, pressed: true };
  emit();
}

function onUp() {
  if (!state.pressed) return;
  state = { ...state, pressed: false };
  emit();
}

function onGoInactive() {
  if (!state.active && !state.pressed) return;
  state = { ...state, active: false, pressed: false };
  emit();
}

function attach() {
  if (attached || typeof window === 'undefined') return;
  attached = true;
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointercancel', onUp, { passive: true });
  window.addEventListener('blur', onGoInactive);
  document.documentElement.addEventListener('mouseleave', onGoInactive);
}

function detach() {
  if (!attached) return;
  attached = false;
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerdown', onDown);
  window.removeEventListener('pointerup', onUp);
  window.removeEventListener('pointercancel', onUp);
  window.removeEventListener('blur', onGoInactive);
  document.documentElement.removeEventListener('mouseleave', onGoInactive);
}

export function subscribePointer(cb: Listener): () => void {
  attach();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) detach();
  };
}

export function getPointer(): PointerState {
  return state;
}

/** True only if the pointer has actually moved within `withinMs` — lets consumers ease back to rest instead of freezing mid-pull if the visitor stops moving the mouse without it technically leaving the window. */
export function pointerRecentlyActive(withinMs = 2000): boolean {
  return state.active && performance.now() - lastMoveAt < withinMs;
}
