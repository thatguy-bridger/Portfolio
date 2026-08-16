export interface CompressedImage {
  blob: Blob;
  /** the encoded blob's own pixel size — every photo keeps its own natural aspect ratio, no forced crop */
  width: number;
  height: number;
}

/**
 * Reads an image file and downscales/recompresses it client-side into a
 * JPEG blob before upload — keeps uploads fast and storage usage sane
 * without needing the user to resize photos themselves. Any resolution or
 * aspect ratio is fine; the photo is never cropped or padded to fit a
 * fixed shape, just capped in longest-edge size.
 */
export function compressImageToBlob(file: File, maxDim = 1600, quality = 0.82): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read image'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve({ blob, width, height }) : reject(new Error('Could not encode image'))),
          'image/jpeg',
          quality,
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
