// The one React-specific file in the motion engine — mounts/unmounts a DOM
// element into the shared magneticField registry (magneticField.ts) for the
// lifetime of the component, and separately wires the lightweight,
// always-on sound triggers (hover/lock/click tones) that fire regardless of
// whether the physics itself is currently allowed to run — sound is gated
// only by the visitor's own mute choice, never by prefers-reduced-motion.
import { useEffect, useRef, useState, type RefObject } from 'react';
import { registerMagneticNode } from './magneticField';
import { motionAllowed, subscribeMotionAllowed } from './env';
import { playFieldEnterTone, playLockOnTone, playClickTone } from '../sound/audioEngine';
import type { MagneticPreset } from './types';

/** Reactive wrapper around env.ts's capability check — lets components (MagneticBlock's static-fallback data-attribute) update live if the visitor's OS setting changes mid-session, or a test applies `page.emulateMedia` after mount rather than before. */
export function useMotionAllowed(): boolean {
  const [allowed, setAllowed] = useState(motionAllowed);
  useEffect(() => subscribeMotionAllowed(setAllowed), []);
  return allowed;
}

export function useMagnetic<T extends HTMLElement>(preset: MagneticPreset | undefined): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !preset) return;

    const unregister = registerMagneticNode(el, preset, {
      onFieldEnter: () => {
        if (preset.sfx) playFieldEnterTone(preset.sfx);
      },
      onLockOn: () => {
        if (preset.sfx === 'cta') playLockOnTone();
      },
    });

    // Sound triggers are event-driven (not part of the rAF loop), so they
    // work identically whether or not the physics itself is running —
    // a reduced-motion visitor who has unmuted still gets a click tone.
    const onPointerDown = () => {
      if (preset.sfx) playClickTone();
    };
    el.addEventListener('pointerdown', onPointerDown);

    return () => {
      unregister();
      el.removeEventListener('pointerdown', onPointerDown);
    };
  }, [preset]);

  return ref;
}
