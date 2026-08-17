import { ValueInput } from './WidgetVariablesPanel';
import type { Widget } from '../../data/siteData';

/** Fill-in form for a widget instance's "instance"-scoped variables — global ones aren't editable here, they come from the widget definition itself. */
export function WidgetInstanceValuesForm({
  widget,
  values,
  onChange,
}: {
  widget: Widget;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}) {
  const instanceVars = widget.variables.filter((v) => v.scope === 'instance');
  if (instanceVars.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
      {instanceVars.map((v) => (
        <label key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
          {v.name}
          <ValueInput
            type={v.type}
            value={values[v.id] ?? v.defaultValue}
            onChange={(val) => onChange({ ...values, [v.id]: val })}
          />
        </label>
      ))}
    </div>
  );
}
