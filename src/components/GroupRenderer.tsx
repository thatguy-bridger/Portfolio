import { BlockContent } from './BlockContent';
import { useElementWidth } from './GroupCanvas';
import { useIsNarrow } from '../design-system/useIsNarrow';
import { GROUP_CANVAS_WIDTH, type CustomPage, type HomepageGroup, type Widget } from '../data/siteData';

/** Below this width the scaled 1200px-design canvas would render blocks too small to read or tap — fall back to a simple stacked column instead. A real per-breakpoint mobile layout is a later phase. */
const MOBILE_BREAKPOINT = 700;

function noop() {}

/** Read-only rendering of the freeform homepage's sections, for the public site. */
export function GroupRenderer({ groups, widgets, pages }: { groups: HomepageGroup[]; widgets: Widget[]; pages: CustomPage[] }) {
  const narrow = useIsNarrow(MOBILE_BREAKPOINT);
  return (
    <>
      {groups.map((g) => (
        <GroupSection key={g.id} group={g} narrow={narrow} widgets={widgets} pages={pages} />
      ))}
    </>
  );
}

function GroupSection({ group, narrow, widgets, pages }: { group: HomepageGroup; narrow: boolean; widgets: Widget[]; pages: CustomPage[] }) {
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
            <BlockContent key={b.id} block={b.block} editable={false} onUpdate={noop} pages={pages} widgets={widgets} />
          ))}
        </div>
      </section>
    );
  }

  if (group.blocks.length === 0) return null;
  const scale = containerWidth > 0 ? Math.min(1, containerWidth / GROUP_CANVAS_WIDTH) : 1;
  const maxBottom = group.blocks.reduce((m, b) => Math.max(m, b.position.y + b.position.h), 0);
  const canvasHeight = Math.max(group.minHeight ?? 0, maxBottom + 40);

  return (
    <section id={group.id} ref={containerRef} style={{ ...sectionStyle, position: 'relative', width: '100%', height: canvasHeight * scale, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: GROUP_CANVAS_WIDTH, height: canvasHeight, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
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
            <BlockContent block={b.block} editable={false} onUpdate={noop} pages={pages} widgets={widgets} />
          </div>
        ))}
      </div>
    </section>
  );
}
