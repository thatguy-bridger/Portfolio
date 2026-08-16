import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageBlocks } from '../components/PageBlocks';
import { DEFAULT_SITE_DATA, type SiteData } from '../data/siteData';
import { isFirebaseConfigured } from '../firebase/client';
import { subscribePublished } from '../firebase/site';
import { useApplyThemeFromData } from '../design-system/useApplyThemeFromData';

export function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<SiteData | null>(null);
  const [loaded, setLoaded] = useState(!isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = subscribePublished((site) => {
      setData(site ? site.data : DEFAULT_SITE_DATA);
      setLoaded(true);
    });
    return unsub;
  }, []);

  useApplyThemeFromData(data ?? DEFAULT_SITE_DATA);

  const page = data?.pages.find((p) => p.slug === slug);

  return (
    <div style={{ minHeight: '100vh', padding: '64px 24px 96px', maxWidth: 760, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <Link to="/" style={{ fontSize: 13, color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
        ← Back to portfolio
      </Link>
      {!loaded ? (
        <p style={{ color: 'var(--text-muted)', marginTop: 40 }}>Loading…</p>
      ) : page ? (
        <>
          <h1 style={{ fontSize: 40, fontWeight: 700, color: 'var(--text-heading)', margin: '24px 0 32px' }}>{page.title}</h1>
          <PageBlocks blocks={page.blocks} editable={false} />
        </>
      ) : (
        <div style={{ marginTop: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)' }}>Page not found</h1>
          <p style={{ color: 'var(--text-muted)' }}>This page hasn't been published yet.</p>
        </div>
      )}
    </div>
  );
}
