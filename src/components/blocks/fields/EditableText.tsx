import { useEffect, useRef } from 'react';

/**
 * Click-to-edit-directly-on-the-canvas text field — used for every `text`/
 * `richtext` registry field (inline by default, see registry.ts). A plain
 * contentEditable element rather than a rich-text engine: this phase's
 * "richtext" support is line breaks + click-anywhere editing, not a full
 * formatting toolbar (the old app's TextStylePopover-level formatting is
 * out of scope here — see readme's Phase 2 QA item for inline editing, not
 * rich formatting). `stopPropagation` on pointerDown keeps a click into the
 * text from also starting the block-select/drag behavior on the wrapper
 * behind it.
 */
export function EditableText({
  value,
  onCommit,
  placeholder,
  multiline = false,
  as: Tag = 'div',
  style,
  className,
}: {
  value: string;
  onCommit: (next: string) => void;
  placeholder?: string;
  multiline?: boolean;
  as?: 'div' | 'span' | 'h1' | 'h2' | 'h3' | 'p';
  style?: React.CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const focused = useRef(false);

  // Keep the DOM in sync with external value changes (e.g. loading a
  // different block, or an undo) without ever clobbering the caret while
  // this exact element is the one being typed into.
  useEffect(() => {
    const el = ref.current;
    if (el && !focused.current && el.innerText !== value) el.innerText = value;
  }, [value]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Tag is a small fixed union of intrinsic tags
    <Tag
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={`editable-field${className ? ` ${className}` : ''}`}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        focused.current = false;
        onCommit(e.currentTarget.innerText);
      }}
      // Deliberately doesn't stopPropagation: letting the pointerdown bubble
      // up to the block wrapper (CanvasEditor.tsx) also selects the block
      // (so its resize/move handles appear) at the same moment editing
      // starts — otherwise, for a block that's mostly text, there'd be no
      // way to select it at all without first clicking some sliver of
      // padding around the text.
      onKeyDown={(e: React.KeyboardEvent) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      style={{
        outline: 'none',
        cursor: 'text',
        whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
        overflow: multiline ? 'visible' : 'hidden',
        textOverflow: 'ellipsis',
        minHeight: '1em',
        minWidth: 8,
        ...style,
      }}
    />
  );
}
