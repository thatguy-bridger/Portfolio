// The one thing PublicPage.tsx mounts to turn on Phase 3 — bundles the
// ambient field backdrop, the mute control, and the first-interaction
// listener that satisfies "sound on by default" within the autoplay
// policy's constraints (browsers block audio-with-sound until a real user
// gesture, so we start silent and fade in on the visitor's first
// click/pointerdown rather than trying to defeat the policy).
//
// Deliberately NOT used by CanvasEditor.tsx or anything under /admin —
// PublicPage.tsx and ReflowedSection's `motionEnabled` flag are the only
// call sites that render this, so the editor never gets the ambient canvas,
// the mute button, or the first-interaction audio listener.
import { useEffect } from 'react';
import { AmbientFieldCanvas } from './AmbientFieldCanvas';
import { SoundToggle } from './SoundToggle';
import { fadeInIfPermitted } from '../../lib/sound/audioEngine';

export function MotionLayer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let fired = false;
    const onFirstInteraction = () => {
      if (fired) return;
      fired = true;
      fadeInIfPermitted();
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };
    // pointerdown covers click/tap; keydown covers keyboard-only visitors
    // (Tab into the page, then any key) — both are real user gestures the
    // autoplay policy accepts.
    window.addEventListener('pointerdown', onFirstInteraction);
    window.addEventListener('keydown', onFirstInteraction);
    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };
  }, []);

  return (
    <>
      <AmbientFieldCanvas />
      {children}
      <SoundToggle />
    </>
  );
}
