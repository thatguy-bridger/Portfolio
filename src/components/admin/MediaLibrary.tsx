import { useEffect, useRef, useState } from 'react';

export interface MediaRow {
  id: string;
  storage_path: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  created_at: string;
  url: string;
}

/**
 * One component, two contexts: the standalone /admin/media management
 * screen (`mode="manage"`) and the "pick from library" popover EditableImage
 * opens (`mode="picker"`, with `onSelect`/`onClose`) — both just browse +
 * upload + delete the same media_library rows, the only difference is
 * whether clicking a thumbnail selects-and-closes or does nothing.
 */
export function MediaLibrary({
  mode,
  onSelect,
  onClose,
}: {
  mode: 'manage' | 'picker';
  onSelect?: (url: string) => void;
  onClose?: () => void;
}) {
  const [items, setItems] = useState<MediaRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch('/api/admin/media');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Could not load media library.');
      setItems(body.media);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load media library.');
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file later
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/media', { method: 'POST', body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Upload failed.');
      setItems((prev) => [body.media, ...(prev ?? [])]);
      if (mode === 'picker' && onSelect) {
        onSelect(body.media.url);
        onClose?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function pick(item: MediaRow) {
    if (mode !== 'picker' || !onSelect) return;
    onSelect(item.url);
    onClose?.();
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this image? This can\'t be undone.')) return;
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Delete failed.');
      setItems((prev) => (prev ?? []).filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={primaryBtn}>
          {uploading ? 'Uploading…' : '+ Upload image'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
        {mode === 'picker' && onClose && (
          <button type="button" onClick={onClose} style={ghostBtn}>Cancel</button>
        )}
      </div>

      {error && <p role="alert" style={{ margin: 0, fontSize: 12, color: '#ef4444' }}>{error}</p>}

      {items === null ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>
      ) : items.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No images uploaded yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, maxHeight: mode === 'picker' ? 360 : undefined, overflowY: mode === 'picker' ? 'auto' : undefined }}>
          {items.map((item) => (
            <div key={item.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                type="button"
                onClick={() => pick(item)}
                title={item.file_name}
                style={{
                  padding: 0,
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  background: 'var(--surface-card)',
                  cursor: mode === 'picker' ? 'pointer' : 'default',
                  aspectRatio: '1 / 1',
                }}
              >
                <img src={item.url} alt={item.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.file_name}</span>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                title="Delete"
                style={{ position: 'absolute', top: 4, right: 4, border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 11, lineHeight: 1, cursor: 'pointer', background: 'rgba(0,0,0,0.55)', color: '#fff' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  border: 'none',
  borderRadius: 'var(--radius-pill)',
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  background: 'var(--accent-gradient)',
  color: '#fff',
};
const ghostBtn: React.CSSProperties = {
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-pill)',
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  background: 'none',
  color: 'var(--text-body)',
};
