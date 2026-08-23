import { useEffect, type RefObject } from 'react';

/** Calls onAway on any pointerdown outside every given ref — for dropdowns/popovers portaled to document.body. */
export function useClickAway(active: boolean, refs: Array<RefObject<HTMLElement | null>>, onAway: () => void) {
  useEffect(() => {
    if (!active) return;
    function handler(e: PointerEvent) {
      const target = e.target as Node;
      if (refs.some((r) => r.current?.contains(target))) return;
      onAway();
    }
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, onAway]);
}
