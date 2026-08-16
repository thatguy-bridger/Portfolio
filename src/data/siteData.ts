import type { BadgeColor } from '../components/ui/Badge';
import type { GlassCardAccent } from '../components/ui/GlassCard';
import { DEFAULT_BODY_FONT, DEFAULT_DISPLAY_FONT } from '../design-system/fonts';

export interface SiteTile {
  id: string;
  title: string;
  description: string;
  accent: GlassCardAccent;
  colSpan: number;
  rowSpan: number;
}

export interface SiteSkill {
  label: string;
  color: BadgeColor;
}

export interface SiteData {
  hero: {
    eyebrow: string;
    headlineStart: string;
    headlineHighlight: string;
    headlineEnd: string;
    subtitle: string;
  };
  about: {
    text: string;
    skills: SiteSkill[];
  };
  contact: {
    heading: string;
    subtext: string;
    email: string;
  };
  tiles: SiteTile[];
  accentId: string;
  customAccentHex: string;
  displayFontId: string;
  bodyFontId: string;
}

export const DEFAULT_SITE_DATA: SiteData = {
  hero: {
    eyebrow: 'Product Designer',
    headlineStart: 'Designing calm,',
    headlineHighlight: 'useful',
    headlineEnd: 'software.',
    subtitle:
      "I partner with startups to turn fuzzy ideas into shipped products — from first sketch to design system.",
  },
  about: {
    text:
      "I'm a product designer who ships. Ten years across fintech, travel, and creative tools — I care most about the gap between a good idea and a good product, and closing it fast without losing the craft.",
    skills: [
      { label: 'Product design', color: 'indigo' },
      { label: 'Design systems', color: 'purple' },
      { label: 'Prototyping', color: 'orange' },
      { label: 'Front-end', color: 'green' },
      { label: 'Brand', color: 'pink' },
    ],
  },
  contact: {
    heading: "Let's work together",
    subtext: "Have a project in mind? Drop your email and I'll get back to you within a day.",
    email: 'hello@example.com',
  },
  tiles: [
    { id: 'nimbus', title: 'Nimbus Finance', description: 'Redesigning a banking app for clarity.', accent: 'indigo', colSpan: 3, rowSpan: 2 },
    { id: 'loop', title: 'Loop Studio', description: 'Brand + web for a design collective.', accent: 'purple', colSpan: 2, rowSpan: 1 },
    { id: 'fielda', title: 'Fielda', description: 'Field-service scheduling, reimagined.', accent: 'orange', colSpan: 1, rowSpan: 1 },
    { id: 'aperture', title: 'Aperture', description: 'A photo-first portfolio template.', accent: 'pink', colSpan: 2, rowSpan: 2 },
    { id: 'northwind', title: 'Northwind Travel', description: 'Booking flow for a boutique travel agency.', accent: 'indigo', colSpan: 2, rowSpan: 1 },
    { id: 'kiln', title: 'Kiln', description: 'Ceramics studio storefront + class booking.', accent: 'orange', colSpan: 1, rowSpan: 1 },
  ],
  accentId: 'indigo',
  customAccentHex: '#6366f1',
  displayFontId: DEFAULT_DISPLAY_FONT.id,
  bodyFontId: DEFAULT_BODY_FONT.id,
};

export function newTileId() {
  return `tile-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
