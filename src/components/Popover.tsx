import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useClickAway } from '../design-system/useClickAway';

/**
 * One Google-Docs-style toolbar trigger: a small button showing the current
 * value that opens its own focused dropdown panel, instead of everything
 * living in one big popover. Portaled to document.body with fixed
 * positioning so it isn't clipped inside a modal's scroll area.
 */
export function ToolbarDropdown({
  trigger,
  title,
  width = 200,
  chromeless = false,
  children,
}: {
  trigger: ReactNode;
  title: string;
  width?: number;
  /** Render the trigger with no button chrome (no padding/background/dropdown arrow) — for callers supplying a fully custom trigger like a swatch circle. */
  chromeless?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
    setOpen((o) => !o);
  }
  const close = () => setOpen(false);
  useClickAway(open, [btnRef, panelRef], close);

  useEffect(() => {
    if (!open) return;
    // A scroll event anywhere fires here in the capture phase, including from
    // inside the panel's own scrollable content (e.g. a long font list) — only
    // treat it as "close the dropdown" when it didn't originate inside the panel.
    function handleScroll(e: Event) {
      if (panelRef.current && e.target instanceof Node && panelRef.current.contains(e.target)) return;
      close();
    }
    document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <span style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={toggle}
        title={title}
        style={
          chromeless
            ? { all: 'unset', cursor: 'pointer', display: 'inline-flex' }
            : {
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                border: 'none',
                borderRadius: 6,
                padding: '3px 6px',
                fontSize: 12,
                cursor: 'pointer',
                background: 'var(--surface-card)',
                color: 'var(--text-body)',
                height: 26,
              }
        }
      >
        {trigger}
        {!chromeless && <span style={{ fontSize: 8, opacity: 0.6 }}>▾</span>}
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              zIndex: 300,
              width,
              maxHeight: 380,
              overflowY: 'auto',
              background: 'var(--surface-glass)',
              backdropFilter: 'var(--blur-glass)',
              WebkitBackdropFilter: 'var(--blur-glass)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontFamily: 'var(--font-body)',
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </span>
  );
}
