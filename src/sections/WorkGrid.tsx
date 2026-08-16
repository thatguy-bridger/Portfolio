import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BentoGrid, type BentoTile } from '../components/BentoGrid';
import { Button } from '../components/ui/Button';
import { Editable } from '../components/Editable';
import { TileElements } from '../components/TileElements';
import { EditCardModal } from '../components/EditCardModal';
import { useReveal } from '../design-system/useReveal';
import { newTileId, type CustomPage, type SiteTile } from '../data/siteData';

const ACCENT_CYCLE: SiteTile['accent'][] = ['indigo', 'purple', 'orange', 'pink'];

function ProjectTile({
  tile,
  editable,
  index,
  count,
  onChange,
  onRemove,
  onEdit,
  onMove,
}: {
  tile: SiteTile;
  editable: boolean;
  index: number;
  count: number;
  onChange: (next: Partial<SiteTile>) => void;
  onRemove: () => void;
  onEdit: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  // Very short (1-row) tiles can't fit an icon + title + full description
  // without either overflowing or sitting under the edit/remove buttons —
  // trim to what actually fits instead of letting content collide with them.
  const compact = tile.rowSpan <= 1;

  const body = (
    <div
      style={{
        padding: editable ? '34px 20px' : '20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        position: 'relative',
        overflow: 'auto',
      }}
    >
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
          <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <button
              onClick={(e) => { e.stopPropagation(); onMove(-1); }}
              disabled={index === 0}
              title="Move earlier"
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: 'none',
                background: 'var(--surface-card)',
                color: 'var(--text-body)',
                fontSize: 9,
                lineHeight: 1,
                cursor: index === 0 ? 'default' : 'pointer',
                opacity: index === 0 ? 0.4 : 1,
              }}
            >
              ↑
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMove(1); }}
              disabled={index === count - 1}
              title="Move later"
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: 'none',
                background: 'var(--surface-card)',
                color: 'var(--text-body)',
                fontSize: 9,
                lineHeight: 1,
                cursor: index === count - 1 ? 'default' : 'pointer',
                opacity: index === count - 1 ? 0.4 : 1,
              }}
            >
              ↓
            </button>
          </div>
        </>
      )}
      {!compact && (
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `var(--${tile.accent}-500)`, marginBottom: 10, opacity: 0.9, flexShrink: 0 }} />
      )}
      <Editable
        editable={editable}
        as="h3"
        value={tile.title}
        onCommit={(v) => onChange({ title: v })}
        style={{
          margin: '0 0 4px',
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--text-heading)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      />
      <Editable
        editable={editable}
        as="p"
        value={tile.description}
        onCommit={(v) => onChange({ description: v })}
        style={{
          margin: 0,
          fontSize: 13,
          color: 'var(--text-muted)',
          display: '-webkit-box',
          WebkitLineClamp: compact ? 1 : 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      />
      {!compact && tile.elements.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <TileElements elements={tile.elements} editable={false} />
        </div>
      )}
    </div>
  );

  if (!editable && tile.link.type === 'internal' && tile.link.path) {
    return (
      <Link to={`/${tile.link.path}`} style={{ display: 'block', height: '100%', color: 'inherit', textDecoration: 'none' }}>
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
  pages,
  editable = false,
  onChange,
}: {
  tiles: SiteTile[];
  pages?: CustomPage[];
  editable?: boolean;
  onChange?: (tiles: SiteTile[]) => void;
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

  function moveTile(id: string, dir: -1 | 1) {
    const idx = tiles.findIndex((t) => t.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= tiles.length) return;
    const next = [...tiles];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange?.(next);
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

  const bentoTiles: BentoTile[] = tiles.map((t, i) => ({
    id: t.id,
    colSpan: t.colSpan,
    rowSpan: t.rowSpan,
    x: t.x,
    y: t.y,
    content: (
      <ProjectTile
        tile={t}
        editable={editable}
        index={i}
        count={tiles.length}
        onChange={(patch) => updateTile(t.id, patch)}
        onRemove={() => removeTile(t.id)}
        onEdit={() => setEditingTileId(t.id)}
        onMove={(dir) => moveTile(t.id, dir)}
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
        <BentoGrid tiles={bentoTiles} editable={editable && arranging} onChange={(id, patch) => updateTile(id, patch)} />
      </div>
      {editingTile && (
        <EditCardModal
          open
          onClose={() => setEditingTileId(null)}
          tile={editingTile}
          onChangeTile={(patch) => updateTile(editingTile.id, patch)}
          pages={pages ?? []}
        />
      )}
    </section>
  );
}
