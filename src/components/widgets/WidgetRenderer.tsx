import { WidgetElementContent } from './WidgetElementContent';
import type { Widget } from '../../data/siteData';

/** Renders a saved widget as it appears on a real page — read-only, with instance variable values resolved in. */
export function WidgetRenderer({ widget, instanceValues }: { widget: Widget; instanceValues?: Record<string, string> }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: widget.aspect,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      {widget.elements.map((el) => (
        <div
          key={el.id}
          style={{
            position: 'absolute',
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.w}%`,
            height: `${el.h}%`,
          }}
        >
          <WidgetElementContent element={el} variables={widget.variables} instanceValues={instanceValues} />
        </div>
      ))}
    </div>
  );
}
