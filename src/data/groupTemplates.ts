import { newBlockId, newGroupBlockId, type GroupBlock, type HomepageGroup } from './siteData';

export interface GroupTemplate {
  key: string;
  label: string;
  build: () => Omit<HomepageGroup, 'id'>;
}

function blk(x: number, y: number, w: number, h: number, block: GroupBlock['block'], z: number): GroupBlock {
  return { id: newGroupBlockId(), block, position: { x, y, w, h }, zIndex: z };
}

export const GROUP_TEMPLATES: GroupTemplate[] = [
  {
    key: 'hero',
    label: 'Hero',
    build: () => ({
      name: 'Hero',
      minHeight: 520,
      blocks: [
        blk(200, 60, 800, 160, { id: newBlockId(), type: 'heading', content: 'Designing calm, useful software.', size: 'xl' }, 1),
        blk(250, 240, 700, 90, { id: newBlockId(), type: 'text', content: "I partner with startups to turn fuzzy ideas into shipped products.", size: 'md' }, 2),
        blk(500, 350, 200, 50, { id: newBlockId(), type: 'button', label: 'See my work', link: { type: 'none' } }, 3),
      ],
    }),
  },
  {
    key: 'about',
    label: 'About',
    build: () => ({
      name: 'About',
      minHeight: 420,
      blocks: [
        blk(80, 40, 300, 70, { id: newBlockId(), type: 'heading', content: 'About', size: 'lg' }, 1),
        blk(80, 120, 500, 220, { id: newBlockId(), type: 'text', content: "I'm a product designer who ships — write a bit about yourself here.", size: 'md' }, 2),
        blk(650, 40, 470, 300, { id: newBlockId(), type: 'image', alt: '' }, 3),
      ],
    }),
  },
  {
    key: 'contact',
    label: 'Contact',
    build: () => ({
      name: 'Contact',
      minHeight: 360,
      blocks: [
        blk(350, 60, 500, 70, { id: newBlockId(), type: 'heading', content: "Let's work together", size: 'lg' }, 1),
        blk(350, 150, 500, 80, { id: newBlockId(), type: 'text', content: "Have a project in mind? Get in touch.", size: 'md' }, 2),
        blk(500, 250, 200, 50, { id: newBlockId(), type: 'button', label: 'Say hello', link: { type: 'none' } }, 3),
      ],
    }),
  },
  {
    key: 'testimonial',
    label: 'Testimonial',
    build: () => ({
      name: 'Testimonial',
      minHeight: 340,
      blocks: [
        blk(300, 60, 600, 140, { id: newBlockId(), type: 'text', content: '"Working together was the best decision we made this year."', size: 'lg' }, 1),
        blk(300, 220, 600, 65, { id: newBlockId(), type: 'text', content: '— Name, Title at Company', size: 'sm' }, 2),
      ],
    }),
  },
  {
    key: 'faq',
    label: 'FAQ',
    build: () => ({
      name: 'FAQ',
      minHeight: 440,
      blocks: [
        blk(80, 30, 300, 70, { id: newBlockId(), type: 'heading', content: 'FAQ', size: 'lg' }, 1),
        blk(80, 110, 500, 50, { id: newBlockId(), type: 'heading', content: 'Question one?', size: 'sm' }, 2),
        blk(80, 165, 500, 70, { id: newBlockId(), type: 'text', content: 'Answer to question one goes here.', size: 'sm' }, 3),
        blk(80, 250, 500, 50, { id: newBlockId(), type: 'heading', content: 'Question two?', size: 'sm' }, 4),
        blk(80, 305, 500, 70, { id: newBlockId(), type: 'text', content: 'Answer to question two goes here.', size: 'sm' }, 5),
      ],
    }),
  },
  {
    key: 'team',
    label: 'Team',
    build: () => ({
      name: 'Team',
      minHeight: 400,
      blocks: [
        blk(80, 30, 300, 70, { id: newBlockId(), type: 'heading', content: 'Team', size: 'lg' }, 1),
        blk(80, 110, 260, 260, { id: newBlockId(), type: 'image', alt: '' }, 2),
        blk(370, 110, 260, 260, { id: newBlockId(), type: 'image', alt: '' }, 3),
        blk(660, 110, 260, 260, { id: newBlockId(), type: 'image', alt: '' }, 4),
      ],
    }),
  },
  {
    key: 'pricing',
    label: 'Pricing',
    build: () => ({
      name: 'Pricing',
      minHeight: 420,
      blocks: [
        blk(80, 30, 300, 70, { id: newBlockId(), type: 'heading', content: 'Pricing', size: 'lg' }, 1),
        blk(80, 120, 320, 220, { id: newBlockId(), type: 'text', content: 'Starter — $X\nWhat is included.', size: 'md' }, 2),
        blk(440, 120, 320, 220, { id: newBlockId(), type: 'text', content: 'Pro — $X\nWhat is included.', size: 'md' }, 3),
        blk(800, 120, 320, 220, { id: newBlockId(), type: 'text', content: 'Custom — Contact\nWhat is included.', size: 'md' }, 4),
      ],
    }),
  },
];
