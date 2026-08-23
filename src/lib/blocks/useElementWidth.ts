import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

/** Tracks a container's rendered width so a freeform canvas can scale to fit narrower panes without a horizontal scrollbar — same convention the old app's GroupCanvas.tsx used, shared here by the editor and the public renderer. */
export function useElementWidth(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}
