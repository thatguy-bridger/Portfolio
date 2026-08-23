import { useEffect, useState } from 'react';

/** Window-width-based (not container-width-based) narrow check for the public renderer's mobile-reflow decision — same convention as the old app's design-system/useIsNarrow.ts. Deliberately separate from useElementWidth (which only fits the desktop canvas to its container): using the window width here means the reflow decision is known on first paint, with no ResizeObserver flash of the full-width desktop canvas on a narrow screen. */
export function useIsNarrow(breakpoint: number): boolean {
  const [narrow, setNarrow] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < breakpoint : false));
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setNarrow(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [breakpoint]);
  return narrow;
}
