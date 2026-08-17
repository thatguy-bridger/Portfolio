import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Editable } from './Editable';
import { ImageInput } from './ImageInput';
import { Model3DInput } from './Model3DInput';
import { VideoInput } from './VideoInput';
import { GalleryBlockEditor, GalleryGrid } from './GalleryBlockEditor';
import { CroppedImage } from './CroppedImage';
import { ImageCropEditor } from './ImageCropEditor';
import { LinkEditor } from './LinkEditor';
import { TextStylePopover, effectsToStyle } from './TextStylePopover';
import { WidgetRenderer } from './widgets/WidgetRenderer';
import { WidgetInstanceValuesForm } from './widgets/WidgetInstanceValuesForm';
import { RepeaterRenderer, RepeaterBlockEditor } from './RepeaterBlock';
import { Button } from './ui/Button';
import { parseEmbedUrl, EMBED_ASPECT } from '../design-system/embeds';
import { useClickAway } from '../design-system/useClickAway';
import { newBlockId, type CustomPage, type PageBlock, type PageBlockType, type Widget } from '../data/siteData';

export const BLOCK_LABEL: Record<PageBlockType, string> = {
  heading: 'Heading',
  text: 'Text',
  image: 'Photo',
  button: 'Button',
  divider: 'Divider',
  model3d: '3D Model',
  widget: 'Widget',
  video: 'Video',
  gallery: 'Gallery',
  embed: 'Embed',
  code: 'Custom Code',
  repeater: 'Repeater',
};

export function newBlock(type: PageBlockType): PageBlock {
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
    case 'model3d':
      return base;
    case 'widget':
      return base;
    case 'video':
      return base;
    case 'gallery':
      return { ...base, galleryImages: [] };
    case 'embed':
      return base;
    case 'code':
      return { ...base, codeHtml: '' };
    case 'repeater':
      return { ...base, repeaterMode: 'manual', repeaterItems: [], repeaterColumns: 3 };
  }
}

// Three.js is a heavy dependency (the loader + renderer alone are several
// hundred KB) — loaded only when a page actually has a 3D block, not as
// part of the main bundle every visitor downloads.
const Model3DViewer = lazy(() => import('./Model3DViewer').then((m) => ({ default: m.Model3DViewer })));

/** Legacy size-tier px values — still used as the fallback when a block has no explicit fontSizePx, so old content keeps its original size. */
const LEGACY_HEADING_PX: Record<'sm' | 'md' | 'lg' | 'xl', number> = { sm: 16, md: 20, lg: 32, xl: 48 };
const LEGACY_TEXT_PX: Record<'sm' | 'md' | 'lg' | 'xl', number> = { sm: 17, md: 20, lg: 28, xl: 40 };

/**
 * The "+ Add block" trigger and its dropdown. The dropdown is portaled to
 * document.body with fixed positioning (computed from the trigger's rect)
 * so it always escapes any scrollable ancestor — a modal's overflow:auto
 * content area would otherwise clip an absolutely-positioned dropdown,
 * silently hiding the menu items. Shared by PageBlocks (flow-list layout)
 * and GroupCanvas (freeform layout) — same block types, same trigger.
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

/** Direct numeric font-size control — replaces the old SM/MD/LG/XL picker with an input that can scale to any size. */
function FontSizeInput({ value, onChange }: { value: number; onChange: (px: number) => void }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
      <input
        type="number"
        min={8}
        max={200}
        value={Math.round(value)}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(Math.max(8, Math.min(200, n)));
        }}
        style={{
          width: 52,
          padding: '3px 6px',
          borderRadius: 6,
          border: '1px solid var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-heading)',
          fontSize: 13,
        }}
      />
      px
    </label>
  );
}

/**
 * Renders a single block's content — heading through repeater — with no
 * opinion about its position or surrounding chrome (move/remove controls,
 * layout). Shared by PageBlocks (the flow-list layout used on the Page
 * Content section and custom pages) and GroupCanvas (the freeform
 * pixel-positioned homepage canvas), so every block type behaves
 * identically in both places.
 */
