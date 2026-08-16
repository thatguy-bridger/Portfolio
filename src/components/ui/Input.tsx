import type { ChangeEvent, InputHTMLAttributes } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'style' | 'onChange'> {
  label?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function Input({ label, type = 'text', onChange, ...rest }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-body)' }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)' }}>{label}</label>}
      <input
        {...rest}
        type={type}
        onChange={onChange}
        style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-heading)',
          fontSize: 14,
          outline: 'none',
          fontFamily: 'var(--font-body)',
          transition: 'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent-primary)';
          e.target.style.boxShadow = '0 0 0 2px var(--shadow-glow-indigo)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-default)';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}
