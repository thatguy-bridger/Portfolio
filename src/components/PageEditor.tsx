import { useState } from 'react';
import { createPortal } from 'react-dom';
import { GroupCanvas, type CanvasDevice } from './GroupCanvas';
import { GroupRenderer } from './GroupRenderer';
import { ImageInput } from './ImageInput';
import { ColorPicker } from './ColorPicker';
import { ToolbarDropdown } from './Popover';
import { Button } from './ui/Button';
import { GROUP_TEMPLATES } from '../data/groupTemplates';
import { newGroupId, type CustomPage, type HomepageGroup, type SiteTile, type Widget } from '../data/siteData';

/**
 * The one editing surface for any page's content — the homepage and every
 * custom page render through this same component, so there's exactly one
 * set of abilities and one interaction model no matter what's selected in
 * the sidebar. Every group renders WYSIWYG (via GroupCanvas, styled
 * identically to the public GroupRenderer) stacked in publish order, with
 * per-section settings tucked behind a small gear icon instead of a
 * permanent panel, and a page-wide Desktop/Mobile toggle instead of one
 * per section.
 */
export function PageEditor({
  groups,
  onChange,
  widgets,
  pages,
  tiles,
  onTilesChange,
}: {
  groups: HomepageGroup[];
  onChange: (groups: HomepageGroup[]) => void;
  widgets: Widget[];
  pages: CustomPage[];
  tiles: SiteTile[];
  onTilesChange: (tiles: SiteTile[]) => void;
}) {
  const [device, setDevice] = useState<CanvasDevice>('desktop');
  const [previewingMobile, setPreviewingMobile] = useState(false);

  function updateGroup(id: string, patch: Partial<HomepageGroup>) {
    onChange(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }
  function deleteGroup(id: string) {
    if (!confirm('Delete this section? This can\'t be undone.')) return;
    onChange(groups.filter((g) => g.id !== id));
  }
  function moveGroup(id: string, dir: -1 | 1) {
    const idx = groups.findIndex((g) => g.id === id);
    const target = idx + dir;
    if (target < 0 || target >= groups.length) return;
    const next = [...groups];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }
  function addGroup(base: Omit<HomepageGroup, 'id'>) {
    onChange([...groups, { id: newGroupId(), ...base }]);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', background: 'var(--surface-panel)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)', padding: 3, gap: 2 }}>
          {(['desktop', 'mobile'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              style={{
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: device === d ? 'var(--accent-primary)' : 'transparent',
                color: device === d ? '#fff' : 'var(--text-body)',
              }}
            >
              {d === 'desktop' ? '🖥️ Desktop' : '📱 Mobile'}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setPreviewingMobile(true)}>
          📱 Preview mobile
        </Button>
      </div>

      {previewingMobile && <MobilePreviewModal groups={groups} widgets={widgets} pages={pages} tiles={tiles} onClose={() => setPreviewingMobile(false)} />}

      {groups.length === 0 && (
        <div style={{ margin: '20px 16px', padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)' }}>
          No sections yet. Add one below to get started.
        </div>
      )}

      {groups.map((group) => (
        <SectionEditor
          key={group.id}
          group={group}
          device={device}
          widgets={widgets}
          pages={pages}
          tiles={tiles}
          onTilesChange={onTilesChange}
          onChange={(patch) => updateGroup(group.id, patch)}
          onDelete={() => deleteGroup(group.id)}
          onMove={(dir) => moveGroup(group.id, dir)}
          canMoveUp={groups[0]?.id !== group.id}
          canMoveDown={groups[groups.length - 1]?.id !== group.id}
        />
      ))}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '20px 16px 60px' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Add a section
        </span>
        <button onClick={() => addGroup({ name: 'Untitled section', blocks: [] })} style={templateBtn}>
          + Blank
        </button>
        {GROUP_TEMPLATES.map((t) => (
          <button key={t.key} onClick={() => addGroup(t.build())} style={templateBtn}>
            + {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionEditor({
  group,
  device,
  widgets,
  pages,
  tiles,
  onTilesChange,
  onChange,
  onDelete,
  onMove,
  canMoveUp,
  canMoveDown,
}: {
  group: HomepageGroup;
  device: CanvasDevice;
  widgets: Widget[];
  pages: CustomPage[];
  tiles: SiteTile[];
  onTilesChange: (tiles: SiteTile[]) => void;
  onChange: (patch: Partial<HomepageGroup>) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const staleCount = group.blocks.filter((b) => b.mobileStale).length;

  return (
    <div style={{ position: 'relative' }}>
      {staleCount > 0 && device === 'mobile' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '8px 16px',
            background: 'rgba(217,119,6,0.12)',
            borderBottom: '1px solid rgba(217,119,6,0.4)',
            fontSize: 12.5,
            color: 'var(--text-heading)',
            flexWrap: 'wrap',
          }}
        >
          <span>
            ⚠ {staleCount} block{staleCount === 1 ? '' : 's'} moved on desktop since {staleCount === 1 ? 'its' : 'their'} mobile layout was last touched.
          </span>
          <Button variant="ghost" size="sm" onClick={() => onChange({ blocks: group.blocks.map((b) => (b.mobileStale ? { ...b, mobileStale: false } : b)) })}>
            Dismiss
          </Button>
        </div>
      )}

      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 60 }}>
        <ToolbarDropdown title="Section settings" width={230} chromeless trigger={<SectionGearTrigger name={group.name} />}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Section name</div>
          <input
            value={group.name}
            onChange={(e) => onChange({ name: e.target.value })}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-heading)', fontSize: 13 }}
          />

          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 4 }}>Background</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ColorPicker value={group.background} onChange={(c) => onChange({ background: c })} onClear={() => onChange({ background: undefined })} />
            <ImageInput label={group.backgroundImage ? 'Replace image' : '+ Image'} onSelect={(backgroundImage) => onChange({ backgroundImage })} />
          </div>
          {group.backgroundImage && (
            <button onClick={() => onChange({ backgroundImage: undefined })} style={{ border: 'none', background: 'none', color: 'var(--red-500)', fontSize: 11, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
              Remove background image
            </button>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Min height
            <input
              type="number"
              min={0}
              step={20}
              value={group.minHeight ?? 400}
              onChange={(e) => onChange({ minHeight: Math.max(0, Number(e.target.value) || 0) })}
              style={{ width: 70, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-heading)', fontSize: 13 }}
            />
            px
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            Padding
            <input
              type="number"
              min={0}
              step={10}
              value={group.paddingY ?? 0}
              onChange={(e) => onChange({ paddingY: Math.max(0, Number(e.target.value) || 0) })}
              style={{ width: 60, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-heading)', fontSize: 13 }}
            />
            px
          </label>
          <label
            title="Scrolling snaps to the top of this section instead of stopping wherever the scroll gesture ends"
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-body)' }}
          >
            <input type="checkbox" checked={!!group.scrollSnap} onChange={(e) => onChange({ scrollSnap: e.target.checked })} />
            Scroll-snap this section
          </label>

          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <Button variant="ghost" size="sm" onClick={() => onMove(-1)} disabled={!canMoveUp}>
              ↑ Move up
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onMove(1)} disabled={!canMoveDown}>
              ↓ Move down
            </Button>
          </div>
          <Button variant="danger" size="sm" onClick={onDelete}>
            Delete section
          </Button>
        </ToolbarDropdown>
      </div>

      <GroupCanvas
        blocks={group.blocks}
        editable
        onChange={(blocks) => onChange({ blocks })}
        widgets={widgets}
        pages={pages}
        tiles={tiles}
        onTilesChange={onTilesChange}
        background={group.background}
        backgroundImage={group.backgroundImage}
        paddingY={group.paddingY ?? 0}
        minHeight={group.minHeight ?? 400}
        device={device}
      />
    </div>
  );
}

function SectionGearTrigger({ name }: { name: string }) {
  return (
    <span
      title={`Section: ${name}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'var(--surface-glass)',
        backdropFilter: 'var(--blur-glass)',
        WebkitBackdropFilter: 'var(--blur-glass)',
        border: '1px solid var(--border-default)',
        color: 'var(--text-body)',
        fontSize: 14,
        cursor: 'pointer',
      }}
    >
      ⚙
    </span>
  );
}

/** A phone-width frame showing the live public rendering of these groups, so a mobile layout can be checked without leaving the editor or resizing the real browser window. */
function MobilePreviewModal({
  groups,
  widgets,
  pages,
  tiles,
  onClose,
}: {
  groups: HomepageGroup[];
  widgets: Widget[];
  pages: CustomPage[];
  tiles: SiteTile[];
  onClose: () => void;
}) {
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Mobile preview</span>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 390,
          maxWidth: '100%',
          height: 'min(820px, 85vh)',
          borderRadius: 28,
          border: '8px solid #111',
          background: 'var(--bg-app)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
          {groups.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No sections yet.</div>
          ) : (
            <GroupRenderer groups={groups} widgets={widgets} pages={pages} tiles={tiles} forceNarrow />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

const templateBtn: React.CSSProperties = {
  border: '1px dashed var(--border-strong)',
  background: 'none',
  borderRadius: 'var(--radius-pill)',
  padding: '6px 14px',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-muted)',
  cursor: 'pointer',
};
