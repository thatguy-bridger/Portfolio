// Mounts the ambient field-lines backdrop (deliverable #4) — fixed behind
// the real content, non-interactive, purely decorative. See
// ambientFieldRenderer.ts for the actual drawing/physics; this component is
// just the canvas element + its mount/unmount lifecycle.
import { useEffect, useRef } from 'react';
import { createAmbientField } from '../../lib/motion/ambientFieldRenderer';

export function AmbientFieldCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const handle = createAmbientField(canvas);
    return () => handle.destroy();
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
