import { useState } from 'react';
import { Link } from 'react-router-dom';
import { WidgetCanvas } from '../components/widgets/WidgetCanvas';
import { WidgetVariablesPanel } from '../components/widgets/WidgetVariablesPanel';
import { WidgetElementInspector } from '../components/widgets/WidgetElementInspector';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useSiteDraft, type SaveStatus } from '../design-system/useSiteDraft';
import { useAuth } from '../auth/AuthProvider';
import { newWidgetElementId, newWidgetId, type Widget, type WidgetElementType } from '../data/siteData';

const TOPBAR_HEIGHT = 52;
const ASPECTS = ['1 / 1', '4 / 3', '16 / 9', '3 / 4'];

function newWidget(): Widget {
  return { id: newWidgetId(), name: 'Untitled widget', aspect: '4 / 3', elements: [], variables: [] };
}

function newElement(
  type: WidgetElementType,
  existingCount: number,
): { id: string; type: WidgetElementType; x: number; y: number; w: number; h: number } {
  // Stagger each new element's default spot so it doesn't land exactly on top of
  // whatever's already there — otherwise adding a second element makes the first
  // one silently vanish underneath it.
  const step = (existingCount % 6) * 6;
  return { id: newWidgetElementId(), type, x: 10 + step, y: 10 + step, w: 40, h: 30 };
}

export function WidgetStudio() {
  const { signOut } = useAuth();
  const { data, setData, status, publishing, hasUnpublished, handlePublish } = useSiteDraft();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading your widgets…
      </div>
    );
  }

  function updateWidget(id: string, patch: Partial<Widget>) {
    if (!data) return;
    setData({ ...data, widgets: data.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)) });
  }

  function createWidget() {
    if (!data) return;
    const widget = newWidget();
    setData({ ...data, widgets: [...data.widgets, widget] });
    setEditingId(widget.id);
    setSelectedElementId(null);
  }

  function deleteWidget(id: string) {
    if (!data) return;
    setData({ ...data, widgets: data.widgets.filter((w) => w.id !== id) });
    setEditingId(null);
  }

  const editing = editingId ? data.widgets.find((w) => w.id === editingId) ?? null : null;

  return (
    <>
      <Topbar status={status} publishing={publishing} hasUnpublished={hasUnpublished} onPublish={handlePublish} onSignOut={signOut} />
      <div style={{ paddingTop: TOPBAR_HEIGHT, maxWidth: 1100, margin: '0 auto', padding: `${TOPBAR_HEIGHT + 32}px 24px 80px` }}>
        {editing ? (
          <WidgetEditor
            widget={editing}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onChange={(patch) => updateWidget(editing.id, patch)}
            onBack={() => {
              setEditingId(null);
              setSelectedElementId(null);
            }}
            onDelete={() => deleteWidget(editing.id)}
          />
        ) : (
          <WidgetLibrary widgets={data.widgets} onOpen={(id) => setEditingId(id)} onCreate={createWidget} />
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
        <strong style={{ color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>Widget Studio</strong>
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

function WidgetLibrary({ widgets, onOpen, onCreate }: { widgets: Widget[]; onOpen: (id: string) => void; onCreate: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>Widget Studio</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Build reusable widgets — text, photos, and shapes bound to variables — then drop them into any page.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onCreate}>
          + New widget
        </Button>
      </div>
      {widgets.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
            border: '1px dashed var(--border-strong)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          No widgets yet. Create one to get started.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {widgets.map((w) => (
            <button
              key={w.id}
              onClick={() => onOpen(w.id)}
              style={{
                textAlign: 'left',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-card)',
                padding: 14,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ width: '100%', aspectRatio: w.aspect, background: 'var(--surface-panel)', borderRadius: 'var(--radius-sm)', position: 'relative', overflow: 'hidden' }}>
                {w.elements.map((el) => (
                  <div
                    key={el.id}
                    style={{
                      position: 'absolute',
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.w}%`,
                      height: `${el.h}%`,
                      background: el.type === 'shape' ? el.fill || 'var(--accent-primary)' : 'var(--border-strong)',
                      borderRadius: el.type === 'shape' && el.shapeKind === 'circle' ? '50%' : 3,
                      opacity: 0.6,
                    }}
                  />
                ))}
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-heading)' }}>{w.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {w.elements.length} element{w.elements.length === 1 ? '' : 's'} · {w.variables.length} variable{w.variables.length === 1 ? '' : 's'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WidgetEditor({
  widget,
  selectedElementId,
  onSelectElement,
  onChange,
  onBack,
  onDelete,
}: {
  widget: Widget;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onChange: (patch: Partial<Widget>) => void;
  onBack: () => void;
  onDelete: () => void;
}) {
  const selectedElement = widget.elements.find((el) => el.id === selectedElementId) ?? null;

  function addElement(type: WidgetElementType) {
    const el = newElement(type, widget.elements.length);
    onChange({ elements: [...widget.elements, el] });
    onSelectElement(el.id);
  }
  function updateElement(id: string, patch: Partial<(typeof widget.elements)[number]>) {
    onChange({ elements: widget.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)) });
  }
  function removeElement(id: string) {
    onChange({ elements: widget.elements.filter((el) => el.id !== id) });
    onSelectElement(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <button
            onClick={onBack}
            style={{ border: 'none', background: 'none', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 10 }}
          >
            ← All widgets
          </button>
          <Input label="Widget name" value={widget.name} onChange={(e) => onChange({ name: e.target.value })} />
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (window.confirm(`Delete "${widget.name}"? Any page using it will show a blank widget slot.`)) onDelete();
          }}
        >
          Delete widget
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Shape</span>
        {ASPECTS.map((a) => (
          <button
            key={a}
            onClick={() => onChange({ aspect: a })}
            style={{
              border: 'none',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              background: widget.aspect === a ? 'var(--accent-primary)' : 'var(--surface-card)',
              color: widget.aspect === a ? '#fff' : 'var(--text-body)',
            }}
          >
            {a}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '2 1 400px', minWidth: 280 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <Button variant="ghost" size="sm" onClick={() => addElement('text')}>
              + Text
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addElement('image')}>
              + Photo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addElement('shape')}>
              + Shape
            </Button>
          </div>
          <WidgetCanvas widget={widget} selectedId={selectedElementId} onSelect={onSelectElement} onChange={(id, patch) => updateElement(id, patch)} />
        </div>

        <div style={{ flex: '1 1 260px', minWidth: 240, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {selectedElement && (
            <WidgetElementInspector
              element={selectedElement}
              variables={widget.variables}
              onChange={(patch) => updateElement(selectedElement.id, patch)}
              onRemove={() => removeElement(selectedElement.id)}
            />
          )}
          <WidgetVariablesPanel variables={widget.variables} onChange={(variables) => onChange({ variables })} />
        </div>
      </div>
    </div>
  );
}
