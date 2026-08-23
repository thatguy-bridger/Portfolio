// Read-only public rendering of a page's sections — the counterpart to
// CanvasEditor.tsx. Desktop renders each section's blocks absolutely
// positioned exactly as authored (same scaled-canvas math as the editor,
// via useElementWidth, so it's pixel-identical to what the editor showed);
// below MOBILE_BREAKPOINT every section switches to ReflowedSection, the
// exact same component the editor's mobile-preview toggle uses, so the two
// can never disagree about what mobile looks like. Mirrors the old app's
// GroupRenderer.tsx (src/components/GroupRenderer.tsx on main).
//
// This is also the Phase 3 motion/sound mount point (MotionLayer wraps the
// whole page once; each top-level block is a MagneticBlock keyed off its
// type). ReflowedSection is shared with CanvasEditor.tsx's mobile-preview
// toggle, which does NOT want motion — see its `motionEnabled` prop, passed
// `true` only from here.
import { DESKTOP_CANVAS_WIDTH, MOBILE_BREAKPOINT, type PageBlocks, type PageSection } from '../../lib/blocks/types';
import { useElementWidth } from '../../lib/blocks/useElementWidth';
import { useIsNarrow } from '../../lib/blocks/useIsNarrow';
import { BlockRenderer } from '../blocks/BlockRenderer';
import { MagneticBlock } from '../motion/MagneticBlock';
import { MotionLayer } from '../motion/MotionLayer';
import { ReflowedSection } from './ReflowedSection';

const noop = () => {};

export function PublicPage({ sections }: { sections: PageBlocks }) {
  return (
    <MotionLayer>
      {sections.map((section) => (
        <PublicSection key={section.id} section={section} />
      ))}
    </MotionLayer>
  );
}

function PublicSection({ section }: { section: PageSection }) {
  const [containerRef, containerWidth] = useElementWidth();
  const narrow = useIsNarrow(MOBILE_BREAKPOINT);

  if (narrow) return <ReflowedSection section={section} motionEnabled />;
  if (section.blocks.length === 0) return null;

  const scale = containerWidth > 0 ? Math.min(1, containerWidth / DESKTOP_CANVAS_WIDTH) : 1;
  const paddingY = section.paddingY ?? 0;
  const maxBottom = section.blocks.reduce((m, b) => Math.max(m, b.position.y + b.position.h), 0);
  const canvasHeight = Math.max(section.minHeight ?? 0, maxBottom + 40);

  return (
    <section
      id={section.id}
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: (canvasHeight + paddingY * 2) * scale,
        overflow: 'hidden',
        // backgroundColor (not the `background` shorthand) — see the
        // identical note in CanvasEditor.tsx.
        backgroundColor: section.background,
        backgroundImage: section.backgroundImage ? `url(${section.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div style={{ position: 'absolute', top: paddingY, left: 0, width: DESKTOP_CANVAS_WIDTH, height: canvasHeight, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {section.blocks.map((block) => (
          <MagneticBlock key={block.id} type={block.type} style={{ position: 'absolute', left: block.position.x, top: block.position.y, width: block.position.w, height: block.position.h, zIndex: block.zIndex }}>
            <BlockRenderer type={block.type} props={block.props} editable={false} onFieldChange={noop} />
          </MagneticBlock>
        ))}
      </div>
    </section>
  );
}
