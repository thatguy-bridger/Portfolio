import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { PageBlocks } from './PageBlocks';
import { newPageId, uniqueSlug, type CustomPage } from '../data/siteData';

function newPage(pages: CustomPage[]): CustomPage {
  return { id: newPageId(), slug: uniqueSlug('untitled-page', pages), title: 'Untitled page', blocks: [] };
}

/**
 * Manages every standalone page under /mywork/<slug> — separate from any
 * work tile. Create, rename, re-slug, delete, and edit each page's content
 * with the same endless block editor used for the main page-content section.
 */
export function PagesManager({
  open,
  onClose,
  pages,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  pages: CustomPage[];
  onChange: (pages: CustomPage[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  function update(id: string, patch: Partial<CustomPage>) {
    onChange(pages.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function remove(id: string) {
    onChange(pages.filter((p) => p.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function addPage() {
    const page = newPage(pages);
    onChange([...pages, page]);
    setEditingId(page.id);
  }

  function close() {
    setEditingId(null);
    onClose();
  }

  const editing = pages.find((p) => p.id === editingId);

  if (editing) {
    return (
      <Modal
        open={open}
        onClose={close}
        size="lg"
        title={editing.title || 'Untitled page'}
        titleExtra={
          <button
            onClick={() => setEditingId(null)}
            style={{ border: 'none', background: 'none', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            ← All pages
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          <Input
            label="Page title"
            value={editing.title}
            onChange={(e) => update(editing.id, { title: e.target.value })}
          />
          <Input
            label="Page URL name"
            value={editing.slug}
            onChange={(e) => update(editing.id, { slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
            onBlur={() => update(editing.id, { slug: uniqueSlug(editing.slug, pages, editing.id) })}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            /mywork/{editing.slug}
            {' · '}
            <Link to={`/mywork/${editing.slug}`} target="_blank" style={{ color: 'var(--accent-primary)' }}>
              Preview ↗
            </Link>
          </span>
        </div>
        <PageBlocks
          blocks={editing.blocks}
          editable
          onChange={(blocks) => update(editing.id, { blocks })}
          pages={pages}
        />
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={close} size="lg" title="Pages">
      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>
        Standalone pages under <code>/mywork/…</code> — link to them from a work tile or a button block, or share the
        URL directly. Not tied to any single project.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pages.length === 0 && (
          <div style={{ padding: '20px 0', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            No pages yet.
          </div>
        )}
        {pages.map((p) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.title || 'Untitled page'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                /mywork/{p.slug} · {p.blocks.length} block{p.blocks.length === 1 ? '' : 's'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <Button variant="ghost" size="sm" onClick={() => setEditingId(p.id)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => remove(p.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <Button variant="ghost" size="sm" onClick={addPage}>
          + New page
        </Button>
      </div>
    </Modal>
  );
}
