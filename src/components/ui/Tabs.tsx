export interface TabsProps {
  tabs: string[];
  value?: string;
  onChange?: (tab: string) => void;
}

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-default)', fontFamily: 'var(--font-body)' }}>
      {tabs.map((t) => {
        const active = t === value;
        return (
          <button
            key={t}
            onClick={() => onChange?.(t)}
            style={{
              padding: '10px 18px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
              transition: 'color var(--duration-fast) var(--ease-standard)',
            }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
