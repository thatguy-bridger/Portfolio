import { useRef, type CSSProperties } from 'react';

/** contentEditable text that commits to parent state onBlur — the inline-edit building block for the builder. */
export function Editable({
  value,
  onCommit,
  editable,
  as: As = 'span',
  style,
  multiline,
}: {
  value: string;
  onCommit: (next: string) => void;
  editable: boolean;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3';
  style?: CSSProperties;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  if (!editable) {
    return <As style={style}>{value}</As>;
  }

  return (
    <As
      ref={ref as never}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const text = (e.currentTarget.textContent ?? '').trim();
        if (text !== value) onCommit(text);
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      style={{
        ...style,
        outline: '1px dashed var(--border-strong)',
        outlineOffset: 4,
        borderRadius: 4,
        cursor: 'text',
      }}
    >
      {value}
    </As>
  );
}
