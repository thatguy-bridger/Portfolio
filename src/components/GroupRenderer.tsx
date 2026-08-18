import { useEffect, useRef, useState } from 'react';
import { BlockContent } from './BlockContent';
import { useElementWidth, seedMobileLayout } from './GroupCanvas';
import { WorkGrid } from '../sections/WorkGrid';
import { useIsNarrow } from '../design-system/useIsNarrow';
import { useTheme } from '../design-system/theme';
import {
  GROUP_CANVAS_WIDTH,
  MOBILE_CANVAS_WIDTH,
  type CustomPage,
  type EntranceAnimation,
  type GroupBlock,
  type GroupBlockPosition,
  type HomepageGroup,
  type SiteTile,
  type Widget,
} from '../data/siteData';

/** Below this width the scaled 1200px-design canvas would render blocks too small to read or tap — a group falls back to a simple stacked column here unless it's had a mobile layout customized (see seedMobileLayout / GroupCanvas device="mobile"). */
const MOBILE_BREAKPOINT = 700;

function noop() {}

function hiddenTransform(animation: EntranceAnimation | undefined): string | undefined {
  switch (animation) {
    case 'slide-up':
      return 'translateY(28px)';
    case 'slide-left':
      return 'translateX(-32px)';
    case 'slide-right':
      return 'translateX(32px)';
    case 'scale':
      return 'scale(0.92)';
    default:
      return undefined;
  }
}

/** Applies a block's entrance animation via IntersectionObserver, honoring reduced-motion (shows the final state immediately, no transition). A block with no animation (or 'none') renders with no wrapper overhead. */
function Reveal({ animation, children }: { animation: EntranceAnimation | undefined; children: React.ReactNode }) {
  const { reducedMotion } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!animation || animation === 'none' || reducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animation, reducedMotion]);

  if (!animation || animation === 'none') return <>{children}</>;

  const shown = reducedMotion || visible;
  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '100%',
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : hiddenTransform(animation),
        transition: reducedMotion ? 'none' : 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Read-only rendering of the freeform homepage's sections, for the public
 * site. `forceNarrow` overrides the real viewport check — used by the
 * Homepage Studio's mobile preview frame, which is narrower than the
 * browser window it's rendered inside of.
 */
export function GroupRenderer({
  groups,
  widgets,
  pages,
  tiles,
  forceNarrow,
}: {
  groups: HomepageGroup[];
  widgets: Widget[];
  pages: CustomPage[];
  tiles: SiteTile[];
  forceNarrow?: boolean;
}) {
  const windowNarrow = useIsNarrow(MOBILE_BREAKPOINT);
  const narrow = forceNarrow ?? windowNarrow;
  return (
    <>
      {groups.map((g) => (
        <GroupSection key={g.id} group={g} narrow={narrow} widgets={widgets} pages={pages} tiles={tiles} />
      ))}
    </>
  );
}

function GroupSection({ group, narrow, widgets, pages, tiles }: { group: HomepageGroup; narrow: boolean; widgets: Widget[]; pages: CustomPage[]; tiles: SiteTile[] }) {
  const [containerRef, containerWidth] = useElementWidth();
  const sectionStyle: React.CSSProperties = {
    background: group.background,
    backgroundImage: group.backgroundImage ? `url(${group.backgroundImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  const visibleBlocks = group.blocks.filter((b) => !b.hideOnMobile);
  const hasCustomMobileLayout = narrow && visibleBlocks.some((b) => b.mobilePosition);

  if (narrow && !hasCustomMobileLayout) {
    const ordered = [...visibleBlocks].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
    if (ordered.length === 0) return null;
    return (
      <section id={group.id} style={{ ...sectionStyle, padding: '48px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600, margin: '0 auto' }}>
          {ordered.map((b) => (
            <Reveal key={b.id} animation={b.animation}>
              {b.block.type === 'workgrid' ? (
                <WorkGrid tiles={tiles} />
              ) : (
                <BlockContent block={b.block} editable={false} onUpdate={noop} pages={pages} widgets={widgets} />
              )}
            </Reveal>
          ))}
        </div>
      </section>
    );
  }

  if (visibleBlocks.length === 0) return null;

  const canvasWidth = narrow ? MOBILE_CANVAS_WIDTH : GROUP_CANVAS_WIDTH;
  const scale = containerWidth > 0 ? Math.min(1, containerWidth / canvasWidth) : 1;
  const paddingY = group.paddingY ?? 0;

  let seeded: Record<string, GroupBlockPosition> | null = null;
  function getPos(b: GroupBlock): GroupBlockPosition {
    if (!narrow) return b.position;
    if (b.mobilePosition) return b.mobilePosition;
    seeded ??= seedMobileLayout(group.blocks);
    return seeded[b.id] ?? b.position;
  }

  const maxBottom = visibleBlocks.reduce((m, b) => Math.max(m, getPos(b).y + getPos(b).h), 0);
  const canvasHeight = Math.max(group.minHeight ?? 0, maxBottom + 40);

  return (
    <section id={group.id} ref={containerRef} style={{ ...sectionStyle, position: 'relative', width: '100%', height: (canvasHeight + paddingY * 2) * scale, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: paddingY, left: 0, width: canvasWidth, height: canvasHeight, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {visibleBlocks.map((b) => {
          const pos = getPos(b);
          return (
            <div
              key={b.id}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: pos.w,
                height: pos.h,
                zIndex: b.zIndex,
                background: b.style?.background,
                backgroundImage: b.style?.backgroundImage ? `url(${b.style.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: b.style?.borderWidth ? `${b.style.borderWidth}px solid ${b.style.borderColor ?? 'var(--border-default)'}` : undefined,
                borderRadius: b.style?.borderRadius,
                boxShadow: b.style?.shadow ? 'var(--shadow-lg)' : undefined,
              }}
            >
              <Reveal animation={b.animation}>
                {b.block.type === 'workgrid' ? (
                  <WorkGrid tiles={tiles} />
                ) : (
                  <BlockContent block={b.block} editable={false} onUpdate={noop} pages={pages} widgets={widgets} />
                )}
              </Reveal>
            </div>
          );
        })}
      </div>
    </section>
  );
}
