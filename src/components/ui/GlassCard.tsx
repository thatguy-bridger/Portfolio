import { useState, type CSSProperties, type ReactNode } from 'react';

export type GlassCardAccent = 'indigo' | 'purple' | 'orange' | 'pink';

const ACCENT_COLOR: Record<GlassCardAccent, string> = {
  indigo: 'var(--indigo-400)',
  purple: 'var(--purple-400)',
  orange: 'var(--orange-400)',
  pink: 'var(--pink-500)',
};

export interface GlassCardProps {
  title?: string;
  subtitle?: string;
  accent?: GlassCardAccent;
  onClick?: () => void;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function GlassCard({ title, subtitle, accent = 'indigo', onClick, children, style, className }: GlassCardProps) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--surface-glass)',
        backdropFilter: 'var(--blur-glass)',
        WebkitBackdropFilter: 'var(--blur-glass)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        padding: 20,
        cursor: onClick ? 'pointer' : 'default',
        transform: hover ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: hover ? 'var(--shadow-lg)' : 'var(--shadow-md)',
        transition: 'transform var(--duration-normal) var(--ease-standard), box-shadow var(--duration-normal) var(--ease-standard)',
        fontFamily: 'var(--font-body)',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {title && <h4 style={{ margin: '0 0 4px', color: ACCENT_COLOR[accent], fontSize: 18, fontWeight: 700 }}>{title}</h4>}
      {subtitle && <p style={{ margin: '0 0 12px', color: 'var(--text-muted)', fontSize: 13 }}>{subtitle}</p>}
      {children}
    </div>
  );
}
