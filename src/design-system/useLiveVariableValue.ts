import { useEffect, useState } from 'react';
import { pluck, toDisplayString } from './jsonPath';
import type { WidgetVariable } from '../data/siteData';

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: string; at: number }>();

async function fetchAndPluck(url: string, path: string | undefined): Promise<string> {
  const key = `${url}::${path ?? ''}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const json = await res.json();
  const value = toDisplayString(pluck(json, path));
  cache.set(key, { value, at: Date.now() });
  return value;
}

/**
 * Resolves a widget variable's effective value: a manual instance override
 * always wins; otherwise a "url"-sourced variable is fetched client-side
 * (JSON + a dot-path pluck) with the variable's stored defaultValue shown
 * while loading or if the fetch fails — most external APIs work fine from
 * the browser, but some block cross-origin requests (no CORS headers) and
 * there is no server here to proxy around that, so this fails soft rather
 * than breaking the page.
 */
export function useLiveVariableValue(variable: WidgetVariable | undefined, instanceOverride: string | undefined): string | undefined {
  const isLive = variable?.source === 'url' && !!variable.sourceUrl;
  const [liveValue, setLiveValue] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;
    fetchAndPluck(variable!.sourceUrl!, variable!.sourcePath)
      .then((v) => { if (!cancelled) setLiveValue(v); })
      .catch(() => { if (!cancelled) setLiveValue(undefined); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, variable?.sourceUrl, variable?.sourcePath]);

  if (instanceOverride !== undefined) return instanceOverride;
  if (isLive) return liveValue ?? variable?.defaultValue;
  return variable?.defaultValue;
}
