import { useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Debounced autosave, generic over whatever's being saved (a page's
 * draft_blocks, its title, etc.) — there was no autosave pattern anywhere
 * else in this codebase yet, so this is Phase 4's one. Watches `value` by
 * reference; every real change (CanvasEditor's onChange always hands back a
 * new array, never mutates in place) resets a `delayMs` timer, so a burst of
 * edits collapses into one save once things go quiet, rather than one PATCH
 * per keystroke/drag-frame.
 *
 * Deliberately does NOT save on mount — `value` arriving for the first time
 * (the page's own already-persisted draft_blocks) is not a change to save,
 * just the initial load.
 */
export function useAutosave<T>(value: T, save: (value: T) => Promise<void>, delayMs = 900) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedOnce = useRef(false);
  const latestValue = useRef(value);
  const saveRef = useRef(save);
  saveRef.current = save;
  latestValue.current = value;

  useEffect(() => {
    if (!mountedOnce.current) {
      mountedOnce.current = true;
      return;
    }
    setStatus('idle');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(runSave, delayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delayMs]);

  async function runSave() {
    setStatus('saving');
    try {
      await saveRef.current(latestValue.current);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }

  /** Saves immediately, bypassing the debounce timer — e.g. before navigating away or before a Publish action, so Publish never ships blocks older than what's on screen. */
  function flush(): Promise<void> {
    if (timerRef.current) clearTimeout(timerRef.current);
    return runSave();
  }

  return { status, flush };
}
