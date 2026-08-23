// Drag/resize snapping — extracted and generalized from the old app's
// GroupCanvas.computeGuides (src/components/GroupCanvas.tsx on main), which
// only ever snapped a whole-block move against edges/centers. This adds
// per-edge resize snapping so all 8 Canva/Slides-style resize handles (see
// CanvasEditor.tsx) snap too, not just move.
import type { BlockPosition } from './types';

export interface GuideLine {
  axis: 'x' | 'y';
  /** position along the axis, in canvas px */
  pos: number;
  /** the guide line's extent, in canvas px, along the other axis */
  from: number;
  to: number;
}

export const SNAP_PX = 6;
export const FINE_PX = 8;
export const MIN_SIZE = 40;

export function gridSnap(n: number): number {
  return Math.round(n / FINE_PX) * FINE_PX;
}

function nearestTarget(value: number, targets: number[], threshold: number): { value: number; guide: number | null } {
  let best = threshold + 1;
  let snapped = value;
  let guide: number | null = null;
  for (const t of targets) {
    const d = Math.abs(value - t);
    if (d < best) {
      best = d;
      snapped = t;
      guide = t;
    }
  }
  return best <= threshold ? { value: snapped, guide } : { value, guide: null };
}

/** Move-drag snapping: snaps the moving block's left/center/right (x) and top/center/bottom (y) against the canvas edges/center and every other block's matching edges/center. */
export function computeMoveSnap(
  pos: BlockPosition,
  others: Array<{ position: BlockPosition }>,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number; guides: GuideLine[] } {
  const targetsX = [0, canvasWidth / 2, canvasWidth, ...others.flatMap((o) => [o.position.x, o.position.x + o.position.w / 2, o.position.x + o.position.w])];
  const targetsY = [0, canvasHeight / 2, canvasHeight, ...others.flatMap((o) => [o.position.y, o.position.y + o.position.h / 2, o.position.y + o.position.h])];
  const myX = [pos.x, pos.x + pos.w / 2, pos.x + pos.w];
  const myY = [pos.y, pos.y + pos.h / 2, pos.y + pos.h];

  let bestDx = SNAP_PX + 1;
  let snappedX = pos.x;
  let guideX: GuideLine | null = null;
  for (const mx of myX) {
    for (const tx of targetsX) {
      const d = Math.abs(mx - tx);
      if (d < bestDx) {
        bestDx = d;
        snappedX = pos.x + (tx - mx);
        guideX = { axis: 'x', pos: tx, from: 0, to: canvasHeight };
      }
    }
  }
  let bestDy = SNAP_PX + 1;
  let snappedY = pos.y;
  let guideY: GuideLine | null = null;
  for (const my of myY) {
    for (const ty of targetsY) {
      const d = Math.abs(my - ty);
      if (d < bestDy) {
        bestDy = d;
        snappedY = pos.y + (ty - my);
        guideY = { axis: 'y', pos: ty, from: 0, to: canvasWidth };
      }
    }
  }
  const guides: GuideLine[] = [];
  if (guideX) guides.push(guideX);
  if (guideY) guides.push(guideY);
  return {
    x: bestDx <= SNAP_PX ? snappedX : gridSnap(pos.x),
    y: bestDy <= SNAP_PX ? snappedY : gridSnap(pos.y),
    guides,
  };
}

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/**
 * Resize-drag snapping for one resize handle: only the edge(s) that handle
 * actually moves get snap-checked — dragging the east handle only checks
 * the right edge against other blocks' x-axis edges/center plus the canvas
 * bounds, never against y-axis targets; a corner handle checks both axes
 * independently. This is what makes every side and corner handle (not just
 * a single bottom-right corner, which is all the old app had) snap
 * correctly regardless of which edges it's moving.
 */
export function computeResizeSnap(
  handle: ResizeHandle,
  box: BlockPosition,
  others: Array<{ position: BlockPosition }>,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number; w: number; h: number; guides: GuideLine[] } {
  const movesLeft = handle.includes('w');
  const movesRight = handle.includes('e');
  const movesTop = handle.includes('n');
  const movesBottom = handle.includes('s');

  let { x, y, w, h } = box;
  const guides: GuideLine[] = [];

  if (movesRight) {
    const targetsX = [0, canvasWidth / 2, canvasWidth, ...others.flatMap((o) => [o.position.x, o.position.x + o.position.w / 2, o.position.x + o.position.w])];
    const snap = nearestTarget(x + w, targetsX, SNAP_PX);
    w = Math.max(MIN_SIZE, snap.value - x);
    if (snap.guide !== null) guides.push({ axis: 'x', pos: snap.guide, from: 0, to: canvasHeight });
    else w = gridSnap(w);
  } else if (movesLeft) {
    const targetsX = [0, canvasWidth / 2, canvasWidth, ...others.flatMap((o) => [o.position.x, o.position.x + o.position.w / 2, o.position.x + o.position.w])];
    const right = x + w;
    const snap = nearestTarget(x, targetsX, SNAP_PX);
    let newX = snap.guide !== null ? snap.value : gridSnap(x);
    newX = Math.min(newX, right - MIN_SIZE);
    x = newX;
    w = right - newX;
    if (snap.guide !== null) guides.push({ axis: 'x', pos: snap.guide, from: 0, to: canvasHeight });
  }

  if (movesBottom) {
    const targetsY = [0, canvasHeight / 2, canvasHeight, ...others.flatMap((o) => [o.position.y, o.position.y + o.position.h / 2, o.position.y + o.position.h])];
    const snap = nearestTarget(y + h, targetsY, SNAP_PX);
    h = Math.max(MIN_SIZE, snap.value - y);
    if (snap.guide !== null) guides.push({ axis: 'y', pos: snap.guide, from: 0, to: canvasWidth });
    else h = gridSnap(h);
  } else if (movesTop) {
    const targetsY = [0, canvasHeight / 2, canvasHeight, ...others.flatMap((o) => [o.position.y, o.position.y + o.position.h / 2, o.position.y + o.position.h])];
    const bottom = y + h;
    const snap = nearestTarget(y, targetsY, SNAP_PX);
    let newY = snap.guide !== null ? snap.value : gridSnap(y);
    newY = Math.min(newY, bottom - MIN_SIZE);
    y = newY;
    h = bottom - newY;
    if (snap.guide !== null) guides.push({ axis: 'y', pos: snap.guide, from: 0, to: canvasWidth });
  }

  return { x, y, w, h, guides };
}
