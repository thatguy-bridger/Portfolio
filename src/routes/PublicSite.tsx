import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScrollProgress } from '../components/ScrollProgress';
import { Hero } from '../sections/Hero';
import { WorkGrid } from '../sections/WorkGrid';
import { PageContent } from '../sections/PageContent';
import { About } from '../sections/About';
import { Contact } from '../sections/Contact';
import { DEFAULT_SITE_DATA, type SiteData } from '../data/siteData';
import { isFirebaseConfigured } from '../firebase/client';
import { subscribePublished } from '../firebase/site';
import { useApplyThemeFromData } from '../design-system/useApplyThemeFromData';
import { useAuth } from '../auth/AuthProvider';

export function PublicSite() {
  const [data, setData] = useState<SiteData>(DEFAULT_SITE_DATA);
  const { user } = useAuth();

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = subscribePublished((site) => {
      if (site) setData(site.data);
    });
    return unsub;
  }, []);

  useApplyThemeFromData(data);

  const sections = [
    { id: 'hero', label: 'Intro' },
    { id: 'work', label: 'Work' },
    ...(data.blocks.length > 0 ? [{ id: 'content', label: 'More' }] : []),
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <>
      <ScrollProgress sections={sections} />
      <main>
        <Hero hero={data.hero} />
        <WorkGrid tiles={data.tiles} />
        <PageContent blocks={data.blocks} />
        <About about={data.about} />
        <Contact contact={data.contact} />
      </main>
      <Link
        to={user ? '/edit' : '/login'}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 90,
          padding: '10px 18px',
          borderRadius: 'var(--radius-pill)',
          background: user ? 'var(--accent-primary)' : 'var(--surface-glass)',
          backdropFilter: user ? undefined : 'var(--blur-glass)',
          WebkitBackdropFilter: user ? undefined : 'var(--blur-glass)',
          border: user ? 'none' : '1px solid var(--border-default)',
          color: user ? '#fff' : 'var(--text-muted)',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: 'var(--shadow-lg)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {user ? 'Edit this site' : 'Sign in'}
      </Link>
    </>
  );
}
