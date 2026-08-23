import { useEffect, useState } from 'react';

interface PageRow {
  id: string;
  path: string;
  title: string;
  status: 'draft' | 'published';
  updated_at: string;
  published_at: string | null;
}

/** The /admin/pages list — create, rename, delete, and jump into the editor for any page. Deliberately plain (a table, a create form, prompt()-based rename) — this doesn't need to be fancy, just functional, per the phase brief. */
export function PagesManager() {
  const [pages, setPages] = useState<PageRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newPath, setNewPath] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  async function load() {
    setError(null);
    try {
      const res = await fetch('/api/admin/pages');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Could not load pages.');
      setPages(body.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load pages.');
      setPages([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createPage(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: newPath, title: newTitle }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Could not create page.');
      setNewPath('');
      setNewTitle('');
      window.location.href = `/admin/pages/${body.page.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create page.');
      setCreating(false);
    }
  }

  async function rename(p: PageRow) {
    const nextTitle = prompt('Title', p.title);
    if (nextTitle === null) return;
    const nextPath = prompt('Path (e.g. /about)', p.path);
    if (nextPath === null) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/pages/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: nextTitle, path: nextPath }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Could not update page.');
      setPages((prev) => (prev ?? []).map((row) => (row.id === p.id ? body.page : row)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update page.');
    }
  }

  async function remove(p: PageRow) {
    if (!confirm(`Delete "${p.title}" (${p.path})? This can't be undone.`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/pages/${p.id}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Could not delete page.');
      setPages((prev) => (prev ?? []).filter((row) => row.id !== p.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete page.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <form onSubmit={createPage} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
          Path
          <input value={newPath} onChange={(e) => setNewPath(e.target.value)} placeholder="/about" required style={inputStyle} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
          Title
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="About" required style={inputStyle} />
        </label>
        <button type="submit" disabled={creating} style={primaryBtn}>{creating ? 'Creating…' : '+ New page'}</button>
      </form>

      {error && <p role="alert" style={{ margin: 0, fontSize: 12, color: '#ef4444' }}>{error}</p>}

      {pages === null ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>
      ) : pages.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No pages yet — create one above.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pages.map((p) => (
            <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>
                  {p.title} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({p.path})</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <span className="badge" style={{ marginRight: 6 }}>{p.status}</span>
                  updated {new Date(p.updated_at).toLocaleString()}
                  {p.published_at ? ` · published ${new Date(p.published_at).toLocaleString()}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <a href={`/admin/pages/${p.id}`} style={linkBtn}>Edit</a>
                <button type="button" onClick={() => rename(p)} style={ghostBtn}>Rename</button>
                <button type="button" onClick={() => remove(p)} style={{ ...ghostBtn, color: '#ef4444' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '7px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-default)',
  background: 'var(--surface-card)',
  color: 'var(--text-heading)',
  fontSize: 13,
};
const primaryBtn: React.CSSProperties = {
  border: 'none',
  borderRadius: 'var(--radius-pill)',
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  background: 'var(--accent-primary)',
  color: '#fff',
};
const ghostBtn: React.CSSProperties = {
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-pill)',
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  background: 'none',
  color: 'var(--text-body)',
};
const linkBtn: React.CSSProperties = {
  ...ghostBtn,
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  background: 'var(--surface-card)',
};
