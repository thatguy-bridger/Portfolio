import { useEffect, useRef, useState } from 'react';

/** True while focus is inside a native text-editing control — undo/redo shortcuts defer to the browser's own text-field undo there instead of hijacking it. */
function isTextEditingFocus(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable;
}

/**
 * A generic undo/redo history over a piece of state, with no dependency on
 * where that state is persisted — kept separate from useSiteDraft's
 * Firebase plumbing so the history mechanism itself (burst-coalescing,
 * undo/redo stack behavior) can be unit-tested without touching real data.
 *
 * Rapid-fire changes (dragging a block, typing a sentence) within
 * `commitMs` of each other collapse into a single undo step, captured from
 * the value at the start of the burst — so dragging one block for two
 * seconds is one undo, not sixty.
 */
export function useUndoHistory<T>(
  initial: T | null = null,
  opts?: { maxHistory?: number; commitMs?: number; bindKeyboard?: boolean },
) {
  const maxHistory = opts?.maxHistory ?? 50;
  const commitMs = opts?.commitMs ?? 500;

  const [value, setValueRaw] = useState<T | null>(initial);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);
  const valueRef = useRef(value);
  valueRef.current = value;
  const burstOrigin = useRef<T | null>(null);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Same external shape as plain useState's setter (value or updater function). */
  function set(next: T | null | ((prev: T | null) => T | null)) {
    const prev = valueRef.current;
    const resolved = typeof next === 'function' ? (next as (prev: T | null) => T | null)(prev) : next;
    if (prev !== null && resolved !== null) {
      if (burstOrigin.current === null) burstOrigin.current = prev;
      if (commitTimer.current) clearTimeout(commitTimer.current);
      commitTimer.current = setTimeout(() => {
        const origin = burstOrigin.current;
        burstOrigin.current = null;
        if (origin !== null) {
          setPast((p) => [...p, origin].slice(-maxHistory));
          setFuture([]);
        }
      }, commitMs);
    }
    setValueRaw(resolved);
  }

  function undo() {
    if (valueRef.current === null) return;
    if (commitTimer.current) {
      clearTimeout(commitTimer.current);
      commitTimer.current = null;
    }
    // A burst that hasn't committed yet is itself the most recent undo step.
    const pending = burstOrigin.current;
    burstOrigin.current = null;
    const stack = pending !== null ? [...past, pending] : past;
    if (stack.length === 0) return;
    const prevState = stack[stack.length - 1];
    setPast(stack.slice(0, -1));
    setFuture((f) => [valueRef.current as T, ...f].slice(0, maxHistory));
    setValueRaw(prevState);
  }

  function redo() {
    if (valueRef.current === null || future.length === 0) return;
    if (commitTimer.current) {
      clearTimeout(commitTimer.current);
      commitTimer.current = null;
    }
    burstOrigin.current = null;
    const [nextState, ...rest] = future;
    setFuture(rest);
    setPast((p) => [...p, valueRef.current as T].slice(-maxHistory));
    setValueRaw(nextState);
  }

  const canUndo = past.length > 0 || burstOrigin.current !== null;
  const canRedo = future.length > 0;

  useEffect(() => {
    if (!opts?.bindKeyboard) return;
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
      if (isTextEditingFocus()) return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.bindKeyboard, past, future]);

  return { value, set, undo, redo, canUndo, canRedo };
}
