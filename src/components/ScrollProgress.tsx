import { useTheme } from '../design-system/theme';
import { useScrollProgress, type ScrollSection } from '../design-system/useScrollProgress';

const SECTION_ACCENTS = ['var(--indigo-400)', 'var(--purple-400)', 'var(--orange-400)', 'var(--pink-500)'];

export function ScrollProgress({ sections }: { sections: ScrollSection[] }) {
  const { reducedMotion } = useTheme();
  const { displayProgress, activeIndex } = useScrollProgress(sections, reducedMotion);
  const activeColor = SECTION_ACCENTS[activeIndex % SECTION_ACCENTS.length];

  function jumpTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  return (
    <nav
      aria-label="Section progress"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 4,
        background: 'var(--border-default)',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${displayProgress * 100}%`,
          background: `linear-gradient(90deg, var(--accent-primary), ${activeColor})`,
          boxShadow: `0 0 12px ${activeColor}`,
          transition: reducedMotion
            ? 'none'
            : 'background var(--duration-slow) var(--ease-standard), box-shadow var(--duration-slow) var(--ease-standard)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 4,
          paddingTop: 8,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            gap: 4,
            background: 'var(--surface-glass)',
            backdropFilter: 'var(--blur-glass)',
            WebkitBackdropFilter: 'var(--blur-glass)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-pill)',
            padding: '6px 8px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {sections.map((s, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={s.id}
                onClick={() => jumpTo(s.id)}
                title={s.label}
                aria-current={active}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? 'var(--accent-primary)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-muted)',
                  borderRadius: 'var(--radius-pill)',
                  padding: active ? '4px 12px' : '4px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--duration-normal) var(--ease-standard)',
                }}
              >
                {active ? s.label : '•'}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
