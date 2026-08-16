import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Editable } from './Editable';
import { ImageInput } from './ImageInput';
import { CroppedImage } from './CroppedImage';
import { ImageCropEditor } from './ImageCropEditor';
import { LinkEditor } from './LinkEditor';
import { TextStylePopover, effectsToStyle } from './TextStylePopover';
import { Button } from './ui/Button';
import { FONT_LIBRARY, loadFont } from '../design-system/fonts';
import { useClickAway } from '../design-system/useClickAway';
import { newBlockId, type CustomPage, type PageBlock, type PageBlockType } from '../data/siteData';

const BLOCK_LABEL: Record<PageBlockType, string> = {
  heading: 'Heading',
  text: 'Text',
  image: 'Photo',
  button: 'Button',
  divider: 'Divider',
};

const SIZE_PX: Record<'sm' | 'md' | 'lg' | 'xl', number> = { sm: 16, md: 20, lg: 32, xl: 48 };
const SIZES: Array<'sm' | 'md' | 'lg' | 'xl'> = ['sm', 'md', 'lg', 'xl'];

function newBlock(type: PageBlockType): PageBlock {
  const base = { id: newBlockId(), type };
  switch (type) {
    case 'heading':
      return { ...base, content: 'New heading', size: 'lg' };
    case 'text':
      return { ...base, content: 'Write something here.', size: 'md' };
    case 'image':
      return { ...base, alt: '' };
    case 'button':
      return { ...base, label: 'Click me', link: { type: 'none' } };
    case 'divider':
      return base;
  }
}

function SizePicker({ value, onChange }: { value: 'sm' | 'md' | 'lg' | 'xl'; onChange: (s: 'sm' | 'md' | 'lg' | 'xl') => void }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, marginBottom: 6 }}>
      {SIZES.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          style={{
            border: 'none',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            cursor: 'pointer',
            background: value === s ? 'var(--accent-primary)' : 'var(--surface-card)',
            color: value === s ? '#fff' : 'var(--text-muted)',
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

/**
 * The "+ Add block" trigger and its dropdown. The dropdown is portaled to
 * document.body with fixed positioning (computed from the trigger's rect)
 * so it always escapes any scrollable ancestor — a modal's overflow:auto
 * content area would otherwise clip an absolutely-positioned dropdown,
 * silently hiding the menu items.
 */
function AddBlockMenu({ onAdd }: { onAdd: (type: PageBlockType) => void }) {
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
}: {
  blocks: PageBlock[];
  editable: boolean;
  onChange?: (blocks: PageBlock[]) => void;
  /** Existing custom pages, offered as link suggestions for button blocks. */
  pages?: CustomPage[];
}) {
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const navigate = useNavigate();

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

          {b.type === 'heading' && (
            <div>
              {editable && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <SizePicker value={b.size ?? 'lg'} onChange={(size) => update(b.id, { size })} />
                  <TextStylePopover value={b.textEffects} onChange={(textEffects) => update(b.id, { textEffects })} />
                </div>
              )}
              <Editable
                editable={editable}
                as="h2"
                value={b.content ?? ''}
                onCommit={(v) => update(b.id, { content: v })}
                style={{ fontSize: SIZE_PX[b.size ?? 'lg'], fontWeight: 700, color: 'var(--text-heading)', ...effectsToStyle(b.textEffects) }}
              />
            </div>
          )}

          {b.type === 'text' && (
            <div>
              {editable && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <SizePicker value={b.size ?? 'md'} onChange={(size) => update(b.id, { size })} />
                  <TextStylePopover value={b.textEffects} onChange={(textEffects) => update(b.id, { textEffects })} />
                </div>
              )}
              <Editable
                editable={editable}
                as="p"
                multiline
                value={b.content ?? ''}
                onCommit={(v) => update(b.id, { content: v })}
                style={{
                  fontSize: SIZE_PX[b.size ?? 'md'] * 0.7 + 6,
                  lineHeight: 1.6,
                  color: 'var(--text-body)',
                  fontFamily: 'var(--font-body)',
                  margin: 0,
                  ...effectsToStyle(b.textEffects),
                }}
              />
            </div>
          )}

          {b.type === 'image' && (
            <div>
              {b.src ? (
                <CroppedImage src={b.src} alt={b.alt} crop={b.crop} width={b.width} height={b.height} />
              ) : editable ? (
                <div
                  style={{
                    aspectRatio: '16 / 9',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-strong)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                  }}
                >
                  No photo yet
                </div>
              ) : null}
              {editable && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <ImageInput
                    label={b.src ? 'Replace photo' : '+ Photo'}
                    onSelect={(src, width, height) => update(b.id, { src, width, height, crop: undefined })}
                  />
                  {b.src && (
                    <button
                      type="button"
                      onClick={() => setAdjustingId(adjustingId === b.id ? null : b.id)}
                      style={{
                        border: 'none',
                        borderRadius: 'var(--radius-pill)',
                        padding: '3px 12px',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: 'var(--surface-card)',
                        color: 'var(--text-body)',
                      }}
                    >
                      {adjustingId === b.id ? 'Done adjusting' : '⤢ Adjust photo'}
                    </button>
                  )}
                </div>
              )}
              {editable && adjustingId === b.id && b.src && (
                <div style={{ marginTop: 8 }}>
                  <ImageCropEditor src={b.src} crop={b.crop} width={b.width} height={b.height} onChange={(crop) => update(b.id, { crop })} />
                </div>
              )}
            </div>
          )}

          {b.type === 'button' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
              {editable ? (
                <>
                  <Editable
                    editable
                    value={b.label ?? ''}
                    onCommit={(v) => update(b.id, { label: v })}
                    style={{ fontSize: 14, fontWeight: 600, padding: '11px 22px', borderRadius: 'var(--radius-pill)', background: 'var(--accent-primary)', color: '#fff' }}
                  />
                  <div style={{ maxWidth: 320 }}>
                    <LinkEditor value={b.link ?? { type: 'none' }} onChange={(link) => update(b.id, { link })} pages={pages} />
                  </div>
                </>
              ) : (
                <Button variant="primary" onClick={() => {
                  if (b.link?.type === 'external' && b.link.url) window.open(b.link.url, '_blank', 'noopener,noreferrer');
                  else if (b.link?.type === 'internal' && b.link.path) navigate(`/${b.link.path}`);
                }}>
                  {b.label || 'Button'}
                </Button>
              )}
            </div>
          )}

          {b.type === 'divider' && <hr style={{ border: 'none', borderTop: '1px solid var(--border-default)', margin: 0 }} />}
        </div>
      ))}

      {editable && <AddBlockMenu onAdd={addBlock} />}
    </div>
  );
}
