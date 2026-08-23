import { useEffect, useState } from 'react';

interface Submission {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  created_at: string;
}

/** /admin/inbox — contact-form submissions, newest first, with a mark-as-read toggle. Kept simple: no reply/delete flow, per the phase brief. */
export function InboxManager() {
  const [items, setItems] = useState<Submission[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch('/api/admin/inbox');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Could not load inbox.');
      setItems(body.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load inbox.');
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRead(item: Submission) {
    // Optimistic — this is a low-stakes toggle, worth feeling instant.
    setItems((prev) => (prev ?? []).map((row) => (row.id === item.id ? { ...row, read: !row.read } : row)));
    try {
      const res = await fetch(`/api/admin/inbox/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: !item.read }),
      });
      if (!res.ok) throw new Error('Could not update.');
    } catch {
      // Revert on failure.
      setItems((prev) => (prev ?? []).map((row) => (row.id === item.id ? { ...row, read: item.read } : row)));
      setError('Could not update — please try again.');
    }
  }

  if (items === null) return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {error && <p role="alert" style={{ margin: 0, fontSize: 12, color: '#ef4444' }}>{error}</p>}
      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No messages yet.</p>
      ) : (
        items.map((item) => (
          <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: item.read ? 0.7 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>
                {item.name} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>&lt;{item.email}&gt;</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!item.read && <span className="badge">New</span>}
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleString()}</span>
                <button type="button" onClick={() => toggleRead(item)} style={ghostBtn}>
                  {item.read ? 'Mark unread' : 'Mark read'}
                </button>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>{item.message}</p>
          </div>
        ))
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
