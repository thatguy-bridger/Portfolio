import { useEffect, useState } from 'react';

/** True when the viewport is below the given width — used to switch a persistent panel to a toggleable drawer. */
export function useIsNarrow(breakpoint = 860): boolean {
  const [narrow, setNarrow] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    function update() {
      setNarrow(window.innerWidth < breakpoint);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [breakpoint]);
  return narrow;
}
