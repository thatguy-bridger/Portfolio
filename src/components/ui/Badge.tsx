import type { ReactNode } from 'react';

export type BadgeColor = 'indigo' | 'purple' | 'orange' | 'pink' | 'green' | 'red';

const COLORS: Record<BadgeColor, string> = {
  indigo: 'var(--indigo-500)',
  purple: 'var(--purple-500)',
  orange: 'var(--orange-600)',
  pink: 'var(--pink-500)',
  green: 'var(--green-600)',
  red: 'var(--red-600)',
};

export interface BadgeProps {
  color?: BadgeColor;
  children: ReactNode;
}

export function Badge({ color = 'indigo', children }: BadgeProps) {
  return (
    <span
      style={{
        background: COLORS[color],
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: 'var(--radius-pill)',
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.01em',
      }}
    >
      {children}
    </span>
  );
}
