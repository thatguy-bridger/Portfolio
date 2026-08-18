import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScrollProgress } from '../components/ScrollProgress';
import { GroupRenderer } from '../components/GroupRenderer';
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

  // Scroll-snap is opt-in per group (HomepageGroup.scrollSnap); it only takes effect at the
  // document level once at least one visible group has it on, and never applies to the classic
  // (non-freeform) homepage layout.
  const snapEnabled = data.useFreeformHomepage && data.homepageGroups.some((g) => g.scrollSnap);
  useEffect(() => {
    document.documentElement.style.scrollSnapType = snapEnabled ? 'y proximity' : '';
    return () => {
      document.documentElement.style.scrollSnapType = '';
    };
  }, [snapEnabled]);

  const classicSections = [
    { id: 'hero', label: 'Intro' },
    { id: 'work', label: 'Work' },
    ...(data.blocks.length > 0 ? [{ id: 'content', label: 'More' }] : []),
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];
  const freeformSections = data.homepageGroups.map((g) => ({ id: g.id, label: g.name }));

  return (
    <>
      <ScrollProgress sections={data.useFreeformHomepage ? freeformSections : classicSections} />
      <main>
        {data.useFreeformHomepage ? (
          <GroupRenderer groups={data.homepageGroups} widgets={data.widgets} pages={data.pages} tiles={data.tiles} />
        ) : (
          <>
            <Hero hero={data.hero} />
            <WorkGrid tiles={data.tiles} />
            <PageContent blocks={data.blocks} widgets={data.widgets} />
            <About about={data.about} />
            <Contact contact={data.contact} />
          </>
        )}
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
