import type { GlassCardAccent } from '../components/ui/GlassCard';

export interface SampleProject {
  id: string;
  title: string;
  description: string;
  accent: GlassCardAccent;
  colSpan: number;
  rowSpan: number;
}

export const SAMPLE_PROJECTS: SampleProject[] = [
  { id: 'nimbus', title: 'Nimbus Finance', description: 'Redesigning a banking app for clarity.', accent: 'indigo', colSpan: 3, rowSpan: 2 },
  { id: 'loop', title: 'Loop Studio', description: 'Brand + web for a design collective.', accent: 'purple', colSpan: 2, rowSpan: 1 },
  { id: 'fielda', title: 'Fielda', description: 'Field-service scheduling, reimagined.', accent: 'orange', colSpan: 1, rowSpan: 1 },
  { id: 'aperture', title: 'Aperture', description: 'A photo-first portfolio template.', accent: 'pink', colSpan: 2, rowSpan: 2 },
  { id: 'northwind', title: 'Northwind Travel', description: 'Booking flow for a boutique travel agency.', accent: 'indigo', colSpan: 2, rowSpan: 1 },
  { id: 'kiln', title: 'Kiln', description: 'Ceramics studio storefront + class booking.', accent: 'orange', colSpan: 1, rowSpan: 1 },
];
