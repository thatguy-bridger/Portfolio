import { Editable } from './Editable';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { PageBlocks } from './PageBlocks';
import { RESERVED_PATHS, uniquePath, type CustomPage, type Widget } from '../data/siteData';

/**
 * Full-canvas editor for one standalone page — the same real estate and
 * the same endless block editor the home page's content section gets, so
 * every page a user creates has identical editing power. Title/path live
 * here instead of a separate management modal.
 */
export function CustomPageCanvas({
  page,
  pages,
  widgets,
  onChange,
  onDelete,
}: {
  page: CustomPage;
  pages: CustomPage[];
  widgets: Widget[];
  onChange: (patch: Partial<CustomPage>) => void;
  onDelete: () => void;
}) {
  const reserved = RESERVED_PATHS.has(page.path);

  return (
    <section style={{ padding: '48px 24px 120px', maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <Editable
            editable
            as="h1"
            value={page.title}
            onCommit={(title) => onChange({ title })}
            style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 12, display: 'block' }}
          />
          <Input
            label="Page path"
            value={page.path}
            onChange={(e) => onChange({ path: e.target.value.toLowerCase().replace(/[^a-z0-9/-]+/g, '-') })}
            onBlur={() => onChange({ path: uniquePath(page.path, pages, page.id) })}
          />
          <div style={{ fontSize: 12, color: reserved ? 'var(--red-500)' : 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-body)' }}>
            /{page.path || '…'}
            {' · '}
            <a href={`/${page.path}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>
              Preview ↗
            </a>
            {reserved && ' — this path is reserved for the app itself, pick another'}
          </div>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (window.confirm(`Delete "${page.title || 'this page'}"? This can't be undone.`)) onDelete();
          }}
        >
          Delete page
        </Button>
      </div>
      <PageBlocks blocks={page.blocks} editable pages={pages} widgets={widgets} onChange={(blocks) => onChange({ blocks })} />
    </section>
  );
}
