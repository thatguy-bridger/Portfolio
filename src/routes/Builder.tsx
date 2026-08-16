import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../sections/Hero';
import { WorkGrid } from '../sections/WorkGrid';
import { About } from '../sections/About';
import { Contact } from '../sections/Contact';
import { CustomizePanel } from '../components/CustomizePanel';
import { Button } from '../components/ui/Button';
import type { SiteData } from '../data/siteData';
import { getDraft, getPublished, publishDraft, saveDraft } from '../firebase/site';
import { useApplyThemeFromData } from '../design-system/useApplyThemeFromData';
import { useTheme } from '../design-system/theme';
import { useAuth } from '../auth/AuthProvider';

type SaveStatus = 'loading' | 'idle' | 'saving' | 'saved' | 'error';

export function Builder() {
  const { signOut } = useAuth();
  const theme = useTheme();
  const [data, setData] = useState<SiteData | null>(null);
  const [status, setStatus] = useState<SaveStatus>('loading');
  const [publishedJson, setPublishedJson] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    (async () => {
      const [draft, published] = await Promise.all([getDraft(), getPublished()]);
      setData(draft.data);
      setPublishedJson(published ? JSON.stringify(published.data) : null);
      setStatus('idle');
    })();
  }, []);

  useApplyThemeFromData(data);

  // Mirror theme-picker changes (accent/font) back into the draft. Compares
  // against the draft's own stored values rather than a "first run" flag, so
  // it's self-correcting regardless of when the initial theme application
  // (above) actually lands relative to this effect.
  useEffect(() => {
    if (!data) return;
    const changed =
      theme.accentId !== data.accentId ||
      theme.customAccentHex !== data.customAccentHex ||
      theme.displayFont.id !== data.displayFontId ||
      theme.bodyFont.id !== data.bodyFontId;
    if (!changed) return;
    setData((prev) =>
      prev && {
        ...prev,
        accentId: theme.accentId,
        customAccentHex: theme.customAccentHex,
        displayFontId: theme.displayFont.id,
        bodyFontId: theme.bodyFont.id,
      },
    );
  }, [theme.accentId, theme.customAccentHex, theme.displayFont.id, theme.bodyFont.id, data]);

  // Debounced autosave whenever the draft changes.
  useEffect(() => {
    if (!data) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    setStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await saveDraft(data);
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function handlePublish() {
    if (!data) return;
    setPublishing(true);
    try {
      await publishDraft(data);
      setPublishedJson(JSON.stringify(data));
    } finally {
      setPublishing(false);
    }
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading your site…
      </div>
    );
  }

  const hasUnpublished = publishedJson !== JSON.stringify(data);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 110,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 20px',
          background: 'var(--surface-glass)',
          backdropFilter: 'var(--blur-glass)',
          WebkitBackdropFilter: 'var(--blur-glass)',
          borderBottom: '1px solid var(--border-default)',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <strong style={{ color: 'var(--text-heading)' }}>Builder</strong>
          <SaveIndicator status={status} />
          {hasUnpublished && !publishing && (
            <span style={{ color: 'var(--orange-500)', fontWeight: 600 }}>Unpublished changes</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>
            View live site
          </Link>
          <Button variant="primary" size="sm" onClick={handlePublish} disabled={publishing || !hasUnpublished}>
            {publishing ? 'Publishing…' : 'Publish'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>

      <div style={{ paddingTop: 52 }}>
        <Hero hero={data.hero} editable onChange={(hero) => setData({ ...data, hero })} />
        <WorkGrid tiles={data.tiles} editable onChange={(tiles) => setData({ ...data, tiles })} />
        <About about={data.about} editable onChange={(about) => setData({ ...data, about })} />
        <Contact contact={data.contact} editable onChange={(contact) => setData({ ...data, contact })} />
      </div>
      <CustomizePanel />
    </>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const label = { loading: 'Loading…', idle: 'Up to date', saving: 'Saving…', saved: 'Saved', error: 'Save failed' }[status];
  const color = status === 'error' ? 'var(--red-500)' : 'var(--text-muted)';
  return <span style={{ color }}>{label}</span>;
}
