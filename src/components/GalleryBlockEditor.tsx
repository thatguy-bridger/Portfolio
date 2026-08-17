import { ImageInput } from './ImageInput';
import { newGalleryImageId, type GalleryImage } from '../data/siteData';

/** A responsive grid of photos, each at its own natural aspect ratio (cropped to fill its grid cell) — used for both the editable gallery block and its read-only public rendering. */
export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
      {images.map((img) => (
        <div key={img.id} style={{ aspectRatio: '1 / 1', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--surface-card)' }}>
          <img src={img.src} alt={img.alt ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ))}
    </div>
  );
}

export function GalleryBlockEditor({ images, onChange }: { images: GalleryImage[]; onChange: (images: GalleryImage[]) => void }) {
  function add(src: string, width: number, height: number) {
    onChange([...images, { id: newGalleryImageId(), src, width, height }]);
  }
  function remove(id: string) {
    onChange(images.filter((img) => img.id !== id));
  }
  function move(id: string, dir: -1 | 1) {
    const idx = images.findIndex((img) => img.id === id);
    const target = idx + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {images.length === 0 ? (
        <div
          style={{
            height: 120,
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          No photos yet
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
          {images.map((img, i) => (
            <div key={img.id} style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--surface-card)' }}>
              <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 3 }}>
                <button disabled={i === 0} onClick={() => move(img.id, -1)} title="Move earlier" style={thumbBtn}>
                  ←
                </button>
                <button disabled={i === images.length - 1} onClick={() => move(img.id, 1)} title="Move later" style={thumbBtn}>
                  →
                </button>
                <button onClick={() => remove(img.id)} title="Remove" style={{ ...thumbBtn, background: 'var(--red-600)', color: '#fff' }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ImageInput label="+ Add photo" onSelect={add} />
    </div>
  );
}

const thumbBtn: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: '50%',
  border: 'none',
  fontSize: 10,
  cursor: 'pointer',
  background: 'rgba(255,255,255,0.9)',
  color: '#111',
};
