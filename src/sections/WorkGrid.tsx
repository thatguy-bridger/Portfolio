import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BentoGrid, type BentoTile } from '../components/BentoGrid';
import { Button } from '../components/ui/Button';
import { Editable } from '../components/Editable';
import { TileElements } from '../components/TileElements';
import { EditCardModal } from '../components/EditCardModal';
import { useReveal } from '../design-system/useReveal';
import { newTileId, type ProjectPage, type SiteTile } from '../data/siteData';

const ACCENT_CYCLE: SiteTile['accent'][] = ['indigo', 'purple', 'orange', 'pink'];

function ProjectTile({
  tile,
  editable,
  onChange,
  onRemove,
  onEdit,
}: {
  tile: SiteTile;
  editable: boolean;
  onChange: (next: Partial<SiteTile>) => void;
  onRemove: () => void;
  onEdit: () => void;
}) {
  const body = (
    <div style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', overflow: 'auto' }}>
      {editable && (
        <>
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
          <button
            onClick={onEdit}
            title="Edit card"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--accent-primary)',
              color: '#fff',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            ✎
          </button>
        </>
      )}
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `var(--${tile.accent}-500)`, marginBottom: 12, opacity: 0.9, flexShrink: 0 }} />
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
      {tile.elements.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <TileElements elements={tile.elements} editable={false} />
        </div>
      )}
    </div>
  );

  if (!editable && tile.link.type === 'internal' && tile.link.slug) {
    return (
      <Link to={`/mywork/${tile.link.slug}`} style={{ display: 'block', height: '100%', color: 'inherit', textDecoration: 'none' }}>
        {body}
      </Link>
    );
  }
  if (!editable && tile.link.type === 'external' && tile.link.url) {
    return (
      <a href={tile.link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', height: '100%', color: 'inherit', textDecoration: 'none' }}>
        {body}
      </a>
    );
  }
  return body;
}

export function WorkGrid({
  tiles,
  projectPages,
  editable = false,
  onChange,
  onProjectPagesChange,
}: {
  tiles: SiteTile[];
  projectPages?: ProjectPage[];
  editable?: boolean;
  onChange?: (tiles: SiteTile[]) => void;
  onProjectPagesChange?: (pages: ProjectPage[]) => void;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const [editingTileId, setEditingTileId] = useState<string | null>(null);
  const [arranging, setArranging] = useState(false);

  function updateTile(id: string, patch: Partial<SiteTile>) {
    onChange?.(tiles.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function removeTile(id: string) {
    onChange?.(tiles.filter((t) => t.id !== id));
    if (editingTileId === id) setEditingTileId(null);
  }

  function addTile() {
    const accent = ACCENT_CYCLE[tiles.length % ACCENT_CYCLE.length];
    const next: SiteTile = {
      id: newTileId(),
      title: 'New project',
      description: 'Describe it here.',
      accent,
      colSpan: 2,
      rowSpan: 1,
      elements: [],
      link: { type: 'none' },
    };
    onChange?.([...tiles, next]);
  }

  const bentoTiles: BentoTile[] = tiles.map((t) => ({
    id: t.id,
    colSpan: t.colSpan,
    rowSpan: t.rowSpan,
    content: (
      <ProjectTile
        tile={t}
        editable={editable}
        onChange={(patch) => updateTile(t.id, patch)}
        onRemove={() => removeTile(t.id)}
        onEdit={() => setEditingTileId(t.id)}
      />
    ),
  }));

  const editingTile = editable ? tiles.find((t) => t.id === editingTileId) : undefined;

  return (
    <section id="work" style={{ padding: '120px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(16px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-heading)' }}>Selected work</h2>
          {editable && (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={addTile}>
                + Add project
              </Button>
              <Button variant={arranging ? 'primary' : 'ghost'} size="sm" onClick={() => setArranging((a) => !a)}>
                {arranging ? 'Done arranging' : 'Arrange tiles'}
              </Button>
            </div>
          )}
        </div>
        <BentoGrid
          tiles={bentoTiles}
          editable={editable && arranging}
          onChange={(id, colSpan, rowSpan) => updateTile(id, { colSpan, rowSpan })}
        />
      </div>
      {editingTile && (
        <EditCardModal
          open
          onClose={() => setEditingTileId(null)}
          tile={editingTile}
          onChangeTile={(patch) => updateTile(editingTile.id, patch)}
          projectPages={projectPages ?? []}
          onChangeProjectPages={(pages) => onProjectPagesChange?.(pages)}
        />
      )}
    </section>
  );
}
