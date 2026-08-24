// Local, backend-free harness for the block registry + freeform canvas
// (Phase 2 deliverable #5) — all state lives in this component (plus a
// localStorage mirror purely for convenience across reloads); nothing here
// talks to Supabase or Firebase. NOT linked from the real public site or
// /admin. See src/pages/dev/canvas-demo.astro for the route this mounts on.
//
// Phase 4 wired this same editing surface (CanvasEditor + PublicPage) to the
// real Supabase `pages` table — see src/components/admin/PageEditor.tsx and
// /admin/pages/[id]. This file intentionally stays a standalone,
// backend-free demo rather than being replaced by that; it's still useful
// as a no-auth-required harness for exercising the canvas/registry alone.
import { useEffect, useState } from 'react';
import { createSection } from '../../lib/blocks/registry';
import { createDemoSections } from '../../lib/blocks/demoData';
import type { PageSection } from '../../lib/blocks/types';
import { CanvasEditor } from '../canvas/CanvasEditor';
import { PublicPage } from '../render/PublicPage';

const STORAGE_KEY = 'phase2-canvas-demo-v1';

function loadInitial(): PageSection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PageSection[];
  } catch {
    // localStorage unavailable (private mode, etc.) — fall through to the seed data.
  }
  return createDemoSections();
}

export function CanvasDemo() {
  const [sections, setSections] = useState<PageSection[]>(createDemoSections);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage only after mount — SSR/first client render
  // must match, and localStorage isn't available during Astro's server render.
  useEffect(() => {
    setSections(loadInitial());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
    } catch {
      // best-effort only
    }
  }, [sections, hydrated]);

  const active = sections[activeIndex] ?? sections[0];

  function updateActiveBlocks(blocks: PageSection['blocks']) {
    setSections((prev) => prev.map((s, i) => (i === activeIndex ? { ...s, blocks } : s)));
  }
  function updateActiveMeta(patch: Partial<PageSection>) {
    setSections((prev) => prev.map((s, i) => (i === activeIndex ? { ...s, ...patch } : s)));
  }
  function addSection() {
    const s = createSection(`Section ${sections.length + 1}`);
    setSections((prev) => [...prev, s]);
    setActiveIndex(sections.length);
  }
  function removeSection(i: number) {
    if (sections.length <= 1) return;
    setSections((prev) => prev.filter((_, idx) => idx !== i));
    setActiveIndex((idx) => Math.max(0, idx === i ? idx - 1 : idx > i ? idx - 1 : idx));
  }
  function resetDemo() {
    if (!confirm('Reset the demo back to its seeded starter content? This discards anything you changed here.')) return;
    setSections(createDemoSections());
    setActiveIndex(0);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1280, margin: '0 auto', padding: '24px 20px 80px' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-heading)' }}>Block canvas demo</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Local-only harness — nothing here is saved to Supabase. State lives in this browser tab (localStorage).
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ModeButton active={mode === 'edit'} onClick={() => setMode('edit')}>Edit</ModeButton>
          <ModeButton active={mode === 'preview'} onClick={() => setMode('preview')}>Preview as visitor</ModeButton>
          <button type="button" onClick={resetDemo} style={ghostBtn}>Reset demo</button>
        </div>
      </header>

      {mode === 'edit' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--border-default)', paddingBottom: 8 }}>
          {sections.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                data-testid={`section-tab-${i}`}
                onClick={() => setActiveIndex(i)}
                style={{
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '7px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: i === activeIndex ? 'var(--accent-gradient)' : 'var(--surface-card)',
                  color: i === activeIndex ? '#fff' : 'var(--text-body)',
                }}
              >
                {s.name}
              </button>
              {sections.length > 1 && (
                <button type="button" onClick={() => removeSection(i)} title="Remove section" style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, marginLeft: 2 }}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addSection} style={ghostBtn}>+ Section</button>
        </div>
      )}

      {mode === 'edit' && active && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            value={active.name}
            onChange={(e) => updateActiveMeta({ name: e.target.value })}
            style={{ fontSize: 13, fontWeight: 600, padding: '6px 10px', width: 240, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-heading)' }}
          />
          <CanvasEditor
            blocks={active.blocks}
            onChange={updateActiveBlocks}
            background={active.background}
            backgroundImage={active.backgroundImage}
            paddingY={active.paddingY}
            minHeight={active.minHeight}
          />
        </div>
      )}

      {mode === 'preview' && (
        <>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
            Phase 3 motion + sound is live in this preview only (never in Edit mode/the editor) — move the cursor near the
            hero button/image, watch the ambient field mesh react, and try the mute control bottom-right.
          </p>
          <div style={{ position: 'relative', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} data-testid="public-preview">
            <PublicPage sections={sections} />
          </div>
        </>
      )}
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 'none',
        borderRadius: 'var(--radius-pill)',
        padding: '8px 18px',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        background: active ? 'var(--accent-gradient)' : 'var(--surface-card)',
        color: active ? '#fff' : 'var(--text-body)',
      }}
    >
      {children}
    </button>
  );
}

const ghostBtn: React.CSSProperties = {
  border: '1px dashed var(--border-default)',
  borderRadius: 'var(--radius-pill)',
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  background: 'none',
  color: 'var(--text-body)',
};
