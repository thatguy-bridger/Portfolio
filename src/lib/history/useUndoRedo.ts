// In-editor session undo/redo — local-only, in-memory, resets on reload
// (the persisted trail is `revision_history`, written server-side; see
// diff.ts and the /api/admin/pages/[id]/{history,rollback} endpoints for
// that separate, durable layer). Generic over `T` so it can wrap whatever
// state a caller wants time-travel over — used in PageEditor.tsx to wrap a
// page's whole `sections` array (PageSection[]), which is what
// CanvasEditor's `onChange` ultimately updates.
//
// Coalescing: CanvasEditor calls `onChange` continuously while a drag is in
// progress (once per pointermove — see CanvasEditor.tsx's onDragMove), and a
// settings-panel text field fires `onChange` once per keystroke. Recording
// every one of those as its own undo step would make Undo only ever step
// back a single pixel or character — not a "meaningful edit" per the phase
// brief. Instead, only the FIRST `set()` call after a quiet period pushes a
// new undo point; everything else within COALESCE_WINDOW_MS of the previous
// push just updates `present` in place, so one whole drag gesture, or one
// burst of typing, collapses into a single undo step — matching how
// Cmd+Z behaves in most editors. The actual past/future transitions are in
// historyReducer.ts (pure, unit-tested standalone); this file is just the
// React-state + wall-clock-timing wrapper around it.
import { useCallback, useRef, useState } from 'react';
import { initialHistoryState, pushSet, redoState, undoState, type HistoryState } from './historyReducer';

/** Bounded so a long editing session can't grow the stack without limit. */
const HISTORY_LIMIT = 50;
const COALESCE_WINDOW_MS = 700;

export interface UndoRedoApi<T> {
  state: T;
  /** Drop-in replacement for a useState setter — accepts either a value or a `(prev) => next` updater. */
  set: (updater: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useUndoRedo<T>(initial: T): UndoRedoApi<T> {
  const [history, setHistory] = useState<HistoryState<T>>(() => initialHistoryState(initial));
  // Wall-clock time of the last recorded push, used only to decide whether
  // the *next* `set()` call starts a new undo step or coalesces into the
  // current one. A ref (not state) — updating it must never itself trigger
  // a render.
  const lastPushAt = useRef(0);

  const set = useCallback((updater: T | ((prev: T) => T)) => {
    setHistory((h) => {
      const next = typeof updater === 'function' ? (updater as (prev: T) => T)(h.present) : updater;
      const now = Date.now();
      const coalesce = now - lastPushAt.current <= COALESCE_WINDOW_MS;
      lastPushAt.current = now;
      return pushSet(h, next, coalesce, HISTORY_LIMIT);
    });
  }, []);

  const undo = useCallback(() => {
    // An edit right after an undo should always start its own new step,
    // never coalesce with whatever was happening before the undo.
    lastPushAt.current = 0;
    setHistory((h) => undoState(h, HISTORY_LIMIT));
  }, []);

  const redo = useCallback(() => {
    lastPushAt.current = 0;
    setHistory((h) => redoState(h, HISTORY_LIMIT));
  }, []);

  return { state: history.present, set, undo, redo, canUndo: history.past.length > 0, canRedo: history.future.length > 0 };
}
