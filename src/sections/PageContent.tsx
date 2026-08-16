import { PageBlocks } from '../components/PageBlocks';
import { useReveal } from '../design-system/useReveal';
import type { PageBlock } from '../data/siteData';

export function PageContent({
  blocks,
  editable = false,
  onChange,
}: {
  blocks: PageBlock[];
  editable?: boolean;
  onChange?: (blocks: PageBlock[]) => void;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();

  if (!editable && blocks.length === 0) return null;

  return (
    <section id="content" style={{ padding: '80px 24px', maxWidth: 760, margin: '0 auto' }}>
      <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(16px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
        <PageBlocks blocks={blocks} editable={editable} onChange={onChange} />
      </div>
    </section>
  );
}