export function BlockContent({
  block: b,
  editable,
  onUpdate,
  pages,
  widgets,
}: {
  block: PageBlock;
  editable: boolean;
  onUpdate: (patch: Partial<PageBlock>) => void;
  pages?: CustomPage[];
  widgets?: Widget[];
}) {
  const [adjustingCrop, setAdjustingCrop] = useState(false);
  const navigate = useNavigate();

  switch (b.type) {
    case 'heading': {
      const fontSize = b.fontSizePx ?? LEGACY_HEADING_PX[b.size ?? 'lg'];
      return (
        <div>
          {editable && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <FontSizeInput value={fontSize} onChange={(fontSizePx) => onUpdate({ fontSizePx })} />
              <TextStylePopover value={b.textEffects} onChange={(textEffects) => onUpdate({ textEffects })} />
            </div>
          )}
          <Editable
            editable={editable}
            as="h2"
            value={b.content ?? ''}
            onCommit={(v) => onUpdate({ content: v })}
            style={{ fontSize, fontWeight: 700, color: 'var(--text-heading)', ...effectsToStyle(b.textEffects) }}
          />
        </div>
      );
    }

    case 'text': {
      const fontSize = b.fontSizePx ?? LEGACY_TEXT_PX[b.size ?? 'md'];
      return (
        <div>
          {editable && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <FontSizeInput value={fontSize} onChange={(fontSizePx) => onUpdate({ fontSizePx })} />
              <TextStylePopover value={b.textEffects} onChange={(textEffects) => onUpdate({ textEffects })} />
            </div>
          )}
          <Editable
            editable={editable}
            as="p"
            multiline
            value={b.content ?? ''}
            onCommit={(v) => onUpdate({ content: v })}
            style={{
              fontSize,
              lineHeight: 1.6,
              color: 'var(--text-body)',
              fontFamily: 'var(--font-body)',
              margin: 0,
              ...effectsToStyle(b.textEffects),
            }}
          />
        </div>
      );
    }

    case 'image':
      return (
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
                onSelect={(src, width, height) => onUpdate({ src, width, height, crop: undefined })}
              />
              {b.src && (
                <button
                  type="button"
                  onClick={() => setAdjustingCrop((v) => !v)}
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
                  {adjustingCrop ? 'Done adjusting' : '⤢ Adjust photo'}
                </button>
              )}
            </div>
          )}
          {editable && adjustingCrop && b.src && (
            <div style={{ marginTop: 8 }}>
              <ImageCropEditor src={b.src} crop={b.crop} width={b.width} height={b.height} onChange={(crop) => onUpdate({ crop })} />
            </div>
          )}
        </div>
      );

    case 'button':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
          {editable ? (
            <>
              <Editable
                editable
                value={b.label ?? ''}
                onCommit={(v) => onUpdate({ label: v })}
                style={{ fontSize: 14, fontWeight: 600, padding: '11px 22px', borderRadius: 'var(--radius-pill)', background: 'var(--accent-primary)', color: '#fff' }}
              />
              <div style={{ maxWidth: 320 }}>
                <LinkEditor value={b.link ?? { type: 'none' }} onChange={(link) => onUpdate({ link })} pages={pages} />
              </div>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                if (b.link?.type === 'external' && b.link.url) window.open(b.link.url, '_blank', 'noopener,noreferrer');
                else if (b.link?.type === 'internal' && b.link.path) navigate(`/${b.link.path}`);
              }}
            >
              {b.label || 'Button'}
            </Button>
          )}
        </div>
      );

    case 'divider':
      return <hr style={{ border: 'none', borderTop: '1px solid var(--border-default)', margin: 0 }} />;

    case 'model3d':
      return (
        <div>
          {b.modelSrc && b.modelFormat ? (
            <Suspense
              fallback={
                <div style={{ height: 380, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Loading viewer…
                </div>
              }
            >
              <Model3DViewer src={b.modelSrc} format={b.modelFormat} />
            </Suspense>
          ) : editable ? (
            <div
              style={{
                height: 200,
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              No 3D model yet
            </div>
          ) : null}
          {editable && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <Model3DInput
                label={b.modelSrc ? 'Replace model' : '+ 3D model'}
                onSelect={(modelSrc, modelFormat, modelFileName) => onUpdate({ modelSrc, modelFormat, modelFileName })}
              />
              {b.modelFileName && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.modelFileName}</span>}
            </div>
          )}
        </div>
      );

    case 'widget': {
      const widget = widgets?.find((w) => w.id === b.widgetId);
      return (
        <div>
          {widget ? (
            <WidgetRenderer widget={widget} instanceValues={b.widgetValues} />
          ) : editable ? (
            <div
              style={{
                height: 160,
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              {widgets && widgets.length > 0 ? 'Pick a widget below' : 'No widgets yet — build one in Widget Studio'}
            </div>
          ) : null}
          {editable && (
            <div style={{ marginTop: 8 }}>
              <select
                value={b.widgetId ?? ''}
                onChange={(e) => onUpdate({ widgetId: e.target.value || undefined, widgetValues: {} })}
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-heading)',
                  fontSize: 13,
                }}
              >
                <option value="">— Choose a widget —</option>
                {(widgets ?? []).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              {widget && (
                <WidgetInstanceValuesForm widget={widget} values={b.widgetValues ?? {}} onChange={(widgetValues) => onUpdate({ widgetValues })} />
              )}
            </div>
          )}
        </div>
      );
    }

    case 'repeater':
      return editable ? (
        <RepeaterBlockEditor block={b} widgets={widgets ?? []} onChange={onUpdate} />
      ) : (
        <RepeaterRenderer block={b} widgets={widgets ?? []} />
      );

    case 'video':
      return (
        <div>
          {b.videoSrc ? (
            <video src={b.videoSrc} controls style={{ width: '100%', borderRadius: 'var(--radius-md)', display: 'block', background: '#000' }} />
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
              No video yet
            </div>
          ) : null}
          {editable && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <VideoInput label={b.videoSrc ? 'Replace video' : '+ Video'} onSelect={(videoSrc, videoFileName) => onUpdate({ videoSrc, videoFileName })} />
              {b.videoFileName && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.videoFileName}</span>}
            </div>
          )}
        </div>
      );

    case 'gallery':
      return editable ? (
        <GalleryBlockEditor images={b.galleryImages ?? []} onChange={(galleryImages) => onUpdate({ galleryImages })} />
      ) : (
        <GalleryGrid images={b.galleryImages ?? []} />
      );

    case 'embed': {
      const parsed = b.embedUrl ? parseEmbedUrl(b.embedUrl) : null;
      return (
        <div>
          {parsed ? (
            <iframe
              src={parsed.embedSrc}
              style={{ width: '100%', aspectRatio: EMBED_ASPECT[parsed.kind], border: 'none', borderRadius: 'var(--radius-md)', display: 'block' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
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
                textAlign: 'center',
                padding: 16,
              }}
            >
              Paste a link below to embed it
            </div>
          ) : null}
          {editable && (
            <input
              value={b.embedUrl ?? ''}
              onChange={(e) => onUpdate({ embedUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=… , a Maps link, or any embeddable URL"
              style={{
                marginTop: 8,
                width: '100%',
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-heading)',
                fontSize: 13,
              }}
            />
          )}
          {editable && b.embedUrl && !parsed && <div style={{ fontSize: 11, color: 'var(--red-500)', marginTop: 4 }}>Not a valid URL.</div>}
        </div>
      );
    }

    case 'code':
      return (
        <div>
          {editable ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={b.codeHtml ?? ''}
                onChange={(e) => onUpdate({ codeHtml: e.target.value })}
                placeholder="<div>Any HTML, CSS (in a <style> tag), or JS (in a <script> tag)…</div>"
                rows={6}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-heading)',
                  fontSize: 12,
                  fontFamily: 'ui-monospace, monospace',
                  resize: 'vertical',
                }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Runs sandboxed in its own frame — it can't access the rest of your site.</div>
              {b.codeHtml && (
                <iframe
                  title="Custom code preview"
                  srcDoc={b.codeHtml}
                  sandbox="allow-scripts allow-popups"
                  style={{ width: '100%', minHeight: 160, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: '#fff' }}
                />
              )}
            </div>
          ) : b.codeHtml ? (
            <iframe title="Custom code" srcDoc={b.codeHtml} sandbox="allow-scripts allow-popups" style={{ width: '100%', minHeight: 160, border: 'none', display: 'block' }} />
          ) : null}
        </div>
      );
  }
}
