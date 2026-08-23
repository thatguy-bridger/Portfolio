import { useEffect, useState, type ReactElement } from 'react';

/**
 * Three-way light/dark/auto cycle button. UX ported from
 * thatguy-bridger/alta-seminary's ThemeToggle.jsx (one icon button, click to
 * cycle, label underneath) — talks directly to the window.PortfolioTheme
 * global (set by the pre-paint script inlined in BaseLayout.astro's <head>)
 * rather than React context, so it works standalone in any island with no
 * <ThemeProvider> ancestor required.
 */
type Mode = 'light' | 'dark' | 'auto';
const ORDER: Mode[] = ['light', 'dark', 'auto'];
const LABEL: Record<Mode, string> = { light: 'Light', dark: 'Dark', auto: 'Auto' };

const ICONS: Record<Mode, ReactElement> = {
  light: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
    </svg>
  ),
  dark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  ),
  auto: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 1 0 20Z" fill="currentColor" stroke="none" />
    </svg>
  ),
};

export function ThemeToggle() {
  // Starts at 'auto' to match the server-rendered markup (which knows nothing about this
  // visitor's localStorage) — synced to the real stored value on mount, after which
  // window.PortfolioTheme is always the source of truth.
  const [mode, setMode] = useState<Mode>('auto');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (window.PortfolioTheme) setMode(window.PortfolioTheme.get());

    // Stay in sync when the theme changes from elsewhere — another ThemeToggle instance,
    // ThemeProvider's setColorScheme, or a direct window.PortfolioTheme.set() call.
    function onExternalChange(e: WindowEventMap['portfolio-theme-change']) {
      setMode(e.detail);
    }
    window.addEventListener('portfolio-theme-change', onExternalChange);
    return () => window.removeEventListener('portfolio-theme-change', onExternalChange);
  }, []);

  function cycle() {
    const next = window.PortfolioTheme ? window.PortfolioTheme.cycle() : ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    setMode(next);
  }

  const displayMode = mounted ? mode : 'auto';

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button
        onClick={cycle}
        aria-label={`Theme: ${LABEL[displayMode]}. Click to switch.`}
        title={`Theme: ${LABEL[displayMode]}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border-default)',
          background: 'var(--surface-card)',
          color: 'var(--text-heading)',
          cursor: 'pointer',
          transition: 'background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)',
        }}
      >
        {ICONS[displayMode]}
      </button>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>{LABEL[displayMode]}</span>
    </div>
  );
}
