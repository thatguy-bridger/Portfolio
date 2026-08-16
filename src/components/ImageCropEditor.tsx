import { useRef } from 'react';
import { CroppedImage } from './CroppedImage';
import { DEFAULT_CROP, type ImageCrop } from '../data/siteData';

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Click or drag on the preview to set the focal point; slider to zoom in. */
export function ImageCropEditor({
  src,
  crop,
  width,
  height,
  onChange,
}: {
  src: string;
  crop?: ImageCrop;
  width?: number;
  height?: number;
  onChange: (crop: ImageCrop) => void;
}) {
  const c = crop ?? DEFAULT_CROP;
  const boxRef = useRef<HTMLDivElement>(null);

  function setFromPointer(e: React.PointerEvent) {
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) return;
    const posX = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
    const posY = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);
    onChange({ ...c, posX, posY });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        ref={boxRef}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setFromPointer(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) setFromPointer(e);
        }}
        style={{ position: 'relative', cursor: 'crosshair', touchAction: 'none' }}
        title="Click or drag to set the focal point"
      >
        <CroppedImage src={src} crop={c} width={width} height={height} rounded />
        <div
          style={{
            position: 'absolute',
            left: `${c.posX}%`,
            top: `${c.posY}%`,
            width: 14,
            height: 14,
            marginLeft: -7,
            marginTop: -7,
            borderRadius: '50%',
            border: '2px solid #fff',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
          }}
        />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-body)', fontFamily: 'var(--font-body)' }}>
        Zoom
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={c.zoom}
          onChange={(e) => onChange({ ...c, zoom: parseFloat(e.target.value) })}
          style={{ flex: 1 }}
        />
      </label>
    </div>
  );
}
