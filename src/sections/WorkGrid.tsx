import { useState } from 'react';
import { BentoGrid, type BentoTile } from '../components/BentoGrid';
import { Button } from '../components/ui/Button';
import { SAMPLE_PROJECTS } from '../data/sampleProjects';
import { useReveal } from '../design-system/useReveal';

function ProjectTile({ title, description, accent }: { title: string; description: string; accent: string }) {
  return (
    <div style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `var(--${accent}-500)`, marginBottom: 12, opacity: 0.9 }} />
      <h4 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</h4>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{description}</p>
    </div>
  );
}

export function WorkGrid() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const [editable, setEditable] = useState(false);
  const [spans, setSpans] = useState(() =>
    Object.fromEntries(SAMPLE_PROJECTS.map((p) => [p.id, { colSpan: p.colSpan, rowSpan: p.rowSpan }])),
  );

  const tiles: BentoTile[] = SAMPLE_PROJECTS.map((p) => ({
    id: p.id,
    colSpan: spans[p.id].colSpan,
    rowSpan: spans[p.id].rowSpan,
    content: <ProjectTile title={p.title} description={p.description} accent={p.accent} />,
  }));

  return (
    <section id="work" style={{ padding: '120px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(16px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-heading)' }}>Selected work</h2>
          <Button variant="ghost" size="sm" onClick={() => setEditable((e) => !e)}>
            {editable ? 'Done arranging' : 'Arrange tiles'}
          </Button>
        </div>
        <BentoGrid
          tiles={tiles}
          editable={editable}
          onChange={(id, colSpan, rowSpan) => setSpans((s) => ({ ...s, [id]: { colSpan, rowSpan } }))}
        />
      </div>
    </section>
  );
}
