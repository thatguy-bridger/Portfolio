import { useRef, useState } from 'react';
import { uploadModel } from '../firebase/storage';
import { MODEL_FORMATS, type Model3DFormat } from '../data/siteData';

export function Model3DInput({
  onSelect,
  label = '+ 3D model',
}: {
  onSelect: (src: string, format: Model3DFormat, fileName: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setProgress(0);
    setError(null);
    try {
      const { url, format, fileName } = await uploadModel(file, setProgress);
      onSelect(url, format, fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed — check Storage is enabled.');
    } finally {
      setProgress(null);
    }
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={progress !== null}
        style={{
          border: 'none',
          borderRadius: 'var(--radius-pill)',
          padding: '3px 12px',
          fontSize: 12,
          fontWeight: 600,
          cursor: progress !== null ? 'default' : 'pointer',
          background: 'var(--surface-card)',
          color: 'var(--text-body)',
        }}
      >
        {progress !== null ? `Uploading… ${progress}%` : label}
      </button>
      {error && <span style={{ fontSize: 11, color: 'var(--red-500)' }}>{error}</span>}
      <input ref={inputRef} type="file" accept={MODEL_FORMATS.join(',')} onChange={handleChange} style={{ display: 'none' }} />
    </span>
  );
}
