import { useEffect, useState } from 'react';
import { pluck, toDisplayString } from './jsonPath';

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { items: Array<Record<string, unknown>>; at: number }>();

async function fetchArray(url: string, arrayPath: string | undefined): Promise<Array<Record<string, unknown>>> {
  const key = `${url}::${arrayPath ?? ''}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.items;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const json = await res.json();
  const arr = pluck(json, arrayPath);
  const items = Array.isArray(arr) ? (arr as Array<Record<string, unknown>>) : [];
  cache.set(key, { items, at: Date.now() });
  return items;
}

/**
 * Fetches a JSON array from a URL (client-side, same CORS caveats as a
 * widget's single-value URL source) and maps each array item into a
 * Record<variableId, string> using fieldMap — one entry per widget
 * instance-variable, each value plucked from that item via a dot/bracket
 * path. Used to drive a repeater block's URL data source.
 */
export function useRepeaterItems(
  sourceUrl: string | undefined,
  sourcePath: string | undefined,
  fieldMap: Record<string, string> | undefined,
): { items: Array<Record<string, string>>; loading: boolean; error: boolean } {
  const [items, setItems] = useState<Array<Record<string, string>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sourceUrl) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchArray(sourceUrl, sourcePath)
      .then((rawItems) => {
        if (cancelled) return;
        const mapped = rawItems.map((raw) => {
          const values: Record<string, string> = {};
          for (const [variableId, fieldPath] of Object.entries(fieldMap ?? {})) {
            values[variableId] = toDisplayString(pluck(raw, fieldPath));
          }
          return values;
        });
        setItems(mapped);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceUrl, sourcePath, JSON.stringify(fieldMap ?? {})]);

  return { items, loading, error };
}
