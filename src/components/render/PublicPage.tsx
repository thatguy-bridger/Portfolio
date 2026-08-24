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
// type, when motion is enabled). ReflowedSection is shared with
// CanvasEditor.tsx's read-only preview, which does NOT want motion — see
// its `motionEnabled` prop, passed `true` only from here.
//
// PublicSection is exported (not just used internally) so CanvasEditor.tsx's
// rescalable preview (item 4 of the canvas-editor request bundle) can call
// the exact same "render this one section at this one width, read-only"
// logic real visitors get, via its `previewWidth` param below, instead of
// reimplementing the desktop/reflow breakpoint split a third time.
import { DESKTOP_CANVAS_WIDTH, MOBILE_BREAKPOINT, type PageBlocks, type PageSection } from '../../lib/blocks/types';
import { blockScale } from '../../lib/blocks/scale';
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

export function PublicSection({
  section,
  previewWidth,
  motionEnabled = true,
}: {
  section: PageSection;
  // When set, this section renders at exactly this pixel width instead of
  // measuring its real container/window — deterministic, synchronous, and
  // independent of the actual device/viewport, which is what makes it safe
  // for a preview frame the owner drags to an arbitrary width to reproduce
  // precisely (down to the same MOBILE_BREAKPOINT comparison) what a real
  // visitor at that width would see, on any device this is edited from.
  previewWidth?: number;
  // Real visitors always get motion (the default); CanvasEditor.tsx's
  // preview passes `false` so the admin editing surface never mounts the
  // magnetic-cursor physics, matching this component's pre-existing
  // "editor stays completely unaffected by Phase 3 motion" contract (see
  // ReflowedSection.tsx's identical motionEnabled flag).
  motionEnabled?: boolean;
}) {
  const [containerRef, measuredWidth] = useElementWidth();
  const windowNarrow = useIsNarrow(MOBILE_BREAKPOINT);
  const isPreview = previewWidth != null;
  const width = isPreview ? previewWidth : measuredWidth;
  const narrow = isPreview ? previewWidth < MOBILE_BREAKPOINT : windowNarrow;

  if (narrow) return <ReflowedSection section={section} motionEnabled={motionEnabled} />;
  if (section.blocks.length === 0) return null;

  const scale = width > 0 ? Math.min(1, width / DESKTOP_CANVAS_WIDTH) : 1;
  const paddingY = section.paddingY ?? 0;
  const maxBottom = section.blocks.reduce((m, b) => Math.max(m, b.position.y + b.position.h), 0);
  const canvasHeight = Math.max(section.minHeight ?? 0, maxBottom + 40);

  return (
    <section
      id={section.id}
      ref={containerRef}
      style={{
        position: 'relative',
        width: isPreview ? previewWidth : '100%',
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
        {section.blocks.map((block) => {
          const boxStyle: React.CSSProperties = { position: 'absolute', left: block.position.x, top: block.position.y, width: block.position.w, height: block.position.h, zIndex: block.zIndex };
          const content = <BlockRenderer type={block.type} props={block.props} editable={false} onFieldChange={noop} scale={blockScale(block.type, block.position)} />;
          return motionEnabled ? (
            <MagneticBlock key={block.id} type={block.type} style={boxStyle}>
              {content}
            </MagneticBlock>
          ) : (
            <div key={block.id} style={boxStyle}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
