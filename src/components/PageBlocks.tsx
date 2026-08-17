import { useEffect } from 'react';
import { BlockContent, AddBlockMenu, newBlock } from './BlockContent';
import { FONT_LIBRARY, loadFont } from '../design-system/fonts';
import type { CustomPage, PageBlock, PageBlockType, Widget } from '../data/siteData';

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
