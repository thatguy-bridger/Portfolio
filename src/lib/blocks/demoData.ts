// Seed content for the local, backend-free canvas demo/harness (see
// src/pages/dev/canvas-demo.astro). Not real site content and not read by
// any real page — exercises every registered block type at least once,
// including nested Columns/Carousel slots, so the canvas is visually
// testable standalone without hand-adding every type first.
import { createCanvasBlock, createSection, createSlotItem } from './registry';
import type { BlockPosition, CanvasBlock, PageSection, SlotItem } from './types';

function block(type: string, position: BlockPosition, zIndex: number, propsPatch: Record<string, unknown> = {}): CanvasBlock {
  const b = createCanvasBlock(type, position, zIndex);
  return { ...b, props: { ...b.props, ...propsPatch } };
}

function slot(type: string, propsPatch: Record<string, unknown>): SlotItem {
  const s = createSlotItem(type);
  return { ...s, props: { ...s.props, ...propsPatch } };
}

const PLACEHOLDER_IMG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#6366f1"/><text x="400" y="300" fill="white" font-size="32" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">Photo</text></svg>',
  );

export function createDemoSections(): PageSection[] {
  const hero = createSection('Hero');
  hero.background = 'var(--surface-panel)';
  hero.paddingY = 20;
  hero.blocks = [
    block('hero', { x: 100, y: 20, w: 1000, h: 220 }, 1, { eyebrow: 'Product Designer', heading: 'Designing calm, useful software.', subheading: "I partner with startups to turn fuzzy ideas into shipped products." }),
    block('button', { x: 100, y: 260, w: 200, h: 56 }, 2, { label: 'View my work', href: '#work' }),
    block('image', { x: 700, y: 260, w: 400, h: 260 }, 3, { imageUrl: PLACEHOLDER_IMG, alt: 'Featured work' }),
    block('divider', { x: 100, y: 560, w: 1000, h: 40 }, 4),
  ];

  const about = createSection('About');
  about.blocks = [
    block('image-text', { x: 100, y: 20, w: 1000, h: 260 }, 1, {
      imageUrl: PLACEHOLDER_IMG,
      alt: 'Portrait',
      heading: 'About me',
      body: "Ten years across fintech, travel, and creative tools — I care most about the gap between a good idea and a good product, and closing it fast without losing the craft.",
    }),
    block('quote', { x: 100, y: 300, w: 1000, h: 160 }, 2, { quoteText: 'Good design is as little design as possible.', citation: 'Dieter Rams' }),
    block('rich-text', { x: 100, y: 480, w: 1000, h: 140 }, 3, { content: 'Available for select freelance projects — get in touch if something here resonates.' }),
  ];

  const work = createSection('Work');
  work.blocks = [
    block('columns', { x: 100, y: 20, w: 1000, h: 300 }, 1, {
      columnCount: '2',
      columns: [
        slot('image-text', { imageUrl: PLACEHOLDER_IMG, heading: 'Nimbus Finance', body: 'Redesigning a banking app for clarity.' }),
        slot('image-text', { imageUrl: PLACEHOLDER_IMG, heading: 'Loop Studio', body: 'Brand + web for a design collective.' }),
        slot('rich-text', { content: '' }),
      ],
    }),
    block('carousel', { x: 100, y: 340, w: 1000, h: 420 }, 2, {
      items: [
        slot('image', { imageUrl: PLACEHOLDER_IMG, alt: 'Slide 1', caption: 'Fielda — field-service scheduling' }),
        slot('image', { imageUrl: PLACEHOLDER_IMG, alt: 'Slide 2', caption: 'Aperture — a photo-first template' }),
        slot('image', { imageUrl: PLACEHOLDER_IMG, alt: 'Slide 3', caption: 'Kiln — ceramics storefront' }),
      ],
    }),
  ];

  return [hero, about, work];
}
