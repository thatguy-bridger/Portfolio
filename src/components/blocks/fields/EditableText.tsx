import { useEffect, useRef, useState } from 'react';

/**
 * Double-click-to-edit text field — used for every `text`/`richtext`
 * registry field (inline by default, see registry.ts). A plain
 * contentEditable element rather than a rich-text engine: this phase's
 * "richtext" support is line breaks + click-anywhere editing, not a full
 * formatting toolbar (the old app's TextStylePopover-level formatting is
 * out of scope here — see readme's Phase 2 QA item for inline editing, not
 * rich formatting).
 *
 * Single click vs. double click is a deliberate split, not just a taste
 * choice: the block wrapper in CanvasEditor.tsx starts a move-drag on
 * ordinary pointerdown now (the whole block is the dragger, not a separate
 * handle) — if this field were contentEditable all the time, the very first
 * click of any drag attempt on a text-heavy block would instead just place
 * a caret and start typing. So it stays plain, inert text (not editable,
 * not focusable) until a double-click promotes it into edit mode; a single
 * click on it falls through to the wrapper exactly like clicking anywhere
 * else on the block, selecting/dragging normally. Blur demotes it back and
 * commits.
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
  const [editing, setEditing] = useState(false);

  // Keep the DOM in sync with external value changes (e.g. loading a
  // different block, or an undo) without ever clobbering the caret while
  // this exact element is the one being typed into.
  useEffect(() => {
    const el = ref.current;
    if (el && !focused.current && el.innerText !== value) el.innerText = value;
  }, [value]);

  // Entering edit mode: focus and drop the caret at the end of the text —
  // matches "double-click to start typing" better than the default (start),
  // since most edits are appending to what's already there.
  useEffect(() => {
    const el = ref.current;
    if (!editing || !el) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [editing]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Tag is a small fixed union of intrinsic tags
    <Tag
      ref={ref as any}
      contentEditable={editing}
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={`editable-field${className ? ` ${className}` : ''}`}
      onDoubleClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        setEditing(true);
      }}
      onPointerDown={(e: React.PointerEvent) => {
        // Only once actually editing: stop a click that's just repositioning
        // the caret (or the second pointerdown of the double-click that just
        // triggered edit mode) from also bubbling up and starting a block
        // drag. Before that, let it bubble — see the header comment.
        if (editing) e.stopPropagation();
      }}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        focused.current = false;
        setEditing(false);
        onCommit(e.currentTarget.innerText);
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (!editing) return;
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
        if (e.key === 'Escape') (e.currentTarget as HTMLElement).blur();
      }}
      style={{
        outline: 'none',
        cursor: editing ? 'text' : 'inherit',
        userSelect: editing ? 'text' : 'none',
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
