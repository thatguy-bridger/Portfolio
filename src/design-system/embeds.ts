import type { EmbedKind } from '../data/siteData';

/**
 * Turns a URL a user pasted (a normal YouTube/Vimeo/Maps link, not
 * necessarily an embed link) into an iframe src plus a detected kind, so
 * the embed block can pick a sensible aspect ratio and label. Anything
 * unrecognized falls back to "generic" and is embedded as-is — this works
 * for sites that support being framed (Spotify, CodePen, Figma, an
 * already-copied Maps "embed a map" URL, etc.) but not for ones that send
 * an X-Frame-Options header blocking it (most social platforms), which is
 * a platform-side restriction no client-side code can work around.
 */
export function parseEmbedUrl(raw: string): { kind: EmbedKind; embedSrc: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, '');

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const id = url.pathname.startsWith('/embed/') ? url.pathname.split('/')[2] : url.searchParams.get('v');
    if (id) return { kind: 'youtube', embedSrc: `https://www.youtube.com/embed/${id}` };
  }
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1);
    if (id) return { kind: 'youtube', embedSrc: `https://www.youtube.com/embed/${id}` };
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean).pop();
    if (id && /^\d+$/.test(id)) return { kind: 'vimeo', embedSrc: `https://player.vimeo.com/video/${id}` };
  }

  if (host === 'google.com' && url.pathname.includes('/maps')) {
    if (url.pathname.includes('/embed')) return { kind: 'maps', embedSrc: trimmed };
    const query = url.searchParams.get('q') || url.pathname.split('/place/')[1]?.split('/')[0];
    if (query) return { kind: 'maps', embedSrc: `https://maps.google.com/maps?q=${encodeURIComponent(decodeURIComponent(query))}&output=embed` };
    return { kind: 'maps', embedSrc: `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed` };
  }
  if (host === 'maps.google.com') {
    return { kind: 'maps', embedSrc: trimmed.includes('output=embed') ? trimmed : `${trimmed}${trimmed.includes('?') ? '&' : '?'}output=embed` };
  }

  if (host === 'twitter.com' || host === 'x.com' || host === 'instagram.com') {
    return { kind: 'twitter', embedSrc: trimmed };
  }

  return { kind: 'generic', embedSrc: trimmed };
}

export const EMBED_ASPECT: Record<EmbedKind, string> = {
  youtube: '16 / 9',
  vimeo: '16 / 9',
  maps: '16 / 9',
  twitter: '1 / 1',
  generic: '16 / 9',
};
