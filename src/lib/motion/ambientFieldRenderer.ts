// The decorative "magnetic field lines" background — a canvas-rendered
// grid of points that eases away from the cursor within a local influence
// radius (threesided.com's "Repulsion Field" section is the direct
// reference), with faint lines drawn to each point's near neighbors so the
// grid reads as a field mesh rather than loose dots. This is deliberately
// the *negative*-polarity half of the "different objects, different
// polarities" system — content blocks (magneticField.ts/presets.ts) mostly
// attract, this backdrop pushes away — while also being pure chrome:
// `pointer-events: none`, fixed behind the real content, never a11y-facing.
// While the pointer is held down (pointerTracker.ts's `pressed`), this
// polarity reverses too — the dots pull in toward the cursor instead of
// pushing away — reverting the instant the button lifts.
//
// Framework-light like the rest of the engine: this file owns the canvas
// 2D context and its own rAF loop; AmbientFieldCanvas.tsx is just the
// mount/unmount wrapper.
import { springStep, smoothstep } from './springs';
import { subscribePointer, pointerRecentlyActive, getPointer } from './pointerTracker';
import { subscribeMotionAllowed, motionAllowed } from './env';

interface Point {
  restX: number;
  restY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const SPACING = 46;
const INFLUENCE_RADIUS = 170;
const MAX_PUSH = 20;
const STIFFNESS = 120;
const DAMPING = 16;

export interface AmbientFieldHandle {
  destroy: () => void;
}

export function createAmbientField(canvas: HTMLCanvasElement): AmbientFieldHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => {} };

  let points: Point[] = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafHandle = 0;
  let lastTick = 0;
  let running = false;
  let unsubPointer: (() => void) | null = null;
  let color = 'rgba(148, 163, 184, 0.5)'; // overwritten by readColor() before first paint

  function readColor() {
    if (typeof getComputedStyle === 'undefined') return;
    const v = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
    color = v || color;
  }

  function layoutGrid() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));

    const cols = Math.ceil(width / SPACING) + 1;
    const rows = Math.ceil(height / SPACING) + 1;
    const next: Point[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const restX = c * SPACING;
        const restY = r * SPACING;
        next.push({ restX, restY, x: restX, y: restY, vx: 0, vy: 0 });
      }
    }
    points = next;
  }

  function paint() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    const cols = Math.ceil(width / SPACING) + 1;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const pushed = Math.hypot(p.x - p.restX, p.y - p.restY) > 0.4;
      const alpha = pushed ? 0.32 : 0.14;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, pushed ? 1.6 : 1.1, 0, Math.PI * 2);
      ctx.fill();

      // Faint line to the neighbor on the right and below only — avoids
      // drawing every edge twice and keeps the mesh legible instead of busy.
      const right = points[i + 1];
      if (right && (i + 1) % cols !== 0) {
        ctx.globalAlpha = alpha * 0.4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(right.x, right.y);
        ctx.stroke();
      }
      const below = points[i + cols];
      if (below) {
        ctx.globalAlpha = alpha * 0.4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(below.x, below.y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function tick(now: number) {
    rafHandle = 0;
    const dt = Math.min((now - (lastTick || now)) / 1000, 1 / 30);
    lastTick = now;

    const live = pointerRecentlyActive();
    const pointer = live ? getPointer() : null;
    // While the pointer is held down, the whole field's polarity reverses —
    // "pull into the mouse" instead of the resting push-away — for as long
    // as the button stays down (pointerTracker.ts clears `pressed` the
    // instant it's released, blurred, or cancelled).
    const polarity = pointer?.pressed ? -1 : 1;
    let anyMoving = false;

    for (const p of points) {
      let tx = p.restX;
      let ty = p.restY;
      if (pointer) {
        const dx = p.restX - pointer.x;
        const dy = p.restY - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < INFLUENCE_RADIUS && dist > 0.01) {
          const falloff = smoothstep(1 - dist / INFLUENCE_RADIUS);
          const push = falloff * MAX_PUSH * polarity;
          tx = p.restX + (dx / dist) * push;
          ty = p.restY + (dy / dist) * push;
        }
      }
      const sx = springStep({ x: p.x, v: p.vx }, tx, STIFFNESS, DAMPING, dt);
      const sy = springStep({ x: p.y, v: p.vy }, ty, STIFFNESS, DAMPING, dt);
      p.x = sx.x;
      p.vx = sx.v;
      p.y = sy.x;
      p.vy = sy.v;
      if (Math.abs(p.vx) + Math.abs(p.vy) > 0.03 || Math.hypot(p.x - tx, p.y - ty) > 0.3) anyMoving = true;
    }

    paint();
    if (anyMoving || live) rafHandle = window.requestAnimationFrame(tick);
    else running = false;
  }

  function kick() {
    if (running || !motionAllowed()) return;
    running = true;
    lastTick = 0;
    rafHandle = window.requestAnimationFrame(tick);
  }

  function staticPaint() {
    // Reduced-motion / coarse-pointer fallback: draw the mesh once at rest,
    // no loop, no pointer reaction — pure quiet chrome per the "equivalent
    // quiet fallback" requirement.
    layoutGrid();
    readColor();
    paint();
  }

  const onResize = () => {
    layoutGrid();
    if (!motionAllowed()) staticPaint();
  };

  readColor();
  layoutGrid();
  if (motionAllowed()) {
    unsubPointer = subscribePointer(kick);
    kick();
  } else {
    staticPaint();
  }

  window.addEventListener('resize', onResize);
  const themeChange = () => readColor();
  window.addEventListener('portfolio-theme-change', themeChange);
  const colorScheme = window.matchMedia?.('(prefers-color-scheme: dark)');
  colorScheme?.addEventListener('change', themeChange);

  const unsubAllowed = subscribeMotionAllowed((next) => {
    if (next) {
      if (!unsubPointer) unsubPointer = subscribePointer(kick);
      kick();
    } else {
      unsubPointer?.();
      unsubPointer = null;
      if (rafHandle) {
        cancelAnimationFrame(rafHandle);
        rafHandle = 0;
      }
      running = false;
      staticPaint();
    }
  });

  return {
    destroy: () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('portfolio-theme-change', themeChange);
      colorScheme?.removeEventListener('change', themeChange);
      unsubAllowed();
      unsubPointer?.();
      if (rafHandle) cancelAnimationFrame(rafHandle);
    },
  };
}
