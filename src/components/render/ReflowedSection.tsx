// The mobile-reflow rendering path (see reflow.ts) — used both by the
// editor's mobile preview toggle (CanvasEditor.tsx) and by the public
// renderer's narrow branch (PublicPage.tsx), so the two can never drift
// apart: below MOBILE_BREAKPOINT there is no separate mobile layout to
// author, every section's blocks render sorted by desktop `y` (top to
// bottom), each full-width, stacked with consistent spacing. Always
// read-only — reflow is automatic, there's nothing to edit at mobile width.
import { reflowOrder } from '../../lib/blocks/reflow';
import type { PageSection } from '../../lib/blocks/types';
import { BlockRenderer } from '../blocks/BlockRenderer';

const noop = () => {};

export function ReflowedSection({ section }: { section: PageSection }) {
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
        {ordered.map((block) => (
          <div key={block.id} style={{ width: '100%', minHeight: Math.min(block.position.h, 480) }}>
            <BlockRenderer type={block.type} props={block.props} editable={false} onFieldChange={noop} narrow />
          </div>
        ))}
      </div>
    </section>
  );
}
