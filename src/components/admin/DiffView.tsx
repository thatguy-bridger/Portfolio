// Presentational rendering of a PageBlocksDiff (src/lib/history/diff.ts) —
// kept separate from that pure function per the phase brief, and from
// HistoryPanel.tsx (which fetches revisions and decides which two to diff)
// so the diff math stays independently testable.
import { BLOCK_REGISTRY } from '../../lib/blocks/registry';
import type { PageBlocksDiff } from '../../lib/history/diff';
import { formatFieldValue } from '../../lib/history/diff';

const KIND_COLOR: Record<string, string> = {
  added: '#16a34a',
  removed: '#dc2626',
  changed: '#d97706',
};
const KIND_LABEL: Record<string, string> = {
  added: 'Added',
  removed: 'Removed',
  changed: 'Changed',
};

export function DiffView({ diff }: { diff: PageBlocksDiff }) {
  if (!diff.hasChanges) {
    return <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>No changes from the previous revision.</p>;
  }

  const changedOrAddedRemovedSections = diff.sections.filter((s) => s.kind !== 'unchanged');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {changedOrAddedRemovedSections.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {changedOrAddedRemovedSections.map((s) => (
            <div key={s.id} style={{ fontSize: 12 }}>
              <Pill kind={s.kind} /> <strong style={{ color: 'var(--text-heading)' }}>Section "{s.name}"</strong>
              {s.kind === 'changed' && s.changes && (
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {s.changes.map((c) => (
                    <li key={c.key} style={{ color: 'var(--text-body)' }}>
                      <code style={{ fontSize: 11 }}>{c.key}</code>: {formatFieldValue(c.before)} → {formatFieldValue(c.after)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {diff.blocks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {diff.blocks.map((b) => (
            <div key={b.id} style={{ fontSize: 12, borderLeft: `3px solid ${KIND_COLOR[b.kind]}`, paddingLeft: 10 }}>
              <div>
                <Pill kind={b.kind} />{' '}
                <strong style={{ color: 'var(--text-heading)' }}>{BLOCK_REGISTRY[b.type]?.label ?? b.type}</strong>{' '}
                <span style={{ color: 'var(--text-muted)' }}>in "{b.sectionName}"</span>
              </div>
              {b.kind === 'changed' && b.changes && b.changes.length > 0 && (
                <table style={{ marginTop: 6, borderCollapse: 'collapse', width: '100%' }}>
                  <tbody>
                    {b.changes.map((c) => (
                      <tr key={c.key}>
                        <td style={{ padding: '2px 8px 2px 0', color: 'var(--text-muted)', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                          <code style={{ fontSize: 11 }}>{c.key}</code>
                        </td>
                        <td style={{ padding: '2px 8px', color: '#dc2626', verticalAlign: 'top' }}>{formatFieldValue(c.before)}</td>
                        <td style={{ padding: '2px 4px', color: 'var(--text-muted)', verticalAlign: 'top' }}>→</td>
                        <td style={{ padding: '2px 0', color: '#16a34a', verticalAlign: 'top' }}>{formatFieldValue(c.after)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Pill({ kind }: { kind: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        padding: '1px 6px',
        borderRadius: 'var(--radius-pill)',
        color: '#fff',
        background: KIND_COLOR[kind] ?? '#888',
      }}
    >
      {KIND_LABEL[kind] ?? kind}
    </span>
  );
}
