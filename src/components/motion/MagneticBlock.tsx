// Wraps one top-level rendered block in magnetic behavior, keyed off its
// registry type (presets.ts) — the integration point PublicPage.tsx and
// ReflowedSection.tsx use instead of touching BlockRenderer.tsx/
// simpleBlocks.tsx, so the block components themselves stay exactly the
// shared editor/public component they already are (see types.ts's
// BlockComponentProps note) with zero awareness that motion exists.
//
// Block types with no preset (rich-text, divider, and any future type not
// listed in presets.ts) render as a plain div — no ref registration, no
// rAF cost, motion is opt-in per type by construction.
import { useMagnetic, useMotionAllowed } from '../../lib/motion/useMagnetic';
import { MOTION_PRESETS } from '../../lib/motion/presets';

export function MagneticBlock({
  type,
  style,
  children,
}: {
  type: string;
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  const preset = MOTION_PRESETS[type];
  const ref = useMagnetic<HTMLDivElement>(preset);
  const motionLive = useMotionAllowed();
  // Reduced-motion / coarse-pointer fallback: a plain CSS hover highlight
  // (see theme.css's [data-magnetic-static] rule) instead of the physics —
  // "no continuous RAF loop, simple opacity/color feedback only" per spec.
  const staticFallback = !!preset && !motionLive;

  return (
    <div
      ref={ref}
      data-magnetic={preset ? type : undefined}
      data-magnetic-static={staticFallback || undefined}
      style={preset ? { ...style, willChange: 'transform' } : style}
    >
      {children}
    </div>
  );
}
