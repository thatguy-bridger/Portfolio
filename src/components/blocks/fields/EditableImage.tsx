import { useRef, useState } from 'react';

/**
 * Click-to-edit-directly-on-the-canvas image field. Clicking the image (or
 * its empty placeholder) opens a small inline popover to paste an image URL
 * or pick a local file — there's no real media library yet (that's Phase 4,
 * per QA_CHECKLIST.md), so a picked file is read to a data: URL client-side
 * rather than uploaded anywhere.
 * // TODO(phase-4-or-later): replace the data: URL file picker with a real
 * // upload to the Supabase `media_library` bucket once that phase wires it up.
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
  const fileRef = useRef<HTMLInputElement>(null);

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
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => commit(String(reader.result));
    reader.readAsDataURL(file);
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
            <button type="button" onClick={() => fileRef.current?.click()} style={panelButtonStyle(false)}>Upload file…</button>
            {value && (
              <button type="button" onClick={() => commit('')} style={{ ...panelButtonStyle(false), color: '#ef4444' }}>
                Remove
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
          <button type="button" onClick={() => setOpen(false)} style={{ alignSelf: 'flex-end', border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>
            Close
          </button>
        </div>
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
    background: primary ? 'var(--accent-primary)' : 'var(--surface-card)',
    color: primary ? '#fff' : 'var(--text-body)',
  };
}
