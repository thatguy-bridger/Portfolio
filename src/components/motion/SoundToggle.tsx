// The always-visible mute/unmute control (required regardless of motion
// preference — see MotionLayer.tsx's header comment). First paint always
// renders the muted-looking icon and only reflects the real, localStorage-
// backed state after mount, same "SSR/first client render must match"
// convention CanvasDemo.tsx uses for its own localStorage read.
import { useEffect, useState } from 'react';
import { isMuted, subscribeSoundState, toggleMute } from '../../lib/sound/audioEngine';

export function SoundToggle() {
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    setMuted(isMuted());
    return subscribeSoundState(() => setMuted(isMuted()));
  }, []);

  return (
    <button
      type="button"
      onClick={() => setMuted(toggleMute())}
      aria-pressed={!muted}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      title={muted ? 'Unmute sound' : 'Mute sound'}
      data-testid="sound-toggle"
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 20,
        width: 44,
        height: 44,
        borderRadius: 'var(--radius-pill)',
        border: '1px solid var(--border-default)',
        background: 'var(--surface-panel)',
        color: 'var(--text-heading)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 18,
        lineHeight: 1,
      }}
    >
      <span aria-hidden="true">{muted ? '\u{1F507}' : '\u{1F50A}'}</span>
    </button>
  );
}
