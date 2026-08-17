import { WidgetRenderer } from './widgets/WidgetRenderer';
import { WidgetInstanceValuesForm } from './widgets/WidgetInstanceValuesForm';
import { useRepeaterItems } from '../design-system/useRepeaterItems';
import { newRepeaterItemId, type PageBlock, type RepeaterItem, type Widget } from '../data/siteData';

const inputStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid var(--border-default)',
  background: 'var(--surface-card)',
  color: 'var(--text-heading)',
  fontSize: 13,
  width: '100%',
};

function ItemsGrid({ widget, items, columns }: { widget: Widget; items: Array<Record<string, string>>; columns: number }) {
  if (items.length === 0) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, columns)}, 1fr)`, gap: 14 }}>
      {items.map((values, i) => (
        <WidgetRenderer key={i} widget={widget} instanceValues={values} />
      ))}
    </div>
  );
}

/** Read-only rendering — used on the public site and inside the read-only PageBlocks pass. */
export function RepeaterRenderer({ block, widgets }: { block: PageBlock; widgets: Widget[] }) {
  const widget = widgets.find((w) => w.id === block.repeaterWidgetId);
  const columns = block.repeaterColumns ?? 3;
  const urlItems = useRepeaterItems(
    block.repeaterMode === 'url' ? block.repeaterSourceUrl : undefined,
    block.repeaterSourcePath,
    block.repeaterFieldMap,
  );

  if (!widget) return null;
  const items = block.repeaterMode === 'url' ? urlItems.items : (block.repeaterItems ?? []).map((it) => it.values);
  return <ItemsGrid widget={widget} items={items} columns={columns} />;
}

/** Editable authoring UI — pick the widget, pick a data mode, and manage items or a URL mapping. */
export function RepeaterBlockEditor({
  block,
  widgets,
  onChange,
}: {
  block: PageBlock;
  widgets: Widget[];
  onChange: (patch: Partial<PageBlock>) => void;
}) {
  const widget = widgets.find((w) => w.id === block.repeaterWidgetId);
  const mode = block.repeaterMode ?? 'manual';
  const instanceVars = widget?.variables.filter((v) => v.scope === 'instance') ?? [];
  const urlItems = useRepeaterItems(
    mode === 'url' ? block.repeaterSourceUrl : undefined,
    block.repeaterSourcePath,
    block.repeaterFieldMap,
  );

  function addManualItem() {
    const items: RepeaterItem[] = [...(block.repeaterItems ?? []), { id: newRepeaterItemId(), values: {} }];
    onChange({ repeaterItems: items });
  }
  function updateManualItem(id: string, values: Record<string, string>) {
    onChange({ repeaterItems: (block.repeaterItems ?? []).map((it) => (it.id === id ? { ...it, values } : it)) });
  }
  function removeManualItem(id: string) {
    onChange({ repeaterItems: (block.repeaterItems ?? []).filter((it) => it.id !== id) });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={block.repeaterWidgetId ?? ''}
          onChange={(e) => onChange({ repeaterWidgetId: e.target.value || undefined })}
          style={{ ...inputStyle, width: 'auto' }}
        >
          <option value="">— Choose a widget to repeat —</option>
          {widgets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          Columns
          <input
            type="number"
            min={1}
            max={6}
            value={block.repeaterColumns ?? 3}
            onChange={(e) => onChange({ repeaterColumns: Math.max(1, Math.min(6, Number(e.target.value) || 1)) })}
            style={{ ...inputStyle, width: 56 }}
          />
        </label>
      </div>

      {!widget ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {widgets.length > 0 ? 'Pick a widget above to repeat it.' : 'No widgets yet — build one in Widget Studio first.'}
        </div>
      ) : (
        <>
          <div style={{ display: 'inline-flex', background: 'var(--surface-panel)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)', padding: 2, gap: 2, width: 'fit-content' }}>
            {(['manual', 'url'] as const).map((m) => (
              <button
                key={m}
                onClick={() => onChange({ repeaterMode: m })}
                style={{
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: mode === m ? 'var(--accent-primary)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text-body)',
                }}
              >
                {m === 'manual' ? 'Type in items' : 'Pull from a URL'}
              </button>
            ))}
          </div>

          {mode === 'manual' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(block.repeaterItems ?? []).length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No items yet.</div>}
              {(block.repeaterItems ?? []).map((item, i) => (
                <div key={item.id} style={{ padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--surface-card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>Item {i + 1}</strong>
                    <button
                      onClick={() => removeManualItem(item.id)}
                      style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'var(--red-600)', color: '#fff', fontSize: 10, cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                  {instanceVars.length === 0 ? (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>This widget has no per-instance variables to fill in.</div>
                  ) : (
                    <WidgetInstanceValuesForm widget={widget} values={item.values} onChange={(values) => updateManualItem(item.id, values)} />
                  )}
                </div>
              ))}
              <button
                onClick={addManualItem}
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
                + Add item
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                Source URL (must return a JSON array, or an object containing one)
                <input
                  value={block.repeaterSourceUrl ?? ''}
                  onChange={(e) => onChange({ repeaterSourceUrl: e.target.value })}
                  placeholder="https://api.example.com/items.json"
                  style={inputStyle}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                Path to the array (optional), e.g. results or data.items
                <input
                  value={block.repeaterSourcePath ?? ''}
                  onChange={(e) => onChange({ repeaterSourcePath: e.target.value })}
                  placeholder="results"
                  style={inputStyle}
                />
              </label>
              {instanceVars.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>This widget has no per-instance variables to map fields into.</div>
              ) : (
                instanceVars.map((v) => (
                  <label key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                    {v.name} comes from field…
                    <input
                      value={block.repeaterFieldMap?.[v.id] ?? ''}
                      onChange={(e) => onChange({ repeaterFieldMap: { ...(block.repeaterFieldMap ?? {}), [v.id]: e.target.value } })}
                      placeholder="e.g. name or stats.count"
                      style={inputStyle}
                    />
                  </label>
                ))
              )}
              <div style={{ fontSize: 11, color: urlItems.error ? 'var(--red-500)' : 'var(--text-muted)' }}>
                {urlItems.loading ? 'Loading…' : urlItems.error ? "Couldn't load that URL — check it returns JSON and allows cross-origin requests." : `${urlItems.items.length} item(s) found`}
              </div>
            </div>
          )}

          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>
              Preview
            </div>
            <ItemsGrid
              widget={widget}
              items={mode === 'url' ? urlItems.items : (block.repeaterItems ?? []).map((it) => it.values)}
              columns={block.repeaterColumns ?? 3}
            />
          </div>
        </>
      )}
    </div>
  );
}
