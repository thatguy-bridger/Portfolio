// Pure state-transition core for useUndoRedo.ts, pulled out of the hook so
// it can be unit-tested standalone (no React renderer needed) — same
// separation-of-concerns reasoning as diff.ts. The hook itself only adds
// React state plumbing and the wall-clock coalescing-window decision; every
// actual past/future array transition lives here.

export interface HistoryState<T> {
  present: T;
  past: T[];
  future: T[];
}

export function initialHistoryState<T>(present: T): HistoryState<T> {
  return { present, past: [], future: [] };
}

/**
 * Applies a new value. When `coalesce` is true (the caller decided this
 * edit landed within the same gesture as the previous one — see
 * useUndoRedo.ts's COALESCE_WINDOW_MS), `present` updates in place with no
 * new undo point; otherwise the current `present` is pushed onto `past`
 * (bounded to `limit`) and `future` is cleared, same as any normal edit
 * after an undo invalidating the redo branch.
 */
export function pushSet<T>(h: HistoryState<T>, next: T, coalesce: boolean, limit: number): HistoryState<T> {
  if (coalesce) return { present: next, past: h.past, future: h.future };
  return { present: next, past: [...h.past, h.present].slice(-limit), future: [] };
}

export function undoState<T>(h: HistoryState<T>, limit: number): HistoryState<T> {
  if (h.past.length === 0) return h;
  const previous = h.past[h.past.length - 1];
  return { present: previous, past: h.past.slice(0, -1), future: [h.present, ...h.future].slice(0, limit) };
}

export function redoState<T>(h: HistoryState<T>, limit: number): HistoryState<T> {
  if (h.future.length === 0) return h;
  const [nextState, ...rest] = h.future;
  return { present: nextState, past: [...h.past, h.present].slice(-limit), future: rest };
}
