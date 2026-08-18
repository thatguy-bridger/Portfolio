import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageTree } from '../components/PageTree';
import { PageEditor } from '../components/PageEditor';
import { Editable } from '../components/Editable';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { CustomizePanel } from '../components/CustomizePanel';
import { RESERVED_PATHS, newPageId, uniquePath, type CustomPage } from '../data/siteData';
import { useApplyThemeFromData } from '../design-system/useApplyThemeFromData';
import { useIsNarrow } from '../design-system/useIsNarrow';
import { useSiteDraft, type SaveStatus } from '../design-system/useSiteDraft';
import { useMessages } from '../design-system/useMessages';
import { useTheme } from '../design-system/theme';
import { useAuth } from '../auth/AuthProvider';

const TOPBAR_HEIGHT = 52;

/**
 * The one editor screen. The homepage and every custom page share the same
 * topbar, the same sidebar, and the same WYSIWYG canvas (PageEditor) —
 * clicking something in the sidebar only ever swaps which page's sections
 * are showing, never which abilities are available.
 */
export function Builder() {
  const { signOut } = useAuth();
  const theme = useTheme();
  const { data, setData, status, publishing, hasUnpublished, handlePublish, undo, redo, canUndo, canRedo } = useSiteDraft();
  const { unreadCount } = useMessages();
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const narrow = useIsNarrow();

  useApplyThemeFromData(data);

  // Mirror theme-picker changes (accent/font) back into the draft. Compares
  // against the draft's own stored values rather than a "first run" flag, so
  // it's self-correcting regardless of when the initial theme application
  // (above) actually lands relative to this effect.
  useEffect(() => {
    if (!data) return;
    const changed =
      theme.accentId !== data.accentId ||
      theme.customAccentHex !== data.customAccentHex ||
      theme.displayFont.id !== data.displayFontId ||
      theme.bodyFont.id !== data.bodyFontId;
    if (!changed) return;
    setData((prev) =>
      prev && {
        ...prev,
        accentId: theme.accentId,
        customAccentHex: theme.customAccentHex,
        displayFontId: theme.displayFont.id,
        bodyFontId: theme.bodyFont.id,
      },
    );
  }, [theme.accentId, theme.customAccentHex, theme.displayFont.id, theme.bodyFont.id, data]);

  function createPage() {
    if (!data) return;
    const page: CustomPage = { id: newPageId(), path: uniquePath('untitled-page', data.pages), title: 'Untitled page', groups: [] };
    setData({ ...data, pages: [...data.pages, page] });
    setActivePageId(page.id);
    setSidebarOpen(false);
  }

  function selectPage(id: string | null) {
    setActivePageId(id);
    setSidebarOpen(false);
  }

  function updatePage(id: string, patch: Partial<CustomPage>) {
    if (!data) return;
    setData({ ...data, pages: data.pages.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  }

  function deletePage(id: string) {
    if (!data) return;
    setData({ ...data, pages: data.pages.filter((p) => p.id !== id) });
    setActivePageId(null);
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading your site…
      </div>
    );
  }

  const activePage = activePageId ? data.pages.find((p) => p.id === activePageId) ?? null : null;

  return (
    <>
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
          {narrow && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                border: '1px solid var(--border-default)',
                background: 'var(--surface-card)',
                borderRadius: 'var(--radius-md)',
                padding: '5px 10px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-body)',
                cursor: 'pointer',
              }}
            >
              ☰ Pages
            </button>
          )}
          <strong style={{ color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>Builder</strong>
          <SaveIndicator status={status} />
          {hasUnpublished && !publishing && (
            <span style={{ color: 'var(--orange-500)', fontWeight: 600, whiteSpace: 'nowrap' }}>Unpublished changes</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <Link to="/edit/widgets" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Widgets{data.widgets.length > 0 ? ` (${data.widgets.length})` : ''}
          </Link>
          <Link
            to="/edit/messages"
            style={{ color: unreadCount > 0 ? 'var(--accent-primary)' : 'var(--text-muted)', fontSize: 13, fontWeight: unreadCount > 0 ? 700 : 400, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Messages{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </Link>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            View live site
          </Link>
          <Link to="/edit/preview" target="_blank" rel="noopener" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Preview draft
          </Link>
          <Link to="/edit/history" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            History
          </Link>
          <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)">
            ↶
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo} title="Redo (Ctrl/Cmd+Shift+Z)">
            ↷
          </Button>
          <Button variant="primary" size="sm" onClick={handlePublish} disabled={publishing || !hasUnpublished}>
            {publishing ? 'Publishing…' : 'Publish'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>

      <div style={{ paddingTop: TOPBAR_HEIGHT, display: 'flex', alignItems: 'flex-start' }}>
        {!narrow && (
          <div
            style={{
              width: 240,
              flexShrink: 0,
              position: 'sticky',
              top: TOPBAR_HEIGHT,
              alignSelf: 'flex-start',
              maxHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
              overflowY: 'auto',
              padding: '20px 14px',
              borderRight: '1px solid var(--border-default)',
            }}
          >
            <PageTree pages={data.pages} activeId={activePageId} onSelect={selectPage} onCreate={createPage} />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {activePage ? (
            <PageMeta page={activePage} pages={data.pages} onChange={(patch) => updatePage(activePage.id, patch)} onDelete={() => deletePage(activePage.id)} />
          ) : null}
          <PageEditor
            groups={activePage ? activePage.groups : data.homepageGroups}
            onChange={(groups) => (activePage ? updatePage(activePage.id, { groups }) : setData({ ...data, homepageGroups: groups }))}
            widgets={data.widgets}
            pages={data.pages}
            tiles={data.tiles}
            onTilesChange={(tiles) => setData({ ...data, tiles })}
          />
        </div>
      </div>

      {narrow && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--surface-overlay)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 'min(80vw, 280px)',
              background: 'var(--surface-panel)',
              padding: '20px 14px',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <PageTree pages={data.pages} activeId={activePageId} onSelect={selectPage} onCreate={createPage} />
          </div>
        </div>
      )}

      <CustomizePanel />
    </>
  );
}

/** Title (shown to visitors, so it's an inline Editable like everything else) + path/delete meta for the active custom page — not part of the WYSIWYG canvas, since path/delete aren't visitor-facing content. */
function PageMeta({
  page,
  pages,
  onChange,
  onDelete,
}: {
  page: CustomPage;
  pages: CustomPage[];
  onChange: (patch: Partial<CustomPage>) => void;
  onDelete: () => void;
}) {
  const reserved = RESERVED_PATHS.has(page.path);
  return (
    <div style={{ padding: '32px 16px 0', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <Editable
            editable
            as="h1"
            value={page.title}
            onCommit={(title) => onChange({ title })}
            style={{ fontSize: 40, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 10, display: 'block' }}
          />
          <div style={{ maxWidth: 320 }}>
            <Input
              label="Page path"
              value={page.path}
              onChange={(e) => onChange({ path: e.target.value.toLowerCase().replace(/[^a-z0-9/-]+/g, '-') })}
              onBlur={() => onChange({ path: uniquePath(page.path, pages, page.id) })}
            />
          </div>
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
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const label = { loading: 'Loading…', idle: 'Up to date', saving: 'Saving…', saved: 'Saved', error: 'Save failed' }[status];
  const color = status === 'error' ? 'var(--red-500)' : 'var(--text-muted)';
  return <span style={{ color }}>{label}</span>;
}
