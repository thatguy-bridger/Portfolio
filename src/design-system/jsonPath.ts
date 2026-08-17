/** Plucks a value out of parsed JSON via a dot/bracket path, e.g. "data.temp" or "results.0.name". Empty path returns the whole thing. */
export function pluck(data: unknown, path: string | undefined): unknown {
  if (!path) return data;
  const keys = path.split('.').flatMap((seg) => seg.split(/\[|\]/).filter(Boolean));
  let cur: unknown = data;
  for (const key of keys) {
    if (cur == null) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

export function toDisplayString(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}
