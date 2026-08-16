import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const VARIANTS: Record<ButtonVariant, { background: string; color: string; border?: string }> = {
  primary: { background: 'var(--accent-primary)', color: '#fff' },
  secondary: { background: 'var(--accent-secondary)', color: '#fff' },
  danger: { background: 'var(--red-600)', color: '#fff' },
  success: { background: 'var(--green-600)', color: '#fff' },
  ghost: { background: 'transparent', color: 'var(--text-body)', border: '1px solid var(--border-strong)' },
};

export function Button({ variant = 'primary', size = 'md', disabled, children, ...rest }: ButtonProps) {
  const [hover, setHover] = useState(false);
  const pad = size === 'sm' ? '8px 16px' : size === 'lg' ? '14px 28px' : '11px 22px';
  const fontSize = size === 'sm' ? '13px' : size === 'lg' ? '16px' : '14px';
  const v = VARIANTS[variant];
  return (
    <button
      {...rest}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: v.background,
        color: v.color,
        border: v.border ?? 'none',
        padding: pad,
        fontSize,
        fontWeight: 600,
        borderRadius: 'var(--radius-pill)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transform: hover && !disabled ? 'scale(1.05)' : 'scale(1)',
        boxShadow: hover && !disabled ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transition:
          'transform var(--duration-normal) var(--ease-standard), box-shadow var(--duration-normal) var(--ease-standard)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {children}
    </button>
  );
}
