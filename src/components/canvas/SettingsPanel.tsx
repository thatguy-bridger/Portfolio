// The side settings panel — generic over BLOCK_REGISTRY field defs, so
// adding a field to a block type in registry.ts is the only change needed
// for it to show up here; nothing in this file is per-block-type. Renders
// whichever fields registry.panelFields() says aren't inline-editable
// (selects/toggles, plus text fields explicitly marked inline:false, e.g. a
// button's URL) for either a selected top-level block or a selected nested
// slot (CanvasEditor passes the same {type, props, onFieldChange} shape
// either way, so this component doesn't know or care which).
import type { BlockField } from '../../lib/blocks/registry';
import { panelFields } from '../../lib/blocks/registry';

export function SettingsPanel({
  title,
  type,
  props,
  onFieldChange,
  onClose,
}: {
  title: string;
  type: string;
  props: Record<string, unknown>;
  onFieldChange: (key: string, value: unknown) => void;
  onClose: () => void;
}) {
  const fields = panelFields(type, props);

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: 14,
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-panel)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
        maxHeight: 560,
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</span>
        <button type="button" onClick={onClose} aria-label="Close settings" style={{ border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>
          ✕
        </button>
      </div>

      {fields.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          Everything for this block is edited directly on the canvas.
        </p>
      )}

      {fields.map((field) => (
        <FieldControl key={field.key} field={field} value={props[field.key]} onChange={(v) => onFieldChange(field.key, v)} />
      ))}
    </div>
  );
}

function FieldControl({ field, value, onChange }: { field: BlockField; value: unknown; onChange: (v: unknown) => void }) {
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '7px 9px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-default)',
    background: 'var(--surface-card)',
    color: 'var(--text-heading)',
    fontSize: 13,
  };

  if (field.kind === 'toggle') {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-body)', cursor: 'pointer' }}>
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    );
  }

  if (field.kind === 'select') {
    return (
      <label style={{ display: 'block' }}>
        <span style={labelStyle}>{field.label}</span>
        <select value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>
    );
  }

  if (field.kind === 'image') {
    return (
      <label style={{ display: 'block' }}>
        <span style={labelStyle}>{field.label}</span>
        <input type="text" value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} placeholder="Image URL" style={inputStyle} />
      </label>
    );
  }

  // text / richtext (inline:false), e.g. a URL — a plain text input here,
  // never the click-to-edit EditableText, per the inline/panel split.
  return (
    <label style={{ display: 'block' }}>
      <span style={labelStyle}>{field.label}</span>
      <input type="text" value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} style={inputStyle} />
    </label>
  );
}
