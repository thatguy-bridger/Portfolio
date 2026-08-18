import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GroupRenderer } from '../components/GroupRenderer';
import { DEFAULT_SITE_DATA, type SiteData } from '../data/siteData';
import { isFirebaseConfigured } from '../firebase/client';
import { subscribePublished } from '../firebase/site';
import { useApplyThemeFromData } from '../design-system/useApplyThemeFromData';

/**
 * A custom page — rendered through the exact same freeform GroupRenderer
 * the homepage uses, so every page a visitor lands on looks and behaves
 * consistently, and what the owner sees while editing is what's actually
 * published here.
 */
export function ProjectPage() {
  const { '*': path } = useParams<{ '*': string }>();
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

  const page = data?.pages.find((p) => p.path === path);

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', padding: '64px 24px', fontFamily: 'var(--font-body)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div style={{ minHeight: '100vh', padding: '64px 24px', maxWidth: 760, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
        <Link to="/" style={{ fontSize: 13, color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to portfolio
        </Link>
        <div style={{ marginTop: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-heading)' }}>Page not found</h1>
          <p style={{ color: 'var(--text-muted)' }}>This page hasn't been published yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      <div style={{ padding: '32px 24px 0', maxWidth: 1200, margin: '0 auto' }}>
        <Link to="/" style={{ fontSize: 13, color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to portfolio
        </Link>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: 'var(--text-heading)', margin: '24px 0 8px' }}>{page.title}</h1>
      </div>
      <GroupRenderer groups={page.groups} widgets={data?.widgets ?? []} pages={data?.pages ?? []} tiles={data?.tiles ?? []} />
    </div>
  );
}
