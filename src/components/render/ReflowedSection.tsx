// The mobile-reflow rendering path (see reflow.ts) — used both by the
// editor's mobile preview toggle (CanvasEditor.tsx) and by the public
// renderer's narrow branch (PublicPage.tsx), so the two can never drift
// apart: below MOBILE_BREAKPOINT there is no separate mobile layout to
// author, every section's blocks render sorted by desktop `y` (top to
// bottom), each full-width, stacked with consistent spacing. Always
// read-only — reflow is automatic, there's nothing to edit at mobile width.
//
// `motionEnabled` (default false) is the one thing that differs between
// those two callers: PublicPage.tsx passes `true` so mobile visitors still
// get magnetic blocks (motion itself still no-ops on a touch/coarse pointer
// per useMagnetic.ts, but this also covers a narrow *desktop* window);
// CanvasEditor.tsx's mobile-preview toggle doesn't pass it, so it stays
// false and renders exactly as before Phase 3 — the editor must stay
// completely unaffected by this feature.
import { reflowOrder } from '../../lib/blocks/reflow';
import type { PageSection } from '../../lib/blocks/types';
import { BlockRenderer } from '../blocks/BlockRenderer';
import { MagneticBlock } from '../motion/MagneticBlock';

const noop = () => {};

export function ReflowedSection({ section, motionEnabled = false }: { section: PageSection; motionEnabled?: boolean }) {
  const ordered = reflowOrder(section.blocks);
  if (ordered.length === 0) return null;
  return (
    <section
      id={section.id}
      style={{
        // backgroundColor (not the `background` shorthand) — see the
        // identical note in CanvasEditor.tsx.
        backgroundColor: section.background,
        backgroundImage: section.backgroundImage ? `url(${section.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '40px 20px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 520, margin: '0 auto' }}>
        {ordered.map((block) => {
          const content = <BlockRenderer type={block.type} props={block.props} editable={false} onFieldChange={noop} narrow />;
          const style: React.CSSProperties = { width: '100%', minHeight: Math.min(block.position.h, 480) };
          return motionEnabled ? (
            <MagneticBlock key={block.id} type={block.type} style={style}>
              {content}
            </MagneticBlock>
          ) : (
            <div key={block.id} style={style}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
