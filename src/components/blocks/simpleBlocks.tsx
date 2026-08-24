// The non-container block types' render components — one function per type,
// each implementing BlockComponentProps (types.ts). Registered into
// BLOCK_COMPONENTS by BlockRenderer.tsx, which is also where columns/
// carousel (the container types) live, since those need to render nested
// blocks recursively — see that file's comment on the circular-import shape.
import { EditableText } from './fields/EditableText';
import { EditableImage } from './fields/EditableImage';
import { type BlockComponentProps, str, bool } from './types';
import { scaledFontSize } from '../../lib/blocks/scale';

const HEADING_SIZE_PX: Record<string, number> = { normal: 40, large: 56, xlarge: 72 };

export function HeroBlockView({ props, editable, onFieldChange, scale = 1 }: BlockComponentProps) {
  const align = str(props, 'align', 'center') === 'left' ? 'left' : 'center';
  // The size preset dropdown (Normal/Large/XL) still picks the *base* size —
  // the box's own scale factor then multiplies that base, so the preset and
  // the resize-to-scale behavior compose instead of fighting each other.
  const baseSize = HEADING_SIZE_PX[str(props, 'headingSize', 'normal')] ?? HEADING_SIZE_PX.normal;
  const size = scaledFontSize(baseSize, scale, 18, 160);
  const eyebrowSize = scaledFontSize(13, scale, 10, 26);
  const subheadingSize = scaledFontSize(18, scale, 12, 42);
  const eyebrow = str(props, 'eyebrow');
  const subheading = str(props, 'subheading');
  if (!editable && !str(props, 'heading') && !eyebrow && !subheading) return null;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: align === 'center' ? 'center' : 'flex-start', textAlign: align, gap: 10, padding: '8px 4px' }}>
      {(editable || eyebrow) && (
        <EditableText
          value={eyebrow}
          onCommit={(v) => onFieldChange('eyebrow', v)}
          placeholder="Eyebrow"
          as="span"
          style={{ display: editable || eyebrow ? 'block' : 'none', fontSize: eyebrowSize, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-primary)' }}
        />
      )}
      <EditableText
        value={str(props, 'heading')}
        onCommit={(v) => onFieldChange('heading', v)}
        placeholder="Heading"
        as="h1"
        multiline
        style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.05, fontSize: size, color: 'var(--text-heading)', whiteSpace: 'pre-wrap' }}
      />
      {(editable || subheading) && (
        <EditableText
          value={subheading}
          onCommit={(v) => onFieldChange('subheading', v)}
          placeholder="Subheading"
          multiline
          style={{ maxWidth: 640, fontSize: subheadingSize, color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}
        />
      )}
    </div>
  );
}

export function RichTextBlockView({ props, editable, onFieldChange, scale = 1 }: BlockComponentProps) {
  const align = str(props, 'textAlign', 'left') === 'center' ? 'center' : 'left';
  const baseFontSize = { small: 14, normal: 16, large: 20 }[str(props, 'fontSize', 'normal')] ?? 16;
  const fontSize = scaledFontSize(baseFontSize, scale, 11, 48);
  const content = str(props, 'content');
  if (!editable && !content) return null;
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto', textAlign: align }}>
      <EditableText
        value={content}
        onCommit={(v) => onFieldChange('content', v)}
        placeholder="Write something here."
        multiline
        style={{ fontSize, lineHeight: 1.6, color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
}

export function ImageBlockView({ props, editable, onFieldChange }: BlockComponentProps) {
  const imageUrl = str(props, 'imageUrl');
  const caption = str(props, 'caption');
  const link = str(props, 'link');
  const rounded = str(props, 'corners', 'rounded') !== 'sharp';
  const shadow = bool(props, 'shadow', true);
  if (!editable && !imageUrl) return null;

  const img = (
    <div style={{ width: '100%', flex: 1, borderRadius: rounded ? 'var(--radius-md)' : 0, overflow: 'hidden', boxShadow: shadow ? 'var(--shadow-md)' : undefined }}>
      {editable ? (
        <EditableImage value={imageUrl} alt={str(props, 'alt')} onChange={(v) => onFieldChange('imageUrl', v)} />
      ) : (
        <img src={imageUrl} alt={str(props, 'alt')} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      )}
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {!editable && link ? <a href={link} style={{ flex: 1, display: 'block' }}>{img}</a> : img}
      {(editable || caption) && (
        <EditableText value={caption} onCommit={(v) => onFieldChange('caption', v)} placeholder="Caption (optional)" as="span" style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }} />
      )}
    </div>
  );
}

