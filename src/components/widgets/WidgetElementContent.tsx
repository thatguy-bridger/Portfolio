import { effectsToStyle } from '../TextStylePopover';
import { DEFAULT_CROP, type WidgetElement, type WidgetVariable } from '../../data/siteData';

/** Resolves what an element actually shows: its bound variable's value (instance override, else the variable's default) or its own static value. */
export function resolveBoundValue(
  element: WidgetElement,
  variables: WidgetVariable[],
  instanceValues?: Record<string, string>,
): { variable?: WidgetVariable; value?: string } {
  if (!element.boundVariableId) return {};
  const variable = variables.find((v) => v.id === element.boundVariableId);
  if (!variable) return {};
  const value = variable.scope === 'instance' && instanceValues?.[variable.id] !== undefined ? instanceValues[variable.id] : variable.defaultValue;
  return { variable, value };
}

/** Renders one widget element's visual content — text, image, or shape — given its resolved (static or bound) value. Used identically in the Studio's live preview and in a real page's rendered instance. */
export function WidgetElementContent({
  element,
  variables,
  instanceValues,
}: {
  element: WidgetElement;
  variables: WidgetVariable[];
  instanceValues?: Record<string, string>;
}) {
  const { variable, value } = resolveBoundValue(element, variables, instanceValues);

  if (element.type === 'text') {
    const text = variable ? value ?? '' : element.content ?? '';
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: element.align === 'right' ? 'flex-end' : element.align === 'center' ? 'center' : 'flex-start',
          textAlign: element.align ?? 'left',
          fontSize: element.fontSizePx ?? 16,
          fontFamily: 'var(--font-body)',
          color: 'var(--text-body)',
          overflow: 'hidden',
          ...effectsToStyle(element.textEffects),
        }}
      >
        <span style={{ whiteSpace: 'pre-wrap', width: '100%' }}>{text}</span>
      </div>
    );
  }

  if (element.type === 'image') {
    // Unlike a page-content image block, a widget image element is an explicitly
    // placed/sized frame (like a picture frame in a slide) — it should fill that
    // frame (cover), not show the whole photo regardless of the frame's shape.
    const src = variable?.type === 'image' ? value : element.src;
    const c = element.crop ?? DEFAULT_CROP;
    return (
      <div style={{ width: '100%', height: '100%', background: 'var(--surface-card)', overflow: 'hidden' }}>
        {src && (
          <img
            src={src}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `${c.posX}% ${c.posY}%`,
              transform: c.zoom !== 1 ? `scale(${c.zoom})` : undefined,
              display: 'block',
            }}
          />
        )}
      </div>
    );
  }

  // shape
  const fill = variable?.type === 'color' ? value : element.fill;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: fill || 'var(--accent-primary)',
        borderRadius: element.shapeKind === 'circle' ? '50%' : (element.radius ?? 0),
      }}
    />
  );
}
