import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScrollProgress } from '../components/ScrollProgress';
import { Hero } from '../sections/Hero';
import { WorkGrid } from '../sections/WorkGrid';
import { About } from '../sections/About';
import { Contact } from '../sections/Contact';
import { DEFAULT_SITE_DATA, type SiteData } from '../data/siteData';
import { isFirebaseConfigured } from '../firebase/client';
import { subscribePublished } from '../firebase/site';
import { useApplyThemeFromData } from '../design-system/useApplyThemeFromData';
import { useAuth } from '../auth/AuthProvider';

const SECTIONS = [
  { id: 'hero', label: 'Intro' },
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

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

  return (
    <>
      <ScrollProgress sections={SECTIONS} />
      <main>
        <Hero hero={data.hero} />
        <WorkGrid tiles={data.tiles} />
        <About about={data.about} />
        <Contact contact={data.contact} />
      </main>
      {user && (
        <Link
          to="/edit"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 90,
            padding: '10px 18px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--accent-primary)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: 'var(--shadow-lg)',
            fontFamily: 'var(--font-body)',
          }}
        >
          Edit this site
        </Link>
      )}
    </>
  );
}
