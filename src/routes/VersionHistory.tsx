import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { listVersions, saveDraft, type SiteVersion } from '../firebase/site';

const TOPBAR_HEIGHT = 52;

function formatTimestamp(v: SiteVersion): string {
  if (!v.publishedAt) return 'Just now';
  return v.publishedAt.toDate().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Every publish writes a snapshot to siteVersions (see firebase/site.ts),
 * capped at MAX_VERSIONS so the feature can't run up Firestore usage over
 * a long-lived site. Restoring loads a version into the current draft —
 * it doesn't re-publish on its own, so a restored version still goes
 * through the normal review-then-Publish step before it goes live.
 */
export function VersionHistory() {
  const [versions, setVersions] = useState<SiteVersion[] | null>(null);
  const [error, setError] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    listVersions()
      .then(setVersions)
      .catch(() => setError(true));
  }, []);

  async function restore(v: SiteVersion) {
    if (!confirm(`Load the version from ${formatTimestamp(v)} into your draft? You'll still need to hit Publish for it to go live — this won't overwrite anything until you do.`)) return;
    setRestoringId(v.id);
    // Written directly rather than through useSiteDraft's setData — that hook's autosave is
    // debounced by 800ms, and navigating away immediately after would cancel it before it
    // ever reached Firestore, silently losing the restore.
    try {
      await saveDraft(v.data);
      navigate('/edit');
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '10px 20px',
          background: 'var(--surface-glass)',
          backdropFilter: 'var(--blur-glass)',
          WebkitBackdropFilter: 'var(--blur-glass)',
          borderBottom: '1px solid var(--border-default)',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
        }}
      >
        <Link to="/edit" style={{ color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          ← Builder
        </Link>
        <strong style={{ color: 'var(--text-heading)' }}>Version History</strong>
      </div>

      <div style={{ paddingTop: TOPBAR_HEIGHT + 32, maxWidth: 720, margin: '0 auto', padding: `${TOPBAR_HEIGHT + 32}px 24px 80px`, fontFamily: 'var(--font-body)' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
          A snapshot is saved every time you publish, newest first. Restoring loads that version into your draft for review — nothing goes
          live until you hit Publish yourself.
        </p>

        {error && <div style={{ color: 'var(--red-500)', fontSize: 13 }}>Couldn't load version history. Try refreshing.</div>}
        {!error && versions === null && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>}
        {!error && versions?.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No published versions yet — publish once to start building history.</div>}

        {versions && versions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {versions.map((v, i) => (
              <div
                key={v.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  background: 'var(--surface-card)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-heading)' }}>
                    {formatTimestamp(v)}
                    {i === 0 && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: 'var(--green-600)' }}>Current</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {v.data.homepageGroups.length} section{v.data.homepageGroups.length === 1 ? '' : 's'} · {v.data.pages.length} page
                    {v.data.pages.length === 1 ? '' : 's'}
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => restore(v)} disabled={i === 0 || restoringId === v.id}>
                  {i === 0 ? 'Published' : restoringId === v.id ? 'Loading…' : 'Restore to draft'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
