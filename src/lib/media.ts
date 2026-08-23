import { getSupabase } from './supabase-server';

/** The Supabase Storage bucket every uploaded image lives in — created by supabase/migrations/0002_media_storage.sql. Shared constant so the migration's intent and the upload/delete endpoints never drift apart. */
export const MEDIA_BUCKET = 'media';

/** Server-side caps on what /api/admin/media will accept — generous enough for real photos, small enough to keep the bucket and the request itself sane. */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB
export const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);

/** The bucket is public (see the migration), so this is a stable, unsigned URL — safe to store/render directly, no signing needed. */
export function publicMediaUrl(storagePath: string): string {
  return getSupabase().storage.from(MEDIA_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

/**
 * Cheap, dependency-free width/height sniff for the two formats real photo
 * uploads are almost always in. Anything else (webp/gif/svg) just comes back
 * null — width/height are optional columns (0001_init.sql) precisely because
 * this isn't meant to be a full image-parsing library, just a nice-to-have
 * for the media picker's grid, not something correctness depends on.
 */
export function sniffImageDimensions(bytes: Uint8Array, contentType: string): { width: number; height: number } | null {
  try {
    if (contentType === 'image/png') return sniffPng(bytes);
    if (contentType === 'image/jpeg') return sniffJpeg(bytes);
  } catch {
    // Malformed/truncated header — not worth failing the upload over.
  }
  return null;
}

function sniffPng(bytes: Uint8Array): { width: number; height: number } | null {
  // 8-byte PNG signature, then the IHDR chunk: 4-byte length, "IHDR", 4-byte width, 4-byte height (big-endian).
  if (bytes.length < 24) return null;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (!isPng) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  return width > 0 && height > 0 ? { width, height } : null;
}

function sniffJpeg(bytes: Uint8Array): { width: number; height: number } | null {
  // Walk the marker segments looking for an SOFn (start-of-frame) marker,
  // which carries the pixel dimensions. JPEG has no single fixed header
  // offset for this the way PNG does.
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    // SOF0-SOF15 except DHT(C4)/JPG(C8)/DAC(CC) carry dimensions the same way.
    const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    const segmentLength = view.getUint16(offset + 2, false);
    if (isSOF && offset + 9 <= bytes.length) {
      const height = view.getUint16(offset + 5, false);
      const width = view.getUint16(offset + 7, false);
      return width > 0 && height > 0 ? { width, height } : null;
    }
    if (marker === 0xd8 || marker === 0xd9) break; // SOI/EOI, no frame found
    offset += 2 + segmentLength;
  }
  return null;
}
