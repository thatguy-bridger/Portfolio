import { Editable } from './Editable';
import { ImageInput } from './ImageInput';
import { newElementId, type TileElement } from '../data/siteData';

/**
 * A simple ordered stack of text/image blocks — the "slides-but-simplified"
 * content unit. No freeform x/y placement; elements just stack top to
 * bottom. Used for both card-face content and full project pages, in both
 * editable (with add/remove controls) and read-only form.
 */
export function TileElements({
  elements,
  editable,
  onChange,
}: {
  elements: TileElement[];
  editable: boolean;
  onChange?: (elements: TileElement[]) => void;
}) {
  function updateEl(id: string, patch: Partial<TileElement>) {
    onChange?.(elements.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function removeEl(id: string) {
    onChange?.(elements.filter((e) => e.id !== id));
  }

  function addText() {
    onChange?.([...elements, { id: newElementId(), type: 'text', content: 'New text' }]);
  }

  function addImage(src: string) {
    onChange?.([...elements, { id: newElementId(), type: 'image', src, alt: '' }]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {elements.map((el) => (
        <div key={el.id} style={{ position: 'relative' }}>
          {el.type === 'text' ? (
            <Editable
              editable={editable}
              as="p"
              multiline
              value={el.content ?? ''}
              onCommit={(v) => updateEl(el.id, { content: v })}
              style={{ margin: 0, fontSize: 14, color: 'var(--text-body)', fontFamily: 'var(--font-body)' }}
            />
          ) : (
            <img
              src={el.src}
              alt={el.alt ?? ''}
              style={{ width: '100%', display: 'block', borderRadius: 'var(--radius-md)' }}
            />
          )}
          {editable && (
            <button
              onClick={() => removeEl(el.id)}
              title="Remove"
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: 'none',
                background: 'var(--red-600)',
                color: '#fff',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {editable && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={addText}
            style={{
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '3px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              background: 'var(--surface-card)',
              color: 'var(--text-body)',
            }}
          >
            + Text
          </button>
          <ImageInput onSelect={addImage} />
        </div>
      )}
    </div>
  );
}
