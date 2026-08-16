import { useState, type ReactNode } from 'react';

export interface IconButtonProps {
  icon: ReactNode;
  tone?: 'default' | 'accent' | 'danger';
  size?: number;
  onClick?: () => void;
  title?: string;
}

export function IconButton({ icon, tone = 'default', size = 44, onClick, title }: IconButtonProps) {
  const [hover, setHover] = useState(false);
  const bg = tone === 'accent' ? 'var(--accent-primary)' : tone === 'danger' ? 'var(--red-600)' : 'var(--surface-card)';
  const color = tone === 'default' ? 'var(--text-body)' : '#fff';
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color,
        border: tone === 'default' ? '1px solid var(--border-default)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: size * 0.45,
        transform: hover ? 'scale(1.1)' : 'scale(1)',
        boxShadow: hover ? 'var(--shadow-md)' : 'none',
        transition:
          'transform var(--duration-normal) var(--ease-standard), box-shadow var(--duration-normal) var(--ease-standard)',
      }}
    >
      {icon}
    </button>
  );
}
