import type { CustomPage } from '../data/siteData';

/**
 * Tab row for switching which page the Builder canvas below is showing —
 * "Home" plus one tab per custom page. Selecting a tab swaps the whole
 * canvas to that page's own full-width block editor, the same one the
 * home page's content section uses, rather than a cramped modal.
 */
export function PageSwitcher({
  pages,
  activeId,
  onSelect,
  onCreate,
}: {
  pages: CustomPage[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        padding: '10px 20px',
        overflowX: 'auto',
        borderBottom: '1px solid var(--border-default)',
        background: 'var(--surface-panel)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <Tab label="Home" active={activeId === null} onClick={() => onSelect(null)} />
      {pages.map((p) => (
        <Tab key={p.id} label={p.title || 'Untitled page'} active={activeId === p.id} onClick={() => onSelect(p.id)} />
      ))}
      <button
        onClick={onCreate}
        style={{
          flexShrink: 0,
          border: '1px dashed var(--border-strong)',
          background: 'none',
          borderRadius: 'var(--radius-pill)',
          padding: '6px 14px',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-muted)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        + New page
      </button>
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        border: 'none',
        borderRadius: 'var(--radius-pill)',
        padding: '6px 14px',
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        background: active ? 'var(--accent-primary)' : 'var(--surface-card)',
        color: active ? '#fff' : 'var(--text-body)',
      }}
    >
      {label}
    </button>
  );
}
