import { useLayoutEffect, useRef, type CSSProperties } from 'react';

/**
 * contentEditable text that commits to parent state onBlur.
 *
 * Content is written to the DOM imperatively (never via JSX children) and
 * only while the element isn't focused — this is what stops an unrelated
 * re-render (autosave status ticking, a sibling field committing, etc.)
 * from ever resetting the caret or clobbering text the user is mid-typing.
 * Commit reads `innerText` rather than `textContent` so line breaks the
 * browser inserts into contentEditable (as separate <div>s) survive as
 * real "\n" characters instead of silently disappearing.
 */
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
  const focused = useRef(false);

  useLayoutEffect(() => {
    if (!editable) return;
    const el = ref.current;
    if (!el || focused.current) return;
    if (el.textContent !== value) el.textContent = value;
  }, [value, editable]);

  const textStyle: CSSProperties = { whiteSpace: multiline ? 'pre-wrap' : undefined, ...style };

  if (!editable) {
    return <As style={textStyle}>{value}</As>;
  }

  return (
    <As
      ref={ref as never}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        focused.current = false;
        const text = (e.currentTarget.innerText ?? '').trim();
        if (text !== value) onCommit(text);
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      style={{
        ...textStyle,
        outline: '1px dashed var(--border-strong)',
        outlineOffset: 4,
        borderRadius: 4,
        cursor: 'text',
      }}
    />
  );
}
