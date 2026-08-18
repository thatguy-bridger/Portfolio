import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../design-system/theme';
import type { ScrollEffectConfig, ScrollEffectPreset } from '../data/siteData';

/** Below this width, parallax and sticky are disabled — the fixed-position math and off-axis motion cost more than they're worth on a small screen, and add scroll jank on weaker mobile hardware. Progress/reveal effects stay on since they're lighter (a single IntersectionObserver, no per-frame work). */
const EFFECT_MOBILE_BREAKPOINT = 700;

const PRESET_STRENGTH: Record<ScrollEffectPreset, number> = { subtle: 0.15, medium: 0.35, dramatic: 0.6 };

function strengthOf(effect: ScrollEffectConfig): number {
  if (effect.preset) return PRESET_STRENGTH[effect.preset];
  return Math.max(0, Math.min(100, effect.intensity ?? 35)) / 100;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function useNarrowEffects(): boolean {
  const [narrow, setNarrow] = useState(() => window.innerWidth < EFFECT_MOBILE_BREAKPOINT);
  useEffect(() => {
    function update() {
      setNarrow(window.innerWidth < EFFECT_MOBILE_BREAKPOINT);
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return narrow;
}

/** Continuous parallax/progress motion via a single shared rAF loop per mounted effect. Renders `children` in a wrapper whose transform/opacity track scroll position every frame while active. */
function MotionEffect({ effect, children }: { effect: ScrollEffectConfig; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    let raf = 0;
    const strength = strengthOf(effect);
    function tick() {
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        if (effect.type === 'parallax') {
          const centerDelta = rect.top + rect.height / 2 - vh / 2;
          setStyle({ transform: `translateY(${(-centerDelta * strength * 0.3).toFixed(1)}px)` });
        } else if (effect.type === 'progress') {
          const progress = clamp01(1 - rect.top / vh);
          const opacity = 1 - (1 - progress) * strength;
          const scale = 1 - (1 - progress) * strength * 0.25;
          setStyle({ opacity: Math.max(0.15, opacity), transform: `scale(${scale.toFixed(3)})` });
        }
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [effect]);

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', willChange: 'transform, opacity', ...style }}>
      {children}
    </div>
  );
}

/**
 * Pins `children` to the viewport (at `stickyOffset` from the top) while its
 * enclosing boundary element (a group `<section>` on the public site, or the
 * nearest positioned ancestor in the editor) is still scrolling past.
 * Portals to document.body while pinned — a block here normally lives inside
 * a `transform: scale(...)` canvas wrapper, and CSS position:fixed doesn't
 * escape a transformed ancestor to reach the real viewport, so this achieves
 * the same effect manually instead.
 */
function StickyEffect({ effect, children }: { effect: ScrollEffectConfig; children: ReactNode }) {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [pin, setPin] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const offset = effect.stickyOffset ?? 20;

  useEffect(() => {
    let raf = 0;
    function tick() {
      const el = placeholderRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const boundary = el.closest('section') ?? el.parentElement;
        const boundaryRect = boundary?.getBoundingClientRect();
        const canPin = rect.top <= offset && (!boundaryRect || boundaryRect.bottom > rect.height + offset);
        if (canPin) {
          setPin((p) => (p && p.left === rect.left && p.width === rect.width && p.height === rect.height ? p : { left: rect.left, top: offset, width: rect.width, height: rect.height }));
        } else {
          setPin(null);
        }
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [offset]);

  return (
    <div ref={placeholderRef} style={{ width: '100%', height: '100%' }}>
      <div style={{ width: '100%', height: '100%', visibility: pin ? 'hidden' : 'visible' }}>{children}</div>
      {pin &&
        createPortal(
          <div style={{ position: 'fixed', left: pin.left, top: pin.top, width: pin.width, height: pin.height, zIndex: 400 }}>{children}</div>,
          document.body,
        )}
    </div>
  );
}

/**
 * Applies a block's continuous scroll effect — used identically by the
 * public GroupRenderer and the editor's GroupCanvas, so parallax/progress
 * preview live while editing, not just after publish. Reduced-motion
 * disables parallax/progress (real motion); sticky stays on since pinning
 * isn't motion. Parallax and sticky both turn off below
 * EFFECT_MOBILE_BREAKPOINT.
 *
 * `editorPreview` skips actually pinning a sticky block — portaling it out
 * to the viewport while its drag handles stay behind in the canvas would
 * make it impossible to keep editing, so the canvas shows a static "pinned"
 * badge instead and defers the real pin behavior to the public renderer /
 * mobile preview frame.
 */
export function ScrollEffectBlock({ effect, editorPreview, children }: { effect: ScrollEffectConfig | undefined; editorPreview?: boolean; children: ReactNode }) {
  const { reducedMotion } = useTheme();
  const narrow = useNarrowEffects();

  if (!effect || effect.type === 'none') return <>{children}</>;
  if (effect.type === 'sticky') {
    if (editorPreview) return <>{children}</>;
    if (narrow) return <>{children}</>;
    return <StickyEffect effect={effect}>{children}</StickyEffect>;
  }
  if (reducedMotion || (narrow && effect.type === 'parallax')) return <>{children}</>;
  return <MotionEffect effect={effect}>{children}</MotionEffect>;
}
