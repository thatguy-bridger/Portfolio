import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GroupCanvas } from '../components/GroupCanvas';
import { ImageInput } from '../components/ImageInput';
import { Button } from '../components/ui/Button';
import { GROUP_TEMPLATES } from '../data/groupTemplates';
import { newGroupId, type CustomPage, type HomepageGroup, type SiteTile, type Widget } from '../data/siteData';
import { useSiteDraft, type SaveStatus } from '../design-system/useSiteDraft';
import { useAuth } from '../auth/AuthProvider';

const TOPBAR_HEIGHT = 52;

export function HomepageStudio() {
  const { signOut } = useAuth();
  const { data, setData, status, publishing, hasUnpublished, handlePublish } = useSiteDraft();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading your homepage…
      </div>
    );
  }

  function updateGroup(id: string, patch: Partial<HomepageGroup>) {
    if (!data) return;
    setData({ ...data, homepageGroups: data.homepageGroups.map((g) => (g.id === id ? { ...g, ...patch } : g)) });
  }

  function addGroup(base: Omit<HomepageGroup, 'id'>) {
    if (!data) return;
    const group: HomepageGroup = { id: newGroupId(), ...base };
    setData({ ...data, homepageGroups: [...data.homepageGroups, group] });
    setEditingId(group.id);
  }

  function deleteGroup(id: string) {
    if (!data) return;
    setData({ ...data, homepageGroups: data.homepageGroups.filter((g) => g.id !== id) });
    setEditingId(null);
  }

  function moveGroup(id: string, dir: -1 | 1) {
    if (!data) return;
    const idx = data.homepageGroups.findIndex((g) => g.id === id);
    const target = idx + dir;
    if (target < 0 || target >= data.homepageGroups.length) return;
    const next = [...data.homepageGroups];
    [next[idx], next[target]] = [next[target], next[idx]];
    setData({ ...data, homepageGroups: next });
  }

  function toggleFreeform(on: boolean) {
    if (!data) return;
    setData({ ...data, useFreeformHomepage: on });
  }

  const editing = editingId ? data.homepageGroups.find((g) => g.id === editingId) ?? null : null;

  return (
    <>
      <Topbar status={status} publishing={publishing} hasUnpublished={hasUnpublished} onPublish={handlePublish} onSignOut={signOut} />
      <div style={{ paddingTop: TOPBAR_HEIGHT, maxWidth: 1260, margin: '0 auto', padding: `${TOPBAR_HEIGHT + 32}px 24px 80px` }}>
        {editing ? (
          <GroupEditor
            group={editing}
            widgets={data.widgets}
            pages={data.pages}
            tiles={data.tiles}
            onTilesChange={(tiles) => setData({ ...data, tiles })}
            onChange={(patch) => updateGroup(editing.id, patch)}
            onBack={() => setEditingId(null)}
            onDelete={() => deleteGroup(editing.id)}
          />
        ) : (
          <GroupsLibrary
            groups={data.homepageGroups}
            useFreeform={data.useFreeformHomepage}
            onToggleFreeform={toggleFreeform}
            onOpen={setEditingId}
            onAdd={addGroup}
            onMove={moveGroup}
          />
        )}
      </div>
    </>
  );
}

