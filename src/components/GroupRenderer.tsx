import { useEffect, useRef, useState } from 'react';
import { BlockContent } from './BlockContent';
import { useElementWidth } from './GroupCanvas';
import { WorkGrid } from '../sections/WorkGrid';
import { useIsNarrow } from '../design-system/useIsNarrow';
import { useTheme } from '../design-system/theme';
import { GROUP_CANVAS_WIDTH, type CustomPage, type EntranceAnimation, type HomepageGroup, type SiteTile, type Widget } from '../data/siteData';

/** Below this width the scaled 1200px-design canvas would render blocks too small to read or tap — fall back to a simple stacked column instead. A real per-breakpoint mobile layout is a later phase. */
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

/** Read-only rendering of the freeform homepage's sections, for the public site. */
export function GroupRenderer({ groups, widgets, pages, tiles }: { groups: HomepageGroup[]; widgets: Widget[]; pages: CustomPage[]; tiles: SiteTile[] }) {
  const narrow = useIsNarrow(MOBILE_BREAKPOINT);
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

  if (narrow) {
    const ordered = [...group.blocks]
      .filter((b) => !b.hideOnMobile)
      .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
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

  if (group.blocks.length === 0) return null;
  const scale = containerWidth > 0 ? Math.min(1, containerWidth / GROUP_CANVAS_WIDTH) : 1;
  const maxBottom = group.blocks.reduce((m, b) => Math.max(m, b.position.y + b.position.h), 0);
  const paddingY = group.paddingY ?? 0;
  const canvasHeight = Math.max(group.minHeight ?? 0, maxBottom + 40);

  return (
    <section id={group.id} ref={containerRef} style={{ ...sectionStyle, position: 'relative', width: '100%', height: (canvasHeight + paddingY * 2) * scale, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: paddingY, left: 0, width: GROUP_CANVAS_WIDTH, height: canvasHeight, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {group.blocks.map((b) => (
          <div
            key={b.id}
            style={{
              position: 'absolute',
              left: b.position.x,
              top: b.position.y,
              width: b.position.w,
              height: b.position.h,
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
        ))}
      </div>
    </section>
  );
}
