import type { CustomPage } from '../data/siteData';

interface TreeNode {
  segment: string;
  fullPath: string;
  /** the page that actually lives at this exact path, if any — a segment can be purely organizational */
  page?: CustomPage;
  children: TreeNode[];
}

/** Groups pages by their path segments, e.g. "school/clubs/justserve" nests under "school" → "clubs". */
function buildTree(pages: CustomPage[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const page of pages) {
    const segments = page.path.split('/').filter(Boolean);
    if (segments.length === 0) continue;
    let level = root;
    const acc: string[] = [];
    segments.forEach((seg, i) => {
      acc.push(seg);
      const fullPath = acc.join('/');
      let node = level.find((n) => n.segment === seg);
      if (!node) {
        node = { segment: seg, fullPath, children: [] };
        level.push(node);
      }
      if (i === segments.length - 1) node.page = page;
      level = node.children;
    });
  }
  sortTree(root);
  return root;
}

function sortTree(nodes: TreeNode[]) {
  nodes.sort((a, b) => a.segment.localeCompare(b.segment));
  nodes.forEach((n) => sortTree(n.children));
}

/**
 * Pages organized as a tree that mirrors their URL path — a page at
 * "school/clubs/justserve" nests under "school" → "clubs" rather than
 * sitting in one flat list. A path segment with no page of its own (e.g.
 * "school" when only "school/clubs/justserve" exists) still shows as a
 * non-clickable group label so the structure stays visible.
 */
export function PageTree({
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
  const tree = buildTree(pages);

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, fontFamily: 'var(--font-body)' }}>
      <TreeRow label="Home" active={activeId === null} depth={0} clickable onClick={() => onSelect(null)} />

      <div
        style={{
          marginTop: 14,
          marginBottom: 2,
          padding: '0 10px',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        Pages
      </div>
      {tree.length === 0 && (
        <div style={{ padding: '4px 10px', fontSize: 12, color: 'var(--text-muted)' }}>No pages yet.</div>
      )}
      {tree.map((node) => (
        <TreeGroup key={node.fullPath} node={node} depth={0} activeId={activeId} onSelect={onSelect} />
      ))}

      <button
        onClick={onCreate}
        style={{
          marginTop: 10,
          textAlign: 'left',
          border: '1px dashed var(--border-strong)',
          background: 'none',
          borderRadius: 'var(--radius-md)',
          padding: '8px 10px',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-muted)',
          cursor: 'pointer',
        }}
      >
        + New page
      </button>
    </nav>
  );
}

function TreeGroup({
  node,
  depth,
  activeId,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div>
      <TreeRow
        label={node.page?.title || node.segment}
        active={!!node.page && activeId === node.page.id}
        depth={depth}
        clickable={!!node.page}
        onClick={() => node.page && onSelect(node.page.id)}
        title={node.page ? undefined : `/${node.fullPath} — no page here yet, just groups what's nested under it`}
      />
      {node.children.map((child) => (
        <TreeGroup key={child.fullPath} node={child} depth={depth + 1} activeId={activeId} onSelect={onSelect} />
      ))}
    </div>
  );
}

function TreeRow({
  label,
  active,
  depth,
  clickable,
  onClick,
  title,
}: {
  label: string;
  active: boolean;
  depth: number;
  clickable: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        textAlign: 'left',
        border: 'none',
        width: '100%',
        background: active ? 'var(--accent-primary)' : 'transparent',
        color: active ? '#fff' : clickable ? 'var(--text-body)' : 'var(--text-muted)',
        borderRadius: 'var(--radius-md)',
        padding: '7px 10px',
        paddingLeft: 10 + depth * 14,
        fontSize: 13,
        fontWeight: active ? 700 : 600,
        fontStyle: clickable ? 'normal' : 'italic',
        cursor: clickable ? 'pointer' : 'default',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
