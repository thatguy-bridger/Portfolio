import { Link } from 'react-router-dom';
import { SiteBody } from './PublicSite';
import { useSiteDraft } from '../design-system/useSiteDraft';

/**
 * "Preview as visitor" — the unpublished draft, rendered through the exact
 * same SiteBody a real visitor sees, with none of the Builder's edit
 * chrome. Only the small badge below marks it as a preview so the site
 * owner can't mistake it for the real live site while checking it.
 */
export function PreviewAsVisitor() {
  const { data } = useSiteDraft();

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading preview…
      </div>
    );
  }

  return (
    <>
      <SiteBody data={data} />
      <Link
        to="/edit"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 90,
          padding: '10px 18px',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--surface-glass)',
          backdropFilter: 'var(--blur-glass)',
          WebkitBackdropFilter: 'var(--blur-glass)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-muted)',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: 'var(--shadow-lg)',
          fontFamily: 'var(--font-body)',
        }}
      >
        👁 Previewing draft — not published · Back to editor
      </Link>
    </>
  );
}
