import { ImageInput } from '../ImageInput';
import { ColorPicker } from '../ColorPicker';
import { newWidgetVariableId, type WidgetVariable, type WidgetVariableType } from '../../data/siteData';

const TYPE_LABEL: Record<WidgetVariableType, string> = {
  text: 'Text',
  number: 'Number',
  color: 'Color',
  image: 'Image',
  date: 'Date',
  boolean: 'Yes/No',
};

export function ValueInput({ type, value, onChange }: { type: WidgetVariableType; value: string; onChange: (v: string) => void }) {
  switch (type) {
    case 'color':
      return <ColorPicker value={value || '#6366f1'} onChange={onChange} size={28} />;
    case 'boolean':
      return (
        <input
          type="checkbox"
          checked={value === 'true'}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          style={{ width: 18, height: 18 }}
        />
      );
    case 'date':
      return <input type="date" value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />;
    case 'number':
      return <input type="number" value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />;
    case 'image':
      return value ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <img src={value} alt="" style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 6 }} />
          <ImageInput label="Replace" onSelect={(src) => onChange(src)} />
        </span>
      ) : (
        <ImageInput label="+ Upload" onSelect={(src) => onChange(src)} />
      );
    default:
      return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />;
  }
}

const inputStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid var(--border-default)',
  background: 'var(--surface-card)',
  color: 'var(--text-heading)',
  fontSize: 13,
  width: '100%',
};

/**
 * Defines the widget's variables — name, type, and whether the value is
 * shared everywhere the widget is used ("global") or filled in separately
 * each time it's placed ("instance"). The value entered here is the
 * variable's actual value for a global variable, or the fallback shown
 * until an instance override is filled in for an instance variable.
 */
export function WidgetVariablesPanel({ variables, onChange }: { variables: WidgetVariable[]; onChange: (vars: WidgetVariable[]) => void }) {
  function add() {
    onChange([
      ...variables,
      { id: newWidgetVariableId(), name: `Variable ${variables.length + 1}`, type: 'text', scope: 'instance', defaultValue: '' },
    ]);
  }
  function update(id: string, patch: Partial<WidgetVariable>) {
    onChange(variables.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }
  function remove(id: string) {
    onChange(variables.filter((v) => v.id !== id));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        Variables
      </div>
      {variables.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No variables yet.</div>}
      {variables.map((v) => (
        <div
          key={v.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: 10,
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              value={v.name}
              onChange={(e) => update(v.id, { name: e.target.value })}
              style={{ ...inputStyle, flex: 1, fontWeight: 600 }}
            />
            <button
              onClick={() => remove(v.id)}
              title="Remove variable"
              style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'var(--red-600)', color: '#fff', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={v.type}
              onChange={(e) => update(v.id, { type: e.target.value as WidgetVariableType, defaultValue: '' })}
              style={{ ...inputStyle, width: 'auto' }}
            >
              {(Object.keys(TYPE_LABEL) as WidgetVariableType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
            <div style={{ display: 'inline-flex', background: 'var(--surface-panel)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)', padding: 2, gap: 2 }}>
              {(['global', 'instance'] as const).map((scope) => (
                <button
                  key={scope}
                  onClick={() => update(v.id, { scope })}
                  style={{
                    border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: v.scope === scope ? 'var(--accent-primary)' : 'transparent',
                    color: v.scope === scope ? '#fff' : 'var(--text-body)',
                  }}
                >
                  {scope === 'global' ? 'Global' : 'Per-instance'}
                </button>
              ))}
            </div>
          </div>
          {v.type !== 'image' && v.type !== 'boolean' && (
            <div style={{ display: 'inline-flex', background: 'var(--surface-panel)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)', padding: 2, gap: 2, width: 'fit-content' }}>
              {(['static', 'url'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => update(v.id, { source: s })}
                  style={{
                    border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: (v.source ?? 'static') === s ? 'var(--accent-primary)' : 'transparent',
                    color: (v.source ?? 'static') === s ? '#fff' : 'var(--text-body)',
                  }}
                >
                  {s === 'static' ? 'Fixed value' : 'Pull from a URL'}
                </button>
              ))}
            </div>
          )}

          {v.source === 'url' && v.type !== 'image' && v.type !== 'boolean' ? (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                Source URL (must return JSON, and allow cross-origin requests)
                <input
                  value={v.sourceUrl ?? ''}
                  onChange={(e) => update(v.id, { sourceUrl: e.target.value })}
                  placeholder="https://api.example.com/data.json"
                  style={inputStyle}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                Path into the response (optional), e.g. results.0.name
                <input
                  value={v.sourcePath ?? ''}
                  onChange={(e) => update(v.id, { sourcePath: e.target.value })}
                  placeholder="data.value"
                  style={inputStyle}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                Fallback value (shown until the fetch resolves, or if it fails)
                <ValueInput type={v.type} value={v.defaultValue} onChange={(val) => update(v.id, { defaultValue: val })} />
              </label>
            </>
          ) : (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
              {v.scope === 'global' ? 'Value' : 'Default value'}
              <ValueInput type={v.type} value={v.defaultValue} onChange={(val) => update(v.id, { defaultValue: val })} />
            </label>
          )}
        </div>
      ))}
      <button
        onClick={add}
        style={{
          border: '1px dashed var(--border-strong)',
          background: 'none',
          borderRadius: 'var(--radius-pill)',
          padding: '6px 14px',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-muted)',
          cursor: 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        + Add variable
      </button>
    </div>
  );
}
