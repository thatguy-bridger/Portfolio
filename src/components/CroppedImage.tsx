import type { CSSProperties } from 'react';
import { DEFAULT_CROP, type ImageCrop } from '../data/siteData';

/**
 * Renders a photo at its own natural aspect ratio — no forced crop frame.
 * At the default zoom (1) the whole photo is visible, uncropped, at
 * whatever shape it naturally is. Zooming in scales the image about the
 * chosen focal point and lets the (still naturally-shaped) frame clip the
 * excess, rather than fitting it into some fixed ratio box.
 */
export function CroppedImage({
  src,
  alt,
  crop,
  width,
  height,
  style,
  rounded = true,
}: {
  src?: string;
  alt?: string;
  crop?: ImageCrop;
  /** natural pixel size, if known — reserves layout space so the page doesn't jump once the photo loads */
  width?: number;
  height?: number;
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
        borderRadius: rounded ? 'var(--radius-md)' : undefined,
        background: 'var(--surface-card)',
        ...style,
      }}
    >
      {src && (
        <img
          src={src}
          alt={alt ?? ''}
          width={width}
          height={height}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            transform: c.zoom !== 1 ? `scale(${c.zoom})` : undefined,
            transformOrigin: `${c.posX}% ${c.posY}%`,
          }}
        />
      )}
    </div>
  );
}
