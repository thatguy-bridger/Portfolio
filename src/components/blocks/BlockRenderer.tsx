// Type -> render-component lookup, shared by the editor canvas and the
// public renderer alike (both call <BlockRenderer type editable .../> —
// exactly one component per block type renders both its live and its
// editable-on-canvas form, see types.ts's BlockComponentProps note).
//
// ColumnsBlockView/CarouselBlockView import BLOCK_COMPONENTS back from this
// same file to render their nested slot content — a circular import that's
// safe because BLOCK_COMPONENTS is only read inside function bodies (at
// render time), never at module-evaluation time. Mirrors Alta-Seminary's
// BlockRenderer.jsx, which documents the identical shape.
import {
  HeroBlockView,
  RichTextBlockView,
  ImageBlockView,
  ImageTextBlockView,
  ButtonBlockView,
  QuoteBlockView,
  DividerBlockView,
} from './simpleBlocks';
import { ColumnsBlockView } from './ColumnsBlockView';
import { CarouselBlockView } from './CarouselBlockView';
import { ContactFormBlockView } from './ContactFormBlockView';
import type { BlockComponentProps } from './types';

export const BLOCK_COMPONENTS: Record<string, React.ComponentType<BlockComponentProps>> = {
  hero: HeroBlockView,
  'rich-text': RichTextBlockView,
  image: ImageBlockView,
  'image-text': ImageTextBlockView,
  button: ButtonBlockView,
  quote: QuoteBlockView,
  divider: DividerBlockView,
  columns: ColumnsBlockView,
  carousel: CarouselBlockView,
  'contact-form': ContactFormBlockView,
};

export function BlockRenderer(props: BlockComponentProps & { type: string }) {
  const { type, ...rest } = props;
  const Component = BLOCK_COMPONENTS[type];
  if (!Component) return null;
  return <Component {...rest} />;
}