function Topbar({
  status,
  publishing,
  hasUnpublished,
  onPublish,
  onSignOut,
}: {
  status: SaveStatus;
  publishing: boolean;
  hasUnpublished: boolean;
  onPublish: () => void;
  onSignOut: () => void;
}) {
  const label = { loading: 'Loading…', idle: 'Up to date', saving: 'Saving…', saved: 'Saved', error: 'Save failed' }[status];
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 110,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        padding: '10px 20px',
        background: 'var(--surface-glass)',
        backdropFilter: 'var(--blur-glass)',
        WebkitBackdropFilter: 'var(--blur-glass)',
        borderBottom: '1px solid var(--border-default)',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        overflowX: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Link to="/edit" style={{ color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          ← Builder
        </Link>
        <strong style={{ color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>Homepage Studio</strong>
        <span style={{ color: status === 'error' ? 'var(--red-500)' : 'var(--text-muted)' }}>{label}</span>
        {hasUnpublished && !publishing && <span style={{ color: 'var(--orange-500)', fontWeight: 600, whiteSpace: 'nowrap' }}>Unpublished changes</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <Button variant="primary" size="sm" onClick={onPublish} disabled={publishing || !hasUnpublished}>
          {publishing ? 'Publishing…' : 'Publish'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onSignOut()}>
          Sign out
        </Button>
      </div>
    </div>
  );
}

export function GroupsLibrary({
  groups,
  useFreeform,
  onToggleFreeform,
  onOpen,
  onAdd,
  onMove,
}: {
  groups: HomepageGroup[];
  useFreeform: boolean;
  onToggleFreeform: (on: boolean) => void;
  onOpen: (id: string) => void;
  onAdd: (base: Omit<HomepageGroup, 'id'>) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>Homepage Studio</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0', maxWidth: 640 }}>
          Build your homepage as freeform sections — add, remove, and reorder them, and position blocks anywhere inside each one.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          background: useFreeform ? 'var(--green-600)' : 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: useFreeform ? '#fff' : 'var(--text-heading)' }}>
            {useFreeform ? 'Your live homepage is using these sections' : 'Your live homepage still uses the classic layout'}
          </div>
          <div style={{ fontSize: 12, color: useFreeform ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)', marginTop: 2, maxWidth: 480 }}>
            {useFreeform
              ? 'Switch back any time — nothing here is deleted when you do.'
              : "Build your sections here first. Nothing on your live site changes until you switch this on — it's never automatic."}
          </div>
        </div>
        <Button variant={useFreeform ? 'secondary' : 'primary'} size="sm" onClick={() => onToggleFreeform(!useFreeform)}>
          {useFreeform ? 'Switch back to classic homepage' : 'Switch to freeform homepage'}
        </Button>
      </div>

      {groups.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
            border: '1px dashed var(--border-strong)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 24,
          }}
        >
          No sections yet. Add one below to get started.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {groups.map((g, i) => (
            <div
              key={g.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                background: 'var(--surface-card)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button onClick={() => onMove(g.id, -1)} disabled={i === 0} style={arrowBtn}>
                  ↑
                </button>
                <button onClick={() => onMove(g.id, 1)} disabled={i === groups.length - 1} style={arrowBtn}>
                  ↓
                </button>
              </div>
              <div
                style={{
                  width: 44,
                  height: 30,
                  borderRadius: 6,
                  background: g.background ?? 'var(--surface-panel)',
                  border: '1px solid var(--border-default)',
                  flexShrink: 0,
                }}
              />
              <button onClick={() => onOpen(g.id)} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-heading)' }}>{g.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {g.blocks.length} block{g.blocks.length === 1 ? '' : 's'}
                </div>
              </button>
              <Button variant="ghost" size="sm" onClick={() => onOpen(g.id)}>
                Edit
              </Button>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 10 }}>
        Add a section
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button onClick={() => onAdd({ name: 'Untitled section', blocks: [] })} style={templateBtn}>
          + Blank
        </button>
        {GROUP_TEMPLATES.map((t) => (
          <button key={t.key} onClick={() => onAdd(t.build())} style={templateBtn}>
            + {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const arrowBtn: React.CSSProperties = {
  width: 20,
  height: 16,
  border: 'none',
  borderRadius: 4,
  background: 'var(--surface-panel)',
  color: 'var(--text-muted)',
  fontSize: 10,
  cursor: 'pointer',
};

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

export function GroupEditor({
  group,
  widgets,
  pages,
  tiles,
  onTilesChange,
  onChange,
  onBack,
  onDelete,
}: {
  group: HomepageGroup;
  widgets: Widget[];
  pages: CustomPage[];
  tiles: SiteTile[];
  onTilesChange: (tiles: SiteTile[]) => void;
  onChange: (patch: Partial<HomepageGroup>) => void;
  onBack: () => void;
  onDelete: () => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← All sections
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm(`Delete "${group.name}"? This can't be undone.`)) onDelete();
          }}
        >
          Delete section
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <input
          value={group.name}
          onChange={(e) => onChange({ name: e.target.value })}
          style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', border: 'none', background: 'none', padding: '2px 0', minWidth: 200 }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          Background
          <input type="color" value={group.background ?? '#ffffff'} onChange={(e) => onChange({ background: e.target.value })} style={{ width: 30, height: 26, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
        </label>
        <ImageInput
          label={group.backgroundImage ? 'Replace background image' : '+ Background image'}
          onSelect={(backgroundImage) => onChange({ backgroundImage })}
        />
        {group.backgroundImage && (
          <button
            onClick={() => onChange({ backgroundImage: undefined })}
            style={{ border: 'none', background: 'none', color: 'var(--red-500)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Remove image
          </button>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          Min height
          <input
            type="number"
            min={0}
            step={20}
            value={group.minHeight ?? 400}
            onChange={(e) => onChange({ minHeight: Math.max(0, Number(e.target.value) || 0) })}
            style={{ width: 70, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-heading)', fontSize: 13 }}
          />
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
        </label>
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
      />
    </div>
  );
}
