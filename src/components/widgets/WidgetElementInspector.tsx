import { ImageInput } from '../ImageInput';
import { ImageCropEditor } from '../ImageCropEditor';
import { TextStylePopover } from '../TextStylePopover';
import type { WidgetElement, WidgetVariable } from '../../data/siteData';

const selectStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid var(--border-default)',
  background: 'var(--surface-card)',
  color: 'var(--text-heading)',
  fontSize: 13,
  width: '100%',
};

const label: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' };

/** Compatible variable kinds for each element type — text can bind to anything printable, image only to image variables, shape only to color variables. */
function compatibleVariables(element: WidgetElement, variables: WidgetVariable[]): WidgetVariable[] {
  if (element.type === 'text') return variables.filter((v) => v.type !== 'image');
  if (element.type === 'image') return variables.filter((v) => v.type === 'image');
  return variables.filter((v) => v.type === 'color');
}

/** Editor for whichever element is currently selected on the widget canvas — its static value or variable binding, plus type-specific properties. */
export function WidgetElementInspector({
  element,
  variables,
  onChange,
  onRemove,
}: {
  element: WidgetElement;
  variables: WidgetVariable[];
  onChange: (patch: Partial<WidgetElement>) => void;
  onRemove: () => void;
}) {
  const bindable = compatibleVariables(element, variables);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {element.type} element
        </div>
        <button
          onClick={onRemove}
          style={{ border: 'none', background: 'none', color: 'var(--red-500)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          Delete
        </button>
      </div>

      {bindable.length > 0 && (
        <label style={label}>
          Bind to variable
          <select
            value={element.boundVariableId ?? ''}
            onChange={(e) => onChange({ boundVariableId: e.target.value || undefined })}
            style={selectStyle}
          >
            <option value="">— Static value —</option>
            {bindable.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {!element.boundVariableId && element.type === 'text' && (
        <label style={label}>
          Content
          <textarea
            value={element.content ?? ''}
            onChange={(e) => onChange({ content: e.target.value })}
            rows={3}
            style={{ ...selectStyle, resize: 'vertical', fontFamily: 'var(--font-body)' }}
          />
        </label>
      )}

      {!element.boundVariableId && element.type === 'image' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ImageInput label={element.src ? 'Replace photo' : '+ Photo'} onSelect={(src) => onChange({ src, crop: undefined })} />
          {element.src && <ImageCropEditor src={element.src} crop={element.crop} onChange={(crop) => onChange({ crop })} />}
        </div>
      )}

      {!element.boundVariableId && element.type === 'shape' && (
        <label style={label}>
          Fill color
          <input
            type="color"
            value={element.fill || '#6366f1'}
            onChange={(e) => onChange({ fill: e.target.value })}
            style={{ width: 40, height: 30, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
          />
        </label>
      )}

      {element.type === 'text' && (
        <>
          <label style={label}>
            Font size ({element.fontSizePx ?? 16}px)
            <input
              type="range"
              min={10}
              max={72}
              value={element.fontSizePx ?? 16}
              onChange={(e) => onChange({ fontSizePx: parseInt(e.target.value, 10) })}
            />
          </label>
          <div style={{ display: 'inline-flex', background: 'var(--surface-panel)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)', padding: 2, gap: 2, width: 'fit-content' }}>
            {(['left', 'center', 'right'] as const).map((a) => (
              <button
                key={a}
                onClick={() => onChange({ align: a })}
                style={{
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  background: (element.align ?? 'left') === a ? 'var(--accent-primary)' : 'transparent',
                  color: (element.align ?? 'left') === a ? '#fff' : 'var(--text-body)',
                }}
              >
                {a}
              </button>
            ))}
          </div>
          <TextStylePopover value={element.textEffects} onChange={(textEffects) => onChange({ textEffects })} />
        </>
      )}

      {element.type === 'shape' && (
        <div style={{ display: 'inline-flex', background: 'var(--surface-panel)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)', padding: 2, gap: 2, width: 'fit-content' }}>
          {(['rect', 'circle'] as const).map((k) => (
            <button
              key={k}
              onClick={() => onChange({ shapeKind: k })}
              style={{
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                background: (element.shapeKind ?? 'rect') === k ? 'var(--accent-primary)' : 'transparent',
                color: (element.shapeKind ?? 'rect') === k ? '#fff' : 'var(--text-body)',
              }}
            >
              {k === 'rect' ? 'Rectangle' : 'Circle'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
