import { useEffect, useRef } from 'react';
import { useTheme } from '../design-system/theme';

interface Blob {
  baseX: number;
  baseY: number;
  radius: number;
  color: string;
  depth: number;
  driftSpeed: number;
  driftPhase: number;
}

/**
 * Layered, blurred gradient-blob background: ambient drift + cursor parallax
 * across depth layers approximates a "3D scene" feel without a WebGL
 * dependency. Freezes to a single static frame when reduced motion is on.
 */
export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const { reducedMotion, accentVariants } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blobs: Blob[] = [
      { baseX: 0.2, baseY: 0.3, radius: 0.38, color: accentVariants.base, depth: 0.6, driftSpeed: 0.00025, driftPhase: 0 },
      { baseX: 0.8, baseY: 0.7, radius: 0.34, color: 'var(--purple-500)', depth: 1, driftSpeed: 0.0002, driftPhase: 2 },
      { baseX: 0.65, baseY: 0.2, radius: 0.22, color: 'var(--pink-500)', depth: 0.35, driftSpeed: 0.0003, driftPhase: 4 },
      { baseX: 0.15, baseY: 0.75, radius: 0.2, color: 'var(--orange-500)', depth: 0.5, driftSpeed: 0.00022, driftPhase: 1.3 },
    ];

    const computedStyle = getComputedStyle(document.documentElement);
    function resolveColor(c: string) {
      if (!c.startsWith('var(')) return c;
      const name = c.slice(4, -1).trim();
      return computedStyle.getPropertyValue(name).trim() || '#6366f1';
    }

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasEl.width = width * dpr;
      canvasEl.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.current.x = (e.clientX - rect.left) / rect.width - 0.5;
      mouse.current.y = (e.clientY - rect.top) / rect.height - 0.5;
    }

    function draw(time: number) {
      ctx!.clearRect(0, 0, width, height);
      for (const b of blobs) {
        const drift = reducedMotion ? 0 : Math.sin(time * b.driftSpeed + b.driftPhase) * 0.05;
        const parallaxX = reducedMotion ? 0 : mouse.current.x * 0.06 * b.depth;
        const parallaxY = reducedMotion ? 0 : mouse.current.y * 0.06 * b.depth;
        const cx = (b.baseX + drift + parallaxX) * width;
        const cy = (b.baseY + drift * 0.6 + parallaxY) * height;
        const r = b.radius * Math.max(width, height);
        const grad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, r);
        const color = resolveColor(b.color);
        grad.addColorStop(0, `${color}55`);
        grad.addColorStop(1, `${color}00`);
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(cx, cy, r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove);

    let rafId: number;
    if (reducedMotion) {
      draw(0);
    } else {
      const loop = (t: number) => {
        draw(t);
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [reducedMotion, accentVariants]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        filter: 'blur(40px)',
        opacity: 0.9,
      }}
    />
  );
}
