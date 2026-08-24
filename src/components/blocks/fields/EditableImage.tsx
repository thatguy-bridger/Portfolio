import { useState } from 'react';
import { createPortal } from 'react-dom';
import { MediaLibrary } from '../../admin/MediaLibrary';

/**
 * Click-to-edit-directly-on-the-canvas image field. Clicking the image (or
 * its empty placeholder) opens a small inline popover to paste an image URL,
 * upload straight to the Supabase media library, or pick a previously
 * uploaded image via "Choose from library" (Phase 4) — every path ends by
 * calling `commit()` with a real URL, so this component itself doesn't care
 * where the URL came from.
 */
export function EditableImage({
  value,
  onChange,
  alt,
  style,
  emptyLabel = 'Click to add an image',
}: {
  value: string;
  onChange: (url: string) => void;
  alt?: string;
  style?: React.CSSProperties;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [libraryOpen, setLibraryOpen] = useState(false);

  function openPopover() {
    // Deliberately no stopPropagation on the pointerdown that calls this —
    // see the identical note in EditableText.tsx: letting it bubble to the
    // block wrapper also selects the block, so its handles show up at the
    // same time the image-edit popover opens.
    setDraft(value);
    setOpen(true);
  }

  function commit(url: string) {
    onChange(url);
    setOpen(false);
    setLibraryOpen(false);
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {value ? (
        <img
          src={value}
          alt={alt ?? ''}
          onPointerDown={openPopover}
          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block', ...style }}
        />
      ) : (
        <button
          type="button"
          onPointerDown={openPopover}
          onClick={(e) => e.preventDefault()}
          style={{
            width: '100%',
            height: '100%',
            minHeight: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px dashed var(--border-default)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-panel)',
            color: 'var(--text-muted)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {emptyLabel}
        </button>
      )}

      {open && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 6,
            zIndex: 3000,
            width: 260,
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            background: 'var(--surface-panel)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(draft);
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder="Paste an image URL…"
            style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-heading)', fontSize: 12 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => commit(draft)} style={panelButtonStyle(true)}>Use URL</button>
            <button type="button" onClick={() => setLibraryOpen(true)} style={panelButtonStyle(false)}>Choose from library…</button>
          </div>
          {value && (
            <button type="button" onClick={() => commit('')} style={{ ...panelButtonStyle(false), color: '#ef4444' }}>
              Remove image
            </button>
          )}
          <button type="button" onClick={() => setOpen(false)} style={{ alignSelf: 'flex-end', border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      )}

      {libraryOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 5000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)',
              padding: 20,
            }}
            onClick={() => setLibraryOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(560px, 100%)',
                maxHeight: '80vh',
                overflowY: 'auto',
                padding: 16,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--surface-panel)',
                border: '1px solid var(--border-default)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>Media library</h3>
              <MediaLibrary mode="picker" onSelect={commit} onClose={() => setLibraryOpen(false)} />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function panelButtonStyle(primary: boolean): React.CSSProperties {
  return {
    flex: 1,
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    padding: '5px 8px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    background: primary ? 'var(--accent-gradient)' : 'var(--surface-card)',
    color: primary ? '#fff' : 'var(--text-body)',
  };
}