export function ImageTextBlockView({ props, editable, onFieldChange, narrow, scale = 1 }: BlockComponentProps) {
  const imageLeft = str(props, 'imagePosition', 'left') !== 'right';
  const gap = { sm: 12, md: 20, lg: 32 }[str(props, 'gap', 'lg')] ?? 32;
  const headingSize = scaledFontSize(26, scale, 15, 60);
  const imageUrl = str(props, 'imageUrl');
  const heading = str(props, 'heading');
  const body = str(props, 'body');
  if (!editable && !imageUrl && !heading && !body) return null;

  const imageCol = (
    <div style={narrow ? { width: '100%', aspectRatio: '4 / 3', borderRadius: 'var(--radius-md)', overflow: 'hidden' } : { flex: '1 1 0', minWidth: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden', alignSelf: 'stretch' }}>
      {editable ? <EditableImage value={imageUrl} alt={str(props, 'alt')} onChange={(v) => onFieldChange('imageUrl', v)} /> : imageUrl ? <img src={imageUrl} alt={str(props, 'alt')} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}
    </div>
  );
  const textCol = (
    <div style={{ flex: narrow ? undefined : '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
      <EditableText
        value={heading}
        onCommit={(v) => onFieldChange('heading', v)}
        placeholder="Heading"
        as="h3"
        style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: headingSize, fontWeight: 700, color: 'var(--text-heading)', whiteSpace: narrow ? 'normal' : 'nowrap', overflow: narrow ? 'visible' : 'hidden' }}
      />
      <EditableText value={body} onCommit={(v) => onFieldChange('body', v)} placeholder="Body copy" multiline style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-body)', whiteSpace: 'pre-wrap' }} />
    </div>
  );

  return (
    <div style={{ width: '100%', height: narrow ? 'auto' : '100%', display: 'flex', flexDirection: narrow ? 'column' : 'row', gap, overflow: narrow ? 'visible' : 'auto' }}>
      {imageLeft ? (<>{imageCol}{textCol}</>) : (<>{textCol}{imageCol}</>)}
    </div>
  );
}

const BUTTON_VARIANT_STYLE: Record<string, React.CSSProperties> = {
  primary: { background: 'var(--accent-primary)', color: '#fff', border: 'none' },
  secondary: { background: 'var(--surface-card)', color: 'var(--text-heading)', border: 'none' },
  outline: { background: 'transparent', color: 'var(--text-heading)', border: '1.5px solid var(--border-default)' },
};
const BUTTON_SIZE_STYLE: Record<string, React.CSSProperties> = {
  sm: { padding: '6px 16px', fontSize: 13 },
  md: { padding: '10px 22px', fontSize: 15 },
  lg: { padding: '14px 28px', fontSize: 17 },
};

export function ButtonBlockView({ props, editable, onFieldChange }: BlockComponentProps) {
  const variant = BUTTON_VARIANT_STYLE[str(props, 'variant', 'primary')] ?? BUTTON_VARIANT_STYLE.primary;
  const size = BUTTON_SIZE_STYLE[str(props, 'size', 'md')] ?? BUTTON_SIZE_STYLE.md;
  const href = str(props, 'href');
  const newTab = bool(props, 'newTab');
  const label = str(props, 'label');

  const content = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 'var(--radius-pill)',
        fontWeight: 600,
        cursor: editable ? 'text' : 'pointer',
        boxShadow: 'var(--shadow-sm)',
        ...variant,
        ...size,
      }}
    >
      <EditableText value={label} onCommit={(v) => onFieldChange('label', v)} placeholder="Button label" as="span" style={{ color: 'inherit' }} />
    </span>
  );

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
      {editable || !href ? content : (
        <a href={href} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined} style={{ textDecoration: 'none' }}>
          {content}
        </a>
      )}
    </div>
  );
}

export function QuoteBlockView({ props, editable, onFieldChange, scale = 1 }: BlockComponentProps) {
  const align = str(props, 'align', 'center') === 'left' ? 'left' : 'center';
  const baseSize = str(props, 'size', 'normal') === 'large' ? 26 : 20;
  const size = scaledFontSize(baseSize, scale, 14, 64);
  const quoteText = str(props, 'quoteText');
  const citation = str(props, 'citation');
  if (!editable && !quoteText) return null;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: align === 'center' ? 'center' : 'flex-start', textAlign: align, gap: 10, padding: '4px 12px' }}>
      <EditableText
        value={quoteText}
        onCommit={(v) => onFieldChange('quoteText', v)}
        placeholder="Say something quotable."
        multiline
        as="p"
        style={{ margin: 0, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, fontSize: size, lineHeight: 1.4, color: 'var(--text-heading)', whiteSpace: 'pre-wrap' }}
      />
      {(editable || citation) && (
        <EditableText value={citation} onCommit={(v) => onFieldChange('citation', v)} placeholder="Citation" as="span" style={{ fontSize: 14, color: 'var(--text-muted)' }} />
      )}
    </div>
  );
}

export function DividerBlockView({ props }: BlockComponentProps) {
  const isLine = str(props, 'style', 'line') !== 'space';
  const size = { sm: 8, md: 24, lg: 56 }[str(props, 'size', 'md')] ?? 24;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: `${size / 2}px 0` }}>
      {isLine && <div style={{ width: '100%', height: 1, background: 'var(--border-default)' }} />}
    </div>
  );
}
