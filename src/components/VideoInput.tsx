import { useRef, useState } from 'react';
import { uploadVideo } from '../firebase/storage';

export function VideoInput({
  onSelect,
  label = '+ Video',
}: {
  onSelect: (src: string, fileName: string) => void;
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
      const { url, fileName } = await uploadVideo(file, setProgress);
      onSelect(url, fileName);
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
      <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/ogg" onChange={handleChange} style={{ display: 'none' }} />
    </span>
  );
}
