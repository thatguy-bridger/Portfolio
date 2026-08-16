export interface SwitchProps {
  options?: string[];
  value?: string;
  onChange?: (value: string) => void;
}

export function Switch({ options = ['Light', 'Dark', 'System'], value, onChange }: SwitchProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'var(--surface-panel)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-pill)',
        padding: 4,
        gap: 2,
        fontFamily: 'var(--font-body)',
      }}
    >
      {options.map((o) => {
        const active = o === value;
        return (
          <button
            key={o}
            onClick={() => onChange?.(o)}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              background: active ? 'var(--accent-primary)' : 'transparent',
              color: active ? '#fff' : 'var(--text-body)',
              transition: 'background var(--duration-fast) var(--ease-standard)',
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
