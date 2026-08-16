import { useState } from 'react';
import { Editable } from './Editable';
import { ImageInput } from './ImageInput';
import { CroppedImage } from './CroppedImage';
import { ImageCropEditor } from './ImageCropEditor';
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
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  function updateEl(id: string, patch: Partial<TileElement>) {
    onChange?.(elements.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function removeEl(id: string) {
    onChange?.(elements.filter((e) => e.id !== id));
    if (adjustingId === id) setAdjustingId(null);
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
            <div>
              <CroppedImage src={el.src} alt={el.alt} crop={el.crop} />
              {editable && (
                <button
                  type="button"
                  onClick={() => setAdjustingId(adjustingId === el.id ? null : el.id)}
                  style={{
                    marginTop: 6,
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
                  {adjustingId === el.id ? 'Done adjusting' : '⤢ Adjust photo'}
                </button>
              )}
              {editable && adjustingId === el.id && el.src && (
                <div style={{ marginTop: 8 }}>
                  <ImageCropEditor src={el.src} crop={el.crop} onChange={(crop) => updateEl(el.id, { crop })} />
                </div>
              )}
            </div>
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
