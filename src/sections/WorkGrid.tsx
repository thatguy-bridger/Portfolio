import { BentoGrid, type BentoTile } from '../components/BentoGrid';
import { Button } from '../components/ui/Button';
import { Editable } from '../components/Editable';
import { useReveal } from '../design-system/useReveal';
import { newTileId, type SiteTile } from '../data/siteData';

const ACCENT_CYCLE: SiteTile['accent'][] = ['indigo', 'purple', 'orange', 'pink'];

function ProjectTile({
  tile,
  editable,
  onChange,
  onRemove,
}: {
  tile: SiteTile;
  editable: boolean;
  onChange: (next: Partial<SiteTile>) => void;
  onRemove: () => void;
}) {
  return (
    <div style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}>
      {editable && (
        <button
          onClick={onRemove}
          title="Remove project"
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: 'none',
            background: 'var(--red-600)',
            color: '#fff',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      )}
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `var(--${tile.accent}-500)`, marginBottom: 12, opacity: 0.9 }} />
      <Editable
        editable={editable}
        as="h3"
        value={tile.title}
        onCommit={(v) => onChange({ title: v })}
        style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: 'var(--text-heading)' }}
      />
      <Editable
        editable={editable}
        as="p"
        value={tile.description}
        onCommit={(v) => onChange({ description: v })}
        style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}
      />
    </div>
  );
}

export function WorkGrid({
  tiles,
  editable = false,
  onChange,
}: {
  tiles: SiteTile[];
  editable?: boolean;
  onChange?: (tiles: SiteTile[]) => void;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();

  function updateTile(id: string, patch: Partial<SiteTile>) {
    onChange?.(tiles.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function removeTile(id: string) {
    onChange?.(tiles.filter((t) => t.id !== id));
  }

  function addTile() {
    const accent = ACCENT_CYCLE[tiles.length % ACCENT_CYCLE.length];
    const next: SiteTile = { id: newTileId(), title: 'New project', description: 'Describe it here.', accent, colSpan: 2, rowSpan: 1 };
    onChange?.([...tiles, next]);
  }

  const bentoTiles: BentoTile[] = tiles.map((t) => ({
    id: t.id,
    colSpan: t.colSpan,
    rowSpan: t.rowSpan,
    content: <ProjectTile tile={t} editable={editable} onChange={(patch) => updateTile(t.id, patch)} onRemove={() => removeTile(t.id)} />,
  }));

  return (
    <section id="work" style={{ padding: '120px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(16px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-heading)' }}>Selected work</h2>
          {editable && (
            <Button variant="ghost" size="sm" onClick={addTile}>
              + Add project
            </Button>
          )}
        </div>
        <BentoGrid
          tiles={bentoTiles}
          editable={editable}
          onChange={(id, colSpan, rowSpan) => updateTile(id, { colSpan, rowSpan })}
        />
      </div>
    </section>
  );
}
