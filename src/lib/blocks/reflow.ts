// Mobile reflow — the automatic replacement for the old app's
// hand-authored mobilePosition tab (GroupCanvas device="mobile" /
// seedMobileLayout in the old src/components/GroupCanvas.tsx). Below
// MOBILE_BREAKPOINT there is no separate mobile layout to author or fall
// back to: every section always renders its blocks sorted by desktop `y`
// (top to bottom, `x` as a tiebreaker), each one full-width, stacked with
// consistent spacing. Freeform positioning only ever matters at desktop
// width. Shared by the editor's mobile preview and the public renderer so
// the two can never drift apart.
import type { CanvasBlock } from './types';

export function reflowOrder(blocks: CanvasBlock[]): CanvasBlock[] {
  return [...blocks].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
}
