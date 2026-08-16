import { useRef, useState } from 'react';
import { compressImageFile } from '../design-system/image';

export function ImageInput({ onSelect, label = '+ Photo' }: { onSelect: (dataUrl: string) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await compressImageFile(file);
      onSelect(dataUrl);
    } catch {
      // Ignore unreadable files — nothing to add.
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
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
        {busy ? 'Processing…' : label}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
    </>
  );
}
