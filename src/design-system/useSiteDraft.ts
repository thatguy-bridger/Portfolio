import { useEffect, useRef, useState } from 'react';
import { getDraft, getPublished, publishDraft, saveDraft } from '../firebase/site';
import { useUndoHistory } from './useUndoHistory';
import type { SiteData } from '../data/siteData';

export type SaveStatus = 'loading' | 'idle' | 'saving' | 'saved' | 'error';

/**
 * Loads the site's draft (+ published, to know whether there's anything
 * unpublished) once, then debounced-autosaves any change back to it. Used
 * by every editing surface — the Builder and the Widget Studio alike —
 * since they're all just different views onto the same SiteData document.
 *
 * The draft also carries an in-memory undo/redo history (see
 * useUndoHistory) — per-session only, resetting on reload same as any
 * other editor's undo stack. Durable rollback across sessions is what
 * publish-time version history (see firebase/site.ts's siteVersions) is
 * for instead.
 */
export function useSiteDraft() {
  const { value: data, set: setData, undo, redo, canUndo, canRedo } = useUndoHistory<SiteData>(null, { bindKeyboard: true });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const hasUnpublished = data !== null && publishedJson !== JSON.stringify(data);

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

  return { data, setData, status, publishing, hasUnpublished, handlePublish, undo, redo, canUndo, canRedo };
}
