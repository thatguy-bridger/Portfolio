import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { BlockContent, BLOCK_LABEL, newBlock } from './BlockContent';
import { Button } from './ui/Button';
import { FONT_LIBRARY, loadFont } from '../design-system/fonts';
import { useClickAway } from '../design-system/useClickAway';
import type { CustomPage, PageBlock, PageBlockType, Widget } from '../data/siteData';

/**
 * The "+ Add block" trigger and its dropdown. The dropdown is portaled to
 * document.body with fixed positioning (computed from the trigger's rect)
 * so it always escapes any scrollable ancestor — a modal's overflow:auto
 * content area would otherwise clip an absolutely-positioned dropdown,
 * silently hiding the menu items.
 */
export function AddBlockMenu({ onAdd }: { onAdd: (type: PageBlockType) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
    setOpen((o) => !o);
  }

  const close = () => setOpen(false);
  useClickAway(open, [btnRef, panelRef], close);

  useEffect(() => {
    if (!open) return;
    // Scroll position can change (page or an ancestor modal) while the menu
    // is open; rather than tracking it live, just close so it never drifts.
    document.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <div style={{ position: 'relative' }}>
      <Button ref={btnRef} variant="ghost" size="sm" onClick={toggle}>
        + Add block
      </Button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              zIndex: 300,
              background: 'var(--surface-glass)',
              backdropFilter: 'var(--blur-glass)',
              WebkitBackdropFilter: 'var(--blur-glass)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: 6,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 140,
            }}
          >
            {(Object.keys(BLOCK_LABEL) as PageBlockType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  onAdd(type);
                  setOpen(false);
                }}
                style={{
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  color: 'var(--text-body)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-card)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                + {BLOCK_LABEL[type]}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

function BlockControls({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const btn: React.CSSProperties = {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: 'none',
    fontSize: 10,
    cursor: 'pointer',
    background: 'var(--surface-card)',
    color: 'var(--text-body)',
  };
  return (
    <div style={{ position: 'absolute', top: -8, right: -8, display: 'flex', gap: 4, zIndex: 2 }}>
      <button style={btn} disabled={index === 0} onClick={() => onMove(-1)} title="Move up">
        ↑
      </button>
      <button style={btn} disabled={index === count - 1} onClick={() => onMove(1)} title="Move down">
        ↓
      </button>
      <button style={{ ...btn, background: 'var(--red-600)', color: '#fff' }} onClick={onRemove} title="Remove">
        ✕
      </button>
    </div>
  );
}

export function PageBlocks({
  blocks,
  editable,
  onChange,
  pages,
  widgets,
}: {
  blocks: PageBlock[];
  editable: boolean;
  onChange?: (blocks: PageBlock[]) => void;
  /** Existing custom pages, offered as link suggestions for button blocks. */
  pages?: CustomPage[];
  /** The widget library, for "widget" blocks to pick from and render. */
  widgets?: Widget[];
}) {
  // Any block using a per-block font override needs that font's stylesheet loaded,
  // for readers too — not just while editing.
  useEffect(() => {
    for (const b of blocks) {
      const fontId = b.textEffects?.fontId;
      if (!fontId) continue;
      const font = FONT_LIBRARY.find((f) => f.id === fontId);
      if (font) loadFont(font);
    }
  }, [blocks]);

  function update(id: string, patch: Partial<PageBlock>) {
    onChange?.(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function remove(id: string) {
    onChange?.(blocks.filter((b) => b.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    const idx = blocks.findIndex((b) => b.id === id);
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange?.(next);
  }

  function addBlock(type: PageBlockType) {
    onChange?.([...blocks, newBlock(type)]);
  }

  if (!editable && blocks.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {blocks.map((b, i) => (
        <div key={b.id} style={{ position: 'relative' }}>
          {editable && <BlockControls index={i} count={blocks.length} onMove={(dir) => move(b.id, dir)} onRemove={() => remove(b.id)} />}
          <BlockContent block={b} editable={editable} onUpdate={(patch) => update(b.id, patch)} pages={pages} widgets={widgets} />
        </div>
      ))}

      {editable && <AddBlockMenu onAdd={addBlock} />}
    </div>
  );
}
