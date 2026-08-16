import type { CSSProperties } from 'react';
import { DEFAULT_CROP, type ImageCrop } from '../data/siteData';

export function CroppedImage({
  src,
  alt,
  crop,
  aspect = '4 / 3',
  style,
  rounded = true,
}: {
  src?: string;
  alt?: string;
  crop?: ImageCrop;
  aspect?: string;
  style?: CSSProperties;
  rounded?: boolean;
}) {
  const c = crop ?? DEFAULT_CROP;
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        aspectRatio: aspect,
        borderRadius: rounded ? 'var(--radius-md)' : undefined,
        background: 'var(--surface-card)',
        ...style,
      }}
    >
      {src && (
        <img
          src={src}
          alt={alt ?? ''}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${c.posX}% ${c.posY}%`,
            transform: c.zoom !== 1 ? `scale(${c.zoom})` : undefined,
            transformOrigin: `${c.posX}% ${c.posY}%`,
            display: 'block',
          }}
        />
      )}
    </div>
  );
}
