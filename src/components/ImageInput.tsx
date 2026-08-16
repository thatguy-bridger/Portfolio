import { useRef, useState } from 'react';
import { uploadImage } from '../firebase/storage';

export function ImageInput({
  onSelect,
  label = '+ Photo',
}: {
  onSelect: (src: string, width: number, height: number) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { url, width, height } = await uploadImage(file);
      onSelect(url, width, height);
    } catch {
      setError('Upload failed — check Storage is enabled.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        style={{
          border: 'none',
          borderRadius: 'var(--radius-pill)',
          padding: '3px 12px',
          fontSize: 12,
          fontWeight: 600,
          cursor: busy ? 'default' : 'pointer',
          background: 'var(--surface-card)',
          color: 'var(--text-body)',
        }}
      >
        {busy ? 'Uploading…' : label}
      </button>
      {error && <span style={{ fontSize: 11, color: 'var(--red-500)' }}>{error}</span>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
    </span>
  );
}
