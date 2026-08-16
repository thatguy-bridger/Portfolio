import { useEffect, useRef, useState } from 'react';

export interface ScrollSection {
  id: string;
  label: string;
}

interface ScrollProgressState {
  /** smoothed 0..1 progress through the document, spring-lagged for a fluid feel */
  displayProgress: number;
  /** raw 0..1 progress, no smoothing */
  rawProgress: number;
  activeIndex: number;
}

/**
 * Tracks scroll progress through the document plus which registered section is
 * active, and smooths the displayed progress toward the raw value with a
 * spring-like lerp so the fill reads as fluid rather than linear/robotic.
 */
export function useScrollProgress(sections: ScrollSection[], reducedMotion: boolean): ScrollProgressState {
  const [state, setState] = useState<ScrollProgressState>({ displayProgress: 0, rawProgress: 0, activeIndex: 0 });
  const targetRef = useRef(0);
  const activeRef = useRef(0);
  const displayRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    function measure() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const raw = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      targetRef.current = raw;

      let active = 0;
      let best = Infinity;
      sections.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - window.innerHeight * 0.3);
        if (rect.top <= window.innerHeight * 0.5 && dist < best) {
          best = dist;
          active = i;
        }
      });
      activeRef.current = active;

      if (reducedMotion) {
        displayRef.current = raw;
        setState({ displayProgress: raw, rawProgress: raw, activeIndex: active });
      }
    }

    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [sections, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    function tick() {
      const diff = targetRef.current - displayRef.current;
      displayRef.current += diff * 0.12;
      if (Math.abs(diff) < 0.0005) displayRef.current = targetRef.current;
      setState({ displayProgress: displayRef.current, rawProgress: targetRef.current, activeIndex: activeRef.current });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion]);

  return state;
}
