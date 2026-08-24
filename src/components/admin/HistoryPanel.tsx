// /admin/pages/[id]/history — the durable, server-persisted history layer
// (as opposed to PageEditor.tsx's in-editor session undo/redo, which is
// local-only and resets on reload). Lists every revision_history row for
// this page, newest first, lets you expand any entry to see its field-level
// diff against the revision immediately before it (diffPageBlocks, from
// src/lib/history/diff.ts), and — for a 'publish' entry — roll the live
// site back to it.
import { useEffect, useState } from 'react';
import type { PageSection } from '../../lib/blocks/types';
import { diffPageBlocks } from '../../lib/history/diff';
import { DiffView } from './DiffView';

interface Revision {
  id: string;
  event_type: 'draft_save' | 'publish';
  blocks: PageSection[];
  created_at: string;
}

export function HistoryPanel({ pageId }: { pageId: string }) {
  const [revisions, setRevisions] = useState<Revision[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/history`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Could not load history.');
      setRevisions(body.revisions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load history.');
      setRevisions([]);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  async function rollback(revision: Revision) {
    if (!window.confirm('Roll the live site back to this published version? This will replace what visitors currently see, and is itself logged as a new publish event.')) return;
    setRollingBackId(revision.id);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId: revision.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Rollback failed.');
      setNotice(`Rolled back — the live site now matches the ${new Date(revision.created_at).toLocaleString()} version.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rollback failed.');
    } finally {
      setRollingBackId(null);
    }
  }

  if (revisions === null) return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {error && <p role="alert" style={{ margin: 0, fontSize: 12, color: '#ef4444' }}>{error}</p>}
      {notice && <p style={{ margin: 0, fontSize: 12, color: '#16a34a' }}>{notice}</p>}

      {revisions.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          No history yet — it starts accumulating the first time this page is saved or published.
        </p>
      ) : (
        revisions.map((revision, i) => {
          // Diff against the revision immediately before this one in time —
          // revisions is newest-first, so that's the NEXT entry in the
          // array (index i + 1), or an empty page if this is the oldest
          // entry on record (renders as "everything added").
          const older = revisions[i + 1]?.blocks ?? [];
          const isExpanded = expandedId === revision.id;
          return (
            <div key={revision.id} className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge" style={revision.event_type === 'publish' ? { background: 'var(--accent-gradient)', color: '#fff' } : undefined}>
                    {revision.event_type === 'publish' ? 'Published' : 'Draft saved'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(revision.created_at).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => setExpandedId(isExpanded ? null : revision.id)} style={ghostBtn}>
                    {isExpanded ? 'Hide changes' : 'View changes'}
                  </button>
                  {revision.event_type === 'publish' && (
                    <button type="button" onClick={() => rollback(revision)} disabled={rollingBackId === revision.id} style={ghostBtn}>
                      {rollingBackId === revision.id ? 'Rolling back…' : 'Roll back to this'}
                    </button>
                  )}
                </div>
              </div>
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 8 }}>
                  <DiffView diff={diffPageBlocks(older, revision.blocks)} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-pill)',
  padding: '5px 12px',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  background: 'none',
  color: 'var(--text-body)',
};
