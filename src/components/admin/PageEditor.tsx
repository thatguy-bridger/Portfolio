// The real page editor (Phase 4) — same shape as the Phase 2 demo harness
// (src/components/dev/CanvasDemo.tsx: section tabs + CanvasEditor + a
// Preview-as-visitor toggle) but wired to an actual `pages` row instead of
// local/localStorage state, per that file's `// TODO(phase-4-or-later)`
// marker. Two real backend actions live here: autosave (debounced PATCH of
// draft_blocks, via useAutosave) and Publish (an explicit, deliberate
// action — never automatic — that copies draft_blocks to published_blocks
// server-side, see /api/admin/pages/[id]/publish.ts).
import { useState } from 'react';
import { createSection } from '../../lib/blocks/registry';
import type { PageSection } from '../../lib/blocks/types';
import type { AutosaveStatus } from '../../lib/useAutosave';
import { useAutosave } from '../../lib/useAutosave';
import { CanvasEditor } from '../canvas/CanvasEditor';
import { PublicPage } from '../render/PublicPage';

export interface AdminPageRow {
  id: string;
  path: string;
  title: string;
  status: 'draft' | 'published';
  draft_blocks: PageSection[];
  published_blocks: PageSection[] | null;
  published_at: string | null;
}

async function patchPage(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/pages/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error ?? 'Save failed.');
  }
}

export function PageEditor({ page }: { page: AdminPageRow }) {
  const [sections, setSections] = useState<PageSection[]>(page.draft_blocks ?? []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [status, setStatus] = useState<'draft' | 'published'>(page.status);
  const [publishedAt, setPublishedAt] = useState<string | null>(page.published_at);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const { status: saveStatus, flush } = useAutosave(sections, (value) => patchPage(page.id, { draft_blocks: value }));

  const active = sections[activeIndex] ?? sections[0];

  function updateActiveBlocks(blocks: PageSection['blocks']) {
    setSections((prev) => prev.map((s, i) => (i === activeIndex ? { ...s, blocks } : s)));
  }
  function updateActiveMeta(patch: Partial<PageSection>) {
    setSections((prev) => prev.map((s, i) => (i === activeIndex ? { ...s, ...patch } : s)));
  }
  function addSection() {
    const s = createSection(`Section ${sections.length + 1}`);
    setSections((prev) => [...prev, s]);
    setActiveIndex(sections.length);
  }
  function removeSection(i: number) {
    setSections((prev) => prev.filter((_, idx) => idx !== i));
    setActiveIndex((idx) => Math.max(0, idx === i ? idx - 1 : idx > i ? idx - 1 : idx));
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    try {
      // Ship whatever's on screen, not whatever the debounce timer last
      // fired for — a publish immediately after a fast edit shouldn't be
      // allowed to race the autosave and publish stale content.
      await flush();
      const res = await fetch(`/api/admin/pages/${page.id}/publish`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Publish failed.');
      setStatus('published');
      setPublishedAt(body.page.published_at);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Publish failed.');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <a href="/admin/pages" style={{ fontSize: 12, color: 'var(--text-muted)' }}>&larr; All pages</a>
          <h1 style={{ margin: '4px 0 0', fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-heading)' }}>{page.title}</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            {page.path} · <span className="badge">{status}</span>
            {publishedAt ? ` · last published ${new Date(publishedAt).toLocaleString()}` : ' · never published'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SaveStatusLabel status={saveStatus} />
          <ModeButton active={mode === 'edit'} onClick={() => setMode('edit')}>Edit</ModeButton>
          <ModeButton active={mode === 'preview'} onClick={() => setMode('preview')}>Preview as visitor</ModeButton>
          <button type="button" onClick={handlePublish} disabled={publishing} style={publishBtn}>
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </header>
      {publishError && <p role="alert" style={{ margin: 0, fontSize: 12, color: '#ef4444' }}>{publishError}</p>}

      {mode === 'edit' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--border-default)', paddingBottom: 8 }}>
          {sections.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button type="button" onClick={() => setActiveIndex(i)} style={tabBtn(i === activeIndex)}>{s.name}</button>
              <button type="button" onClick={() => removeSection(i)} title="Remove section" style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, marginLeft: 2 }}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={addSection} style={ghostBtn}>+ Section</button>
        </div>
      )}

      {mode === 'edit' && active && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            value={active.name}
            onChange={(e) => updateActiveMeta({ name: e.target.value })}
            style={{ fontSize: 13, fontWeight: 600, padding: '6px 10px', width: 240, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-heading)' }}
          />
          <CanvasEditor
            blocks={active.blocks}
            onChange={updateActiveBlocks}
            background={active.background}
            backgroundImage={active.backgroundImage}
            paddingY={active.paddingY}
            minHeight={active.minHeight}
          />
        </div>
      )}

      {mode === 'edit' && !active && (
        <div style={{ padding: 40, textAlign: 'center', border: '1.5px dashed var(--border-default)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>This page has no sections yet.</p>
          <button type="button" onClick={addSection} style={publishBtn}>+ Add a section</button>
        </div>
      )}

      {mode === 'preview' && (
        <>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
            Previewing unpublished draft content — this is what visitors will see once you hit Publish, not necessarily what's live now.
          </p>
          <div style={{ position: 'relative', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <PublicPage sections={sections} />
          </div>
        </>
      )}
    </div>
  );
}

function SaveStatusLabel({ status }: { status: AutosaveStatus }) {
  const label = { idle: '', saving: 'Saving…', saved: 'Saved', error: 'Save failed' }[status];
  if (!label) return null;
  return <span style={{ fontSize: 12, color: status === 'error' ? '#ef4444' : 'var(--text-muted)' }}>{label}</span>;
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={tabBtn(active)}>
      {children}
    </button>
  );
}

function tabBtn(active: boolean): React.CSSProperties {
  return {
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    padding: '7px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    background: active ? 'var(--accent-primary)' : 'var(--surface-card)',
    color: active ? '#fff' : 'var(--text-body)',
  };
}

const ghostBtn: React.CSSProperties = {
  border: '1px dashed var(--border-default)',
  borderRadius: 'var(--radius-pill)',
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  background: 'none',
  color: 'var(--text-body)',
};

const publishBtn: React.CSSProperties = {
  border: 'none',
  borderRadius: 'var(--radius-pill)',
  padding: '8px 20px',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  background: 'var(--accent-primary)',
  color: '#fff',
  boxShadow: 'var(--shadow-sm)',
};
