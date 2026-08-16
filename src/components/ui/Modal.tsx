import type { ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  title?: string;
  onClose?: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  /** 'md' (default) for short forms; 'lg' for richer editors like page-block content. */
  size?: 'md' | 'lg';
  titleExtra?: ReactNode;
}

const MAX_WIDTH: Record<'md' | 'lg', number> = { md: 480, lg: 760 };

export function Modal({ open, title, onClose, children, footer, size = 'md', titleExtra }: ModalProps) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      data-testid="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--surface-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 20,
        fontFamily: 'var(--font-body)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface-panel)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          width: `min(92vw, ${MAX_WIDTH[size]}px)`,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 28,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {titleExtra}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', color: 'var(--text-body)', fontSize: 14 }}>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>{footer}</div>}
      </div>
    </div>
  );
}
